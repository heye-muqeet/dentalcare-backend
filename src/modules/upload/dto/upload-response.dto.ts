export class UploadResponseDto {
  success: boolean;
  message: string;
  data: {
    public_id: string;
    secure_url: string;
    width?: number;
    height?: number;
    format: string;
    bytes: number;
  };
}

export class FileInfoDto {
  success: boolean;
  data: {
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
    created_at: string;
    tags: string[];
  };
}
