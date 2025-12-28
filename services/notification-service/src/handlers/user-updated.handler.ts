import { IEventHandler } from '../interfaces/event-handler.interface';
import { UserUpdatedEvent } from '../types/events';
import { UserRepository } from '../repositories/user.repository';
import { logger } from '../utils/logger';

export class UserUpdatedHandler implements IEventHandler {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async handle(event: UserUpdatedEvent): Promise<void> {
    try {
      const user = await this.userRepository.findById(event.data.id);
      if (user) {
        await this.userRepository.update(event.data.id, {
          company_id: event.data.company_id,
          name: event.data.name,
          email: event.data.email,
        });
        logger.info(`User updated in notification service: ${event.data.id}`);
      } else {
        // If user doesn't exist, create it (handles race conditions)
        await this.userRepository.create({
          id: event.data.id,
          company_id: event.data.company_id,
          name: event.data.name,
          email: event.data.email,
        });
        logger.info(`User created in notification service (from update event): ${event.data.id}`);
      }
    } catch (error: any) {
      logger.error(`Failed to update user in notification service: ${error.message}`, {
        user_id: event.data.id,
      });
      throw error;
    }
  }
}

