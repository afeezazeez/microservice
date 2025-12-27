export interface Role {
  id: number
  name: string
  slug: string
  description: string
  permissions?: Array<{
    id: number
    name: string
    slug: string
  }>
}

export interface RoleListResponse {
  roles: Role[]
}

