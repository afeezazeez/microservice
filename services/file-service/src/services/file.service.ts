import { FileRepository } from '../repositories/file.repository';
import { ClientErrorException } from '../exceptions/client.error.exception';
import { ResponseStatus } from '../enums/http-status-codes';
import File from '../database/models/File';
import minioService from './minio.service';
import thumbnailService from './thumbnail.service';
import { WinstonLogger } from '../utils/logger/winston.logger';
import { RabbitMQService } from './rabbitmq.service';
import { Op } from 'sequelize';

export class FileService {
  private readonly fileRepository: FileRepository;
  private readonly logger: WinstonLogger;
  private readonly rabbitMQService: RabbitMQService;

  constructor(logger?: WinstonLogger) {
    this.fileRepository = new FileRepository();
    this.logger = logger || new WinstonLogger('FileService');
    this.rabbitMQService = new RabbitMQService(logger);
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: number
  ): Promise<File> {
   
    const storagePath = await minioService.uploadFile(file, userId);

    let thumbnailPath: string | null = null;
    try {
      thumbnailPath = await thumbnailService.generateThumbnail(
        file.buffer,
        file.mimetype,
        file.originalname,
        userId
      );
      if (thumbnailPath) {
        this.logger.info('Thumbnail generated successfully', {
          file: file.originalname,
          thumbnail_path: thumbnailPath,
        });
      }
    } catch (error: any) {
      this.logger.error('Failed to generate thumbnail during upload', {
        error: error.message,
        stack: error.stack,
        file: file.originalname,
        mime_type: file.mimetype,
      });
    }

    const fileRecord = await this.fileRepository.create({
      filename: storagePath,
      original_name: file.originalname,
      mime_type: file.mimetype,
      size: file.size,
      storage_path: storagePath,
      uploaded_by: userId,
      thumbnail_path: thumbnailPath || undefined,
    });

    return fileRecord;
  }

  async getFile(fileId: number): Promise<File> {
    const file = await this.fileRepository.findById(fileId);

    if (!file) {
      throw new ClientErrorException('File not found', ResponseStatus.NOT_FOUND);
    }

    return file;
  }

  async getFilesByIds(fileIds: number[]): Promise<File[]> {
    if (fileIds.length === 0) {
      return [];
    }

    return await this.fileRepository.findAllWithoutPagination({
      where: { id: { [Op.in]: fileIds } } as any,
    });
  }

  async downloadFile(fileId: number): Promise<{ file: File; buffer: Buffer }> {
    const file = await this.getFile(fileId);
    const buffer = await minioService.downloadFile(file.storage_path);

    return { file, buffer };
  }

  async deleteFile(fileId: number, userId: number): Promise<void> {
    const file = await this.getFile(fileId);

    if (file.uploaded_by !== userId) {
      throw new ClientErrorException(
        'You do not have permission to delete this file',
        ResponseStatus.FORBIDDEN
      );
    }

    await minioService.deleteFile(file.storage_path);
    
    if (file.thumbnail_path) {
      try {
        await thumbnailService.deleteThumbnail(file.thumbnail_path);
      } catch (error: any) {
        this.logger.warn('Failed to delete thumbnail', {
          thumbnail_path: file.thumbnail_path,
          error: error.message,
        });
      }
    }
    
    await this.fileRepository.hardDelete(fileId);

    await this.rabbitMQService.publish('file.events', 'file.deleted', {
      event: 'file.deleted',
      data: {
        file_id: fileId,
      },
    });
  }
}

