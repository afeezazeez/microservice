export interface TaskDeletedEvent {
  event: 'task.deleted';
  data: {
    file_ids: number[];
  };
}

export type FileServiceEvent = TaskDeletedEvent;

