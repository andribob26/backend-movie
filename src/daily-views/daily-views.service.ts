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
      if (!this.movieModel.sequelize) {
        throw new Error('Sequelize instance tidak tersedia pada Movie model');
      }

      const sequelize = this.movieModel.sequelize!;

      // 1. Rollup view7 & view30
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

      // 2. Hitung popularityScore
      await sequelize.query(`
      UPDATE movies m
      SET
        popularityScore = 
          (COALESCE(m.view7, 0) * 10.0) +
          (COALESCE(m.view30, 0) * 2.0) +
          (COALESCE(m.totalLike, 0) * 1.5) +
          (COALESCE(m.totalComment, 0) * 2.0) +
          (LEAST(COALESCE(m.rating, 0), 10.0) * 3.0),
        "popularityScoreLastUpdated" = CURRENT_TIMESTAMP,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE 
        m.view7 > 0 
        OR m.view30 > 0 
        OR m.totalLike > 0 
        OR m.totalComment > 0 
        OR m.rating IS NOT NULL;
    `);

      this.logger.log('Rollup view7, view30, dan popularityScore selesai!');
    } catch (error) {
      this.logger.error('Error saat rollup views & popularity', error);
    }
  }
}
