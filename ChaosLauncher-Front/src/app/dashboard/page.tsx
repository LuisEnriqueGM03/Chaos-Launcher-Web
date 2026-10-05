'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Anvil, Sparkles, RefreshCw, Cpu, Server, CheckCircle2, FileArchive } from 'lucide-react';
import { useAuth } from '../../features/auth/application/auth.context';
import { useModpacks } from '../../features/modpacks/application/use-modpacks';
import { ModpackList } from '../../features/modpacks/presentation/ModpackList';
import { ImportZipModal } from '../../features/modpacks/presentation/ImportZipModal';
import { MinecraftButton } from '../../shared/components/MinecraftButton';
import { MinecraftCard } from '../../shared/components/MinecraftCard';

export default function DashboardPage() {
  const { user, isSuperadmin } = useAuth();
  const { modpacks, loading, refetch } = useModpacks(true);

  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Filter modpacks according to tab
  const displayedModpacks =
    activeTab === 'my' && user && !isSuperadmin
      ? modpacks.filter((p) => p.authorId === user.id)
      : modpacks;

  return (
    <div className="max-w-7xl w-full mx-auto px-6 py-8 space-y-8 flex-1">
      {/* Studio Header */}
      <div className="p-6 minecraft-panel flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 minecraft-slot">
            <Anvil className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <span className="text-[10px] font-minecraft font-bold tracking-widest text-amber-400 uppercase">
              CHAOS LAUNCHER STUDIO
            </span>
            <h1 className="font-minecraft text-2xl sm:text-3xl font-bold text-white minecraft-text-shadow-lava tracking-wide">
              PANEL DE CONTROL DE MODPACKS
            </h1>
            <p className="text-xs text-stone-400 font-minecraft mt-0.5">
              Administra versiones, mods opcionales y conectividad con servidores
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <MinecraftButton variant="amber" size="lg" onClick={() => setIsImportOpen(true)}>
            <FileArchive className="w-5 h-5" />
            <span>IMPORTAR ZIP</span>
          </MinecraftButton>
          <Link href="/dashboard/modpacks/new">
            <MinecraftButton variant="green" size="lg">
              <Plus className="w-5 h-5" />
              <span>FORJAR NUEVO MODPACK</span>
            </MinecraftButton>
          </Link>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MinecraftCard className="flex items-center gap-4">
          <div className="p-3 minecraft-slot text-amber-400">
            <Anvil className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-minecraft text-stone-400">
              Modpacks Registrados
            </div>
            <div className="text-2xl font-minecraft font-bold text-white minecraft-text-shadow">
              {modpacks.length}
            </div>
          </div>
        </MinecraftCard>

        <MinecraftCard className="flex items-center gap-4">
          <div className="p-3 minecraft-slot text-emerald-400">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-minecraft text-stone-400">
              Servidores Activos
            </div>
            <div className="text-2xl font-minecraft font-bold text-emerald-400 minecraft-text-shadow">
              {modpacks.filter((p) => p.isActive).length}
            </div>
          </div>
        </MinecraftCard>

        <MinecraftCard className="flex items-center gap-4">
          <div className="p-3 minecraft-slot text-orange-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-minecraft text-stone-400">
              Sincronización Diferencial
            </div>
            <div className="text-sm font-minecraft font-bold text-orange-400 flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Habilitada (SHA-1)</span>
            </div>
          </div>
        </MinecraftCard>
      </div>

      {/* Tab Filter (Mis Modpacks vs Todos) */}
      {user && (
        <div className="flex items-center gap-2 border-b-2 border-black pb-2">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 text-xs font-minecraft tracking-wider transition ${
              activeTab === 'my'
                ? 'minecraft-btn-lava border-b-2 border-b-amber-400 text-white font-bold'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Mis Modpacks ({modpacks.filter((p) => p.authorId === user.id).length})
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-xs font-minecraft tracking-wider transition ${
              activeTab === 'all'
                ? 'minecraft-btn-lava border-b-2 border-b-amber-400 text-white font-bold'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Todos los Modpacks ({modpacks.length})
          </button>
        </div>
      )}

      {/* Modpack List */}
      <ModpackList
        modpacks={displayedModpacks}
        loading={loading}
        onRefresh={refetch}
      />

      <ImportZipModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        modpacks={displayedModpacks}
        onDone={refetch}
      />
    </div>
  );
}
