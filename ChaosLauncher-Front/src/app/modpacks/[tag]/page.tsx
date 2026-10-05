'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { marked } from 'marked';
import { 
  ArrowLeft, 
  Sparkles, 
  Cpu, 
  ExternalLink, 
  Github, 
  Edit3, 
  Copy, 
  Check, 
  Server, 
  Anvil, 
  FileCode, 
  ShieldCheck, 
  X, 
  Puzzle,
  Terminal,
  Clock,
  Trash2,
  SlidersHorizontal,
  Layers
} from 'lucide-react';
import { Modpack } from '../../../core/types/modpack.types';
import { modpacksApi } from '../../../features/modpacks/infrastructure/modpacks.api';
import { useAuth } from '../../../features/auth/application/auth.context';
import { getApiUrl } from '../../../core/config/env';
import { MinecraftButton } from '../../../shared/components/MinecraftButton';
import { MinecraftCard } from '../../../shared/components/MinecraftCard';
import { MinecraftSlot } from '../../../shared/components/MinecraftSlot';
import { MinecraftPanel } from '../../../shared/components/MinecraftPanel';
import { ServerStatusBadge } from '../../../features/server-status/presentation/ServerStatusBadge';
import { DeleteModpackModal } from '../../../features/modpacks/presentation/DeleteModpackModal';
import { OptionalModsConfigurator } from '../../../features/modpacks/presentation/OptionalModsConfigurator';
import { DiscordPixelIcon } from '../../../shared/components/DiscordPixelIcon';
import { resolveImageUrl } from '../../../shared/utils/image';

