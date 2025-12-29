import { TaskDeletedEvent } from '../types/events';
import { FileRepository } from '../repositories/file.repository';
import minioService from '../services/minio.service';
import { WinstonLogger } from '../utils/logger/winston.logger';

const logger = new WinstonLogger('TaskDeletedHandler');

export async function handleTaskDeleted(event: TaskDeletedEvent): Promise<void> {
  try {
    const fileRepository = new FileRepository();

    for (const fileId of event.data.file_ids) {
      try {
        const file = await fileRepository.findById(fileId);
        
        if (!file) {
          logger.warn(`File not found: file_id=${fileId}`);
          continue;
        }
        
        await minioService.deleteFile(file.storage_path);
        await fileRepository.hardDelete(fileId);
        
        logger.info(`File deleted due to task deletion: file_id=${fileId}`);
      } catch (error: any) {
        logger.error(`Failed to delete file ${fileId}: ${error.message}`);
      }
    }
  } catch (error: any) {
    logger.error(`Failed to handle task deleted event: ${error.message}`);
    throw error;
  }
}

