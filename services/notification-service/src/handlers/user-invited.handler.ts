import { IEventHandler } from '../interfaces/event-handler.interface';
import { UserInvitedEvent } from '../types/events';
import { EmailService } from '../services/email.service';
import { logger } from '../utils/logger';

export class UserInvitedHandler implements IEventHandler {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async handle(event: UserInvitedEvent): Promise<void> {
    try {
      // Use email and name directly from the event to avoid race condition
      // The user might not exist in our database yet if user.created hasn't been processed
      await this.emailService.sendUserInvitation({
        to: event.data.user_email,
        userName: event.data.user_name,
        userEmail: event.data.user_email,
        companyName: event.data.company_name,
        roleName: event.data.role_name,
      });

      logger.info(`User invitation email sent: ${event.data.user_email}`);
    } catch (error: any) {
      logger.error(`Failed to handle user invited event: ${error.message}`, {
        user_id: event.data.user_id,
        user_email: event.data.user_email,
      });
      throw error;
    }
  }
}

