import { apiClient } from '../../../core/http/api-client';

export interface ImportResult {
  unchanged: boolean;
  tag: string;
  repo: string;
  repoUrl: string;
  version: string;
  previousVersion: string | null;
  created: boolean;
  totalFiles: number;
  changes: { added: number; modified: number; removed: number };
  commitUrl?: string;
  unresolvedMods: Array<{ projectID: number; fileID: number }>;
  largeFiles: number;
  ignoredModJars: number;
}

export interface ImportJobStatus {
  id: string;
  status: 'running' | 'done' | 'error';
  stage: string;
  percent: number;
  log: string[];
  result?: ImportResult;
  error?: string;
}

export interface StartImportParams {
  file: File;
  githubToken: string;
  modpackTag?: string;
  repoName?: string;
  serverIp?: string;
  serverPort?: string;
  onUploadProgress?: (percent: number) => void;
}

export const modpackImportApi = {
  /** Sube el ZIP y devuelve el id del trabajo en segundo plano. */
  async start(params: StartImportParams): Promise<{ jobId: string }> {
    const form = new FormData();
    form.append('githubToken', params.githubToken);
    if (params.modpackTag) form.append('modpackTag', params.modpackTag);
    if (params.repoName) form.append('repoName', params.repoName);
    if (params.serverIp) form.append('serverIp', params.serverIp);
    if (params.serverPort) form.append('serverPort', params.serverPort);
    // El archivo va al final para que el servidor ya tenga los campos de texto al recibirlo
    form.append('file', params.file);

    return apiClient.post('/modpacks/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0, // el ZIP puede pesar cientos de MB
      onUploadProgress: (e) => {
        if (params.onUploadProgress && e.total) {
          params.onUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    });
  },

  async getStatus(jobId: string): Promise<ImportJobStatus> {
    return apiClient.get(`/modpacks/import/${jobId}`);
  },
};
