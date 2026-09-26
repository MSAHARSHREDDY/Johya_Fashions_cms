export type UserRole = 'admin' | 'superadmin';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  lastLogin?: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: AuthUser;
  token?: string;
}
