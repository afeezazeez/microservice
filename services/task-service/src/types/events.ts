export interface FileDeletedEvent {
  event: 'file.deleted';
  data: {
    file_id: number;
  };
}

export type TaskServiceEvent = FileDeletedEvent;

