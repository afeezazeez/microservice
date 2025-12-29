import { IEventHandler } from '../interfaces/event-handler.interface';
import { TaskDeletedEvent } from '../types/events';
import { EmailService } from '../services/email.service';
import { NotificationService } from '../services/notification.service';
import { UserRepository } from '../repositories/user.repository';
import { logger } from '../utils/logger';

export class TaskDeletedHandler implements IEventHandler {
  private emailService: EmailService;
  private notificationService: NotificationService;
  private userRepository: UserRepository;

  constructor() {
    this.emailService = new EmailService();
    this.notificationService = new NotificationService();
    this.userRepository = new UserRepository();
  }

  async handle(event: TaskDeletedEvent): Promise<void> {
    try {
      if (event.data.file_ids || !event.data.task_id) {
        return;
      }

      const recipients = new Set<number>();

      if (event.data.assigned_to) {
        recipients.add(event.data.assigned_to);
      }

      if (event.data.watcher_ids && event.data.watcher_ids.length > 0) {
        event.data.watcher_ids.forEach(watcherId => {
          recipients.add(watcherId);
        });
      }

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
            subject: `Task deleted: ${event.data.task_title}`,
            template: 'task-deleted',
            data: {
              title: 'Task Deleted',
              userName: user.name,
              taskTitle: event.data.task_title,
              projectName: event.data.project_name,
            },
          });

          await this.notificationService.createNotification({
            user_id: user.id,
            type: 'task.deleted',
            title: 'Task deleted',
            message: `Task "${event.data.task_title}" in project "${event.data.project_name}" has been deleted`,
            metadata: {
              project_id: event.data.project_id,
            },
          });
        })
      );

      logger.info(`Task deleted notifications sent to ${validUsers.length} recipients`);
    } catch (error: any) {
      logger.error(`Failed to handle task deleted event: ${error.message}`, {
        task_id: event.data.task_id,
        assigned_to: event.data.assigned_to,
      });
      throw error;
    }
  }
}

