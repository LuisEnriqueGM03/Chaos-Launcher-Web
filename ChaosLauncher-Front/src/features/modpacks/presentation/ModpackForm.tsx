import React, { useState } from 'react';
import { ENV } from '../../../core/config/env';
import { useRouter } from 'next/navigation';
import { 
  Anvil, 
  Save, 
  Upload, 
  AlertCircle, 
  ArrowLeft, 
  Trash2, 
  Crop,
  Tag,
  Palette,
  Server,
  Cpu,
  GitBranch,
  ChevronLeft,
  ChevronRight,
  Download,
  Sparkles,
  Check,
  Key,
  ExternalLink,
  Github,
  FileArchive,
} from 'lucide-react';
import { Modpack, LoaderType } from '../../../core/types/modpack.types';
import { modpacksApi } from '../infrastructure/modpacks.api';
import { githubModpackApi, GeneratedManifestResult } from '../infrastructure/github-modpack.api';
import { MinecraftPanel } from '../../../shared/components/MinecraftPanel';
import { MinecraftInput } from '../../../shared/components/MinecraftInput';
import { MinecraftButton } from '../../../shared/components/MinecraftButton';
import { MinecraftSlot } from '../../../shared/components/MinecraftSlot';
import { MinecraftSelect, SelectOption } from '../../../shared/components/MinecraftSelect';
import { MinecraftImageAdjuster } from '../../../shared/components/MinecraftImageAdjuster';
import { DeleteModpackModal } from './DeleteModpackModal';
import { PushToGithubModal } from './PushToGithubModal';
import { ImportZipModal } from './ImportZipModal';
import { resolveImageUrl } from '../../../shared/utils/image';

interface ModpackFormProps {
  initialData?: Modpack;
  isEditing?: boolean;
}

const FORM_STEPS = [
  { step: 1, label: '1. Identificación', icon: Tag },
  { step: 2, label: '2. Personalización Visual', icon: Palette },
  { step: 3, label: '3. Servidor Minecraft', icon: Server },
  { step: 4, label: '4. Versión & Rendimiento', icon: Cpu },
  { step: 5, label: '5. Repositorio GitHub', icon: GitBranch },
];

const TITLE_MODE_OPTIONS: SelectOption[] = [
  { value: 'BOTH', label: 'Ambos (Banner + Texto)', sublabel: 'Banner de imagen 1900x550 y título de Minecraft' },
  { value: 'IMAGE_ONLY', label: 'Solo Banner de Imagen', sublabel: 'Solo el logo/banner panorámico 1900x550' },
  { value: 'TEXT_ONLY', label: 'Solo Texto Minecraft', sublabel: 'Título estilizado con tipografía oficial' },
  { value: 'ICON_ONLY', label: 'Solo Icono Cuadrado', sublabel: 'Logo/icono centrado sin texto ni banner' },
];

const COLOR_OPTIONS: SelectOption[] = [
  { value: '#ef4444', label: 'Rojo Lava (Chaos)', colorHex: '#ef4444' },
  { value: '#f59e0b', label: 'Ámbar Mimic (RPG)', colorHex: '#f59e0b' },
  { value: '#10b981', label: 'Verde Esmeralda', colorHex: '#10b981' },
  { value: '#06b6d4', label: 'Azul Diamante', colorHex: '#06b6d4' },
  { value: '#8b5cf6', label: 'Púrpura Amatista', colorHex: '#8b5cf6' },
  { value: '#3b0764', label: 'Negro Obsidiana', colorHex: '#3b0764' },
  { value: '#d97706', label: 'Oro Netherita', colorHex: '#d97706' },
  { value: '#ec4899', label: 'Rosa Glowstone', colorHex: '#ec4899' },
  { value: '#2563eb', label: 'Azul Lapislázuli', colorHex: '#2563eb' },
];

const LOADER_OPTIONS: SelectOption[] = [
  { value: 'NEOFORGE', label: 'NeoForge', sublabel: '1.20.4+' },
  { value: 'FABRIC', label: 'Fabric', sublabel: 'Ligero y optimizado' },
  { value: 'FORGE', label: 'Forge', sublabel: 'Clásico' },
  { value: 'VANILLA', label: 'Vanilla', sublabel: 'Sin loader de mods' },
];

