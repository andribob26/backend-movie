export interface UploadChunkResponse {
  success: boolean;
  message: string;
  id: string;
  uploadId: string;
  fileName: string;
  mimeType: string;
  url: string;
  stage: string;
  progress: number; // dari 0–100
}
