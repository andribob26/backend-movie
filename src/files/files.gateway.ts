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
  transports: ['polling', 'websocket'], // ⛔ JANGAN DIUBAH
})
export class FilesGateway {
  private chunkSubjects = new Map<
    string,
    { subject: Subject<any>; timeout: NodeJS.Timeout }
  >();

  private readonly timeoutMs = 30000;

  constructor(private readonly filesService: FilesService) {
    console.log('[FilesGateway] initialized');
  }

  /* ===============================
     SOCKET LIFECYCLE DEBUG
  =============================== */
  afterInit() {
    console.log('[FilesGateway] afterInit');
  }

  handleConnection(client: Socket) {
    console.log(
      '[FilesGateway] client connected',
      client.id,
      'transport:',
      client.conn.transport.name,
    );
  }

  handleDisconnect(client: Socket) {
    console.log('[FilesGateway] client disconnected', client.id);
  }

  /* ===============================
     CANCEL UPLOAD
  =============================== */
  @SubscribeMessage('cancel_upload')
  handleCancelUpload(@MessageBody() data: { uploadId: string }) {
    console.log('[cancel_upload]', data?.uploadId);
    this.filesService.cancelUpload(data.uploadId);
  }

  /* ===============================
     UPLOAD CHUNK
  =============================== */
  @SubscribeMessage('upload_chunk')
  async handleUploadChunk(client: Socket, payload: UploadChunkRequest) {
    console.log(
      '[upload_chunk]',
      'client:',
      client.id,
      'uploadId:',
      payload?.uploadId,
      'chunk:',
      payload?.chunkIndex,
      '/',
      payload?.totalChunks,
      'size:',
      payload?.data?.length,
    );

    const { uploadId, chunkIndex, totalChunks } = payload;

    if (
      !uploadId ||
      totalChunks <= 0 ||
      chunkIndex < 0 ||
      chunkIndex >= totalChunks
    ) {
      console.log('[upload_chunk] INVALID META', payload);
      return client.emit('upload_error', {
        uploadId,
        message: 'Invalid upload metadata',
      });
    }

    let entry = this.chunkSubjects.get(uploadId);

    if (!entry) {
      console.log('[upload_chunk] CREATE SUBJECT', uploadId);

      const subject = new Subject<UploadChunkRequest>();
      const timeout = this.createTimeout(uploadId, client);

      this.chunkSubjects.set(uploadId, { subject, timeout });

      const response$ = this.filesService.handleUploadChunks(
        subject.asObservable(),
      );

      response$.subscribe({
        next: (res: UploadChunkResponse) => {
          if (res.stage === 'uploading') {
            console.log('[upload_progress]', uploadId, res.progress);
            client.emit('upload_progress', {
              uploadId: res.uploadId,
              progress: res.progress,
            });
          } else if (res.success && res.url) {
            console.log('[upload_done]', uploadId, res.url);
            client.emit('upload_done', res);
          }
        },
        error: (err: any) => {
          console.log('[upload_error]', uploadId, err?.message);
          client.emit('upload_error', {
            uploadId,
            message: err?.message || 'Upload failed',
          });
          this.cleanupUpload(uploadId);
        },
        complete: () => {
          console.log('[upload_complete]', uploadId);
          this.cleanupUpload(uploadId);
        },
      });

      entry = this.chunkSubjects.get(uploadId)!;
    }

    // reset timeout
    clearTimeout(entry.timeout);
    entry.timeout = this.createTimeout(uploadId, client);

    entry.subject.next(payload);

    console.log('[chunk_received emit]', uploadId, chunkIndex);

    client.emit('chunk_received', {
      uploadId,
      chunkIndex,
    });

    if (chunkIndex + 1 === totalChunks) {
      console.log('[last_chunk]', uploadId);
      entry.subject.complete();
    }
  }

  /* ===============================
     TIMEOUT & CLEANUP
  =============================== */
  private createTimeout(uploadId: string, client: Socket) {
    console.log('[timeout-set]', uploadId);

    return setTimeout(() => {
      console.log('[timeout-fired]', uploadId);

      client.emit('upload_error', {
        uploadId,
        message: 'Upload canceled due to inactivity',
      });

      this.cleanupUpload(uploadId);
    }, this.timeoutMs);
  }

  private cleanupUpload(uploadId: string) {
    console.log('[cleanupUpload]', uploadId);

    const entry = this.chunkSubjects.get(uploadId);
    if (entry) {
      entry.subject.complete();
      clearTimeout(entry.timeout);
      this.chunkSubjects.delete(uploadId);
    }
  }
}
