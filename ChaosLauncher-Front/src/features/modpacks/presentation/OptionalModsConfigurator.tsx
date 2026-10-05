'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Puzzle, 
  Search, 
  Save, 
  Check, 
  AlertCircle, 
  Filter, 
  Sparkles, 
  FileText, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink
} from 'lucide-react';
import { SourceModItem } from '../../../core/types/modpack.types';
import { modpacksApi } from '../infrastructure/modpacks.api';
import { MinecraftButton } from '../../../shared/components/MinecraftButton';
import { MinecraftInput } from '../../../shared/components/MinecraftInput';
import { MinecraftPanel } from '../../../shared/components/MinecraftPanel';
import { MinecraftCard } from '../../../shared/components/MinecraftCard';
import { cn } from '../../../shared/utils/cn';

interface OptionalModsConfiguratorProps {
  tag: string;
  modpackName?: string;
  onClose?: () => void;
  onSaveSuccess?: () => void;
}

interface ModConfigState {
  isOptional: boolean;
  name: string;
  description: string;
  defaultEnabled: boolean;
}

export const OptionalModsConfigurator: React.FC<OptionalModsConfiguratorProps> = ({
  tag,
  modpackName,
  onClose,
  onSaveSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [sourceMods, setSourceMods] = useState<SourceModItem[]>([]);
  const [configs, setConfigs] = useState<Record<string, ModConfigState>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'configured' | 'unconfigured'>('all');
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});

  // Cargar lista de mods desde el backend
  useEffect(() => {
    let isMounted = true;
    const fetchMods = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await modpacksApi.getSourceMods(tag);
        if (isMounted) {
          setSourceMods(res.mods || []);
          const initialMap: Record<string, ModConfigState> = {};
          const initialExpanded: Record<string, boolean> = {};

          (res.mods || []).forEach((m) => {
            initialMap[m.file] = {
              isOptional: !!m.isOptional,
              name: m.name || '',
              description: m.description || '',
              defaultEnabled: m.defaultEnabled ?? true,
            };
            if (m.isOptional) {
              initialExpanded[m.file] = true;
            }
          });
          setConfigs(initialMap);
          setExpandedFiles(initialExpanded);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              'No se pudo inspeccionar el modpack.json ni extraer la lista de mods.',
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMods();
    return () => {
      isMounted = false;
    };
  }, [tag]);

  // Manejar toggle de mod opcional
  const handleToggleOptional = (file: string) => {
    setConfigs((prev) => {
      const current = prev[file];
      const willBeOptional = !current.isOptional;
      return {
        ...prev,
        [file]: {
          ...current,
          isOptional: willBeOptional,
        },
      };
    });

    setExpandedFiles((prev) => ({
      ...prev,
      [file]: !configs[file]?.isOptional,
    }));
  };

  const handleToggleDefaultEnabled = (file: string) => {
    setConfigs((prev) => ({
      ...prev,
      [file]: {
        ...prev[file],
        defaultEnabled: !prev[file].defaultEnabled,
      },
    }));
  };

  const handleUpdateName = (file: string, name: string) => {
    setConfigs((prev) => ({
      ...prev,
      [file]: {
        ...prev[file],
        name,
      },
    }));
  };

  const handleUpdateDescription = (file: string, description: string) => {
    setConfigs((prev) => ({
      ...prev,
      [file]: {
        ...prev[file],
        description,
      },
    }));
  };

  const toggleExpand = (file: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [file]: !prev[file],
    }));
  };

  // Guardar configuración en backend
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Filtrar únicamente los marcados como opcionales
      const payload = sourceMods
        .filter((m) => configs[m.file]?.isOptional)
        .map((m) => {
          const cfg = configs[m.file];
          return {
            modId: m.modId,
            name: cfg.name.trim() || m.name,
            file: m.file,
            description: cfg.description.trim(),
            defaultEnabled: cfg.defaultEnabled,
          };
        });

      await modpacksApi.saveOptionalMods(tag, payload);
      setSuccessMsg(`¡Configuración guardada exitosamente! ${payload.length} mods opcionales registrados.`);
      if (onSaveSuccess) onSaveSuccess();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Error al guardar mods opcionales');
    } finally {
      setSaving(false);
    }
  };

  // Filtrado optimizado de mods
  const filteredMods = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return sourceMods.filter((mod) => {
      const cfg = configs[mod.file];
      const isOpt = !!cfg?.isOptional;

      if (filterMode === 'configured' && !isOpt) return false;
      if (filterMode === 'unconfigured' && isOpt) return false;

      if (!q) return true;

      const matchName = mod.name.toLowerCase().includes(q) || cfg?.name.toLowerCase().includes(q);
      const matchFile = mod.file.toLowerCase().includes(q);
      const matchDesc = cfg?.description.toLowerCase().includes(q);
      return matchName || matchFile || matchDesc;
    });
  }, [sourceMods, configs, searchQuery, filterMode]);

  const configuredCount = useMemo(() => {
    return Object.values(configs).filter((c) => c.isOptional).length;
  }, [configs]);

  const formatSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  if (loading) {
    return (
      <MinecraftPanel className="p-8 text-center space-y-4">
        <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent animate-spin mx-auto" />
        <p className="font-minecraft text-white text-xs">
          INSPECCIONANDO MODPACK.JSON Y ESCANEANDO MODS...
        </p>
      </MinecraftPanel>
    );
  }

  return (
    <div className="space-y-6 select-none">
      {/* Top Header / Stats */}
      <MinecraftPanel className="p-5 space-y-4 bg-[#140a0a]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 minecraft-slot flex items-center justify-center bg-amber-950/60 border-amber-700">
              <Puzzle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-minecraft text-base font-bold text-white minecraft-text-shadow-lava">
                CONFIGURADOR DE MODS OPCIONALES
              </h2>
              <p className="text-xs text-stone-400 font-minecraft">
                {modpackName ? `Modpack: ${modpackName} ` : ''}(#{tag})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MinecraftButton
              type="button"
              variant="green"
              size="md"
              onClick={handleSave}
              isLoading={saving}
              disabled={saving}
              className="flex items-center gap-2 text-xs"
            >
              <Save className="w-4 h-4" />
              <span>GUARDAR CONFIGURACIÓN ({configuredCount})</span>
            </MinecraftButton>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 minecraft-btn-gray text-stone-400 hover:text-white cursor-pointer"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Info Explanatory Banner */}
        <div className="p-3 bg-black/60 border border-stone-800 flex items-start gap-2.5 text-xs font-minecraft text-stone-300">
          <SlidersHorizontal className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Aquí puedes inspeccionar todos los archivos <code>.jar</code> encontrados en el manifiesto oficial del modpack. Al activar el interruptor de un mod, los jugadores podrán habilitarlo o deshabilitarlo a su gusto desde <strong>ChaosLauncher</strong> antes de jugar.
          </p>
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="p-3 bg-red-950/80 border border-red-700 text-white font-minecraft text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-white font-minecraft text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar mod por nombre o archivo (ej. Shaders, VoiceChat, Sodium)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-none minecraft-input text-xs text-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={cn(
                'flex-1 py-2 text-center font-minecraft text-[11px] border transition cursor-pointer',
                filterMode === 'all'
                  ? 'bg-amber-950/90 text-amber-300 border-amber-600 font-bold'
                  : 'bg-black/50 text-stone-400 border-stone-800 hover:text-white',
              )}
            >
              TODOS ({sourceMods.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('configured')}
              className={cn(
                'flex-1 py-2 text-center font-minecraft text-[11px] border transition cursor-pointer',
                filterMode === 'configured'
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600 font-bold'
                  : 'bg-black/50 text-stone-400 border-stone-800 hover:text-white',
              )}
            >
              OPCIONALES ({configuredCount})
            </button>
          </div>
        </div>
      </MinecraftPanel>

      {/* Mods List */}
      <div className="space-y-3">
        {filteredMods.length === 0 ? (
          <MinecraftPanel className="p-8 text-center space-y-2">
            <p className="font-minecraft text-xs text-stone-400">
              No se encontraron mods que coincidan con la búsqueda "{searchQuery}".
            </p>
          </MinecraftPanel>
        ) : (
          filteredMods.map((mod) => {
            const cfg = configs[mod.file] || {
              isOptional: false,
              name: mod.name,
              description: '',
              defaultEnabled: true,
            };
            const isExpanded = !!expandedFiles[mod.file];

            return (
              <div
                key={mod.file}
                className={cn(
                  'minecraft-panel transition duration-75',
                  cfg.isOptional
                    ? 'border-amber-600/80 bg-[#170e0e]'
                    : 'border-stone-800 bg-[#0f0707] hover:border-stone-700',
                )}
              >
                {/* Mod Summary Row */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Switch + Name + File */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Minecraft Switch */}
                    <div className="flex flex-col items-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleOptional(mod.file)}
                        className={cn(
                          'w-12 h-6 border-2 border-black flex items-center p-0.5 transition cursor-pointer shadow-inner',
                          cfg.isOptional ? 'bg-emerald-600 justify-end' : 'bg-stone-800 justify-start',
                        )}
                        title={cfg.isOptional ? 'Mod configurado como opcional' : 'Mod parte del paquete base'}
                      >
                        <div
                          className={cn(
                            'w-4 h-4 border border-black transition shadow-sm',
                            cfg.isOptional ? 'bg-emerald-300' : 'bg-stone-500',
                          )}
                        />
                      </button>
                      <span className="text-[9px] font-minecraft mt-1 text-stone-400 uppercase">
                        {cfg.isOptional ? 'OPCIONAL' : 'BASE'}
                      </span>
                    </div>

                    {/* Mod Information */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            'font-minecraft font-bold text-xs sm:text-sm tracking-wide',
                            cfg.isOptional ? 'text-amber-400' : 'text-white',
                          )}
                        >
                          {cfg.name || mod.name}
                        </span>
                        <span className="text-[10px] font-minecraft bg-black/60 px-2 py-0.5 border border-stone-800 text-stone-400">
                          {formatSize(mod.size)}
                        </span>
                        {cfg.isOptional && (
                          <span
                            className={cn(
                              'text-[10px] font-minecraft font-bold px-2 py-0.5 border',
                              cfg.defaultEnabled
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                                : 'bg-stone-900 text-stone-400 border-stone-700',
                            )}
                          >
                            {cfg.defaultEnabled ? 'ACTIVO POR DEFECTO' : 'DESACTIVADO POR DEFECTO'}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-mono text-stone-500 truncate" title={mod.file}>
                        {mod.file}
                      </div>

                      {!isExpanded && cfg.description && (
                        <p className="text-xs text-stone-300 font-sans line-clamp-1 italic">
                          "{cfg.description}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Actions: Expand Config */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {cfg.isOptional && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(mod.file)}
                        className="minecraft-btn-gray px-2.5 py-1.5 text-[11px] font-minecraft flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Contraer' : 'Configurar detalles'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details Configuration Panel (Only if Optional & Expanded) */}
                {cfg.isOptional && isExpanded && (
                  <div className="p-4 border-t border-stone-800 bg-[#120707] space-y-4 animate-in fade-in duration-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name input */}
                      <div className="space-y-1.5">
                        <label className="block font-minecraft text-xs text-stone-300 uppercase">
                          Nombre visible en ChaosLauncher
                        </label>
                        <input
                          type="text"
                          value={cfg.name}
                          onChange={(e) => handleUpdateName(mod.file, e.target.value)}
                          placeholder={mod.name}
                          className="w-full px-3 py-2 rounded-none minecraft-input text-xs text-white"
                        />
                        <span className="text-[10px] text-stone-500 font-minecraft">
                          Ejemplo: Simple Voice Chat, Shaders Pack, Minimap
                        </span>
                      </div>

                      {/* Default enabled switch */}
                      <div className="space-y-1.5">
                        <label className="block font-minecraft text-xs text-stone-300 uppercase">
                          Estado por defecto al instalar
                        </label>
                        <div className="p-2.5 minecraft-slot flex items-center justify-between">
                          <div>
                            <span className="text-xs font-minecraft text-white block">
                              {cfg.defaultEnabled ? 'Habilitado (Recomendado)' : 'Deshabilitado opcional'}
                            </span>
                            <span className="text-[10px] text-stone-400 font-minecraft">
                              {cfg.defaultEnabled
                                ? 'Viene activado de fábrica; el jugador puede apagarlo si quiere.'
                                : 'Viene apagado; el jugador debe encenderlo expresamente.'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleDefaultEnabled(mod.file)}
                            className={cn(
                              'w-10 h-5 border-2 border-black flex items-center p-0.5 transition cursor-pointer shrink-0 ml-3',
                              cfg.defaultEnabled ? 'bg-amber-600 justify-end' : 'bg-stone-800 justify-start',
                            )}
                          >
                            <div
                              className={cn(
                                'w-3 h-3 border border-black',
                                cfg.defaultEnabled ? 'bg-amber-300' : 'bg-stone-500',
                              )}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Description input */}
                    <div className="space-y-1.5">
                      <label className="block font-minecraft text-xs text-stone-300 uppercase">
                        Descripción o Instrucciones para el Jugador
                      </label>
                      <textarea
                        rows={2}
                        value={cfg.description}
                        onChange={(e) => handleUpdateDescription(mod.file, e.target.value)}
                        placeholder="Explica brevemente qué hace este mod o para qué sirve (ej. Permite hablar por proximidad en el servidor)..."
                        className="w-full px-3 py-2 rounded-none minecraft-input text-xs text-white font-sans"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Save Bar if scrolled */}
      <div className="sticky bottom-4 z-20 flex justify-end">
        <MinecraftButton
          type="button"
          variant="green"
          size="lg"
          onClick={handleSave}
          isLoading={saving}
          disabled={saving}
          className="shadow-2xl border-2 border-black"
        >
          <Save className="w-5 h-5" />
          <span>GUARDAR CAMBIOS ({configuredCount} OPCIONALES)</span>
        </MinecraftButton>
      </div>
    </div>
  );
};
