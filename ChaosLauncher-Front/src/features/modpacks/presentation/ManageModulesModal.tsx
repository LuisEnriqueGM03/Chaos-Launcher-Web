'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Puzzle, 
  ShieldCheck, 
  Clock, 
  Check, 
  X, 
  Lock, 
  Sparkles,
  Layers
} from 'lucide-react';
import { MinecraftButton } from '../../../shared/components/MinecraftButton';
import { DiscordPixelIcon } from '../../../shared/components/DiscordPixelIcon';

export interface ModuleSettings {
  hasOptionalMods: boolean;
  hasRules: boolean;
  hasDiscord: boolean;
  hasChangelog: boolean;
}

interface ManageModulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  modpackName: string;
  initialSettings: ModuleSettings;
  onSave: (settings: ModuleSettings) => Promise<void>;
}

export const ManageModulesModal: React.FC<ManageModulesModalProps> = ({
  isOpen,
  onClose,
  modpackName,
  initialSettings,
  onSave,
}) => {
  const [settings, setSettings] = useState<ModuleSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar si cambia el prop
  React.useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  if (!isOpen) return null;

  const toggleModule = (key: keyof ModuleSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(settings);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar configuración de módulos');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-2xl minecraft-panel p-6 sm:p-7 relative border-2 border-black space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-black pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 minecraft-slot text-amber-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-minecraft font-bold tracking-widest text-amber-400 uppercase">
                GESTIÓN MODULAR
              </span>
              <h2 className="font-minecraft text-lg sm:text-xl font-bold text-white minecraft-text-shadow-lava">
                MÓDULOS DE {modpackName.toUpperCase()}
              </h2>
              <p className="text-xs text-stone-400 font-minecraft mt-0.5">
                Activa o desactiva las pestañas y secciones disponibles en el launcher y catálogo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white transition cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 minecraft-card border-red-500/70 text-red-300 text-xs font-minecraft">
            {error}
          </div>
        )}

        {/* Modules Grid */}
        <div className="space-y-3.5">
          {/* 1. MÓDULO GENERAL (OBLIGATORIO) */}
          <div className="minecraft-card p-4 flex items-center justify-between gap-4 border-amber-600/40 bg-[#160c0c]">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="p-3 minecraft-slot text-amber-400 shrink-0">
                <Settings className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-minecraft font-bold text-sm text-white">General & Servidor</h4>
                  <span className="text-[9px] font-minecraft font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-600 px-1.5 py-0.2 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>OBLIGATORIO</span>
                  </span>
                </div>
                <p className="text-xs text-stone-400 font-sans mt-0.5">
                  Información base del servidor, versiones de Minecraft, loader, RAM y guía de conexión.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <div className="px-3 py-1.5 bg-emerald-950/50 border border-emerald-600/60 text-emerald-300 font-minecraft text-xs font-bold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>ACTIVO</span>
              </div>
            </div>
          </div>

          {/* 2. MÓDULO MODS INCLUIDOS (OPCIONALES) */}
          <button
            type="button"
            onClick={() => toggleModule('hasOptionalMods')}
            className={`w-full text-left minecraft-card p-4 flex items-center justify-between gap-4 transition cursor-pointer border-2 ${
              settings.hasOptionalMods
                ? 'border-emerald-600/80 bg-[#0e1a12]'
                : 'border-stone-800 bg-[#120a0a] opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className={`p-3 minecraft-slot shrink-0 ${settings.hasOptionalMods ? 'text-emerald-400' : 'text-stone-500'}`}>
                <Puzzle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-minecraft font-bold text-sm text-white">Mods Incluidos</h4>
                  <span className="text-[10px] font-minecraft text-amber-400 font-semibold">
                    (Pestaña "Mods")
                  </span>
                </div>
                <p className="text-xs text-stone-400 font-sans mt-0.5">
                  Permite a los usuarios activar o desactivar shaders y mods cliente opcionales en el launcher.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {settings.hasOptionalMods ? (
                <div className="minecraft-btn-green px-3.5 py-1.5 text-xs font-minecraft font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>ACTIVADO</span>
                </div>
              ) : (
                <div className="minecraft-btn-gray px-3.5 py-1.5 text-xs font-minecraft text-stone-400 flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5" />
                  <span>DESACTIVADO</span>
                </div>
              )}
            </div>
          </button>

          {/* 3. MÓDULO NORMATIVA */}
          <button
            type="button"
            onClick={() => toggleModule('hasRules')}
            className={`w-full text-left minecraft-card p-4 flex items-center justify-between gap-4 transition cursor-pointer border-2 ${
              settings.hasRules
                ? 'border-cyan-600/80 bg-[#0c1619]'
                : 'border-stone-800 bg-[#120a0a] opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className={`p-3 minecraft-slot shrink-0 ${settings.hasRules ? 'text-cyan-400' : 'text-stone-500'}`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-minecraft font-bold text-sm text-white">Normativa del Servidor</h4>
                  <span className="text-[10px] font-minecraft text-cyan-400 font-semibold">
                    (Pestaña "Normas")
                  </span>
                </div>
                <p className="text-xs text-stone-400 font-sans mt-0.5">
                  Habilita un editor enriquecido para redactar el reglamento y sanciones visible directamente en el juego.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {settings.hasRules ? (
                <div className="minecraft-btn-green px-3.5 py-1.5 text-xs font-minecraft font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>ACTIVADO</span>
                </div>
              ) : (
                <div className="minecraft-btn-gray px-3.5 py-1.5 text-xs font-minecraft text-stone-400 flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5" />
                  <span>DESACTIVADO</span>
                </div>
              )}
            </div>
          </button>

          {/* 4. MÓDULO DISCORD */}
          <button
            type="button"
            onClick={() => toggleModule('hasDiscord')}
            className={`w-full text-left minecraft-card p-4 flex items-center justify-between gap-4 transition cursor-pointer border-2 ${
              settings.hasDiscord
                ? 'border-[#5865F2] bg-[#0f111c]'
                : 'border-stone-800 bg-[#120a0a] opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className={`p-3 minecraft-slot shrink-0 ${settings.hasDiscord ? 'text-[#828bf7]' : 'text-stone-500'}`}>
                <DiscordPixelIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-minecraft font-bold text-sm text-white">Comunidad de Discord</h4>
                  <span className="text-[10px] font-minecraft text-[#828bf7] font-semibold">
                    (Pestaña "Discord")
                  </span>
                </div>
                <p className="text-xs text-stone-400 font-sans mt-0.5">
                  Muestra la tarjeta de Discord y un botón 3D azul pixelado para unirse al servidor de Discord.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {settings.hasDiscord ? (
                <div className="minecraft-btn-green px-3.5 py-1.5 text-xs font-minecraft font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>ACTIVADO</span>
                </div>
              ) : (
                <div className="minecraft-btn-gray px-3.5 py-1.5 text-xs font-minecraft text-stone-400 flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5" />
                  <span>DESACTIVADO</span>
                </div>
              )}
            </div>
          </button>

          {/* 5. MÓDULO CHANGELOG */}
          <button
            type="button"
            onClick={() => toggleModule('hasChangelog')}
            className={`w-full text-left minecraft-card p-4 flex items-center justify-between gap-4 transition cursor-pointer border-2 ${
              settings.hasChangelog
                ? 'border-purple-600/80 bg-[#140e1c]'
                : 'border-stone-800 bg-[#120a0a] opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className={`p-3 minecraft-slot shrink-0 ${settings.hasChangelog ? 'text-purple-400' : 'text-stone-500'}`}>
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-minecraft font-bold text-sm text-white">Notas de Versión / Changelog</h4>
                  <span className="text-[10px] font-minecraft text-purple-400 font-semibold">
                    (Pestaña "Changelog")
                  </span>
                </div>
                <p className="text-xs text-stone-400 font-sans mt-0.5">
                  Presenta la línea de tiempo de cambios y mejoras introducidas en cada versión del modpack.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {settings.hasChangelog ? (
                <div className="minecraft-btn-green px-3.5 py-1.5 text-xs font-minecraft font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>ACTIVADO</span>
                </div>
              ) : (
                <div className="minecraft-btn-gray px-3.5 py-1.5 text-xs font-minecraft text-stone-400 flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5" />
                  <span>DESACTIVADO</span>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black">
          <MinecraftButton variant="gray" size="md" onClick={onClose} disabled={saving}>
            CANCELAR
          </MinecraftButton>

          <MinecraftButton variant="green" size="md" onClick={handleSave} disabled={saving}>
            <Sparkles className="w-4 h-4" />
            <span>{saving ? 'GUARDANDO MÓDULOS...' : 'GUARDAR CAMBIOS'}</span>
          </MinecraftButton>
        </div>
      </div>
    </div>
  );
};
