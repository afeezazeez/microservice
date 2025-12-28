import { IEventHandler } from '../interfaces/event-handler.interface';
import { ProjectMemberAddedEvent } from '../types/events';
import { EmailService } from '../services/email.service';
import { UserRepository } from '../repositories/user.repository';
import { logger } from '../utils/logger';

export class ProjectMemberAddedHandler implements IEventHandler {
  private emailService: EmailService;
  private userRepository: UserRepository;

  constructor() {
    this.emailService = new EmailService();
    this.userRepository = new UserRepository();
  }

  async handle(event: ProjectMemberAddedEvent): Promise<void> {
    try {
      const user = await this.userRepository.findById(event.data.user_id);
      if (!user) {
        logger.warn(`User not found in notification service for project member added: ${event.data.user_id}`);
        return;
      }

      await this.emailService.sendProjectMemberAddedNotification({
        to: user.email,
        userName: user.name,
        projectName: event.data.project_name,
        companyName: event.data.company_name || 'your company',
      });
    } catch (error: any) {
      logger.error(`Failed to handle project member added event: ${error.message}`, {
        project_name: event.data.project_name,
        user_id: event.data.user_id,
      });
      throw error;
    }
  }
}

