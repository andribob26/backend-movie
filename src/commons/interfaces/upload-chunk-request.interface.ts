export interface UploadChunkRequest {
  uploadId: string;
  folder: string;
  chunkIndex: number;
  totalChunks: number;
  data: Uint8Array;
  originalName: string;
  size: number;
  mimeType: string;
}
