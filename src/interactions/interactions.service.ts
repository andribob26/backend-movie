import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Movie } from 'src/entities/movie.entity'; // sesuaikan path entity kamu
import { DailyView } from 'src/entities/daily-views.entity'; // sesuaikan path
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Redis } from 'ioredis';
import { createHash } from 'crypto';
import { Season } from 'src/entities/season.entity';
import { Episode } from 'src/entities/episode.entity';
import { BaseResponse } from 'src/commons/interfaces/base-response.interface';
import { InferCreationAttributes, Transaction } from 'sequelize';

@Injectable()
export class InteractionsService {
  constructor(
    @InjectModel(Movie)
    private readonly movieModel: typeof Movie,

    @InjectModel(Season)
    private readonly seasonModel: typeof Season,

    @InjectModel(Episode)
    private readonly episodeModel: typeof Episode,

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
  async recordView(
    movieId: string,
    episodeId: string | null,
    ip: string,
    userAgent: string,
  ): Promise<BaseResponse<{ success: boolean; message?: string }>> {
    console.log('[recordView] ===== START =====');
    console.log('[recordView] Params:', { movieId, episodeId, ip, userAgent });

    try {
      const redis = await this.getRedisClient();
      console.log('[recordView] Redis connected');

      const today = new Date().toISOString().split('T')[0];
      const uaHash = this.hashUA(userAgent || 'unknown');

      console.log('[recordView] today:', today);
      console.log('[recordView] uaHash:', uaHash);

      const targetId = episodeId || movieId;
      const rateKey = `v_rate:${targetId}:${ip}:${uaHash}:${today}`;
      const viewedKey = `v_flag:${targetId}:${ip}:${uaHash}:${today}`;

      console.log('[recordView] rateKey:', rateKey);
      console.log('[recordView] viewedKey:', viewedKey);

      const alreadyViewed = await redis.get(viewedKey);
      console.log('[recordView] viewedKey exists?:', alreadyViewed);

      if (alreadyViewed) {
        console.log('[recordView] Sudah tercatat hari ini → RETURN');
        return { message: 'Sudah tercatat hari ini', data: { success: true } };
      }

      const countStr = await redis.incr(rateKey);
      const count = Number(countStr);

      console.log('[recordView] rate increment result:', count);

      if (count === 1) {
        await redis.expire(rateKey, 86400);
        console.log('[recordView] Expire rateKey set 86400 seconds');
      }

      if (count > 5) {
        console.log('[recordView] LIMIT EXCEEDED > 5');
        throw new BadRequestException(
          'Maksimal 5 view per hari untuk konten ini',
        );
      }

      if (!this.dailyViewModel.sequelize) {
        console.log('[recordView] Sequelize NOT available');
        throw new Error(
          'Sequelize instance tidak tersedia pada DailyView model',
        );
      }

      console.log('[recordView] Start DB transaction DailyView');

      await this.dailyViewModel.sequelize.transaction(async (t) => {
        const existing = await this.dailyViewModel.findOne({
          where: { movieId, viewDate: today },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        console.log('[recordView] existing DailyView:', existing?.dataValues);

        if (existing) {
          await existing.increment('viewCount', { by: 1, transaction: t });
          console.log('[recordView] DailyView increment +1');
        } else {
          await this.dailyViewModel.create(
            { movieId, viewDate: today, viewCount: 1 } as any,
            { transaction: t },
          );
          console.log('[recordView] DailyView created with 1');
        }
      });

      console.log('[recordView] DailyView transaction committed');

      const movie = await this.movieModel.findByPk(movieId);
      console.log('[recordView] Movie result:', movie?.dataValues);

      if (!movie) {
        console.log('[recordView] Movie NOT FOUND');
        throw new NotFoundException('Movie atau Series tidak ditemukan');
      }

      if (movie.dataValues.type === 'movie') {
        console.log('[recordView] TYPE = MOVIE → increment totalView');

        await this.movieModel.increment('totalView', {
          by: 1,
          where: { id: movieId },
        });

        console.log('[recordView] Movie totalView +1 SUCCESS');
      } else {
        console.log('[recordView] TYPE = SERIES');

        if (episodeId) {
          console.log('[recordView] Episode view → increment episode');

          await this.episodeModel.increment('totalView', {
            by: 1,
            where: { id: episodeId },
          });

          console.log('[recordView] Episode totalView +1 SUCCESS');

          const episodes = await this.episodeModel.findAll({
            include: [
              {
                model: Season,
                where: { movieId: movie.dataValues.id },
                required: true,
              },
            ],
            attributes: ['id', 'totalView'],
            raw: true,
          });

          console.log('[recordView] Episodes fetched:', episodes);

          const totalSum = episodes.reduce(
            (sum: number, ep: any) => sum + (ep.totalView || 0),
            0,
          );

          console.log('[recordView] totalSum series:', totalSum);

          await this.movieModel.update(
            { totalView: totalSum },
            { where: { id: movieId } },
          );

          console.log('[recordView] Series totalView updated:', totalSum);
        } else {
          console.log('[recordView] episodeId NULL → increment series level');

          await this.movieModel.increment('totalView', {
            by: 1,
            where: { id: movieId },
          });

          console.log('[recordView] Series totalView +1 SUCCESS');
        }
      }

      await redis.set(viewedKey, '1', 'EX', 86400);
      console.log('[recordView] viewedKey set with expire 86400');

      console.log('[recordView] ===== SUCCESS =====');

      return { message: 'Berhasil mencatat', data: { success: true } };
    } catch (error) {
      console.error('[recordView] ERROR:', error);
      console.log('[recordView] ===== FAILED =====');
      throw error;
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
