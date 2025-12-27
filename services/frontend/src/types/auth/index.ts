export interface User {
  id: number
  email: string
  name: string
  company_id: number
  company_name: string | null
  roles: string[]
}

export interface Company {
  id: number
  name: string
  identifier: string
  email: string
}

export interface RegisterPayload {
  company: {
    name: string
    email: string
  }
  user: {
    name: string
    email: string
    password: string
    password_confirmation: string
  }
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterResponse {
  user: User
  company: Company
  access_token: string
  refresh_token: string
}

export interface LoginResponse {
  user: User
  access_token: string
  refresh_token: string
}

export interface MeResponse {
  user: User
}

export interface RefreshTokenResponse {
  access_token: string
}

