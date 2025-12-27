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
    await this.emailService.sendUserInvitation({
      to: event.data.user_email,
      userName: event.data.user_name,
      userEmail: event.data.user_email,
      companyName: event.data.company_name,
    });
  }
}

