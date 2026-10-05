'use client';

import React from 'react';
import Link from 'next/link';
import { Anvil, Cpu, Sparkles } from 'lucide-react';
import { Modpack } from '../../../core/types/modpack.types';
import { useAuth } from '../../auth/application/auth.context';
import { MinecraftCard } from '../../../shared/components/MinecraftCard';
import { MinecraftSlot } from '../../../shared/components/MinecraftSlot';
import { MinecraftButton } from '../../../shared/components/MinecraftButton';
import { ServerStatusBadge } from '../../server-status/presentation/ServerStatusBadge';
import { resolveImageUrl } from '../../../shared/utils/image';

interface ModpackCardProps {
  modpack: Modpack;
  onRefresh?: () => void;
}

export const ModpackCard: React.FC<ModpackCardProps> = ({ modpack }) => {
  const { user, isSuperadmin } = useAuth();

  const canEdit = isSuperadmin || (user && modpack.authorId === user.id);
  const ramGb = (modpack.recommendedRam / 1024).toFixed(0);

  return (
    <MinecraftCard
      className="flex flex-col justify-between h-full group hover:border-stone-500/80 transition-all duration-200 relative overflow-hidden"
      style={{
        borderTopColor: modpack.accentColor || '#ff4500',
        borderTopWidth: '4px',
      }}
    >
      {/* Background ambient gradient with modpack accent color */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: modpack.accentColor || '#ff4500' }}
      />

      <div className="space-y-4 relative z-10">
        {/* Header: Icon + Name + Tag + Status */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <MinecraftSlot size="lg" className="border-stone-700/60 bg-[#0d0707] shrink-0">
              {modpack.iconUrl ? (
                <img
                  src={resolveImageUrl(modpack.iconUrl)}
                  alt={modpack.name}
                  className="w-full h-full object-contain filter drop-shadow"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/chaos_icon.png';
                  }}
                />
              ) : (
                <Anvil className="w-8 h-8 text-amber-400" />
              )}
            </MinecraftSlot>

            <div className="min-w-0 flex-1">
              <h3
                className="font-minecraft font-bold text-base text-white minecraft-text-shadow-lava tracking-wide truncate"
                title={modpack.name}
              >
                {modpack.name}
              </h3>
              <div className="text-[11px] font-minecraft text-stone-400 mt-0.5 flex items-center gap-2 truncate">
                <span className="text-amber-400">#{modpack.tag}</span>
                <span>•</span>
                <span>v{modpack.version}</span>
              </div>
            </div>
          </div>

          <ServerStatusBadge tag={modpack.tag} />
        </div>

        {/* Description */}
        {modpack.description && (
          <p className="text-xs text-stone-300 font-sans line-clamp-2 leading-relaxed">
            {modpack.description}
          </p>
        )}

        {/* Specs Badges (Minecraft, Loader, RAM, Server) */}
        <div className="grid grid-cols-2 gap-2 text-xs font-minecraft">
          <div className="p-2 minecraft-slot flex items-center gap-2 text-stone-300">
            <span className="text-emerald-400 font-bold">MC:</span>
            <span>{modpack.minecraftVersion}</span>
          </div>

          <div className="p-2 minecraft-slot flex items-center gap-2 text-stone-300 truncate">
            <span className="text-orange-400 font-bold uppercase">{modpack.loaderType}</span>
            <span className="text-[10px] text-stone-400 truncate">{modpack.loaderVersion || ''}</span>
          </div>

          <div className="p-2 minecraft-slot flex items-center gap-2 text-stone-300">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>{ramGb} GB RAM</span>
          </div>

          <div className="p-2 minecraft-slot flex items-center gap-2 text-stone-300 truncate" title={modpack.serverIp}>
            <span className="text-red-400 font-bold">IP:</span>
            <span className="truncate text-[11px] font-mono">{modpack.serverIp}</span>
          </div>
        </div>

        {/* Creator / Author info */}
        {modpack.author && (
          <div className="flex items-center justify-between text-xs font-minecraft text-stone-400 pt-1 border-t border-stone-800/60">
            <span className="text-[10px] uppercase text-stone-500">Forjado por:</span>
            <div className="flex items-center gap-1.5">
              <img
                src={modpack.author.skinUrl || 'https://mc-heads.net/avatar/Steve/100'}
                alt={modpack.author.username}
                className="w-4 h-4 object-cover border border-stone-800"
              />
              <span className="text-white text-xs font-bold">{modpack.author.username}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer: En el catálogo y dashboard solo botón EXPLORAR */}
      <div className="pt-3.5 mt-3 border-t-2 border-black flex items-center relative z-10">
        <Link href={`/modpacks/${modpack.tag}`} className="w-full">
          <MinecraftButton variant="green" size="md" className="w-full flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>EXPLORAR MODPACK</span>
          </MinecraftButton>
        </Link>
      </div>
    </MinecraftCard>
  );
};
