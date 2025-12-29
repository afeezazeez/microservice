import { IEventHandler } from '../interfaces/event-handler.interface';
import { TaskUpdatedEvent } from '../types/events';
import { EmailService } from '../services/email.service';
import { NotificationService } from '../services/notification.service';
import { UserRepository } from '../repositories/user.repository';
import { logger } from '../utils/logger';

export class TaskUpdatedHandler implements IEventHandler {
  private emailService: EmailService;
  private notificationService: NotificationService;
  private userRepository: UserRepository;

  constructor() {
    this.emailService = new EmailService();
    this.notificationService = new NotificationService();
    this.userRepository = new UserRepository();
  }

  async handle(event: TaskUpdatedEvent): Promise<void> {
    try {
      const recipients = new Set<number>();

      if (event.data.assigned_to && event.data.assigned_to !== event.data.updated_by) {
        recipients.add(event.data.assigned_to);
      }

      event.data.watcher_ids.forEach(watcherId => {
        if (watcherId !== event.data.updated_by) {
          recipients.add(watcherId);
        }
      });

      if (recipients.size === 0) {
        return;
      }

      const users = await Promise.all(
        Array.from(recipients).map(userId => this.userRepository.findById(userId))
      );

      const validUsers = users.filter(user => user !== null);

      await Promise.all(
        validUsers.map(async (user) => {
          if (!user) return;

          await this.emailService.sendEmail({
            to: user.email,
            subject: `Task updated: ${event.data.task_title}`,
            template: 'task-updated',
            data: {
              title: 'Task Updated',
              userName: user.name,
              taskTitle: event.data.task_title,
              projectName: event.data.project_name,
            },
          });

          await this.notificationService.createNotification({
            user_id: user.id,
            type: 'task.updated',
            title: 'Task updated',
            message: `Task "${event.data.task_title}" in project "${event.data.project_name}" has been updated`,
            metadata: {
              task_id: event.data.task_id,
              project_id: event.data.project_id,
            },
          });
        })
      );

      logger.info(`Task updated notifications sent to ${validUsers.length} recipients`);
    } catch (error: any) {
      logger.error(`Failed to handle task updated event: ${error.message}`, {
        task_id: event.data.task_id,
      });
      throw error;
    }
  }
}

