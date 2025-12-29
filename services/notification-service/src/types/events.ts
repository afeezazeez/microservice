export interface UserCreatedEvent {
  event: 'user.created';
  data: {
    id: number;
    company_id: number;
    name: string;
    email: string;
  };
}

export interface UserUpdatedEvent {
  event: 'user.updated';
  data: {
    id: number;
    company_id: number;
    name: string;
    email: string;
  };
}

export interface UserDeletedEvent {
  event: 'user.deleted';
  data: {
    id: number;
  };
}

export interface UserInvitedEvent {
  event: 'user.invited';
  data: {
    user_id: number;
    user_email: string;
    user_name: string;
    company_name: string;
    role_name: string;
  };
}

export interface ProjectMemberAddedEvent {
  event: 'project.member.added';
  data: {
    project_name: string;
    user_id: number;
    company_name: string;
  };
}

export interface ProjectMemberRemovedEvent {
  event: 'project.member.removed';
  data: {
    project_name: string;
    user_id: number;
    company_name: string;
  };
}

export interface TaskCreatedEvent {
  event: 'task.created';
  data: {
    task_id: number;
    task_title: string;
    project_id: number;
    project_name: string;
    assigned_to?: number;
    created_by: number;
  };
}

export interface TaskUpdatedEvent {
  event: 'task.updated';
  data: {
    task_id: number;
    task_title: string;
    project_id: number;
    project_name: string;
    assigned_to?: number;
    updated_by: number;
    watcher_ids: number[];
  };
}

export interface TaskDeletedEvent {
  event: 'task.deleted';
  data: {
    task_id?: number;
    task_title?: string;
    project_id?: number;
    project_name?: string;
    assigned_to?: number;
    watcher_ids?: number[];
    file_ids?: number[];
  };
}

export interface TaskStatusChangedEvent {
  event: 'task.status_changed';
  data: {
    task_id: number;
    task_title: string;
    project_id: number;
    project_name: string;
    old_status: string;
    new_status: string;
    assigned_to?: number;
    updated_by: number;
    watcher_ids: number[];
  };
}

export interface TaskAssigneeUpdatedEvent {
  event: 'task.assignee.updated';
  data: {
    task_id: number;
    task_title: string;
    project_id: number;
    project_name: string;
    previous_assignee?: number;
    new_assignee?: number;
    updated_by: number;
    watcher_ids: number[];
  };
}

export type NotificationEvent = 
  | UserCreatedEvent 
  | UserUpdatedEvent 
  | UserDeletedEvent 
  | UserInvitedEvent 
  | ProjectMemberAddedEvent 
  | ProjectMemberRemovedEvent
  | TaskCreatedEvent
  | TaskUpdatedEvent
  | TaskDeletedEvent
  | TaskStatusChangedEvent
  | TaskAssigneeUpdatedEvent;

