export interface UserInvitedEvent {
  event: 'user.invited';
  data: {
    user_id: number;
    user_name: string;
    user_email: string;
    company_id: number;
    company_name: string;
    invited_at: string;
  };
}

export type NotificationEvent = UserInvitedEvent;