export default function ModpackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isSuperadmin } = useAuth();
  const tag = params.tag as string;

  type ExploreTab = 'general' | 'mods' | 'rules' | 'discord' | 'changelog';

  const [activeTab, setActiveTab] = useState<ExploreTab>('general');
  const [modpack, setModpack] = useState<Modpack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de interacción
  const [copiedIp, setCopiedIp] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [manifestJson, setManifestJson] = useState<string | null>(null);
  const [loadingManifest, setLoadingManifest] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isModsConfigOpen, setIsModsConfigOpen] = useState(false);

  const loadData = async () => {
    try {
      const data = await modpacksApi.getByTag(tag);
      setModpack(data);
      setManifestJson(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'No se pudo cargar el modpack.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!tag) return;
    setLoading(true);
    setError(null);
    loadData();
  }, [tag]);

  const canEdit = isSuperadmin || (user && modpack && modpack.authorId === user.id);

  const handleCopyIp = () => {
    if (!modpack) return;
    const fullAddress = `${modpack.serverIp}${modpack.serverPort && modpack.serverPort !== 25565 ? `:${modpack.serverPort}` : ''}`;
    navigator.clipboard.writeText(fullAddress);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2200);
  };

  const handleOpenJsonModal = async () => {
    setIsJsonModalOpen(true);
    if (!manifestJson) {
      setLoadingManifest(true);
      try {
        const res = await fetch(`${getApiUrl()}/modpacks/${tag}/manifest`);
        const json = await res.json();
        setManifestJson(JSON.stringify(json, null, 2));
      } catch (err: any) {
        setManifestJson(JSON.stringify({ error: 'No se pudo obtener el manifiesto', details: err.message }, null, 2));
      } finally {
        setLoadingManifest(false);
      }
    }
  };

  const handleCopyJson = () => {
    if (!manifestJson) return;
    navigator.clipboard.writeText(manifestJson);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2200);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <MinecraftPanel className="p-8 text-center space-y-4 max-w-md">
          <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent animate-spin mx-auto" />
          <p className="font-minecraft text-white text-sm">CARGANDO INFORMACIÓN DEL MODPACK...</p>
        </MinecraftPanel>
      </div>
    );
  }

  if (error || !modpack) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <MinecraftPanel className="p-8 text-center space-y-4 max-w-md border-red-700">
          <h2 className="font-minecraft text-xl font-bold text-red-400">ERROR AL CARGAR MODPACK</h2>
          <p className="text-xs text-stone-300 font-minecraft">{error || 'Modpack no encontrado'}</p>
          <div className="pt-4">
            <Link href="/">
              <MinecraftButton variant="lava" size="md">
                <ArrowLeft className="w-4 h-4" />
                <span>VOLVER AL CATÁLOGO</span>
              </MinecraftButton>
            </Link>
          </div>
        </MinecraftPanel>
      </div>
    );
  }

  const ramRecommendedGb = Math.round(modpack.recommendedRam / 1024);
  const ramMinGb = Math.round((modpack.minRam || 2048) / 1024);
  const wallpaper = resolveImageUrl(modpack.wallpaperUrl) || '/assets/nether_bg.jpg';
  const manifestUrl = `${getApiUrl()}/modpacks/${modpack.tag}/manifest`;

  const hasOptionalMods = modpack.hasOptionalMods !== false;
  const hasRules = Boolean(modpack.hasRules);
  const hasDiscord = Boolean(modpack.hasDiscord);
  const hasChangelog = modpack.hasChangelog !== false;

  // Parsear changelog
  const changelogItems: string[] = Array.isArray(modpack.versions?.[0]?.changelog)
    ? modpack.versions[0].changelog
    : typeof modpack.versions?.[0]?.changelog === 'string'
    ? (modpack.versions[0].changelog as string).split('\n').filter(Boolean)
    : ['✨ Versión de lanzamiento oficial', '⚡ Rendimiento y shaders optimizados'];

  // Parsear markdown de normas
  const renderRulesHtml = () => {
    if (!modpack.rulesContent || !modpack.rulesContent.trim()) {
      return '<p class="text-stone-400 font-minecraft italic">Aún no se ha redactado la normativa para este servidor.</p>';
    }
    try {
      return marked.parse(modpack.rulesContent, { breaks: true, gfm: true }) as string;
    } catch {
      return `<p class="text-red-400">${modpack.rulesContent}</p>`;
    }
  };

  return (
    <div className="flex-1 flex flex-col select-none">
      {/* 1. TOP ACTIONS & BREADCRUMB BAR */}
      <div className="bg-[#120808] border-b-2 border-black px-6 py-3.5 z-20">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <Link href="/">
            <button className="flex items-center gap-2 text-stone-300 hover:text-white font-minecraft text-xs transition cursor-pointer">
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>VOLVER AL CATÁLOGO</span>
            </button>
          </Link>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {modpack.githubRepo && (
              <a
                href={
                  modpack.githubRepo.startsWith('http')
                    ? modpack.githubRepo
                    : `https://github.com/${modpack.githubRepo}`
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <MinecraftButton variant="gray" size="sm" className="flex items-center gap-1.5 text-xs">
                  <Github className="w-3.5 h-3.5 text-stone-300" />
                  <span>GITHUB</span>
                  <ExternalLink className="w-3 h-3 text-stone-400 ml-0.5" />
                </MinecraftButton>
              </a>
            )}

            <MinecraftButton onClick={handleOpenJsonModal} variant="amber" size="sm" className="flex items-center gap-1.5 text-xs">
                <FileCode className="w-3.5 h-3.5" />
                <span>VER JSON MANIFEST</span>
              </MinecraftButton>

            <MinecraftButton onClick={handleCopyIp} variant="lava" size="sm" className="flex items-center gap-1.5 text-xs">
                {copiedIp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIp ? '¡IP COPIADA!' : 'COPIAR IP'}</span>
              </MinecraftButton>

            {canEdit && (
              <>
                {hasOptionalMods && (
                  <MinecraftButton onClick={() => setIsModsConfigOpen(true)} variant="amber" size="sm" className="flex items-center gap-1.5 text-xs">
                      <Puzzle className="w-3.5 h-3.5" />
                      <span>CONFIGURAR MODS</span>
                    </MinecraftButton>
                )}

                <Link href={`/dashboard/modpacks/${modpack.tag}/edit`}>
                  <MinecraftButton variant="green" size="sm" className="flex items-center gap-1.5 text-xs">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>EDITAR MODPACK</span>
                  </MinecraftButton>
                </Link>

                <MinecraftButton onClick={() => setIsDeleteModalOpen(true)}
                    variant="lava"
                    size="sm"
                    className="flex items-center gap-1.5 text-xs border-red-700 bg-red-950/80 hover:bg-red-900"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>ELIMINAR</span>
                  </MinecraftButton>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. HERO SHOWCASE SECTION */}
      <section className="relative w-full overflow-hidden border-b-4 border-black">
        {/* Background Wallpaper */}
        <div className="absolute inset-0 z-0">
          <img
            src={wallpaper}
            alt={modpack.name}
            className="w-full h-full object-cover object-center filter brightness-[0.82]"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/nether_bg.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080505] via-[#080505]/75 to-black/50" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-10 sm:py-14 flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8">
          {/* Big Slot with Modpack Icon */}
          <div
            className="minecraft-slot w-24 h-24 sm:w-28 sm:h-28 p-2 flex items-center justify-center shrink-0 shadow-2xl"
            style={{ borderColor: modpack.accentColor || '#ef4444' }}
          >
            {modpack.iconUrl ? (
              <img
                src={resolveImageUrl(modpack.iconUrl)}
                alt={modpack.name}
                className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/chaos_icon.png';
                }}
              />
            ) : (
              <Anvil className="w-14 h-14 text-amber-400" />
            )}
          </div>

          {/* Details & Badges */}
          <div className="flex-1 text-center md:text-left space-y-3 min-w-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <span className="font-minecraft text-xs font-bold px-2.5 py-0.5 bg-black/70 text-amber-400 border border-amber-600/60 uppercase">
                #{modpack.tag}
              </span>
              <span className="font-minecraft text-xs font-bold px-2.5 py-0.5 bg-black/70 text-emerald-400 border border-emerald-600/60">
                v{modpack.version}
              </span>
              <span className="font-minecraft text-xs font-bold px-2.5 py-0.5 bg-black/70 text-orange-400 border border-orange-600/60 uppercase">
                {modpack.loaderType} {modpack.loaderVersion || ''}
              </span>
              <span className="font-minecraft text-xs font-bold px-2.5 py-0.5 bg-black/70 text-cyan-400 border border-cyan-600/60">
                MC {modpack.minecraftVersion}
              </span>
              <ServerStatusBadge tag={modpack.tag} />
            </div>

            <h1 className="font-minecraft text-3xl sm:text-5xl font-bold text-white minecraft-text-shadow-lava tracking-wide">
              {modpack.name}
            </h1>

            {/* Author Pill */}
            {modpack.author && (
              <div className="flex items-center justify-center md:justify-start gap-2 pt-1">
                <span className="text-xs text-stone-400 font-minecraft uppercase">Forjado por:</span>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-black/60 border border-stone-800">
                  <img
                    src={modpack.author.skinUrl || 'https://mc-heads.net/avatar/Steve/100'}
                    alt={modpack.author.username}
                    className="w-4 h-4 object-cover"
                  />
                  <span className="text-xs font-bold text-white font-minecraft">{modpack.author.username}</span>
                  {modpack.author.role === 'SUPERADMIN' && (
                    <span className="text-[9px] bg-red-950/80 text-red-300 px-1 py-0.2 border border-red-700 font-minecraft">
                      ADMIN
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. TABS MODULARES DINÁMICOS EN EL EXPLORADOR */}
      <div className="bg-[#100707] border-b-2 border-black sticky top-0 z-30 px-6 py-0 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
          {/* TAB GENERAL */}
          <button
            onClick={() => setActiveTab('general')}
            className={`px-5 py-3 font-minecraft text-xs flex items-center gap-2 border-t-2 border-x-2 transition cursor-pointer select-none ${
              activeTab === 'general'
                ? 'bg-[#180c0c] text-amber-400 border-amber-600 font-bold -mb-[2px] z-10'
                : 'bg-black/60 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>GENERAL</span>
          </button>

          {/* TAB MODS */}
          {hasOptionalMods && (
            <button
              onClick={() => setActiveTab('mods')}
              className={`px-5 py-3 font-minecraft text-xs flex items-center gap-2 border-t-2 border-x-2 transition cursor-pointer select-none ${
                activeTab === 'mods'
                  ? 'bg-[#180c0c] text-emerald-400 border-emerald-600 font-bold -mb-[2px] z-10'
                  : 'bg-black/60 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              <Puzzle className="w-4 h-4 text-emerald-400" />
              <span>MODS ({modpack.optionalMods?.length || 0})</span>
            </button>
          )}

          {/* TAB NORMAS */}
          {hasRules && (
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-5 py-3 font-minecraft text-xs flex items-center gap-2 border-t-2 border-x-2 transition cursor-pointer select-none ${
                activeTab === 'rules'
                  ? 'bg-[#180c0c] text-cyan-400 border-cyan-600 font-bold -mb-[2px] z-10'
                  : 'bg-black/60 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>NORMAS</span>
            </button>
          )}

          {/* TAB DISCORD */}
          {hasDiscord && (
            <button
              onClick={() => setActiveTab('discord')}
              className={`px-5 py-3 font-minecraft text-xs flex items-center gap-2 border-t-2 border-x-2 transition cursor-pointer select-none ${
                activeTab === 'discord'
                  ? 'bg-[#180c0c] text-[#828bf7] border-[#5865F2] font-bold -mb-[2px] z-10'
                  : 'bg-black/60 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              <DiscordPixelIcon className="w-4 h-4 text-[#828bf7]" />
              <span>DISCORD</span>
            </button>
          )}

          {/* TAB CHANGELOG */}
          {hasChangelog && (
            <button
              onClick={() => setActiveTab('changelog')}
              className={`px-5 py-3 font-minecraft text-xs flex items-center gap-2 border-t-2 border-x-2 transition cursor-pointer select-none ${
                activeTab === 'changelog'
                  ? 'bg-[#180c0c] text-purple-400 border-purple-600 font-bold -mb-[2px] z-10'
                  : 'bg-black/60 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              <Clock className="w-4 h-4 text-purple-400" />
              <span>CHANGELOG</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. CONTENIDO DE LAS PESTAÑAS */}
      <main className="max-w-7xl w-full mx-auto px-6 py-10">
        {/* PESTAÑA 1: GENERAL */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna Izquierda: Descripción & Guía de Juego */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card: Descripción */}
              <MinecraftPanel className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-minecraft text-xs font-bold uppercase tracking-wider border-b border-stone-800 pb-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>DESCRIPCIÓN DE LA EXPERIENCIA</span>
                </div>
                <p className="text-sm text-stone-200 font-sans leading-relaxed whitespace-pre-line">
                  {modpack.description || 'Este paquete de mods no incluye una descripción extendida.'}
                </p>
              </MinecraftPanel>

              {/* Card: Instrucciones para jugar desde ChaosLauncher */}
              <MinecraftPanel className="p-6 space-y-3 border-emerald-700/50 bg-[#0d1610]">
                <div className="flex items-center gap-2 text-emerald-400 font-minecraft text-xs font-bold uppercase tracking-wider">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>CÓMO JUGAR CON CHAOS LAUNCHER</span>
                </div>
                <ol className="text-xs text-stone-200 font-minecraft space-y-2.5 list-decimal list-inside leading-relaxed">
                  <li>Abre tu aplicación de escritorio <strong>ChaosLauncher</strong>.</li>
                  <li>En la barra lateral izquierda, selecciona <strong>{modpack.name}</strong>.</li>
                  <li>Haz clic en el botón verde <strong>JUGAR</strong> o <strong>DESCARGAR</strong>.</li>
                  <li>El lanzador descargará automáticamente los mods y sincronizará la última versión con el servidor.</li>
                </ol>
              </MinecraftPanel>
            </div>

            {/* Columna Derecha: Servidor, Hardware y Manifiesto */}
            <div className="space-y-6">
              {/* Card: Conexión al Servidor */}
              <MinecraftCard className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-minecraft text-xs font-bold uppercase tracking-wider border-b border-stone-800 pb-2">
                  <Server className="w-4 h-4 text-amber-400" />
                  <span>CONEXIÓN AL SERVIDOR</span>
                </div>

                <div className="space-y-3 text-xs font-minecraft">
                  <div>
                    <span className="text-[10px] uppercase text-stone-500">Dirección del Servidor:</span>
                    <div className="flex items-center justify-between p-2.5 minecraft-slot bg-black mt-1">
                      <span className="font-mono text-white text-xs font-bold select-all truncate">
                        {modpack.serverIp}
                      </span>
                      <button
                        onClick={handleCopyIp}
                        className="p-1 text-stone-400 hover:text-white transition cursor-pointer shrink-0 ml-2"
                        title="Copiar IP"
                      >
                        {copiedIp ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 minecraft-slot">
                    <span className="text-stone-400">Puerto:</span>
                    <span className="font-mono text-white font-bold">{modpack.serverPort}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 minecraft-slot">
                    <span className="text-stone-400">Estado en vivo:</span>
                    <ServerStatusBadge tag={modpack.tag} />
                  </div>
                </div>
              </MinecraftCard>

              {/* Card: Hardware y Requisitos */}
              <MinecraftCard className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-minecraft text-xs font-bold uppercase tracking-wider border-b border-stone-800 pb-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span>REQUISITOS DE HARDWARE</span>
                </div>

                <div className="space-y-3 text-xs font-minecraft">
                  <div className="p-2.5 minecraft-slot space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">RAM Recomendada:</span>
                      <span className="text-amber-400 font-bold">{ramRecommendedGb} GB ({modpack.recommendedRam} MB)</span>
                    </div>
                    <div className="w-full h-2 bg-stone-900 border border-stone-700 p-0.5">
                      <div
                        className="h-full bg-amber-400"
                        style={{ width: `${Math.min(100, (ramRecommendedGb / 16) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 minecraft-slot">
                    <span className="text-stone-400">RAM Mínima:</span>
                    <span className="text-white font-bold">{ramMinGb} GB</span>
                  </div>

                  <div className="flex items-center justify-between p-2 minecraft-slot">
                    <span className="text-stone-400">Versión Minecraft:</span>
                    <span className="text-emerald-400 font-bold">{modpack.minecraftVersion}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 minecraft-slot">
                    <span className="text-stone-400">Modloader:</span>
                    <span className="text-orange-400 font-bold uppercase">
                      {modpack.loaderType} {modpack.loaderVersion || ''}
                    </span>
                  </div>
                </div>
              </MinecraftCard>

              {/* Card: Repositorio y Manifiesto */}
              <MinecraftCard className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-minecraft text-xs font-bold uppercase tracking-wider border-b border-stone-800 pb-2">
                  <FileCode className="w-4 h-4 text-amber-400" />
                  <span>MANIFIESTO Y CÓDIGO</span>
                </div>

                <div className="space-y-2.5">
                  <button
                    onClick={handleOpenJsonModal}
                    className="w-full minecraft-btn-gray py-2 px-3 text-xs font-minecraft flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <FileCode className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ver JSON Manifest</span>
                    </span>
                    <span className="text-[10px] text-stone-400">API</span>
                  </button>

                  {modpack.githubRepo && (
                    <a
                      href={
                        modpack.githubRepo.startsWith('http')
                          ? modpack.githubRepo
                          : `https://github.com/${modpack.githubRepo}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full minecraft-btn-gray py-2 px-3 text-xs font-minecraft flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Github className="w-3.5 h-3.5 text-white shrink-0" />
                        <span className="truncate">{modpack.githubRepo}</span>
                      </span>
                      <ExternalLink className="w-3 h-3 text-stone-400 shrink-0" />
                    </a>
                  )}
                </div>
              </MinecraftCard>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: MODS */}
        {activeTab === 'mods' && hasOptionalMods && (
          <div className="space-y-6">
            <MinecraftPanel className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2 text-emerald-400 font-minecraft text-xs font-bold uppercase tracking-wider">
                  <Puzzle className="w-5 h-5 text-emerald-400" />
                  <span>MODS OPCIONALES DISPONIBLES EN EL LAUNCHER</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-minecraft text-stone-400">
                    {modpack.optionalMods?.length || 0} mods configurados
                  </span>
                  {canEdit && (
                    <MinecraftButton onClick={() => setIsModsConfigOpen(true)} variant="amber" size="sm" className="py-1 px-2.5 text-xs flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>CONFIGURAR MODS</span>
                      </MinecraftButton>
                  )}
                </div>
              </div>

              {modpack.optionalMods && modpack.optionalMods.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {modpack.optionalMods.map((opt) => (
                    <div
                      key={opt.id || opt.modId}
                      className="minecraft-card p-4 flex flex-col justify-between gap-3 border-stone-800 bg-[#140b0b]"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-minecraft font-bold text-sm text-white">{opt.name}</span>
                          {opt.defaultEnabled ? (
                            <span className="text-[9px] font-minecraft font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-600/50 px-2 py-0.5">
                              HABILITADO POR DEFECTO
                            </span>
                          ) : (
                            <span className="text-[9px] font-minecraft font-bold text-stone-400 bg-black/60 border border-stone-700 px-2 py-0.5">
                              OPCIONAL (DESACTIVADO)
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-amber-400/80 block">
                          Archivo: {opt.file}
                        </span>
                        <p className="text-xs text-stone-300 font-sans leading-relaxed pt-1">
                          {opt.description || 'Sin descripción específica proporcionada.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 minecraft-slot bg-black/40 text-center space-y-2">
                  <Puzzle className="w-8 h-8 text-stone-600 mx-auto" />
                  <p className="text-xs font-minecraft text-stone-400">
                    Este modpack no cuenta con mods opcionales configurados. Todos los componentes forman parte del paquete principal.
                  </p>
                  {canEdit && (
                    <div className="pt-2">
                      <MinecraftButton variant="amber" size="sm" onClick={() => setIsModsConfigOpen(true)}>
                        CONFIGURAR MODS AHORA
                      </MinecraftButton>
                    </div>
                  )}
                </div>
              )}
            </MinecraftPanel>
          </div>
        )}

        {/* PESTAÑA 3: NORMAS */}
        {activeTab === 'rules' && hasRules && (
          <div className="max-w-4xl mx-auto space-y-6">
            <MinecraftPanel
              title="REGLAMENTO DEL SERVIDOR"
              subtitle="Normas de convivencia, sanciones y conducta para mantener la armonía de la comunidad."
              icon={<ShieldCheck className="w-5 h-5 text-cyan-400" />}
              className="p-8"
            >
              <div
                className="prose prose-invert max-w-none space-y-4 font-minecraft text-xs sm:text-sm text-stone-200 leading-relaxed
                  [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-amber-400 [&>h1]:border-b-2 [&>h1]:border-amber-600/40 [&>h1]:pb-2 [&>h1]:mb-4
                  [&>h2]:text-lg [&>h2]:font-bold [&>h2]:text-emerald-400 [&>h2]:mt-6 [&>h2]:mb-3
                  [&>h3]:text-base [&>h3]:font-bold [&>h3]:text-cyan-400
                  [&>p]:text-stone-300 [&>p]:leading-relaxed
                  [&>ul]:list-disc [&>ul]:list-inside [&>ul]:space-y-2 [&>ul>li]:text-stone-200
                  [&>ol]:list-decimal [&>ol]:list-inside [&>ol]:space-y-2 [&>ol>li]:text-stone-200
                  [&>blockquote]:border-l-4 [&>blockquote]:border-amber-500 [&>blockquote]:bg-amber-950/20 [&>blockquote]:p-3 [&>blockquote]:text-amber-300 [&>blockquote]:my-4
                  [&>hr]:border-stone-800 [&>hr]:my-6
                  [&>strong]:text-white [&>strong]:font-bold"
                dangerouslySetInnerHTML={{ __html: renderRulesHtml() }}
              />

              {canEdit && (
                <div className="pt-6 border-t-2 border-black flex justify-end">
                  <Link href={`/dashboard/modpacks/${modpack.tag}/edit`}>
                    <MinecraftButton variant="amber" size="sm">
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>EDITAR NORMATIVA</span>
                    </MinecraftButton>
                  </Link>
                </div>
              )}
            </MinecraftPanel>
          </div>
        )}

        {/* PESTAÑA 4: DISCORD */}
        {activeTab === 'discord' && hasDiscord && (
          <div className="max-w-3xl mx-auto space-y-6">
            <MinecraftPanel
              title="COMUNIDAD OFICIAL DE DISCORD"
              subtitle="Únete al servidor oficial para enterarte de eventos, actualizaciones y recibir soporte en vivo."
              icon={<DiscordPixelIcon className="w-5 h-5 text-[#828bf7]" />}
              className="p-8 text-center space-y-6"
            >
              {/* Discord Banner & Icon */}
              <div className="p-6 minecraft-card border-[#5865F2]/50 bg-[#0f111c] space-y-4 max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-none minecraft-slot text-[#828bf7] mx-auto flex items-center justify-center bg-black/60 border-[#5865F2]">
                  <DiscordPixelIcon className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-minecraft text-xl font-bold text-white minecraft-text-shadow">
                    COMUNIDAD {modpack.name.toUpperCase()}
                  </h3>
                  <p className="text-xs text-stone-300 font-sans">
                    Comparte con otros jugadores, reporta errores y participa en sorteos de rangos exclusivos.
                  </p>
                </div>

                {/* BOTÓN AZUL 3D MINECRAFT PARA UNIRSE A DISCORD */}
                <div className="pt-2 flex justify-center">
                  <a
                    href={modpack.discordUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!modpack.discordUrl) {
                        e.preventDefault();
                        alert('No se ha configurado la URL de Discord para este modpack.');
                      }
                    }}
                    className="minecraft-btn-discord px-8 py-4 font-minecraft font-bold text-sm tracking-wider flex items-center justify-center gap-3 cursor-pointer no-underline shadow-xl hover:scale-105 transition"
                  >
                    <DiscordPixelIcon className="w-6 h-6" />
                    <span>UNIRSE A DISCORD</span>
                    <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
                  </a>
                </div>

                {modpack.discordUrl && (
                  <span className="text-[10px] font-mono text-stone-400 block pt-1 truncate">
                    {modpack.discordUrl}
                  </span>
                )}
              </div>
            </MinecraftPanel>
          </div>
        )}

        {/* PESTAÑA 5: CHANGELOG */}
        {activeTab === 'changelog' && hasChangelog && (
          <div className="max-w-4xl mx-auto space-y-6">
            <MinecraftPanel
              title={`REGISTRO DE CAMBIOS (v${modpack.version})`}
              subtitle={`${changelogItems.length} cambios registrados en esta versión del modpack.`}
              icon={<Clock className="w-5 h-5 text-purple-400" />}
              className="p-6 space-y-4"
            >
              <div className="space-y-3">
                {changelogItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="minecraft-slot p-3.5 flex items-start gap-3 bg-[#0f0707] border-stone-800"
                  >
                    <span className="text-purple-400 font-minecraft text-sm shrink-0 mt-0.5">◆</span>
                    <span
                      className="text-xs sm:text-sm text-stone-200 font-minecraft leading-relaxed [&>strong]:text-amber-300 [&>strong]:font-bold [&>a]:text-amber-400 [&>a]:underline [&>code]:bg-black/50 [&>code]:px-1 [&>code]:py-0.5 [&>code]:text-emerald-300"
                      dangerouslySetInnerHTML={{ __html: marked.parseInline(item) as string }}
                    />
                  </div>
                ))}
              </div>
            </MinecraftPanel>
          </div>
        )}
      </main>

      {/* MODAL: VER MANIFEST JSON */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-3xl minecraft-panel p-6 relative border-2 border-black space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-5 h-5 text-amber-400" />
                <h3 className="font-minecraft text-base font-bold text-white">
                  MANIFIESTO JSON DINÁMICO #{tag}
                </h3>
              </div>
              <button
                onClick={() => setIsJsonModalOpen(false)}
                className="p-1 text-stone-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto minecraft-slot p-4 bg-[#070404]">
              {loadingManifest ? (
                <div className="p-8 text-center text-xs font-minecraft text-stone-400">
                  Cargando manifiesto desde el servidor...
                </div>
              ) : (
                <pre className="font-mono text-xs text-emerald-400 leading-relaxed whitespace-pre select-all">
                  {manifestJson}
                </pre>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-800">
              <a
                href={manifestUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-minecraft text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>Abrir en nueva pestaña</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex items-center gap-3">
                <MinecraftButton variant="gray" size="sm" onClick={() => setIsJsonModalOpen(false)}>
                  CERRAR
                </MinecraftButton>
                <MinecraftButton variant="amber" size="sm" onClick={handleCopyJson}>
                  {copiedJson ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedJson ? '¡COPIADO!' : 'COPIAR JSON'}</span>
                </MinecraftButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURACIÓN DE MODS */}
      {isModsConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-end p-2">
              <button
                onClick={() => {
                  setIsModsConfigOpen(false);
                  loadData();
                }}
                className="p-1.5 text-stone-300 hover:text-white bg-black border border-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <OptionalModsConfigurator
              tag={modpack.tag}
              modpackName={modpack.name}
              onSaveSuccess={() => {
                setIsModsConfigOpen(false);
                loadData();
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      <DeleteModpackModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        modpackName={modpack.name}
        modpackTag={modpack.tag}
      />
    </div>
  );
}
