export interface TaskWatcher {
  id: number
  task_id: number
  user_id: number
  created_at: string
}

export interface Task {
  id: number
  project_id: number
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED'
  assigned_to: number | null
  created_by: number
  due_date: string | null
  watchers?: TaskWatcher[]
  file_ids?: number[]
  created_at: string
  updated_at: string
}

export interface CreateTaskPayload {
  project_id: number
  title: string
  description?: string
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED'
  assigned_to?: number
  due_date?: string
  file_ids?: number[]
}

export interface UpdateTaskPayload {
  title?: string
  description?: string
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED'
  assigned_to?: number
  due_date?: string
  file_ids?: number[]
}

