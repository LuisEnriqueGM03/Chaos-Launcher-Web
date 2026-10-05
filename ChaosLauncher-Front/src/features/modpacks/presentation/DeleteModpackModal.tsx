'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { MinecraftButton } from '../../../shared/components/MinecraftButton';
import { MinecraftInput } from '../../../shared/components/MinecraftInput';
import { modpacksApi } from '../infrastructure/modpacks.api';

interface DeleteModpackModalProps {
  isOpen: boolean;
  onClose: () => void;
  modpackName: string;
  modpackTag: string;
  onSuccess?: () => void;
}

export const DeleteModpackModal: React.FC<DeleteModpackModalProps> = ({
  isOpen,
  onClose,
  modpackName,
  modpackTag,
  onSuccess,
}) => {
  const router = useRouter();
  const [confirmTag, setConfirmTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfirmed = confirmTag.trim().toLowerCase() === modpackTag.trim().toLowerCase();

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setLoading(true);
    setError(null);
    try {
      await modpacksApi.delete(modpackTag);
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Error al eliminar el modpack');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-lg minecraft-panel bg-[#140808] border-2 border-red-700/80 p-6 space-y-5 text-slate-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-red-900/60 pb-3">
          <div className="flex items-center gap-2.5 text-red-500">
            <Trash2 className="w-5 h-5 text-red-500 shrink-0" />
            <h3 className="font-minecraft text-base font-bold text-white minecraft-text-shadow-lava tracking-wide">
              ELIMINAR MODPACK
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1 text-stone-400 hover:text-white transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="p-3.5 bg-red-950/50 border border-red-700/60 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs font-minecraft space-y-1 text-red-200">
            <p className="font-bold text-red-400 uppercase tracking-wide">
              ¡ADVERTENCIA: ACCIÓN DESTRUCTIVA!
            </p>
            <p className="leading-relaxed">
              Estás a punto de eliminar definitivamente <strong className="text-white">"{modpackName}"</strong> (#{modpackTag}). Se borrarán todas las versiones, configuraciones de mods opcionales y registros asociados en la base de datos.
            </p>
          </div>
        </div>

        {/* Confirmation Input */}
        <div className="space-y-2 text-left">
          <label className="block font-minecraft text-xs text-stone-300">
            Para confirmar, escribe el tag <span className="text-amber-400 font-bold">#{modpackTag}</span> a continuación:
          </label>
          <MinecraftInput
            type="text"
            placeholder={modpackTag}
            value={confirmTag}
            onChange={(e) => setConfirmTag(e.target.value)}
            disabled={loading}
            autoFocus
          />
        </div>

        {error && (
          <div className="p-2.5 bg-red-900/80 border border-red-500 text-white font-minecraft text-xs">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="minecraft-btn-gray px-4 py-2 text-xs font-minecraft cursor-pointer disabled:opacity-50"
          >
            CANCELAR
          </button>

          <MinecraftButton
            type="button"
            variant="lava"
            size="md"
            disabled={!isConfirmed || loading}
            isLoading={loading}
            onClick={handleDelete}
            className="flex items-center gap-2 border-red-600"
          >
            <Trash2 className="w-4 h-4 text-white" />
            <span>ELIMINAR DEFINITIVAMENTE</span>
          </MinecraftButton>
        </div>
      </div>
    </div>
  );
};
