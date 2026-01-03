import { Processor } from '@nestjs/bullmq';
import { WorkerHost } from '@nestjs/bullmq';
import { InjectModel } from '@nestjs/sequelize';
import { Job } from 'bullmq';
import * as fs from 'fs/promises';
import * as path from 'path';
import { File } from 'src/entities/file.entity';

@Processor('file_cleanup')
export class FileCleansProcessor extends WorkerHost {
  constructor(
    @InjectModel(File)
    private readonly fileModel: typeof File,
  ) {
    super();
  }

  async process(job: Job<{ fileId: string }>): Promise<void> {
    const { fileId } = job.data;
    console.log(`📦 Processing file cleanup job: ${job.id} - ${fileId}`);

    const file = await this.fileModel.findByPk(fileId);

    if (!file) {
      console.warn(`⚠️ File with id ${fileId} not found in DB`);
      return;
    }

    const filePath = file.dataValues.filePath;

    console.log(file, 'teeeees');

    // Hapus dari database terlebih dahulu
    await file.destroy();
    console.log(`✅ Deleted file ${fileId} from DB`);

    console.log(filePath, 'teeeees2');
    if (!filePath) {
      console.warn(`⚠️ File ${fileId} exists but has no valid file path`);
      return;
    }

    // Hapus file utama
    await this.deleteFileSafe(filePath);

    // Hapus file temps (jika ada)
    // if (file.filePath.includes('/files/')) {
    //   const tempsPath = file.filePath.replace('/files/', '/file-temps/');
    //   await this.deleteFileSafe(tempsPath);
    // }

    const relativeFromFiles = path.relative(
      path.join(process.cwd(), 'files'),
      filePath,
    );

    if (!relativeFromFiles.startsWith('..')) {
      const tempFilePath = path.join(
        process.cwd(),
        'file-temps',
        relativeFromFiles,
      );
      await this.deleteFileSafe(tempFilePath);
    }

    // Bersihkan semua folder kosong secara global
    await this.cleanAllEmptyFolders();
  }

  private async deleteFileSafe(filePath: string) {
    try {
      await fs.unlink(filePath);
      console.log(`🗑️ Deleted file: ${filePath}`);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        console.warn(`⚠️ File not found: ${filePath}`);
      } else {
        console.error(`❌ Failed to delete file: ${filePath}`, err);
        throw err; // Agar BullMQ bisa retry
      }
    }
  }

  private async deleteAllEmptyFolders(
    rootPath: string,
    stopFoldersAbs: string[],
  ): Promise<void> {
    try {
      const entries = await fs.readdir(rootPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subPath = path.join(rootPath, entry.name);
          await this.deleteAllEmptyFolders(subPath, stopFoldersAbs);
        }
      }

      // Jangan hapus folder penting
      const resolvedPath = path.resolve(rootPath);
      if (stopFoldersAbs.includes(resolvedPath)) return;

      const remaining = await fs.readdir(rootPath);
      if (remaining.length === 0) {
        await fs.rmdir(rootPath);
        console.log(`🧹 Deleted empty folder: ${rootPath}`);
      }
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        console.warn(`⚠️ Failed to clean folder ${rootPath}:`, err);
      }
    }
  }

  private async cleanAllEmptyFolders() {
    const projectRoot = path.resolve(process.cwd());
    const filesRoot = path.join(projectRoot, 'files');
    const fileTempsRoot = path.join(projectRoot, 'file-temps');
    const filesExtractRoot = path.join(projectRoot, 'files', 'extract');

    const stopFoldersAbs = [
      path.resolve(filesRoot),
      path.resolve(fileTempsRoot),
      path.resolve(filesExtractRoot),
    ];

    console.log('🧼 Starting full folder cleanup...');

    await this.deleteAllEmptyFolders(filesRoot, stopFoldersAbs);
    await this.deleteAllEmptyFolders(fileTempsRoot, stopFoldersAbs);

    console.log('✅ Folder cleanup finished.');
  }
}
