import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DailyViewsService } from './daily-views.service';

@Processor('views_rollup')
@Injectable()
export class DailyViewsProcessor extends WorkerHost {
  private readonly logger = new Logger(DailyViewsProcessor.name);

  constructor(
    private readonly dailyViewsService: DailyViewsService,
    @InjectQueue('views_rollup') private readonly queue: Queue,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === 'daily-rolling-views') {
      this.logger.log('Menjalankan daily rollup view7 & view30...');
      await this.dailyViewsService.updateRollingViews();
      this.logger.log('Daily rollup selesai!');
    }
  }

  async onModuleInit() {
    try {
      // Tambah scheduler repeatable
      // BullMQ otomatis skip kalau jobId sudah ada (aman multi-instance)
      await this.queue.add(
        'daily-rolling-views',
        {}, // data kosong
        {
          repeat: {
            pattern: '10 0 * * *', // jam 00:10 setiap hari
            // timezone: 'Asia/Jakarta', // optional
          },
          jobId: 'daily-rolling-views-scheduler', // ← kunci unik ini yang bikin aman
          removeOnComplete: true,
          removeOnFail: true,
          attempts: 3,
          backoff: { type: 'exponential', delay: 10000 },
        },
      );

      this.logger.log(
        'Scheduler daily rollup berhasil dibuat (00:10 setiap hari)',
      );
    } catch (error) {
      this.logger.error('Gagal membuat scheduler rollup:', error);
    }
  }
}
