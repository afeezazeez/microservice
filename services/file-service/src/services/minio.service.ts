import { Client } from 'minio';
import configService from '../utils/config/config.service';
import { WinstonLogger } from '../utils/logger/winston.logger';
import { v4 as uuidv4 } from 'uuid';

const Logger = new WinstonLogger('MinIO');

class MinIOService {
  private client: Client;
  private bucketName: string;

  constructor() {
    const endpoint = configService.get('MINIO_ENDPOINT', 'minio');
    const port = configService.getNumber('MINIO_PORT', 9000);
    const useSSL = configService.getBoolean('MINIO_USE_SSL', false);
    const accessKey = configService.get('MINIO_ACCESS_KEY', 'minioadmin');
    const secretKey = configService.get('MINIO_SECRET_KEY', 'minioadmin');
    const bucketName = configService.get('MINIO_BUCKET_NAME', 'task-files');

    this.client = new Client({
      endPoint: endpoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });

    this.bucketName = bucketName;
    this.ensureBucketExists();
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucketName);
      if (!exists) {
        await this.client.makeBucket(this.bucketName);
        Logger.info(`Bucket ${this.bucketName} created successfully`);
      }
    } catch (error: any) {
      Logger.error(`Failed to ensure bucket exists: ${error.message}`);
      throw error;
    }
  }

  async uploadFile(file: Express.Multer.File, userId: number): Promise<string> {
    try {
      const fileExtension = file.originalname.split('.').pop() || '';
      const filename = `${uuidv4()}.${fileExtension}`;
      const metaData = {
        'Content-Type': file.mimetype,
        'original-name': file.originalname,
        'uploaded-by': userId.toString(),
      };

      await this.client.putObject(this.bucketName, filename, file.buffer, file.size, metaData);
      Logger.info(`File uploaded successfully: ${filename}`);

      return filename;
    } catch (error: any) {
      Logger.error(`Failed to upload file: ${error.message}`);
      throw error;
    }
  }

  async downloadFile(storagePath: string): Promise<Buffer> {
    try {
      const dataStream = await this.client.getObject(this.bucketName, storagePath);
      const chunks: Buffer[] = [];

      return new Promise((resolve, reject) => {
        dataStream.on('data', (chunk) => chunks.push(chunk));
        dataStream.on('end', () => resolve(Buffer.concat(chunks)));
        dataStream.on('error', (error) => reject(error));
      });
    } catch (error: any) {
      Logger.error(`Failed to download file: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(storagePath: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucketName, storagePath);
      Logger.info(`File deleted successfully: ${storagePath}`);
    } catch (error: any) {
      Logger.error(`Failed to delete file: ${error.message}`);
      throw error;
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    storagePath: string,
    contentType: string
  ): Promise<void> {
    try {
      const metaData = {
        'Content-Type': contentType,
      };

      await this.client.putObject(
        this.bucketName,
        storagePath,
        buffer,
        buffer.length,
        metaData
      );
      Logger.info(`Buffer uploaded successfully: ${storagePath}`);
    } catch (error: any) {
      Logger.error(`Failed to upload buffer: ${error.message}`);
      throw error;
    }
  }
}

export default new MinIOService();

