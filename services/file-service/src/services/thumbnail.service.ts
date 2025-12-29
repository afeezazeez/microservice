import sharp from 'sharp';
import { spawn } from 'child_process';
import { Readable } from 'stream';
import minioService from './minio.service';
import { WinstonLogger } from '../utils/logger/winston.logger';

const logger = new WinstonLogger('ThumbnailService');

export class ThumbnailService {
  private readonly THUMBNAIL_WIDTH = 300;
  private readonly THUMBNAIL_HEIGHT = 300;
  private readonly THUMBNAIL_QUALITY = 80;

  async generateThumbnail(
    fileBuffer: Buffer,
    mimeType: string,
    originalName: string,
    userId: number
  ): Promise<string | null> {
    try {
      if (this.isImage(mimeType)) {
        return await this.generateImageThumbnail(fileBuffer, userId);
      } else if (this.isVideo(mimeType)) {
        return await this.generateVideoThumbnail(fileBuffer, mimeType, userId);
      } else if (this.isPDF(mimeType)) {
        return await this.generatePDFThumbnail(fileBuffer, userId);
      } else if (this.isDocument(mimeType)) {
        return null;
      }
      return null;
    } catch (error: any) {
      logger.warn('Failed to generate thumbnail', {
        mimeType,
        error: error.message,
      });
      return null;
    }
  }

  private async generateImageThumbnail(
    fileBuffer: Buffer,
    userId: number
  ): Promise<string> {
    const thumbnailBuffer = await sharp(fileBuffer)
      .resize(this.THUMBNAIL_WIDTH, this.THUMBNAIL_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: this.THUMBNAIL_QUALITY })
      .toBuffer();

    const thumbnailPath = `thumbnails/${userId}/${Date.now()}-thumb.jpg`;
    await minioService.uploadBuffer(thumbnailBuffer, thumbnailPath, 'image/jpeg');

    return thumbnailPath;
  }

  private async generateVideoThumbnail(
    fileBuffer: Buffer,
    mimeType: string,
    userId: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i',
        'pipe:0',
        '-ss',
        '00:00:01',
        '-vframes',
        '1',
        '-vf',
        `scale=${this.THUMBNAIL_WIDTH}:${this.THUMBNAIL_HEIGHT}:force_original_aspect_ratio=decrease`,
        '-f',
        'image2pipe',
        '-vcodec',
        'mjpeg',
        '-q:v',
        String(this.THUMBNAIL_QUALITY),
        'pipe:1',
      ]);

      const chunks: Buffer[] = [];

      ffmpeg.stdout.on('data', (chunk) => {
        chunks.push(chunk);
      });

      ffmpeg.stderr.on('data', () => {});

      ffmpeg.on('close', async (code) => {
        if (code !== 0) {
          reject(new Error(`FFmpeg process exited with code ${code}`));
          return;
        }

        const thumbnailBuffer = Buffer.concat(chunks);
        const thumbnailPath = `thumbnails/${userId}/${Date.now()}-thumb.jpg`;
        await minioService.uploadBuffer(thumbnailBuffer, thumbnailPath, 'image/jpeg');
        resolve(thumbnailPath);
      });

      ffmpeg.on('error', (error) => {
        reject(error);
      });

      const inputStream = Readable.from(fileBuffer);
      inputStream.pipe(ffmpeg.stdin);
    });
  }

  private async generatePDFThumbnail(
    fileBuffer: Buffer,
    userId: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const pdftoppm = spawn('pdftoppm', [
        '-jpeg',
        '-f',
        '1',
        '-l',
        '1',
        '-scale-to-x',
        String(this.THUMBNAIL_WIDTH),
        '-scale-to-y',
        String(this.THUMBNAIL_HEIGHT),
        '-',
        '-',
      ]);

      const chunks: Buffer[] = [];

      pdftoppm.stdout.on('data', (chunk) => {
        chunks.push(chunk);
      });

      pdftoppm.stderr.on('data', () => {});

      pdftoppm.on('close', async (code) => {
        if (code !== 0) {
          reject(new Error(`pdftoppm process exited with code ${code}`));
          return;
        }

        const thumbnailBuffer = Buffer.concat(chunks);
        const thumbnailPath = `thumbnails/${userId}/${Date.now()}-thumb.jpg`;
        await minioService.uploadBuffer(thumbnailBuffer, thumbnailPath, 'image/jpeg');
        resolve(thumbnailPath);
      });

      pdftoppm.on('error', (error) => {
        reject(error);
      });

      const inputStream = Readable.from(fileBuffer);
      inputStream.pipe(pdftoppm.stdin);
    });
  }

  async getThumbnail(thumbnailPath: string): Promise<Buffer> {
    return await minioService.downloadFile(thumbnailPath);
  }

  async deleteThumbnail(thumbnailPath: string): Promise<void> {
    await minioService.deleteFile(thumbnailPath);
  }

  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  private isVideo(mimeType: string): boolean {
    return mimeType.startsWith('video/');
  }

  private isPDF(mimeType: string): boolean {
    return mimeType === 'application/pdf';
  }

  private isDocument(mimeType: string): boolean {
    const documentTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
    ];
    return documentTypes.includes(mimeType);
  }

  supportsPreview(mimeType: string): boolean {
    return (
      this.isImage(mimeType) ||
      this.isVideo(mimeType) ||
      this.isPDF(mimeType) ||
      this.isDocument(mimeType)
    );
  }
}

export default new ThumbnailService();

