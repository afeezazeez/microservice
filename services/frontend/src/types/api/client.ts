export interface FailedQueueItem {
  resolve: (value?: unknown) => void
  reject: (reason?: any) => void
}

