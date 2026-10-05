import { apiClient } from '../../../core/http/api-client';
import { AuthResponse, User } from '../../../core/types/user.types';

export const authApi = {
  async login(credentials: { username: string; password: string }): Promise<AuthResponse> {
    return apiClient.post('/auth/login', credentials);
  },

  async register(data: {
    username: string;
    password: string;
    skinUrl?: string;
  }): Promise<AuthResponse> {
    return apiClient.post('/auth/register', data);
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getMe(): Promise<User> {
    return apiClient.get('/auth/me');
  },
};
