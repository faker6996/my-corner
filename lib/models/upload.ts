export interface UploadedImage {
  id: string;
  path: string;
  url: string;
  originalName: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  formattedSize: string;
}

export interface OcrUploadResponse {
  imageUrl: string;
  filename: string;
  size: number;
  uploadedAt: string;
}

