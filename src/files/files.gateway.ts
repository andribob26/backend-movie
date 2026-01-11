import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UploadChunkRequest } from '../commons/interfaces/upload-chunk-request.interface';
import { Subject } from 'rxjs';
import { UploadChunkResponse } from '../commons/interfaces/upload-chunk-response.interface';
import { FilesService } from './files.service';

@WebSocketGateway({
  namespace: '/file',
  cors: { origin: '*' },
  transports: ['polling', 'websocket'], // ✅ WAJIB
})
export class FilesGateway {
  private chunkSubjects = new Map<
    string,
    { subject: Subject<any>; timeout: NodeJS.Timeout }
  >();

  private readonly timeoutMs = 30000;

  constructor(private readonly filesService: FilesService) {}

  @SubscribeMessage('cancel_upload')
  handleCancelUpload(@MessageBody() data: { uploadId: string }) {
    this.filesService.cancelUpload(data.uploadId);
  }

  @SubscribeMessage('upload_chunk')
  async handleUploadChunk(client: Socket, payload: UploadChunkRequest) {
    const { uploadId, chunkIndex, totalChunks } = payload;

    if (
      !uploadId ||
      totalChunks <= 0 ||
      chunkIndex < 0 ||
      chunkIndex >= totalChunks
    ) {
      return client.emit('upload_error', {
        uploadId,
        message: 'Invalid upload metadata',
      });
    }

    let entry = this.chunkSubjects.get(uploadId);

    if (!entry) {
      const subject = new Subject<UploadChunkRequest>();
      const timeout = this.createTimeout(uploadId, client);

      this.chunkSubjects.set(uploadId, { subject, timeout });

      const response$ = this.filesService.handleUploadChunks(
        subject.asObservable(),
      );

      response$.subscribe({
        next: (res: UploadChunkResponse) => {
          if (res.stage === 'uploading') {
            client.emit('upload_progress', {
              uploadId: res.uploadId,
              progress: res.progress,
            });
          } else if (res.success && res.url) {
            client.emit('upload_done', res);
          }
        },
        error: (err: any) => {
          client.emit('upload_error', {
            uploadId,
            message: err?.message || 'Upload failed',
          });
          this.cleanupUpload(uploadId);
        },
        complete: () => {
          this.cleanupUpload(uploadId);
        },
      });

      entry = this.chunkSubjects.get(uploadId)!;
    }

    // Reset timeout
    clearTimeout(entry.timeout);
    entry.timeout = this.createTimeout(uploadId, client);

    entry.subject.next(payload);

    client.emit('chunk_received', {
      uploadId,
      chunkIndex,
    });

    if (chunkIndex + 1 === totalChunks) {
      entry.subject.complete();
    }
  }

  private createTimeout(uploadId: string, client: Socket) {
    return setTimeout(() => {
      client.emit('upload_error', {
        uploadId,
        message: 'Upload canceled due to inactivity',
      });
      this.cleanupUpload(uploadId);
    }, this.timeoutMs);
  }

  private cleanupUpload(uploadId: string) {
    const entry = this.chunkSubjects.get(uploadId);
    if (entry) {
      console.log(`Cleaning up upload ${uploadId}`);
      entry.subject.complete();
      clearTimeout(entry.timeout);
      this.chunkSubjects.delete(uploadId);
    }
  }
}
