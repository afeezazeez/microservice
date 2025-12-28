import { IEventHandler } from '../interfaces/event-handler.interface';
import { ProjectMemberAddedEvent } from '../types/events';
import { EmailService } from '../services/email.service';

export class ProjectMemberAddedHandler implements IEventHandler {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async handle(event: ProjectMemberAddedEvent): Promise<void> {
    await this.emailService.sendProjectMemberAddedNotification({
      to: event.data.user_email,
      userName: event.data.user_name,
      projectName: event.data.project_name,
      companyName: event.data.company_name || 'your company',
    });
  }
}

