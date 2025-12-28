import { IEventHandler } from '../interfaces/event-handler.interface';
import { UserDeletedEvent } from '../types/events';
import { UserRepository } from '../repositories/user.repository';
import { logger } from '../utils/logger';

export class UserDeletedHandler implements IEventHandler {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async handle(event: UserDeletedEvent): Promise<void> {
    try {
      const user = await this.userRepository.findById(event.data.id);
      if (user) {
        await this.userRepository.hardDelete(event.data.id);
        logger.info(`User deleted from notification service: ${event.data.id}`);
      } else {
        logger.warn(`User not found in notification service for deletion: ${event.data.id}`);
      }
    } catch (error: any) {
      logger.error(`Failed to delete user from notification service: ${error.message}`, {
        user_id: event.data.id,
      });
      throw error;
    }
  }
}

