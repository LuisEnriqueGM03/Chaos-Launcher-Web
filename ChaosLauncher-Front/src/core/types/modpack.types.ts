import { User } from './user.types';

export type LoaderType = 'NEOFORGE' | 'FABRIC' | 'FORGE' | 'VANILLA';

export interface OptionalMod {
  id?: string;
  modId: string;
  name: string;
  file: string;
  description: string;
  defaultEnabled: boolean;
}

export interface SourceModItem {
  file: string;
  name: string;
  modId: string;
  size: number;
  isOptional: boolean;
  description: string;
  defaultEnabled: boolean;
}

export interface SourceModsResponse {
  tag?: string;
  name?: string;
  modpackTag?: string;
  modpackName?: string;
  totalMods?: number;
  totalSourceMods?: number;
  configuredCount?: number;
  sourceUrl: string;
  mods: SourceModItem[];
}

export interface ModpackVersion {
  id?: string;
  version: string;
  changelog: string[];
  fileSizeMb?: number;
  sha1?: string;
  isCurrent?: boolean;
  createdAt?: string;
}

export interface Modpack {
  id?: string;
  name: string;
  tag: string;
  description?: string;
  accentColor: string;
  iconUrl?: string;
  wallpaperUrl?: string;
  titleImageUrl?: string;
  titleDisplayMode?: 'IMAGE_ONLY' | 'TEXT_ONLY' | 'BOTH' | 'ICON_ONLY';
  titleText?: string;
  serverIp: string;
  serverPort: number;
  version: string;
  minecraftVersion: string;
  loaderType: LoaderType;
  loaderVersion?: string;
  recommendedRam: number;
  minRam?: number;
  githubRepo?: string;
  githubBranch?: string;
  downloadUrl?: string;
  forceUpdate?: boolean;
  order?: number;
  isActive?: boolean;
  hasOptionalMods?: boolean;
  hasRules?: boolean;
  rulesContent?: string;
  hasDiscord?: boolean;
  discordUrl?: string;
  hasChangelog?: boolean;
  changelog?: string[];
  authorId?: string;
  author?: User;
  versions?: ModpackVersion[];
  optionalMods?: OptionalMod[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ServerStatusData {
  online: boolean;
  players: number;
  max: number;
  motd?: string;
  ip: string;
  port: number;
  cached: boolean;
  checkedAt: string;
}
