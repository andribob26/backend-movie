import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Observable } from 'rxjs';
import { File } from 'src/entities/file.entity';
import * as fs from 'fs';
import * as path from 'path';
import { UploadChunkRequest } from 'src/commons/interfaces/upload-chunk-request.interface';
import { UploadChunkResponse } from 'src/commons/interfaces/upload-chunk-response.interface';
import { generateFileName } from 'src/commons/utils/upload.util';
import * as fileType from 'file-type';
import { InferCreationAttributes } from 'sequelize';

@Injectable()
export class FilesService {
  private activeUploads = new Map<string, boolean>();
  constructor(
    @InjectModel(File)
    private readonly fileModel: typeof File,
    private readonly configService: ConfigService,
  ) {}

  cancelUpload(uploadId: string) {
    this.activeUploads.set(uploadId, false);
  }

  private isUploadCanceled(uploadId: string): boolean {
    return this.activeUploads.get(uploadId) === false;
  }

  private observableToAsyncIterable<T>(
    observable: Observable<T>,
  ): AsyncIterable<T> {
    const iterator = {
      nextValue: null as T | null,
      done: false,
      error: null as any,
      resolve: null as ((value: IteratorResult<T>) => void) | null,
      reject: null as ((reason?: any) => void) | null,
      queue: [] as T[],
      subscription: null as any,

      [Symbol.asyncIterator]() {
        return this;
      },

      next() {
        if (this.queue.length > 0) {
          const value = this.queue.shift()!;
          return Promise.resolve({ value, done: false });
        }
        if (this.done) {
          return Promise.resolve({ value: undefined, done: true });
        }
        if (this.error) {
          return Promise.reject(this.error);
        }
        return new Promise<IteratorResult<T>>((resolve, reject) => {
          this.resolve = resolve;
          this.reject = reject;
        });
      },

      pushValue(value: T) {
        if (this.resolve) {
          this.resolve({ value, done: false });
          this.resolve = null;
          this.reject = null;
        } else {
          this.queue.push(value);
        }
      },

      finish() {
        this.done = true;
        if (this.resolve) {
          this.resolve({ value: undefined, done: true });
          this.resolve = null;
          this.reject = null;
        }
      },

      fail(err: any) {
        this.error = err;
        if (this.reject) {
          this.reject(err);
          this.resolve = null;
          this.reject = null;
        }
      },
    };

    iterator.subscription = observable.subscribe({
      next(value) {
        iterator.pushValue(value);
      },
      error(err) {
        iterator.fail(err);
      },
      complete() {
        iterator.finish();
      },
    });

    return iterator;
  }

