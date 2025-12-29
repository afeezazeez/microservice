import { TaskServiceEvent } from '../types/events';

export interface IEventHandler {
  handle(event: TaskServiceEvent): Promise<void>;
}


