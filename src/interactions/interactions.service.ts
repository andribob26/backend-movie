import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Movie } from 'src/entities/movie.entity'; // sesuaikan path entity kamu
import { DailyView } from 'src/entities/daily-views.entity'; // sesuaikan path
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Redis } from 'ioredis';
import { createHash } from 'crypto';

@Injectable()
export class InteractionsService {
  constructor(
    @InjectModel(Movie)
    private readonly movieModel: typeof Movie,

    @InjectModel(DailyView)
    private readonly dailyViewModel: typeof DailyView,

    @InjectQueue('views_rollup') // nama queue kamu, bisa diganti kalau beda
    private readonly popularityQueue: Queue,
  ) {}

  /**
   * Mendapatkan Redis client dari BullMQ queue secara async
   * Ini fix masalah Promise dan tipe overlap
   */
  private async getRedisClient(): Promise<Redis> {
    const client = await this.popularityQueue.client;
    if (!client || typeof client.get !== 'function') {
      throw new Error(
        'Redis client tidak tersedia atau tidak valid dari BullMQ queue',
      );
    }
    return client as unknown as Redis;
  }

  // ── VIEW ──────────────────────────────────────────────────────────────
  /**
   * Mencatat view (maks 5x/hari per IP + User-Agent per film)
   */
  async recordView(movieId: string, ip: string, userAgent: string) {
    try {
      const redis = await this.getRedisClient();
      const today = new Date().toISOString().split('T')[0];
      const uaHash = this.hashUA(userAgent || 'unknown');

      const rateKey = `v_rate:${movieId}:${ip}:${uaHash}:${today}`;
      const viewedKey = `v_flag:${movieId}:${ip}:${uaHash}:${today}`;

      // 1. Sudah dicatat hari ini?
      if (await redis.get(viewedKey)) {
        return { success: true, message: 'Sudah tercatat hari ini' };
      }

      // 2. Cek dan increment batas 5x/hari
      const countStr = await redis.incr(rateKey);
      const count = Number(countStr);

      if (count === 1) {
        await redis.expire(rateKey, 86400); // 1 hari
      }

      if (count > 5) {
        return {
          success: false,
          message: 'Maksimal 5 view per hari untuk film ini',
        };
      }

      if (!this.dailyViewModel.sequelize) {
        throw new Error(
          'Sequelize instance tidak tersedia pada DailyView model',
        );
      }

      // 3. Tambah ke daily_views (upsert atomic)
      await this.dailyViewModel.sequelize.query(
        `
          INSERT INTO daily_views (id, "movieId", "viewDate", "viewCount")
          VALUES (gen_random_uuid(), :movieId, :today, 1)
          ON CONFLICT ("movieId", "viewDate")
          DO UPDATE SET "viewCount" = daily_views."viewCount" + 1
        `,
        { replacements: { movieId, today } },
      );

      // 4. Tambah totalView seumur hidup
      await this.movieModel.increment('totalView', {
        by: 1,
        where: { id: movieId },
      });

      // 5. Flag agar tidak dihitung ulang hari ini
      await redis.set(viewedKey, '1', 'EX', 86400);

      return { success: true };
    } catch (error) {
      console.error('Error saat mencatat view:', error);
      return { success: false, message: 'Gagal mencatat view' };
    }
  }

  // ── COMMENT ───────────────────────────────────────────────────────────
  /**
   * Tambah 1 ke totalComment (bisa ditambah rate limit kalau perlu)
   */
  async addComment(movieId: string) {
    try {
      await this.movieModel.increment('totalComment', {
        by: 1,
        where: { id: movieId },
      });
      return { success: true };
    } catch (error) {
      console.error('Error saat tambah comment:', error);
      return { success: false, message: 'Gagal mencatat comment' };
    }
  }

  /**
   * Hash User-Agent agar lebih aman dan pendek
   */
  private hashUA(ua: string): string {
    return createHash('md5').update(ua).digest('hex').slice(0, 16);
  }
}
