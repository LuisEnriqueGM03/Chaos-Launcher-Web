import { apiClient } from '../../../core/http/api-client';
import { Modpack, ServerStatusData } from '../../../core/types/modpack.types';

export const modpacksApi = {
  async getAll(includeInactive = false): Promise<Modpack[]> {
    return apiClient.get(`/modpacks?all=${includeInactive}`);
  },

  async getByTag(tag: string): Promise<Modpack> {
    return apiClient.get(`/modpacks/${encodeURIComponent(tag)}`);
  },

  async create(data: Partial<Modpack>): Promise<Modpack> {
    return apiClient.post('/modpacks', data);
  },

  async update(tag: string, data: Partial<Modpack>): Promise<Modpack> {
    return apiClient.patch(`/modpacks/${encodeURIComponent(tag)}`, data);
  },

  async delete(tag: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/modpacks/${encodeURIComponent(tag)}`);
  },

  async syncGithub(tag: string): Promise<{ message: string; sourceUrl: string; modpack: Modpack }> {
    return apiClient.post(`/modpacks/${encodeURIComponent(tag)}/sync-github`, {}, {
      timeout: 60000,
    });
  },

  async getServerStatus(tag: string): Promise<ServerStatusData> {
    return apiClient.get(`/modpacks/${encodeURIComponent(tag)}/server-status`);
  },

  async getSourceMods(tag: string): Promise<import('../../../core/types/modpack.types').SourceModsResponse> {
    return apiClient.get(`/modpacks/${encodeURIComponent(tag)}/source-mods`);
  },

  async saveOptionalMods(tag: string, mods: Array<{
    modId: string;
    name: string;
    file: string;
    description?: string;
    defaultEnabled?: boolean;
  }>): Promise<{ message: string; count: number }> {
    return apiClient.put(`/modpacks/${encodeURIComponent(tag)}/optional-mods`, { mods });
  },

  async uploadImage(file: File, category: 'icons' | 'wallpapers' | 'general' = 'general'): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient.post<{ url: string }>(`/uploads/image?category=${category}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res as unknown as { url: string };
  },
};