  handleUploadChunks(
    stream$: Observable<UploadChunkRequest>,
  ): Observable<UploadChunkResponse> {
    return new Observable((observer) => {
      (async () => {
        let writeStream: fs.WriteStream | null = null;
        let totalChunks = 0;
        let receivedChunks = 0;
        let tempPath = '';
        let uploadId = '';
        let folder = '';
        let fileName = '';
        let originalName = '';
        let size = 0;
        let mimeType = '';

        try {
          for await (const chunk of this.observableToAsyncIterable(stream$)) {
            if (!uploadId) {
              uploadId = chunk.uploadId;
              this.activeUploads.set(uploadId, true);
            }

            if (this.isUploadCanceled(chunk.uploadId)) {
              if (writeStream) writeStream.destroy();
              try {
                fs.unlinkSync(tempPath);
              } catch (e: any) {
                if (e.code !== 'ENOENT') throw e;
              }
              throw new Error(`Upload dibatalkan oleh user`);
            }

            if (!chunk?.data) {
              console.log('[FileService] Invalid chunk data, skipping');
              continue;
            }

            if (!fileName) {
              fileName = generateFileName(chunk.originalName);
            }

            totalChunks = chunk.totalChunks;
            folder = chunk.folder;
            originalName = chunk.originalName;
            mimeType = chunk.mimeType;
            size = chunk.size;

            if (!writeStream) {
              const tempFolder = path.join(
                __dirname,
                '../../file-temps',
                folder,
              );
              if (!fs.existsSync(tempFolder)) {
                fs.mkdirSync(tempFolder, { recursive: true });
              }
              tempPath = path.join(tempFolder, fileName);

              writeStream = fs.createWriteStream(tempPath, { flags: 'a' });
              writeStream.on('error', (err) => {
                writeStream?.destroy();
                observer.error({
                  message: 'Failed to write temp file',
                  error: err?.message || err,
                  uploadId,
                  receivedChunks,
                  totalChunks,
                });
              });
            }

            const buffer = Buffer.from(chunk.data);
            if (!writeStream.write(buffer)) {
              await new Promise<void>((resolve) =>
                writeStream!.once('drain', resolve),
              );
            }

            receivedChunks++;

            const progress = (receivedChunks / totalChunks) * 100;
            observer.next({
              success: true,
              message: 'Uploading...',
              id: '',
              uploadId,
              fileName,
              mimeType,
              url: '',
              stage: 'uploading',
              progress,
            });
          }

          if (receivedChunks === 0) {
            observer.error({
              message: 'No chunks were received',
              error: new Error('No chunks were received'),
              uploadId,
              receivedChunks,
              totalChunks,
            });
            return;
          }

          await new Promise<void>((resolve, reject) => {
            if (!writeStream) return resolve();
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
            writeStream.end();
          });

          // 🔒 Validasi MIME sebelum pindah ke folder final
          const fileBuffer = fs.readFileSync(tempPath);
          let detectedType = await fileType.fromBuffer(fileBuffer);

          const ext = path.extname(originalName).toLowerCase();
          if (!detectedType && ext === '.srt') {
            detectedType = {
              ext: 'srt',
              mime: 'application/x-subrip',
            } as any;
          }

          console.log(detectedType, 'detectedType');

          const allowedMime = [
            'application/zip',
            'application/x-rar-compressed',
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'image/avif',
            'application/x-subrip',
          ];
          const blockedMime = [
            'application/x-msdownload',
            'application/x-sh',
            'application/x-php',
            'text/html',
            'application/javascript',
            'text/javascript',
            'application/x-python',
            'application/x-perl',
            'application/x-ruby',
          ];

          if (
            !detectedType ||
            !allowedMime.includes(detectedType.mime) ||
            blockedMime.includes(detectedType.mime)
          ) {
            try {
              fs.unlinkSync(tempPath);
            } catch (e: any) {
              if (e.code !== 'ENOENT') throw e;
            }
            throw new Error(
              `Tipe file tidak diperbolehkan: ${detectedType?.mime || 'unknown'}`,
            );
          }

          // ✅ Aman → pindahkan ke folder `files/`
          const isComplete = receivedChunks === totalChunks;
          const finalFolder = path.join(process.cwd(), 'files', folder);
          if (!fs.existsSync(finalFolder)) {
            fs.mkdirSync(finalFolder, { recursive: true });
          }
          const finalPath = path.join(finalFolder, fileName);
          // fs.renameSync(tempPath, finalPath);
          await this.moveFileSafe(tempPath, finalPath);

          // ✅ Simpan ke database
          let file = await this.fileModel.findOne({
            where: { uploadId },
          });

          if (!file) {
            file = this.fileModel.build({
              uploadId,
              folder,
              fileName,
              mimeType,
              size: Number(size),
              originalName,
              uploadedChunks: receivedChunks,
              completed: isComplete,
              filePath: String(finalPath),
            } as InferCreationAttributes<File>);
          } else {
            file.uploadedChunks = receivedChunks;
            file.completed = isComplete;
            file.filePath = finalPath;
          }

          const dataFile = await file.save();

          const baseUrl =
            this.configService.get('BASE_URL') || 'http://api.nimeninja.win';
          const fileUrl = `${baseUrl}/api/files/${folder}/${fileName}`;

          observer.next({
            success: true,
            message: 'File uploaded successfully',
            id: dataFile.id,
            uploadId,
            fileName: fileName,
            mimeType: mimeType,
            url: fileUrl,
            stage: 'done',
            progress: 100,
          });

          this.activeUploads.delete(uploadId);
          observer.complete();
        } catch (err) {
          this.activeUploads.delete(uploadId);
          console.error('[FileService] Error handling stream:', err);
          observer.error({
            message: 'Failed to upload chunks',
            error: err?.message || err,
            uploadId,
            receivedChunks,
            totalChunks,
          });

          try {
            fs.unlinkSync(tempPath);
          } catch (e: any) {
            if (e.code !== 'ENOENT')
              console.warn(`Gagal hapus tempPath: ${tempPath}`, e);
          }
        } finally {
          if (writeStream && !writeStream.closed && !writeStream.destroyed) {
            try {
              writeStream.end();
            } catch (e) {
              console.warn('Gagal end writeStream:', e);
            }
          }
        }
      })();
    });
  }

  private async moveFileSafe(tempPath: string, finalPath: string) {
    try {
      await fs.promises.rename(tempPath, finalPath);
    } catch (err: any) {
      if (err.code === 'EXDEV') {
        await fs.promises.copyFile(tempPath, finalPath);
        await fs.promises.unlink(tempPath);
        console.log(
          `[moveFileSafe] Moved across devices: ${tempPath} → ${finalPath}`,
        );
      } else {
        throw err;
      }
    }
  }
}
