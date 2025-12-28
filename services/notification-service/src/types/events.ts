export interface UserInvitedEvent {
  event: 'user.invited';
  data: {
    user_id: number;
    user_name: string;
    user_email: string;
    company_id: number;
    company_name: string;
    role_slug: string;
    role_name: string;
    invited_at: string;
  };
}

export interface ProjectMemberAddedEvent {
  event: 'project.member.added';
  data: {
    project_id: number;
    project_name: string;
    user_id: number;
    user_name: string;
    user_email: string;
    company_id: number;
    company_name: string | null;
    added_at: string;
  };
}

export interface ProjectMemberRemovedEvent {
  event: 'project.member.removed';
  data: {
    project_id: number;
    project_name: string;
    user_id: number;
    user_name: string;
    user_email: string;
    company_id: number;
    company_name: string | null;
    removed_at: string;
  };
}

export type NotificationEvent = UserInvitedEvent | ProjectMemberAddedEvent | ProjectMemberRemovedEvent;

