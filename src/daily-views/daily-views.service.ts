import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Movie } from 'src/entities/movie.entity'; // sesuaikan path

@Injectable()
export class DailyViewsService {
  private readonly logger = new Logger(DailyViewsService.name);

  constructor(
    @InjectModel(Movie)
    private readonly movieModel: typeof Movie,
  ) {}

  /**
   * Update rolling window view7 & view30 setiap hari
   * - view7: jumlah view 7 hari terakhir (hari ini sampai 6 hari lalu)
   * - view30: jumlah view 30 hari terakhir (hari ini sampai 29 hari lalu)
   */
  async updateRollingViews(): Promise<void> {
    this.logger.log('Memulai rollup view7 & view30...');

    try {
      // Pastikan sequelize tersedia (non-null assertion aman karena config Sequelize sudah dijamin)
      if (!this.movieModel.sequelize) {
        throw new Error('Sequelize instance tidak tersedia pada Movie model');
      }

      const sequelize = this.movieModel.sequelize!; // alias untuk lebih readable

      await sequelize.query(`
        UPDATE movies m
        SET
          view7 = COALESCE((
            SELECT SUM(dv."viewCount")
            FROM daily_views dv
            WHERE dv."movieId" = m.id
            AND dv."viewDate" >= CURRENT_DATE - INTERVAL '6 days'
            AND dv."viewDate" <= CURRENT_DATE
          ), 0),

          view30 = COALESCE((
            SELECT SUM(dv."viewCount")
            FROM daily_views dv
            WHERE dv."movieId" = m.id
            AND dv."viewDate" >= CURRENT_DATE - INTERVAL '29 days'
            AND dv."viewDate" <= CURRENT_DATE
          ), 0),

          "updatedAt" = CURRENT_TIMESTAMP
        WHERE EXISTS (
          SELECT 1 FROM daily_views dv WHERE dv."movieId" = m.id
        );
      `);

      this.logger.log('Rollup view7 & view30 selesai!');
    } catch (error) {
      this.logger.error('Error saat rollup view7 & view30', error);
      // Optional: bisa kirim notifikasi (misal ke Slack/Discord) kalau error
      // Contoh: await this.notificationService.sendError('Rollup failed', error);
    }
  }
}
