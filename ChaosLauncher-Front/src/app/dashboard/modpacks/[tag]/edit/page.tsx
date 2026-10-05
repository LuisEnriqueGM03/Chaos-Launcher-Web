'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Settings, 
  Puzzle, 
  ArrowLeft, 
  Eye, 
  Layers, 
  ShieldCheck, 
  Clock, 
  Save, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import { Modpack } from '../../../../../core/types/modpack.types';
import { modpacksApi } from '../../../../../features/modpacks/infrastructure/modpacks.api';
import { ModpackForm } from '../../../../../features/modpacks/presentation/ModpackForm';
import { OptionalModsConfigurator } from '../../../../../features/modpacks/presentation/OptionalModsConfigurator';
import { ManageModulesModal } from '../../../../../features/modpacks/presentation/ManageModulesModal';
import { MinecraftMarkdownEditor } from '../../../../../shared/components/MinecraftMarkdownEditor';
import { DiscordPixelIcon } from '../../../../../shared/components/DiscordPixelIcon';
import { MinecraftButton } from '../../../../../shared/components/MinecraftButton';
import { MinecraftPanel } from '../../../../../shared/components/MinecraftPanel';
import { MinecraftInput } from '../../../../../shared/components/MinecraftInput';
import { cn } from '../../../../../shared/utils/cn';

