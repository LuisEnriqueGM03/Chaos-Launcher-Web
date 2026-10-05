import { apiClient } from '../../../core/http/api-client';

export interface GenerateManifestParams {
  repo: string;
  branch?: string;
  scope?: 'mods' | 'all';
  token?: string;
  name?: string;
  version?: string;
  minecraftVersion?: string;
  loaderType?: string;
  loaderVersion?: string;
  serverIp?: string;
  serverPort?: number;
  recommendedRam?: number;
  forceUpdate?: boolean;
  changelog?: string[];
}

export interface GeneratedManifestResult {
  success: boolean;
  manifest: any;
  previousVersion?: string | null;
  bumpedVersion?: string;
  hasChanges?: boolean;
  changesSummary?: {
    added: number;
    removed: number;
    modified: number;
    addedFiles?: string[];
    removedFiles?: string[];
    modifiedFiles?: string[];
  };
  summary: {
    totalFiles: number;
    totalSizeMb: number;
    cachedFiles: number;
    newFiles: number;
    scope: string;
    repo: string;
    branch: string;
  };
}

export interface PushManifestParams {
  repo: string;
  branch?: string;
  githubToken: string;
  manifest: any;
  commitMessage?: string;
  modpackTag?: string;
}

export interface PushManifestResult {
  success: boolean;
  message: string;
  commitUrl: string;
  commitSha: string;
  synced: boolean;
}

export const githubModpackApi = {
  async generateManifest(params: GenerateManifestParams): Promise<GeneratedManifestResult> {
    return apiClient.post('/modpacks/github/generate-manifest', params, {
      timeout: 60000, // 1 minuto de timeout para escaneo y cálculo de hashes
    });
  },

  async pushManifest(params: PushManifestParams): Promise<PushManifestResult> {
    return apiClient.post('/modpacks/github/push-manifest', params, {
      timeout: 60000, // 1 minuto de timeout para subida a GitHub
    });
  },
};
