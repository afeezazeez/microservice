export interface ProjectMember {
  id: number
  user_id: number
  joined_at: string | null
}

export interface Project {
  id: number
  company_id: number
  name: string
  slug: string
  description: string | null
  status: 'active' | 'archived' | 'completed'
  created_by: number
  start_date: string | null
  end_date: string | null
  members?: ProjectMember[]
  created_at: string
  updated_at: string
}

export interface CreateProjectPayload {
  name: string
  description?: string
  start_date?: string
  end_date?: string
}

export interface UpdateProjectPayload {
  name?: string
  description?: string
  status?: 'active' | 'archived' | 'completed'
  start_date?: string
  end_date?: string
}

export interface AddMemberPayload {
  user_id: number
}

