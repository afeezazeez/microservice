import { IEventHandler } from '../interfaces/event-handler.interface';
import { UserCreatedEvent } from '../types/events';
import { UserRepository } from '../repositories/user.repository';
import { logger } from '../utils/logger';

export class UserCreatedHandler implements IEventHandler {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async handle(event: UserCreatedEvent): Promise<void> {
    try {
      await this.userRepository.create({
        id: event.data.id,
        company_id: event.data.company_id,
        name: event.data.name,
        email: event.data.email,
      });
      logger.info(`User created in notification service: ${event.data.id}`);
    } catch (error: any) {
      logger.error(`Failed to create user in notification service: ${error.message}`, {
        user_id: event.data.id,
      });
      throw error;
    }
  }
}

