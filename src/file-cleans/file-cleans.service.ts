import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JobsOptions, Queue, QueueEvents } from 'bullmq';
import { BaseResponse } from 'src/commons/interfaces/base-response.interface';
import { File } from 'src/entities/file.entity';

@Injectable()
export class FileCleansService {
  private isCleaning = false; // ⚡ Flag untuk mencegah enqueue paralel
  private queueEvents: QueueEvents;

  constructor(
    @InjectQueue('file_cleanup')
    private queue: Queue,
    @InjectModel(File)
    private readonly fileModel: typeof File,
  ) {
    // Gunakan QueueEvents untuk listen event
    this.queueEvents = new QueueEvents('file_cleanup', {
      connection: this.queue.opts.connection, // ✅ ini ConnectionOptions
    });

    this.queueEvents.on('failed', async ({ jobId, failedReason }) => {
      const job = await this.queue.getJob(jobId);
      const attemptsMade = job?.attemptsMade ?? 0;

      console.error(
        `[FileCleanup] Job failed: ${jobId}, attemptsMade: ${attemptsMade}, reason: ${failedReason}`,
      );
    });

    this.queueEvents.on('completed', ({ jobId }) => {
      console.log(`[FileCleanup] Job completed: ${jobId}`);
    });
  }

  async enqueueUnusedFiles(): Promise<BaseResponse<any>> {
    if (this.isCleaning) {
      return {
        message: 'Cleanup already running',
        data: null,
      };
    }

    this.isCleaning = true; // mulai flag
    try {
      const unusedFiles = await this.fileModel.findAll({
        where: { isUsed: false },
      });

      if (unusedFiles.length === 0) {
        console.log('No unused files found for cleanup');
        return {
          message: `Delete jobs enqueued for unused files`,
          data: { count: 0, fileIds: null },
        };
      }

      const retryOpts: JobsOptions = {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: true,
      };

      // jobId unik untuk mencegah duplikasi queue
      const jobs = unusedFiles.map((file) => ({
        name: 'delete_file',
        data: { fileId: file.id },
        opts: { ...retryOpts, jobId: `delete_file_${file.id}` },
      }));

      if (jobs.length > 0) {
        await this.queue.addBulk(jobs);
      }

      const result = unusedFiles.map((file) => file.id);

      return {
        message: `Delete jobs enqueued for unused files`,
        data: { count: result.length, fileIds: result },
      };
    } catch (error) {
      throw error;
    } finally {
      this.isCleaning = false; // reset flag
    }
  }
}
