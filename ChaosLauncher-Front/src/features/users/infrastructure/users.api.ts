import { apiClient } from '../../../core/http/api-client';
import { User } from '../../../core/types/user.types';

export const usersApi = {
  async getAll(): Promise<User[]> {
    return apiClient.get('/users');
  },

  async create(data: {
    username: string;
    password: string;
    skinUrl?: string;
    role?: 'SUPERADMIN' | 'CREATOR' | 'USER';
  }): Promise<User> {
    return apiClient.post('/users', data);
  },

  async delete(id: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/users/${encodeURIComponent(id)}`);
  },
};
