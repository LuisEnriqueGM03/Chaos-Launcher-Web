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

const CHUNK_RETRIES = 4;

const FILE_CHANGED_MESSAGE =
  'No se pudo leer el archivo: cambió, se movió o se está sincronizando desde que lo elegiste. ' +
  'Cópialo a una carpeta local estable (p. ej. el Escritorio), vuelve a elegirlo e inténtalo de nuevo.';

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const modpackImportApi = {
  /**
   * Sube el ZIP en partes (cada una por debajo del límite de 100 MB de Cloudflare y leída del disco en el
   * momento de enviarla, sin una subida única larga que el navegador pueda abortar) y lanza la importación.
   */
  async start(params: StartImportParams): Promise<{ jobId: string }> {
    const { file } = params;

    const { uploadId, chunkSize } = (await apiClient.post('/modpacks/import/upload', {
      fileName: file.name,
      size: file.size,
    })) as { uploadId: string; chunkSize: number };

    const totalChunks = Math.ceil(file.size / chunkSize);
    let sentBytes = 0;

    for (let index = 0; index < totalChunks; index++) {
      const blob = file.slice(index * chunkSize, Math.min(file.size, (index + 1) * chunkSize));

      let data: ArrayBuffer;
      try {
        data = await blob.arrayBuffer();
      } catch {
        throw new Error(FILE_CHANGED_MESSAGE);
      }

      for (let attempt = 1; ; attempt++) {
        try {
          await apiClient.put(`/modpacks/import/upload/${uploadId}/chunk?index=${index}`, data, {
            headers: { 'Content-Type': 'application/octet-stream' },
            timeout: 0,
            onUploadProgress: (e) => {
              params.onUploadProgress?.(Math.min(99, Math.round(((sentBytes + e.loaded) / file.size) * 100)));
            },
          });
          break;
        } catch (err) {
          // El servidor ignora partes repetidas, así que reintentar es seguro
          if (attempt >= CHUNK_RETRIES) throw err;
          await wait(1500 * attempt);
        }
      }

      sentBytes += data.byteLength;
      params.onUploadProgress?.(Math.round((sentBytes / file.size) * 100));
    }

    return apiClient.post(`/modpacks/import/upload/${uploadId}/start`, {
      githubToken: params.githubToken,
      modpackTag: params.modpackTag,
      repoName: params.repoName,
      serverIp: params.serverIp,
      serverPort: params.serverPort,
    });
  },

  async getStatus(jobId: string): Promise<ImportJobStatus> {
    return apiClient.get(`/modpacks/import/${jobId}`);
  },
};
