import { IEventHandler } from '../interfaces/event-handler.interface';
import { TaskAssigneeUpdatedEvent } from '../types/events';
import { EmailService } from '../services/email.service';
import { NotificationService } from '../services/notification.service';
import { UserRepository } from '../repositories/user.repository';
import { logger } from '../utils/logger';

export class TaskAssigneeUpdatedHandler implements IEventHandler {
  private emailService: EmailService;
  private notificationService: NotificationService;
  private userRepository: UserRepository;

  constructor() {
    this.emailService = new EmailService();
    this.notificationService = new NotificationService();
    this.userRepository = new UserRepository();
  }

  async handle(event: TaskAssigneeUpdatedEvent): Promise<void> {
    try {
      const recipients = new Set<number>();

      if (event.data.new_assignee && event.data.new_assignee !== event.data.updated_by) {
        recipients.add(event.data.new_assignee);
      }

      if (event.data.previous_assignee && event.data.previous_assignee !== event.data.updated_by) {
        recipients.add(event.data.previous_assignee);
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
      const newAssignee = event.data.new_assignee ? await this.userRepository.findById(event.data.new_assignee) : null;
      const previousAssignee = event.data.previous_assignee ? await this.userRepository.findById(event.data.previous_assignee) : null;

      await Promise.all(
        validUsers.map(async (user) => {
          if (!user) return;

          const isNewAssignee = event.data.new_assignee && user.id === event.data.new_assignee;
          const isPreviousAssignee = event.data.previous_assignee && user.id === event.data.previous_assignee;
          const isWatcher = !isNewAssignee && !isPreviousAssignee;

          if (isNewAssignee) {
            await this.emailService.sendEmail({
              to: user.email,
              subject: `Task assigned to you: ${event.data.task_title}`,
              template: 'task-assignee-updated',
              data: {
                title: 'Task Assigned to You',
                userName: user.name,
                taskTitle: event.data.task_title,
                projectName: event.data.project_name,
                isNewAssignee: true,
              },
            });

            await this.notificationService.createNotification({
              user_id: user.id,
              type: 'task.assignee.updated',
              title: 'Task assigned to you',
              message: `Task "${event.data.task_title}" in project "${event.data.project_name}" has been assigned to you`,
              metadata: {
                task_id: event.data.task_id,
                project_id: event.data.project_id,
              },
            });
          } else if (isPreviousAssignee) {
            const newAssigneeName = newAssignee ? newAssignee.name : 'another user';
            await this.emailService.sendEmail({
              to: user.email,
              subject: `Task reassigned: ${event.data.task_title}`,
              template: 'task-assignee-updated',
              data: {
                title: 'Task Reassigned',
                userName: user.name,
                taskTitle: event.data.task_title,
                projectName: event.data.project_name,
                isNewAssignee: false,
                newAssigneeName: newAssigneeName,
              },
            });

            await this.notificationService.createNotification({
              user_id: user.id,
              type: 'task.assignee.updated',
              title: 'Task reassigned',
              message: `Task "${event.data.task_title}" in project "${event.data.project_name}" has been reassigned to ${newAssigneeName}`,
              metadata: {
                task_id: event.data.task_id,
                project_id: event.data.project_id,
              },
            });
          } else if (isWatcher) {
            const newAssigneeName = newAssignee ? newAssignee.name : 'another user';
            await this.emailService.sendEmail({
              to: user.email,
              subject: `Task assignee updated: ${event.data.task_title}`,
              template: 'task-assignee-updated',
              data: {
                title: 'Task Assignee Updated',
                userName: user.name,
                taskTitle: event.data.task_title,
                projectName: event.data.project_name,
                isWatcher: true,
                newAssigneeName: newAssigneeName,
              },
            });

            await this.notificationService.createNotification({
              user_id: user.id,
              type: 'task.assignee.updated',
              title: 'Task assignee updated',
              message: `Task "${event.data.task_title}" in project "${event.data.project_name}" has been assigned to ${newAssigneeName}`,
              metadata: {
                task_id: event.data.task_id,
                project_id: event.data.project_id,
              },
            });
          }
        })
      );

      logger.info(`Task assignee updated notifications sent to ${validUsers.length} recipients`);
    } catch (error: any) {
      logger.error(`Failed to handle task assignee updated event: ${error.message}`, {
        task_id: event.data.task_id,
      });
      throw error;
    }
  }
}

