import { FileDeletedEvent } from '../types/events';
import { TaskFileRepository } from '../repositories/task-file.repository';
import { WinstonLogger } from '../utils/logger/winston.logger';

const logger = new WinstonLogger('FileDeletedHandler');

export async function handleFileDeleted(event: FileDeletedEvent): Promise<void> {
  try {
    const taskFileRepository = new TaskFileRepository();

    const taskFiles = await taskFileRepository.findAllWithoutPagination({
      where: { file_id: event.data.file_id } as any,
    });

    if (taskFiles.length === 0) {
      logger.info(`No task-file relationship found for file_id=${event.data.file_id}, skipping deletion`);
      return;
    }

    const deletedCount = await taskFileRepository.destroy({
      where: { file_id: event.data.file_id } as any,
    });

    logger.info(`Deleted ${deletedCount} task-file relationship(s) for file_id=${event.data.file_id}`);
  } catch (error: any) {
    logger.error(`Failed to handle file deleted event: ${error.message}`, {
      file_id: event.data.file_id,
    });
    throw error;
  }
}