export const ModpackForm: React.FC<ModpackFormProps> = ({ initialData, isEditing = false }) => {
  const router = useRouter();

  const [activeStepTab, setActiveStepTab] = useState<number>(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [name, setName] = useState(initialData?.name || '');
  const [tag, setTag] = useState(initialData?.tag || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [accentColor, setAccentColor] = useState(initialData?.accentColor || '#ef4444');
  const [iconUrl, setIconUrl] = useState(initialData?.iconUrl || '');
  const [wallpaperUrl, setWallpaperUrl] = useState(initialData?.wallpaperUrl || '');
  const [titleImageUrl, setTitleImageUrl] = useState(initialData?.titleImageUrl || '');
  const [titleDisplayMode, setTitleDisplayMode] = useState<string>(initialData?.titleDisplayMode || 'BOTH');
  const [titleText, setTitleText] = useState(initialData?.titleText || '');
  const [titleImagePreview, setTitleImagePreview] = useState<string | null>(null);

  const [adjusterOpen, setAdjusterOpen] = useState(false);
  const [adjusterConfig, setAdjusterConfig] = useState<{
    width: number;
    height: number;
    title: string;
    field: 'title' | 'wallpaper';
    category: 'wallpapers' | 'general';
    currentUrl: string;
  }>({
    width: 1900,
    height: 550,
    title: 'Ajustar Banner de Título (1900 x 550)',
    field: 'title',
    category: 'wallpapers',
    currentUrl: '',
  });

  const [serverIp, setServerIp] = useState(initialData?.serverIp || ENV.DEFAULT_SERVER_IP);
  const [serverPort, setServerPort] = useState(initialData?.serverPort || 25565);
  const [version, setVersion] = useState(initialData?.version || '1.0.0');
  const [minecraftVersion, setMinecraftVersion] = useState(initialData?.minecraftVersion || '1.21.1');
  const [loaderType, setLoaderType] = useState<LoaderType>(initialData?.loaderType || 'NEOFORGE');
  const [loaderVersion, setLoaderVersion] = useState(initialData?.loaderVersion || '');
  const [recommendedRam, setRecommendedRam] = useState(initialData?.recommendedRam || 6144);
  const [minRam, setMinRam] = useState(initialData?.minRam || 4096);
  const [githubRepo, setGithubRepo] = useState(initialData?.githubRepo || '');
  const [githubBranch, setGithubBranch] = useState(initialData?.githubBranch || 'main');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(initialData?.forceUpdate ?? true);

  const [loading, setLoading] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingWallpaper, setUploadingWallpaper] = useState(false);
  const [uploadingTitleImage, setUploadingTitleImage] = useState(false);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [wallpaperPreview, setWallpaperPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados para el generador inteligente de modpack.json
  const [manifestScope, setManifestScope] = useState<'mods' | 'all'>('mods');
  const [githubPat, setGithubPat] = useState<string>('');
  const [generatingManifest, setGeneratingManifest] = useState(false);
  const [generatedManifestResult, setGeneratedManifestResult] = useState<GeneratedManifestResult | null>(null);
  const [generatorError, setGeneratorError] = useState<string | null>(null);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [showFileList, setShowFileList] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = sessionStorage.getItem('chaos_github_pat') || '';
      if (savedToken) setGithubPat(savedToken);
    }
  }, []);

  const handleGenerateManifest = async () => {
    if (!githubRepo.trim()) {
      setGeneratorError('Debes ingresar primero el Repositorio de GitHub (ej: owner/repo).');
      return;
    }

    setGeneratingManifest(true);
    setGeneratorError(null);

    try {
      const res = await githubModpackApi.generateManifest({
        repo: githubRepo.trim(),
        branch: githubBranch.trim() || 'main',
        scope: manifestScope,
        token: githubPat.trim() || undefined,
        name: name || undefined,
        version: version !== initialData?.version ? (version || undefined) : undefined,
        minecraftVersion: minecraftVersion || undefined,
        loaderType,
        loaderVersion: loaderVersion || undefined,
        serverIp: serverIp || undefined,
        serverPort,
        recommendedRam,
        forceUpdate,
      });

      setGeneratedManifestResult(res);

      if (res.manifest.version) {
        setVersion(res.manifest.version);
      }
      if (res.manifest.minecraftVersion && (!minecraftVersion || minecraftVersion === '1.21.1')) {
        setMinecraftVersion(res.manifest.minecraftVersion);
      }
    } catch (err: any) {
      setGeneratorError(err.message || 'Error al generar modpack.json desde el repositorio');
    } finally {
      setGeneratingManifest(false);
    }
  };

  const handleDownloadManifest = () => {
    if (!generatedManifestResult?.manifest) return;
    const jsonStr = JSON.stringify(generatedManifestResult.manifest, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modpack.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setIconPreview(localUrl);
    setUploadingIcon(true);
    setError(null);
    try {
      const res = await modpacksApi.uploadImage(file, 'icons');
      setIconUrl(res.url);
    } catch (err: any) {
      setError(err.message || 'Error al subir icono');
    } finally {
      setUploadingIcon(false);
    }
  };

  // Al subir wallpaper, pasa obligatoriamente por el componente de recorte (1920x1080)
  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setAdjusterConfig({
      width: 1920,
      height: 1080,
      title: 'Ajustar Wallpaper / Fondo (1920 x 1080 px)',
      field: 'wallpaper',
      category: 'wallpapers',
      currentUrl: localUrl,
    });
    setAdjusterOpen(true);
    e.target.value = '';
  };

  // Al subir banner de título, pasa obligatoriamente por el componente de recorte (1900x550)
  const handleTitleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setAdjusterConfig({
      width: 1900,
      height: 550,
      title: 'Ajustar Banner de Título (1900 x 550 px)',
      field: 'title',
      category: 'wallpapers',
      currentUrl: localUrl,
    });
    setAdjusterOpen(true);
    e.target.value = '';
  };

  const openAdjuster = (field: 'title' | 'wallpaper') => {
    if (field === 'title') {
      setAdjusterConfig({
        width: 1900,
        height: 550,
        title: 'Ajustar Banner de Título (1900 x 550 px)',
        field: 'title',
        category: 'wallpapers',
        currentUrl: titleImagePreview || (titleImageUrl ? resolveImageUrl(titleImageUrl) : ''),
      });
    } else {
      setAdjusterConfig({
        width: 1920,
        height: 1080,
        title: 'Ajustar Wallpaper / Fondo (1920 x 1080 px)',
        field: 'wallpaper',
        category: 'wallpapers',
        currentUrl: wallpaperPreview || (wallpaperUrl ? resolveImageUrl(wallpaperUrl) : ''),
      });
    }
    setAdjusterOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload: any = {
      name,
      tag: tag.toLowerCase().trim(),
      description,
      accentColor,
      iconUrl: iconUrl || undefined,
      wallpaperUrl: wallpaperUrl || undefined,
      titleImageUrl: titleImageUrl || undefined,
      titleDisplayMode: titleDisplayMode || 'BOTH',
      titleText: titleText.trim() || undefined,
      serverIp,
      serverPort: Number(serverPort),
      version,
      minecraftVersion,
      loaderType,
      loaderVersion: loaderVersion || undefined,
      recommendedRam: Number(recommendedRam),
      minRam: Number(minRam),
      githubRepo: githubRepo || undefined,
      githubBranch: githubBranch || 'main',
      forceUpdate,
    };

    if (isEditing && initialData) {
      payload.hasOptionalMods = initialData.hasOptionalMods;
      payload.hasRules = initialData.hasRules;
      payload.hasDiscord = initialData.hasDiscord;
      payload.hasChangelog = initialData.hasChangelog;
      payload.rulesContent = initialData.rulesContent;
      payload.discordUrl = initialData.discordUrl;
    } else {
      payload.changelog = ['✨ Versión inicial de lanzamiento'];
    }

    try {
      if (isEditing && initialData?.tag) {
        await modpacksApi.update(initialData.tag, payload);
      } else {
        await modpacksApi.create(payload);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al guardar el modpack');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MinecraftPanel
      title={isEditing ? `EDITAR MODPACK: ${initialData?.name}` : 'CREAR NUEVO MODPACK'}
      subtitle="Configura todos los parámetros técnicos para el launcher y servidores"
      icon={<Anvil className="w-5 h-5 text-amber-400" />}
      className="max-w-4xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 minecraft-card border-red-500/70 text-red-300 text-xs font-minecraft flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* BARRA DE SUBTABS (PASOS DEL 1 AL 5) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1.5 minecraft-slot bg-black/60 border-stone-800">
          {FORM_STEPS.map((s) => {
            const isActive = activeStepTab === s.step;
            const Icon = s.icon;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => setActiveStepTab(s.step)}
                className={`px-2.5 py-2 text-xs font-minecraft tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 border text-center ${
                  isActive
                    ? 'minecraft-btn-lava text-white border-b-2 border-b-amber-400 font-bold shadow-md'
                    : 'bg-[#140808] text-stone-400 hover:text-white hover:bg-[#200d0d] border-stone-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-300' : 'text-stone-400'}`} />
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* 1. INFORMACIÓN BÁSICA */}
        {activeStepTab === 1 && (
          <div className="p-4 minecraft-card space-y-4">
            <h4 className="font-minecraft text-xs font-bold text-amber-400 uppercase tracking-widest border-b border-stone-800 pb-2">
              1. Identificación del Modpack
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MinecraftInput
                label="Nombre del Modpack *"
                placeholder="Ej: Mimic MC Oficial"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!isEditing && !tag) {
                    setTag(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
                  }
                }}
                required
              />

              <MinecraftInput
                label="Tag / Slug Único *"
                placeholder="Ej: mimic-mc"
                value={tag}
                onChange={(e) => setTag(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                helperText="Identificador único para el Launcher y URLs"
                required
                disabled={isEditing}
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="block font-minecraft font-bold text-xs uppercase tracking-wider text-slate-300">
                Descripción del Modpack
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve resumen de la experiencia, lore y cantidad de mods..."
                className="w-full px-3.5 py-2.5 rounded-none minecraft-input text-xs text-white placeholder-stone-500 font-minecraft"
              />
            </div>

            {/* Color representativo personalizado */}
            <MinecraftSelect
              label="Color Representativo *"
              value={accentColor}
              onChange={setAccentColor}
              options={COLOR_OPTIONS}
              allowCustomColor={true}
              placeholder="Selecciona un color..."
            />
          </div>
        )}

        {/* 2. RECURSOS VISUALES (Icono, Título 1900x550 & Wallpaper 1920x1080) */}
        {activeStepTab === 2 && (
          <div className="p-4 minecraft-card space-y-4">
            <h4 className="font-minecraft text-xs font-bold text-amber-400 uppercase tracking-widest border-b border-stone-800 pb-2">
              2. Personalización Visual (Icono, Banner de Título & Wallpaper)
            </h4>

          {/* Modo de Visualización del Título */}
          <MinecraftSelect
            label="Modo de Visualización del Título en el Launcher *"
            value={titleDisplayMode}
            onChange={(val) => setTitleDisplayMode(val)}
            options={TITLE_MODE_OPTIONS}
            placeholder="Selecciona cómo se verá el título..."
          />

          {/* Texto del Título Personalizado (Texto blanco sin marco ni fondo) */}
          <MinecraftInput
            label="Texto del Título en el Launcher (Opcional)"
            placeholder="Ej: MIMIC MC (dejar vacío para usar el nombre del modpack)"
            value={titleText}
            onChange={(e) => setTitleText(e.target.value)}
            helperText="Texto blanco tipográfico de Minecraft que se renderiza limpiamente en el Launcher"
          />

          {/* Banner de Título Panorámico (1900 x 550 px) */}
          <div className="space-y-3 pt-2 border-t border-stone-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block font-minecraft font-bold text-xs uppercase tracking-wider text-slate-300">
                Logo / Banner de Título Panorámico (1900 × 550 px)
              </label>
              <button
                type="button"
                onClick={() => openAdjuster('title')}
                className="px-2.5 py-1 text-[11px] font-minecraft bg-amber-950/40 border border-amber-600/70 text-amber-300 hover:bg-amber-900/60 transition flex items-center gap-1.5 cursor-pointer active:translate-y-0.5"
                title="Abrir recortador interactivo a 1900 x 550 px"
              >
                <Crop className="w-3.5 h-3.5 text-amber-400" />
                <span>Ajustar / Recortar (1900×550)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div className="space-y-2">
                <MinecraftInput
                  placeholder="https://.../title_banner.png"
                  value={titleImageUrl}
                  onChange={(e) => {
                    setTitleImageUrl(e.target.value);
                    setTitleImagePreview(null);
                  }}
                  helperText="Imagen transparente o decorativa que encabezará el modpack en el Launcher"
                />

                <label className="minecraft-btn-lava px-3 py-1.5 text-xs font-minecraft cursor-pointer inline-flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingTitleImage ? 'Subiendo...' : 'Subir archivo de título'}</span>
                  <input type="file" accept="image/*" onChange={handleTitleImageUpload} className="hidden" />
                </label>
              </div>

              <div className="space-y-1">
                <div className="h-20 w-full border-2 border-black minecraft-slot overflow-hidden relative bg-[#0a0505] flex items-center justify-center p-2">
                  {titleImagePreview || titleImageUrl ? (
                    <img
                      src={titleImagePreview || resolveImageUrl(titleImageUrl)}
                      alt="Title preview"
                      className="w-full h-full object-contain filter drop-shadow"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-[10px] font-minecraft text-stone-500">
                      Sin banner de título personalizado (1900 × 550)
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-minecraft text-stone-400">
                  Previsualización del banner de título.
                </div>
              </div>
            </div>
          </div>

          {/* Wallpaper / Fondo del Launcher (1920 x 1080 px) */}
          <div className="space-y-3 pt-3 border-t border-stone-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block font-minecraft font-bold text-xs uppercase tracking-wider text-slate-300">
                Wallpaper / Fondo del Launcher (1920 × 1080 px)
              </label>
              <button
                type="button"
                onClick={() => openAdjuster('wallpaper')}
                className="px-2.5 py-1 text-[11px] font-minecraft bg-amber-950/40 border border-amber-600/70 text-amber-300 hover:bg-amber-900/60 transition flex items-center gap-1.5 cursor-pointer active:translate-y-0.5"
                title="Abrir recortador interactivo a 1920 x 1080 px"
              >
                <Crop className="w-3.5 h-3.5 text-amber-400" />
                <span>Ajustar / Recortar (1920×1080)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div className="space-y-2">
                <MinecraftInput
                  placeholder="https://.../wallpaper.jpg"
                  value={wallpaperUrl}
                  onChange={(e) => {
                    setWallpaperUrl(e.target.value);
                    setWallpaperPreview(null);
                  }}
                  helperText="Si no se configura, el launcher utilizará por defecto el fondo del Nether"
                />

                <label className="minecraft-btn-lava px-3 py-1.5 text-xs font-minecraft cursor-pointer inline-flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingWallpaper ? 'Subiendo...' : 'Subir wallpaper'}</span>
                  <input type="file" accept="image/*" onChange={handleWallpaperUpload} className="hidden" />
                </label>
              </div>

              <div className="space-y-1">
                <div className="h-24 w-full border-2 border-black minecraft-slot overflow-hidden relative bg-black flex items-center justify-center">
                  <img
                    src={wallpaperPreview || resolveImageUrl(wallpaperUrl) || '/assets/nether_bg.jpg'}
                    alt="Wallpaper preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/nether_bg.jpg';
                    }}
                  />
                  {!wallpaperUrl && (
                    <span className="absolute bottom-1 right-2 px-1.5 py-0.5 bg-black/75 text-[9px] font-minecraft text-amber-400">
                      Fondo por defecto: Nether
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-minecraft text-stone-400">
                  Vista previa del wallpaper / fondo del modpack.
                </div>
              </div>
            </div>
          </div>

          {/* Icono Cuadrado del Modpack */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-3 border-t border-stone-800">
            <div className="space-y-2">
              <MinecraftInput
                label="URL del Icono Cuadrado (PNG o WebP)"
                placeholder="https://.../icon.png"
                value={iconUrl}
                onChange={(e) => {
                  setIconUrl(e.target.value);
                  setIconPreview(null);
                }}
              />
              <label className="minecraft-btn-lava px-3 py-1.5 text-xs font-minecraft cursor-pointer inline-flex items-center gap-2">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingIcon ? 'Subiendo...' : 'Subir archivo de icono'}</span>
                <input type="file" accept="image/*" onChange={handleIconUpload} className="hidden" />
              </label>
            </div>

            <div className="flex items-center gap-3">
              <MinecraftSlot size="xl" className="border-stone-700 bg-black overflow-hidden flex items-center justify-center">
                {iconPreview || iconUrl ? (
                  <img
                    src={iconPreview || resolveImageUrl(iconUrl)}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/chaos_icon.png';
                    }}
                  />
                ) : (
                  <Anvil className="w-10 h-10 text-stone-600" />
                )}
              </MinecraftSlot>
              <div className="text-[10px] font-minecraft text-stone-400">
                Icono que se verá en la lista y slots del launcher.
              </div>
            </div>
          </div>
        </div>
        )}

        {/* 3. SERVIDOR DE MINECRAFT */}
        {activeStepTab === 3 && (
          <div className="p-4 minecraft-card space-y-4">
            <h4 className="font-minecraft text-xs font-bold text-amber-400 uppercase tracking-widest border-b border-stone-800 pb-2">
              3. Servidor de Minecraft Integrado
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <MinecraftInput
                  label="IP / Dominio del Servidor *"
                  placeholder="Ej: play.example.com"
                  value={serverIp}
                  onChange={(e) => setServerIp(e.target.value)}
                  required
                />
              </div>
              <div>
                <MinecraftInput
                  label="Puerto"
                  type="number"
                  placeholder="25565"
                  value={serverPort}
                  onChange={(e) => setServerPort(Number(e.target.value))}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. VERSIONES, LOADER Y REQUISITOS DE HARDWARE */}
        {activeStepTab === 4 && (
          <div className="p-4 minecraft-card space-y-4">
            <h4 className="font-minecraft text-xs font-bold text-amber-400 uppercase tracking-widest border-b border-stone-800 pb-2">
              4. Versión, Loader y Memoria RAM
            </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <MinecraftInput
              label="Versión Modpack"
              placeholder="1.0.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              required
            />

            <MinecraftInput
              label="Versión Minecraft *"
              placeholder="1.21.1"
              value={minecraftVersion}
              onChange={(e) => setMinecraftVersion(e.target.value)}
              required
            />

            <MinecraftSelect
              label="Modloader *"
              value={loaderType}
              onChange={(val) => setLoaderType(val as LoaderType)}
              options={LOADER_OPTIONS}
            />

            <MinecraftInput
              label="Versión Loader"
              placeholder="21.1.248"
              value={loaderVersion}
              onChange={(e) => setLoaderVersion(e.target.value)}
            />
          </div>

          {/* Slider de Memoria RAM */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-minecraft">
              <span className="text-slate-300 font-bold">RAM Recomendada:</span>
              <span className="text-amber-400 font-bold px-2 py-0.5 minecraft-slot">
                {(recommendedRam / 1024).toFixed(1)} GB ({recommendedRam} MB)
              </span>
            </div>

            <input
              type="range"
              min={2048}
              max={16384}
              step={512}
              value={recommendedRam}
              onChange={(e) => setRecommendedRam(Number(e.target.value))}
              className="w-full h-2 rounded-none bg-black accent-amber-500 cursor-pointer"
            />

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-minecraft text-stone-400">Presets rápidos:</span>
              {[4096, 6144, 8192, 12288].map((mb) => (
                <button
                  key={mb}
                  type="button"
                  onClick={() => setRecommendedRam(mb)}
                  className={`px-2.5 py-0.5 rounded-none text-[10px] font-minecraft ${
                    recommendedRam === mb ? 'minecraft-btn-green font-bold' : 'minecraft-btn-lava'
                  }`}
                >
                  {mb / 1024} GB
                </button>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* 5. GITHUB & GENERADOR DE MANIFIESTO */}
        {activeStepTab === 5 && (
          <div className="p-4 minecraft-card space-y-4">
            <h4 className="font-minecraft text-xs font-bold text-amber-400 uppercase tracking-widest border-b border-stone-800 pb-2 flex items-center justify-between">
              <span>5. Repositorio de GitHub y Manifiesto modpack.json</span>
              <span className="text-[10px] text-stone-400 font-normal">Sincronización Diferencial</span>
            </h4>

            {/* IMPORTAR DESDE ZIP: crea o actualiza el repositorio a partir de un ZIP de CurseForge */}
            <div className="p-3 bg-amber-950/20 border border-amber-700/50 space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h5 className="font-minecraft text-xs font-bold text-amber-300 flex items-center gap-2">
                    <FileArchive className="w-4 h-4" />
                    IMPORTAR DESDE ZIP
                  </h5>
                  <p className="text-[11px] font-minecraft text-stone-400 mt-1 leading-snug">
                    {isEditing
                      ? 'Sube el ZIP del modpack: se actualizará el repositorio con los archivos que cambiaron y se publicará la versión siguiente.'
                      : 'Sube el ZIP del modpack: se crea el modpack, su repositorio de GitHub y el manifiesto automáticamente.'}
                  </p>
                </div>
                <MinecraftButton type="button" variant="amber" size="md" onClick={() => setIsImportOpen(true)}>
                  <FileArchive className="w-4 h-4" />
                  <span>IMPORTAR ZIP</span>
                </MinecraftButton>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <MinecraftInput
                  label="Repositorio de GitHub Conectado *"
                  placeholder="Ej: owner/repo"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  helperText="Repositorio donde están alojados los mods y archivos del juego"
                />
              </div>
              <div>
                <MinecraftInput
                  label="Rama Principal"
                  placeholder="main"
                  value={githubBranch}
                  onChange={(e) => setGithubBranch(e.target.value)}
                />
              </div>
            </div>

            {/* SECCIÓN DEL GENERADOR INTELIGENTE DE MODPACK.JSON */}
            <div className="mt-4 pt-4 border-t border-stone-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h5 className="font-minecraft text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Generador Inteligente de modpack.json
                  </h5>
                </div>
                <span className="text-[10px] font-minecraft text-stone-400">
                  Hashes SHA-1 reales & descarga/push
                </span>
              </div>

              <p className="text-xs text-stone-300 font-minecraft leading-relaxed">
                Escanea tu repositorio de GitHub para detectar automáticamente todos los mods y archivos del juego, calcula sus firmas SHA-1 de contenido y crea el archivo <code className="text-amber-300 font-bold">modpack.json</code> necesario para que el launcher realice descargas ultrarrápidas y diferenciales.
              </p>

              {/* Selector de Alcance */}
              <div className="space-y-1.5">
                <label className="text-xs font-minecraft text-stone-300 font-bold block">
                  Alcance del Escaneo en el Repositorio:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManifestScope('mods')}
                    className={`p-3 text-left border-2 transition-all cursor-pointer ${
                      manifestScope === 'mods'
                        ? 'border-amber-500 bg-amber-950/40 text-white'
                        : 'border-stone-800 bg-black/40 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="font-minecraft text-xs font-bold flex items-center justify-between">
                      <span>Solo Mods (Carpeta mods/*.jar)</span>
                      {manifestScope === 'mods' && <Check className="w-4 h-4 text-amber-400" />}
                    </div>
                    <p className="text-[11px] font-minecraft text-stone-400 mt-1">
                      Escanea únicamente los mods .jar de la carpeta mods/. Ultra-rápido si solo agregas o quitas mods sin tocar configs.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setManifestScope('all')}
                    className={`p-3 text-left border-2 transition-all cursor-pointer ${
                      manifestScope === 'all'
                        ? 'border-amber-500 bg-amber-950/40 text-white'
                        : 'border-stone-800 bg-black/40 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="font-minecraft text-xs font-bold flex items-center justify-between">
                      <span>Todo el Juego (mods, config, shaders...)</span>
                      {manifestScope === 'all' && <Check className="w-4 h-4 text-amber-400" />}
                    </div>
                    <p className="text-[11px] font-minecraft text-stone-400 mt-1">
                      Empaqueta mods, configs y shaders. El launcher solo descargará lo que haya cambiado y nunca sobreescribirá controles ni opciones personales.
                    </p>
                  </button>
                </div>
              </div>

              {/* Token opcional de GitHub PAT para repos privados o evitar límites */}
              <div className="p-3 bg-black/40 border border-stone-800 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-minecraft text-stone-300 flex items-center gap-1.5">
                    <Key className="w-3 h-3 text-amber-400" />
                    <span>Token de GitHub (PAT Opcional para escanear):</span>
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=ChaosLauncher+Studio"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-minecraft text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
                  >
                    <span>Crear token (1 clic)</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx (Requerido solo si tu repositorio es privado)"
                  value={githubPat}
                  onChange={(e) => {
                    setGithubPat(e.target.value);
                    if (typeof window !== 'undefined') sessionStorage.setItem('chaos_github_pat', e.target.value);
                  }}
                  className="w-full bg-[#120a09] border border-stone-700 px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Botón de Escaneo */}
              <div className="flex items-center gap-3">
                <MinecraftButton
                  type="button"
                  variant="lava"
                  size="md"
                  isLoading={generatingManifest}
                  onClick={handleGenerateManifest}
                  className="flex items-center gap-2 font-bold tracking-wider"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{generatingManifest ? 'ESCANEAR Y CALCULANDO HASHES...' : '⚡ ESCANEAR Y GENERAR MODPACK.JSON'}</span>
                </MinecraftButton>
              </div>

              {generatorError && (
                <div className="p-3 bg-red-950/80 border border-red-700 text-red-300 text-xs font-minecraft flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{generatorError}</span>
                </div>
              )}

              {/* Resumen del manifiesto generado */}
              {generatedManifestResult && (
                <div className="p-4 bg-stone-950 border-2 border-amber-600/70 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="font-minecraft text-xs font-bold text-white uppercase">
                        Manifiesto Generado con Éxito
                      </span>
                    </div>
                    <span className="text-[11px] font-minecraft text-emerald-400 font-bold">
                      Listo para descargar o publicar
                    </span>
                  </div>

                  {/* Resumen de versión y cambios detectados */}
                  <div className="p-2.5 bg-black/60 border border-stone-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-stone-400 text-xs font-minecraft">Versión:</span>
                      {generatedManifestResult.previousVersion && generatedManifestResult.previousVersion !== generatedManifestResult.manifest.version ? (
                        <div className="flex items-center gap-1.5 font-minecraft text-xs">
                          <span className="text-stone-500 line-through">v{generatedManifestResult.previousVersion}</span>
                          <span className="text-amber-400 font-bold">➔</span>
                          <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold">
                            v{generatedManifestResult.manifest.version}
                          </span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-950 border border-amber-600 text-amber-300 font-bold text-xs font-minecraft">
                          v{generatedManifestResult.manifest.version}
                        </span>
                      )}
                    </div>

                    {generatedManifestResult.changesSummary && (
                      <div className="flex items-center gap-2 text-[11px] font-minecraft">
                        {generatedManifestResult.changesSummary.removed > 0 && (
                          <span className="text-red-400 font-bold bg-red-950/60 px-1.5 py-0.5 border border-red-700/60">
                            -{generatedManifestResult.changesSummary.removed} {generatedManifestResult.changesSummary.removed === 1 ? 'mod eliminado' : 'mods eliminados'}
                          </span>
                        )}
                        {generatedManifestResult.changesSummary.added > 0 && (
                          <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 border border-emerald-700/60">
                            +{generatedManifestResult.changesSummary.added} {generatedManifestResult.changesSummary.added === 1 ? 'mod añadido' : 'mods añadidos'}
                          </span>
                        )}
                        {generatedManifestResult.changesSummary.modified > 0 && (
                          <span className="text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 border border-cyan-700/60">
                            ~{generatedManifestResult.changesSummary.modified} actualizados
                          </span>
                        )}
                        {!generatedManifestResult.hasChanges && (
                          <span className="text-stone-400">Sin cambios en la lista de archivos</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-minecraft">
                    <div className="p-2 bg-black/60 border border-stone-800">
                      <span className="text-stone-400 block text-[10px]">Archivos:</span>
                      <span className="text-white font-bold text-sm">
                        {generatedManifestResult.summary.totalFiles} archivos
                      </span>
                    </div>
                    <div className="p-2 bg-black/60 border border-stone-800">
                      <span className="text-stone-400 block text-[10px]">Peso Total:</span>
                      <span className="text-amber-400 font-bold text-sm">
                        {generatedManifestResult.summary.totalSizeMb} MB
                      </span>
                    </div>
                    <div className="p-2 bg-black/60 border border-stone-800">
                      <span className="text-stone-400 block text-[10px]">Hashes en Caché:</span>
                      <span className="text-emerald-400 font-bold text-sm">
                        {generatedManifestResult.summary.cachedFiles} reutilizados
                      </span>
                    </div>
                    <div className="p-2 bg-black/60 border border-stone-800">
                      <span className="text-stone-400 block text-[10px]">Nuevos Hashes:</span>
                      <span className="text-cyan-400 font-bold text-sm">
                        {generatedManifestResult.summary.newFiles} calculados
                      </span>
                    </div>
                  </div>

                  {/* Vista previa desplegable de archivos */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowFileList(!showFileList)}
                      className="text-xs font-minecraft text-amber-400 hover:text-amber-300 underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{showFileList ? 'Ocultar vista previa de archivos' : `Ver vista previa (${generatedManifestResult.manifest.files?.length || 0} archivos)`}</span>
                    </button>

                    {showFileList && (
                      <div className="mt-2 max-h-48 overflow-y-auto bg-black/80 border border-stone-800 p-2 space-y-1 font-mono text-[11px] text-stone-300">
                        {generatedManifestResult.manifest.files?.slice(0, 50).map((file: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between border-b border-stone-900 pb-1">
                            <span className="truncate max-w-[280px] sm:max-w-md text-amber-200">{file.path}</span>
                            <span className="text-stone-500 shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                          </div>
                        ))}
                        {(generatedManifestResult.manifest.files?.length || 0) > 50 && (
                          <div className="text-center text-stone-500 pt-1 text-[10px]">
                            ... y {(generatedManifestResult.manifest.files?.length || 0) - 50} archivos más
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ACCIONES: DESCARGAR Y SUBIR A GITHUB */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-800">
                    <MinecraftButton
                      type="button"
                      variant="gray"
                      size="md"
                      onClick={handleDownloadManifest}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>📥 DESCARGAR modpack.json</span>
                    </MinecraftButton>

                    <MinecraftButton
                      type="button"
                      variant="green"
                      size="md"
                      onClick={() => setIsPushModalOpen(true)}
                      className="flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"
                    >
                      <Github className="w-4 h-4 text-white" />
                      <span>🚀 SUBIR DIRECTAMENTE A GITHUB</span>
                    </MinecraftButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botones de acción y navegación entre pasos */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t-2 border-black">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="minecraft-btn-gray px-3.5 py-2 text-xs font-minecraft flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver</span>
            </button>

            {activeStepTab > 1 && (
              <button
                type="button"
                onClick={() => setActiveStepTab((prev) => prev - 1)}
                className="minecraft-btn-lava px-3 py-2 text-xs font-minecraft flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Paso Anterior</span>
              </button>
            )}

            {activeStepTab < 5 && (
              <button
                type="button"
                onClick={() => setActiveStepTab((prev) => prev + 1)}
                className="minecraft-btn-lava px-3.5 py-2 text-xs font-minecraft flex items-center gap-1.5 cursor-pointer font-bold text-amber-300"
              >
                <span>Paso Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isEditing && (
              <MinecraftButton
                type="button"
                variant="lava"
                size="md"
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2 border-red-700/80 bg-red-950/70 hover:bg-red-900"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>ELIMINAR MODPACK</span>
              </MinecraftButton>
            )}

            <MinecraftButton type="submit" variant="green" size="lg" isLoading={loading}>
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'ACTUALIZAR MODPACK' : 'CREAR MODPACK'}</span>
            </MinecraftButton>
          </div>
        </div>
      </form>

      {/* Modal interactivo de ajuste y recorte de dimensiones exactas */}
      <MinecraftImageAdjuster
        isOpen={adjusterOpen}
        onClose={() => setAdjusterOpen(false)}
        targetWidth={adjusterConfig.width}
        targetHeight={adjusterConfig.height}
        title={adjusterConfig.title}
        category={adjusterConfig.category}
        initialImageUrl={adjusterConfig.currentUrl}
        onSave={(url) => {
          if (adjusterConfig.field === 'title') {
            setTitleImageUrl(url);
            setTitleImagePreview(null);
          } else {
            setWallpaperUrl(url);
            setWallpaperPreview(null);
          }
        }}
      />

      {/* Modal de confirmación de eliminación */}
      {isEditing && (
        <DeleteModpackModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          modpackName={name}
          modpackTag={tag}
        />
      )}

      {/* Importación desde ZIP (crea o actualiza el repositorio) */}
      <ImportZipModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        modpacks={[]}
        lockedTag={isEditing ? initialData?.tag : undefined}
        onFinished={(res) => {
          if (isEditing) {
            setGithubRepo(res.repo);
            router.refresh();
          } else {
            // El modpack ya existe: se continúa en su edición para ajustar nombre, colores y servidor
            router.push(`/dashboard/modpacks/${res.tag}/edit`);
          }
        }}
      />

      {/* Modal interactivo para publicar modpack.json directamente en GitHub */}
      {generatedManifestResult?.manifest && (
        <PushToGithubModal
          isOpen={isPushModalOpen}
          onClose={() => setIsPushModalOpen(false)}
          manifest={generatedManifestResult.manifest}
          repo={githubRepo}
          branch={githubBranch}
          modpackTag={initialData?.tag || tag}
          onSuccess={(res) => {
            if (res.synced && initialData?.tag) {
              router.refresh();
            }
          }}
        />
      )}
    </MinecraftPanel>
  );
};
