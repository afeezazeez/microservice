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

export type NotificationEvent = 
  | UserCreatedEvent 
  | UserUpdatedEvent 
  | UserDeletedEvent 
  | UserInvitedEvent 
  | ProjectMemberAddedEvent 
  | ProjectMemberRemovedEvent;

