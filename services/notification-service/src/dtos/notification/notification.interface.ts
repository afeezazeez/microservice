export interface INotification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
}