export default function EditModpackPage() {
  const params = useParams();
  const tag = params.tag as string;

  type EditTab = 'general' | 'optional-mods' | 'rules' | 'discord' | 'changelog';

  const [activeTab, setActiveTab] = useState<EditTab>('general');
  const [modpack, setModpack] = useState<Modpack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModulesModalOpen, setIsModulesModalOpen] = useState(false);

  // Estados locales para los editores de sub-módulos
  const [rulesDraft, setRulesDraft] = useState('');
  const [discordUrlDraft, setDiscordUrlDraft] = useState('');
  const [changelogDraft, setChangelogDraft] = useState('');
  const [savingSubModule, setSavingSubModule] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchModpack = async () => {
    if (!tag) return;
    try {
      const data = await modpacksApi.getByTag(tag);
      setModpack(data);
      setRulesDraft(data.rulesContent || '');
      setDiscordUrlDraft(data.discordUrl || '');
      setChangelogDraft(data.versions?.[0]?.changelog?.join('\n') || '');
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'No se pudo cargar el modpack');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModpack();
  }, [tag]);

  // Si la pestaña actual queda inactiva por deshabilitación de módulo, volver a 'general'
  useEffect(() => {
    if (!modpack) return;
    if (activeTab === 'optional-mods' && modpack.hasOptionalMods === false) {
      setActiveTab('general');
    } else if (activeTab === 'rules' && !modpack.hasRules) {
      setActiveTab('general');
    } else if (activeTab === 'discord' && !modpack.hasDiscord) {
      setActiveTab('general');
    } else if (activeTab === 'changelog' && modpack.hasChangelog === false) {
      setActiveTab('general');
    }
  }, [modpack, activeTab]);

  const handleSaveSubModule = async (patchData: Partial<Modpack>, message: string) => {
    if (!modpack) return;
    setSavingSubModule(true);
    setSuccessMessage(null);
    try {
      await modpacksApi.update(modpack.tag, patchData);
      await fetchModpack();
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Error al guardar');
    } finally {
      setSavingSubModule(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-xs font-minecraft text-stone-400">
        Cargando datos del modpack #{tag}...
      </div>
    );
  }

  if (error || !modpack) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-xs font-minecraft text-red-400">
        ⚠️ Error: {error || 'Modpack no encontrado'}
      </div>
    );
  }

  const hasOptionalMods = modpack.hasOptionalMods !== false;
  const hasRules = Boolean(modpack.hasRules);
  const hasDiscord = Boolean(modpack.hasDiscord);
  const hasChangelog = modpack.hasChangelog !== false;

  return (
    <div className="max-w-5xl w-full mx-auto px-6 py-8 flex-1 space-y-6 select-none">
      {/* Top Header & Breadcrumbs & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-4">
        <div className="flex items-center gap-3">
          <Link href={`/modpacks/${modpack.tag}`}>
            <button className="flex items-center gap-2 text-stone-400 hover:text-white font-minecraft text-xs transition cursor-pointer">
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>VOLVER A #{modpack.tag}</span>
            </button>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* BOTÓN MÓDULOS QUE ABRE EL MODAL CON ICONOS */}
          <MinecraftButton
            variant="amber"
            size="sm"
            onClick={() => setIsModulesModalOpen(true)}
            className="flex items-center gap-1.5 text-xs"
          >
            <Layers className="w-4 h-4" />
            <span>MÓDULOS</span>
          </MinecraftButton>

          <Link href={`/modpacks/${modpack.tag}`}>
            <button className="minecraft-btn-gray px-3 py-1.5 text-xs font-minecraft flex items-center gap-1.5 text-stone-300 hover:text-white cursor-pointer">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>VER EN EL EXPLORADOR</span>
            </button>
          </Link>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 minecraft-card border-emerald-500/70 bg-emerald-950/60 text-emerald-300 text-xs font-minecraft flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs Dinámicos según Módulos Activos */}
      <div className="flex flex-wrap border-b-2 border-black gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={cn(
            'px-4 py-2.5 font-minecraft text-xs flex items-center gap-2 border-t-2 border-x-2 transition cursor-pointer select-none',
            activeTab === 'general'
              ? 'bg-[#180c0c] text-amber-400 border-amber-600 font-bold -mb-[2px] z-10'
              : 'bg-black/60 text-stone-400 border-stone-800 hover:text-stone-200',
          )}
        >
          <Settings className="w-4 h-4 text-amber-400" />
          <span>GENERAL</span>
        </button>

        {hasOptionalMods && (
          <button
            type="button"
            onClick={() => setActiveTab('optional-mods')}
            className={cn(
              'px-4 py-2.5 font-minecraft text-xs flex items-center gap-2 border-t-2 border-x-2 transition cursor-pointer select-none',
              activeTab === 'optional-mods'
                ? 'bg-[#180c0c] text-emerald-400 border-emerald-600 font-bold -mb-[2px] z-10'
                : 'bg-black/60 text-stone-400 border-stone-800 hover:text-stone-200',
            )}
          >
            <Puzzle className="w-4 h-4 text-emerald-400" />
            <span>MODS ({modpack.optionalMods?.length || 0})</span>
          </button>
        )}

        {hasRules && (
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={cn(
              'px-4 py-2.5 font-minecraft text-xs flex items-center gap-2 border-t-2 border-x-2 transition cursor-pointer select-none',
              activeTab === 'rules'
                ? 'bg-[#180c0c] text-cyan-400 border-cyan-600 font-bold -mb-[2px] z-10'
                : 'bg-black/60 text-stone-400 border-stone-800 hover:text-stone-200',
            )}
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>NORMAS</span>
          </button>
        )}

        {hasDiscord && (
          <button
            type="button"
            onClick={() => setActiveTab('discord')}
            className={cn(
              'px-4 py-2.5 font-minecraft text-xs flex items-center gap-2 border-t-2 border-x-2 transition cursor-pointer select-none',
              activeTab === 'discord'
                ? 'bg-[#180c0c] text-[#828bf7] border-[#5865F2] font-bold -mb-[2px] z-10'
                : 'bg-black/60 text-stone-400 border-stone-800 hover:text-stone-200',
            )}
          >
            <DiscordPixelIcon className="w-4 h-4 text-[#828bf7]" />
            <span>DISCORD</span>
          </button>
        )}

        {hasChangelog && (
          <button
            type="button"
            onClick={() => setActiveTab('changelog')}
            className={cn(
              'px-4 py-2.5 font-minecraft text-xs flex items-center gap-2 border-t-2 border-x-2 transition cursor-pointer select-none',
              activeTab === 'changelog'
                ? 'bg-[#180c0c] text-purple-400 border-purple-600 font-bold -mb-[2px] z-10'
                : 'bg-black/60 text-stone-400 border-stone-800 hover:text-stone-200',
            )}
          >
            <Clock className="w-4 h-4 text-purple-400" />
            <span>CHANGELOG</span>
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'general' && (
        <ModpackForm initialData={modpack} isEditing={true} />
      )}

      {activeTab === 'optional-mods' && hasOptionalMods && (
        <OptionalModsConfigurator
          tag={modpack.tag}
          modpackName={modpack.name}
          onSaveSuccess={fetchModpack}
        />
      )}

      {activeTab === 'rules' && hasRules && (
        <MinecraftPanel
          title="NORMATIVA DEL SERVIDOR"
          subtitle="Redacta las normas de conducta, sanciones y pautas que los jugadores leerán en la pestaña 'Normas' del Launcher."
          icon={<ShieldCheck className="w-5 h-5 text-cyan-400" />}
          className="space-y-6"
        >
          <MinecraftMarkdownEditor
            value={rulesDraft}
            onChange={setRulesDraft}
            label="REGLAMENTO DEL SERVIDOR (MARKDOWN)"
            placeholder="# Normas de Convivencia\n1. Respetar a la comunidad y al equipo administrativo.\n2. Prohibido el uso de hacks, x-ray o clientes modificados no permitidos.\n> ⚠️ Cualquier infracción conllevará baneo permanente."
          />

          <div className="flex items-center justify-end pt-4 border-t-2 border-black">
            <MinecraftButton
              variant="green"
              size="lg"
              disabled={savingSubModule}
              onClick={() => handleSaveSubModule({ rulesContent: rulesDraft }, '¡Normativa guardada con éxito!')}
            >
              <Save className="w-4 h-4" />
              <span>{savingSubModule ? 'GUARDANDO...' : 'GUARDAR NORMATIVA'}</span>
            </MinecraftButton>
          </div>
        </MinecraftPanel>
      )}

      {activeTab === 'discord' && hasDiscord && (
        <MinecraftPanel
          title="COMUNIDAD DE DISCORD"
          subtitle="Configura el enlace de invitación para que los jugadores se unan con el botón azul 3D temático de Minecraft en el Launcher."
          icon={<DiscordPixelIcon className="w-5 h-5 text-[#828bf7]" />}
          className="space-y-6"
        >
          <div className="space-y-4">
            <MinecraftInput
              label="Enlace de Invitación de Discord *"
              placeholder="https://discord.gg/tu-comunidad"
              value={discordUrlDraft}
              onChange={(e) => setDiscordUrlDraft(e.target.value)}
              helperText="URL de invitación permanente o vanity URL (Ej: https://discord.gg/chaos)"
            />

            {/* Vista Previa del Botón Azul 3D */}
            <div className="p-6 minecraft-slot bg-[#0c0d16] border-stone-800 space-y-4">
              <span className="text-[10px] font-minecraft text-stone-400 uppercase tracking-widest block">
                VISTA PREVIA DEL BOTÓN EN EL LAUNCHER Y CATÁLOGO:
              </span>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <a
                  href={discordUrlDraft || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => { if (!discordUrlDraft) e.preventDefault(); }}
                  className="minecraft-btn-discord px-6 py-3 font-minecraft font-bold text-sm tracking-wider flex items-center justify-center gap-3 cursor-pointer no-underline"
                >
                  <DiscordPixelIcon className="w-5 h-5" />
                  <span>UNIRSE A DISCORD</span>
                  <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
                </a>

                {discordUrlDraft && (
                  <span className="text-xs font-minecraft text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Enlace listo</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t-2 border-black">
            <MinecraftButton
              variant="green"
              size="lg"
              disabled={savingSubModule}
              onClick={() => handleSaveSubModule({ discordUrl: discordUrlDraft }, '¡Configuración de Discord guardada!')}
            >
              <Save className="w-4 h-4" />
              <span>{savingSubModule ? 'GUARDANDO...' : 'GUARDAR DISCORD'}</span>
            </MinecraftButton>
          </div>
        </MinecraftPanel>
      )}

      {activeTab === 'changelog' && hasChangelog && (
        <MinecraftPanel
          title="NOTAS DE LA VERSIÓN / CHANGELOG"
          subtitle={`Redacta los cambios, mejoras y correcciones para la versión v${modpack.version}.`}
          icon={<Clock className="w-5 h-5 text-purple-400" />}
          className="space-y-6"
        >
          <MinecraftMarkdownEditor
            value={changelogDraft}
            onChange={setChangelogDraft}
            label="REGISTRO DE CAMBIOS Y NOVEDADES (MARKDOWN)"
            placeholder="✨ **Lanzamiento Oficial** v1.0.0\n⚡ **Optimización Extrema**: +120 FPS estables con Sodium e Iris\n🛡️ **Seguridad**: Sistema anticheat actualizado\n⚔️ **Jugabilidad**: Mazmorras y bosses equilibrados\n📦 **Mods**: 15 nuevos artefactos agregados"
            showMinecraftBadges={true}
            minHeight="280px"
          />

          <div className="flex items-center justify-end pt-4 border-t-2 border-black">
            <MinecraftButton
              variant="green"
              size="lg"
              disabled={savingSubModule}
              onClick={() => {
                const changelogArray = changelogDraft
                  .split('\n')
                  .map((l) => l.trim())
                  .filter(Boolean);
                handleSaveSubModule({ changelog: changelogArray }, '¡Changelog guardado con éxito!');
              }}
            >
              <Save className="w-4 h-4" />
              <span>{savingSubModule ? 'GUARDANDO...' : 'GUARDAR CHANGELOG'}</span>
            </MinecraftButton>
          </div>
        </MinecraftPanel>
      )}

      {/* MODAL GESTIONAR MÓDULOS */}
      <ManageModulesModal
        isOpen={isModulesModalOpen}
        onClose={() => setIsModulesModalOpen(false)}
        modpackName={modpack.name}
        initialSettings={{
          hasOptionalMods,
          hasRules,
          hasDiscord,
          hasChangelog,
        }}
        onSave={async (newSettings) => {
          await modpacksApi.update(modpack.tag, newSettings);
          await fetchModpack();
          setSuccessMessage('¡Módulos actualizados con éxito!');
          setTimeout(() => setSuccessMessage(null), 3000);
        }}
      />
    </div>
  );
}
