import { extname } from 'path';

export class FileUtil {
  static generateUniqueFilename(originalname: string): string {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(originalname);
    return `${uniqueSuffix}${ext}`;
  }

  static getFileExtension(filename: string): string {
    return extname(filename).toLowerCase();
  }

  static isImageFile(mimetype: string): boolean {
    return mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/) !== null;
  }

  static isDocumentFile(mimetype: string): boolean {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    return allowedMimes.includes(mimetype);
  }

  static getFileSizeInMB(bytes: number): number {
    return bytes / (1024 * 1024);
  }

  static validateFileSize(file: Express.Multer.File, maxSizeMB: number): boolean {
    const fileSizeMB = this.getFileSizeInMB(file.size);
    return fileSizeMB <= maxSizeMB;
  }
}
