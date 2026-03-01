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

      // 1. Rollup view7 & view30 (sudah benar, snake_case)
      await sequelize.query(`
      UPDATE movies m
      SET
        view7 = COALESCE((
          SELECT SUM(dv.view_count)
          FROM daily_views dv
          WHERE dv.movie_id = m.id
            AND dv.view_date >= CURRENT_DATE - INTERVAL '6 days'
            AND dv.view_date <= CURRENT_DATE
        ), 0),

        view30 = COALESCE((
          SELECT SUM(dv.view_count)
          FROM daily_views dv
          WHERE dv.movie_id = m.id
            AND dv.view_date >= CURRENT_DATE - INTERVAL '29 days'
            AND dv.view_date <= CURRENT_DATE
        ), 0),

        updated_at = CURRENT_TIMESTAMP
      WHERE EXISTS (
        SELECT 1 FROM daily_views dv WHERE dv.movie_id = m.id
      );
    `);

      this.logger.log('Rollup view7 & view30 selesai');

      // 2. Hitung popularityScore (hanya pakai kolom yang ada)
      await sequelize.query(`
      UPDATE movies m
      SET
        popularity_score = 
          (COALESCE(m.view7, 0) * 10.0) +
          (COALESCE(m.view30, 0) * 2.0) +
          (COALESCE(m.total_comment, 0) * 2.0) +
          (LEAST(COALESCE(m.imdb_rating, 0), 10.0) * 3.0),
        popularity_score_last_updated = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE 
        m.view7 > 0 
        OR m.view30 > 0 
        OR m.total_comment > 0 
        OR m.imdb_rating IS NOT NULL;
    `);

      this.logger.log('Rollup popularityScore selesai!');
    } catch (error) {
      this.logger.error('Error saat rollup views & popularity', error);
    }
  }
}
