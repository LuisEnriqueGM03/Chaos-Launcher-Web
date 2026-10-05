'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Sparkles, RefreshCw } from 'lucide-react';
import { Modpack } from '../../../core/types/modpack.types';
import { ModpackCard } from './ModpackCard';
import { MinecraftInput } from '../../../shared/components/MinecraftInput';
import { MinecraftButton } from '../../../shared/components/MinecraftButton';

interface ModpackListProps {
  modpacks: Modpack[];
  loading?: boolean;
  onRefresh?: () => void;
}

export const ModpackList: React.FC<ModpackListProps> = ({
  modpacks,
  loading = false,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoader, setSelectedLoader] = useState<string>('ALL');

  const filtered = modpacks.filter((pack) => {
    const matchesSearch =
      pack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pack.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pack.serverIp.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLoader =
      selectedLoader === 'ALL' || pack.loaderType.toUpperCase() === selectedLoader.toUpperCase();

    return matchesSearch && matchesLoader;
  });

  return (
    <div className="space-y-6">
      {/* Controls Bar: Search, Filters & Create Button */}
      <div className="p-4 minecraft-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full md:w-auto flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <MinecraftInput
              placeholder="Buscar por nombre, tag o IP de servidor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-3.5 pointer-events-none" />
          </div>

          {/* Loader filter */}
          <select
            value={selectedLoader}
            onChange={(e) => setSelectedLoader(e.target.value)}
            className="px-3 py-2.5 minecraft-input text-xs text-white font-minecraft rounded-none"
          >
            <option value="ALL">Todos los Loaders</option>
            <option value="NEOFORGE">NeoForge</option>
            <option value="FABRIC">Fabric</option>
            <option value="FORGE">Forge</option>
            <option value="VANILLA">Vanilla</option>
          </select>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="minecraft-btn-lava p-2.5 text-stone-300 hover:text-white transition"
              title="Refrescar lista"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}

          <Link href="/dashboard/modpacks/new">
            <MinecraftButton variant="green" size="md">
              <Plus className="w-4 h-4" />
              <span>FORJAR MODPACK</span>
            </MinecraftButton>
          </Link>
        </div>
      </div>

      {/* Grid of Modpacks */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 minecraft-card animate-pulse flex items-center justify-center">
              <span className="text-xs font-minecraft text-stone-500">Cargando modpack...</span>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 minecraft-panel text-center space-y-4">
          <Sparkles className="w-10 h-10 text-amber-400 mx-auto animate-bounce" />
          <h3 className="font-minecraft text-lg font-bold text-white minecraft-text-shadow-lava">
            NO SE ENCONTRARON MODPACKS
          </h3>
          <p className="text-xs text-stone-400 font-minecraft max-w-md mx-auto">
            {searchTerm
              ? 'No hay modpacks que coincidan con tus criterios de búsqueda.'
              : 'Aún no se ha forjado ningún modpack en este servidor.'}
          </p>
          <div className="pt-2">
            <Link href="/dashboard/modpacks/new">
              <MinecraftButton variant="green" size="lg">
                FORJAR EL PRIMER MODPACK
              </MinecraftButton>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((modpack) => (
            <ModpackCard key={modpack.tag} modpack={modpack} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
};
