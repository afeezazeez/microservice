import { IEventHandler } from '../interfaces/event-handler.interface';
import { UserInvitedEvent } from '../types/events';
import { EmailService } from '../services/email.service';
import { UserRepository } from '../repositories/user.repository';
import { logger } from '../utils/logger';

export class UserInvitedHandler implements IEventHandler {
  private emailService: EmailService;
  private userRepository: UserRepository;

  constructor() {
    this.emailService = new EmailService();
    this.userRepository = new UserRepository();
  }

  async handle(event: UserInvitedEvent): Promise<void> {
    try {
      const user = await this.userRepository.findById(event.data.user_id);
      if (!user) {
        logger.warn(`User not found in notification service for invitation: ${event.data.user_id}`);
        return;
      }

      await this.emailService.sendUserInvitation({
        to: user.email,
        userName: user.name,
        userEmail: user.email,
        companyName: event.data.company_name,
        roleName: event.data.role_name,
      });
    } catch (error: any) {
      logger.error(`Failed to handle user invited event: ${error.message}`, {
        user_id: event.data.user_id,
      });
      throw error;
    }
  }
}

