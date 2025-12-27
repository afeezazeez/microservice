import type { User } from './index'

export interface InviteUserPayload {
  name: string
  email: string
  role_slug: string
}

export interface UpdateUserPayload {
  name?: string
  email?: string
}

export interface UserListResponse {
  users: User[]
}

