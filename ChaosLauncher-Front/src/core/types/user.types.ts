export type UserRole = 'SUPERADMIN' | 'CREATOR' | 'USER';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  skinUrl?: string;
  createdAt?: string;
  _count?: {
    modpacks?: number;
  };
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
