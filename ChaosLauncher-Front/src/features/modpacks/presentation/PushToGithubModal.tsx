'use client';

import React, { useState, useEffect } from 'react';
import {
  GitCommit,
  Key,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
  Github,
  Sparkles,
} from 'lucide-react';
import { MinecraftButton } from '../../../shared/components/MinecraftButton';
import { MinecraftInput } from '../../../shared/components/MinecraftInput';
import { githubModpackApi, PushManifestResult } from '../infrastructure/github-modpack.api';

interface PushToGithubModalProps {
  isOpen: boolean;
  onClose: () => void;
  manifest: any;
  repo: string;
  branch: string;
  modpackTag?: string;
  onSuccess?: (result: PushManifestResult) => void;
}

export const PushToGithubModal: React.FC<PushToGithubModalProps> = ({
  isOpen,
  onClose,
  manifest,
  repo,
  branch,
  modpackTag,
  onSuccess,
}) => {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [rememberToken, setRememberToken] = useState(true);
  const [commitMessage, setCommitMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PushManifestResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setResult(null);
      const savedToken = sessionStorage.getItem('chaos_github_pat') || '';
      setToken(savedToken);
      setCommitMessage(
        `chore: update modpack.json v${manifest?.version || '1.0.0'} (${manifest?.files?.length || 0} archivos)`,
      );
    }
  }, [isOpen, manifest]);

  if (!isOpen) return null;

  const handlePush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Por favor, ingresa tu GitHub Personal Access Token (PAT).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (rememberToken) {
        sessionStorage.setItem('chaos_github_pat', token.trim());
      } else {
        sessionStorage.removeItem('chaos_github_pat');
      }

      const res = await githubModpackApi.pushManifest({
        repo,
        branch: branch || 'main',
        manifest,
        githubToken: token.trim(),
        commitMessage: commitMessage.trim(),
        modpackTag,
      });

      setResult(res);
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err: any) {
      setError(err.message || 'Error al publicar modpack.json en GitHub');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="minecraft-panel max-w-lg w-full p-6 relative border-2 border-stone-700 bg-[#140e0c] shadow-2xl text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-amber-400" />
            <h3 className="font-minecraft text-base font-bold text-white tracking-wide">
              Subir modpack.json a GitHub
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success View */}
        {result ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/60 rounded-none flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-minecraft text-sm font-bold text-emerald-300">
                  ¡Publicado Exitosamente!
                </h4>
                <p className="text-xs text-stone-300 font-minecraft mt-1 leading-relaxed">
                  El archivo <code className="text-amber-300">modpack.json</code> fue commiteado en la rama{' '}
                  <span className="font-bold text-white">{branch || 'main'}</span>.
                </p>
                {result.synced && (
                  <p className="text-xs text-emerald-400 font-minecraft mt-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Sincronizado automáticamente en el catálogo de ChaosLauncher.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-minecraft pt-2">
              <a
                href={result.commitUrl}
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1.5 underline"
              >
                <span>Ver commit en GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <MinecraftButton variant="green" size="md" onClick={onClose}>
                LISTO
              </MinecraftButton>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handlePush} className="space-y-4">
            {/* Repo Info */}
            <div className="p-3 bg-black/50 border border-stone-800 text-xs font-minecraft flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-stone-400">Repositorio: </span>
                <span className="text-amber-300 font-bold">{repo}</span>
              </div>
              <div>
                <span className="text-stone-400">Rama: </span>
                <span className="text-emerald-400 font-bold">{branch || 'main'}</span>
              </div>
              <div>
                <span className="text-stone-400">Versión: </span>
                <span className="text-emerald-300 font-bold bg-emerald-950 px-1.5 py-0.5 border border-emerald-700">v{manifest?.version || '1.0.0'}</span>
              </div>
            </div>

            {/* Token Input */}
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
                  required
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

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="rememberPat"
                  checked={rememberToken}
                  onChange={(e) => setRememberToken(e.target.checked)}
                  className="rounded-none bg-stone-900 border-stone-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="rememberPat" className="text-[11px] font-minecraft text-stone-400 cursor-pointer select-none">
                  Recordar token durante esta sesión del navegador
                </label>
              </div>
            </div>

            {/* Commit Message */}
            <div>
              <MinecraftInput
                label="Mensaje de Commit"
                placeholder="Actualizar modpack.json con nuevas versiones"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                helperText="Se registrará en el historial de Git del repositorio"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-950/80 border border-red-700 text-red-300 text-xs font-minecraft flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="minecraft-btn-gray px-4 py-2 text-xs font-minecraft cursor-pointer"
              >
                Cancelar
              </button>
              <MinecraftButton
                type="submit"
                variant="green"
                size="md"
                isLoading={loading}
                className="flex items-center gap-2"
              >
                <GitCommit className="w-4 h-4" />
                <span>{loading ? 'PUBLICANDO...' : 'CONFIRMAR Y SUBIR'}</span>
              </MinecraftButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
