import { IEventHandler } from '../interfaces/event-handler.interface';
import { TaskCreatedEvent } from '../types/events';
import { EmailService } from '../services/email.service';
import { NotificationService } from '../services/notification.service';
import { UserRepository } from '../repositories/user.repository';
import { logger } from '../utils/logger';

export class TaskCreatedHandler implements IEventHandler {
  private emailService: EmailService;
  private notificationService: NotificationService;
  private userRepository: UserRepository;

  constructor() {
    this.emailService = new EmailService();
    this.notificationService = new NotificationService();
    this.userRepository = new UserRepository();
  }

  async handle(event: TaskCreatedEvent): Promise<void> {
    try {
      if (!event.data.assigned_to) {
        return;
      }

      const assignee = await this.userRepository.findById(event.data.assigned_to);
      if (!assignee) {
        logger.warn(`Assignee not found for task created: ${event.data.assigned_to}`);
        return;
      }

      await this.emailService.sendEmail({
        to: assignee.email,
        subject: `New task assigned: ${event.data.task_title}`,
        template: 'task-created',
        data: {
          title: 'New Task Assigned',
          userName: assignee.name,
          taskTitle: event.data.task_title,
          projectName: event.data.project_name,
        },
      });

      await this.notificationService.createNotification({
        user_id: assignee.id,
        type: 'task.created',
        title: 'New task assigned',
        message: `You have been assigned to task "${event.data.task_title}" in project "${event.data.project_name}"`,
        metadata: {
          task_id: event.data.task_id,
          project_id: event.data.project_id,
        },
      });

      logger.info(`Task created notification sent: ${assignee.email}`);
    } catch (error: any) {
      logger.error(`Failed to handle task created event: ${error.message}`, {
        task_id: event.data.task_id,
        assigned_to: event.data.assigned_to,
      });
      throw error;
    }
  }
}

