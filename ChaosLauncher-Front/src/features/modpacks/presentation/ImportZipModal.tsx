'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  FileArchive,
  Key,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
  Github,
  Upload,
  Info,
} from 'lucide-react';
import { MinecraftButton } from '../../../shared/components/MinecraftButton';
import { MinecraftInput } from '../../../shared/components/MinecraftInput';
import { Modpack } from '../../../core/types/modpack.types';
import { ImportJobStatus, ImportResult, modpackImportApi } from '../infrastructure/modpack-import.api';

interface ImportZipModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Modpacks que el usuario puede actualizar (con repositorio de GitHub). */
  modpacks: Modpack[];
  /** Si se indica, el modal solo actualiza ese modpack (sin selector). */
  lockedTag?: string;
  /** Se llama al terminar la importación con éxito (p. ej. para refrescar listas). */
  onDone?: () => void;
  /** Se llama cuando el usuario cierra el resultado con «LISTO». */
  onFinished?: (result: ImportResult) => void;
}

const POLL_MS = 1500;

export const ImportZipModal: React.FC<ImportZipModalProps> = ({ isOpen, onClose, modpacks, lockedTag, onDone, onFinished }) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [target, setTarget] = useState<string>(''); // '' = modpack nuevo
  const [repoName, setRepoName] = useState('');
  const [serverIp, setServerIp] = useState('');

  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [job, setJob] = useState<ImportJobStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFile(null);
    setTarget(lockedTag || '');
    setRepoName('');
    setServerIp('');
    setUploadPercent(null);
    setJob(null);
    setBusy(false);
    setError(null);
    try {
      setToken(sessionStorage.getItem('chaos_github_pat') || '');
    } catch {
      setToken('');
    }
  }, [isOpen, lockedTag]);

  useEffect(() => {
    logEnd.current?.scrollIntoView({ block: 'end' });
  }, [job?.log.length]);

  if (!isOpen) return null;

  const finished = job?.status === 'done' || job?.status === 'error';
  const result = job?.status === 'done' ? job.result : undefined;

  const waitForJob = async (jobId: string): Promise<ImportJobStatus> => {
    for (;;) {
      const status = await modpackImportApi.getStatus(jobId);
      setJob(status);
      if (status.status !== 'running') return status;
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file) return setError('Elige el archivo .zip del modpack.');
    if (!file.name.toLowerCase().endsWith('.zip')) return setError('El archivo debe ser un .zip.');
    if (!token.trim()) return setError('Ingresa tu GitHub Personal Access Token (PAT).');

    setBusy(true);
    setUploadPercent(0);
    try {
      try {
        sessionStorage.setItem('chaos_github_pat', token.trim());
      } catch {
        // sessionStorage no disponible: el token solo se usa en esta petición
      }
      const { jobId } = await modpackImportApi.start({
        file,
        githubToken: token.trim(),
        modpackTag: target || undefined,
        repoName: !target ? repoName.trim() || undefined : undefined,
        serverIp: !target ? serverIp.trim() || undefined : undefined,
        onUploadProgress: setUploadPercent,
      });
      setUploadPercent(null);
      const final = await waitForJob(jobId);
      if (final.status === 'done') onDone?.();
    } catch (err: any) {
      setUploadPercent(null);
      setError(err.message || 'No se pudo importar el modpack.');
    } finally {
      setBusy(false);
    }
  };

  const percent = uploadPercent !== null ? Math.round(uploadPercent * 0.15) : job?.percent ?? 0;
  const stage = uploadPercent !== null ? `Subiendo ZIP (${uploadPercent}%)` : job?.stage || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="minecraft-panel max-w-xl w-full p-6 relative border-2 border-stone-700 bg-[#140e0c] shadow-2xl text-stone-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <FileArchive className="w-5 h-5 text-amber-400" />
            <h3 className="font-minecraft text-base font-bold text-white tracking-wide">Importar modpack desde ZIP</h3>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="p-1 hover:bg-stone-800 text-stone-400 hover:text-white transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resultado */}
        {result ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/60 flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs font-minecraft text-stone-300 leading-relaxed space-y-1">
                <h4 className="text-sm font-bold text-emerald-300">
                  {result.unchanged
                    ? 'Sin cambios: el ZIP es igual a lo que ya hay en el repositorio.'
                    : result.created
                    ? `¡Modpack creado! Versión v${result.version}`
                    : `¡Modpack actualizado! v${result.previousVersion} → v${result.version}`}
                </h4>
                <p>
                  Repositorio: <span className="text-amber-300 font-bold">{result.repo}</span> · {result.totalFiles}{' '}
                  archivos
                </p>
                {!result.unchanged && (
                  <p>
                    ➕ {result.changes.added} nuevos · 🔄 {result.changes.modified} modificados · 🗑️{' '}
                    {result.changes.removed} eliminados
                  </p>
                )}
                {result.largeFiles > 0 && <p>📦 {result.largeFiles} archivo(s) grande(s) subido(s) a un Release.</p>}
              </div>
            </div>

            {result.unresolvedMods.length > 0 && (
              <div className="p-3 bg-amber-950/60 border border-amber-700 text-amber-200 text-xs font-minecraft flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {result.unresolvedMods.length} mod(s) no se pudieron resolver en CurseForge y quedaron fuera del
                  manifiesto (projectID/fileID: {result.unresolvedMods.slice(0, 5).map((m) => `${m.projectID}/${m.fileID}`).join(', ')}
                  {result.unresolvedMods.length > 5 ? '…' : ''}).
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs font-minecraft pt-2">
              <a
                href={result.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1.5 underline"
              >
                <Github className="w-3.5 h-3.5" />
                <span>Ver repositorio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <MinecraftButton
                variant="green"
                size="md"
                onClick={() => {
                  onClose();
                  onFinished?.(result);
                }}
              >
                LISTO
              </MinecraftButton>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ZIP */}
            <div className="space-y-1.5">
              <label className="font-minecraft text-xs text-stone-300">Archivo ZIP del modpack (CurseForge) *</label>
              <input
                ref={fileInput}
                type="file"
                accept=".zip,application/zip"
                disabled={busy}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={busy}
                className="w-full minecraft-btn-gray px-3 py-3 text-xs font-minecraft flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span className="truncate">
                  {file ? `${file.name} (${(file.size / 1048576).toFixed(0)} MB)` : 'Elegir archivo .zip'}
                </span>
              </button>
            </div>

            {/* Nuevo o actualizar */}
            {lockedTag ? (
              <div className="p-2.5 bg-black/50 border border-stone-800 text-xs font-minecraft text-stone-300">
                Se actualizará este modpack (<span className="text-amber-300 font-bold">{lockedTag}</span>) con la versión siguiente.
              </div>
            ) : (
            <div className="space-y-1.5">
              <label className="font-minecraft text-xs text-stone-300">¿Qué quieres hacer?</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                disabled={busy}
                className="w-full bg-[#120a09] border-2 border-stone-700 px-3 py-2 text-xs font-minecraft text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Crear un modpack nuevo (y su repositorio)</option>
                {modpacks.map((m) => (
                  <option key={m.tag} value={m.tag}>
                    Actualizar «{m.name}» (v{m.version}) → versión siguiente
                  </option>
                ))}
              </select>
            </div>
            )}

            {!target && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <MinecraftInput
                  label="Nombre del repo"
                  placeholder="(por defecto, el nombre del modpack)"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  disabled={busy}
                />
                <MinecraftInput
                  label="IP del servidor"
                  placeholder="play.ejemplo.com"
                  value={serverIp}
                  onChange={(e) => setServerIp(e.target.value)}
                  disabled={busy}
                />
              </div>
            )}

            {/* Token */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-minecraft text-xs text-stone-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>GitHub Personal Access Token (PAT) *</span>
                </label>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=ChaosLauncher+Studio"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-minecraft text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
                >
                  <span>Crear token (1 clic)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  disabled={busy}
                  className="w-full bg-[#120a09] border-2 border-stone-700 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-3 bg-black/50 border border-stone-800 text-[11px] font-minecraft text-stone-400 flex gap-2 leading-snug">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
              <span>
                Los mods se enlazan desde CurseForge; en el repositorio se suben configs, resourcepacks y shaders
                (se omiten logs, mapas y datos del jugador). Si el modpack ya tiene repositorio, solo se suben los
                archivos que cambiaron y se publica la versión siguiente.
              </span>
            </div>

            {/* Progreso */}
            {(busy || job) && !finished && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-minecraft text-stone-300">
                  <span>{stage}</span>
                  <span>{percent}%</span>
                </div>
                <div className="h-2.5 bg-black border border-stone-700">
                  <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${percent}%` }} />
                </div>
                {job && job.log.length > 0 && (
                  <div className="max-h-28 overflow-y-auto bg-black/60 border border-stone-800 p-2 text-[10px] font-mono text-stone-400">
                    {job.log.slice(-40).map((l, i) => (
                      <div key={i}>{l}</div>
                    ))}
                    <div ref={logEnd} />
                  </div>
                )}
              </div>
            )}

            {(error || job?.status === 'error') && (
              <div className="p-3 bg-red-950/80 border border-red-700 text-red-300 text-xs font-minecraft flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{error || job?.error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="minecraft-btn-gray px-4 py-2 text-xs font-minecraft cursor-pointer disabled:opacity-50"
              >
                {job?.status === 'error' ? 'Cerrar' : 'Cancelar'}
              </button>
              <MinecraftButton type="submit" variant="green" size="md" isLoading={busy} className="flex items-center gap-2">
                <FileArchive className="w-4 h-4" />
                <span>{busy ? 'IMPORTANDO...' : target ? 'ACTUALIZAR MODPACK' : 'IMPORTAR Y CREAR'}</span>
              </MinecraftButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
