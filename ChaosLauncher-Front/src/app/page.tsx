'use client';

import React from 'react';
import Link from 'next/link';
import {
  Download,
  Zap,
  Sparkles,
  Terminal,
  CheckCircle2,
  Cpu,
  HardDrive,
  Monitor,
  Anvil,
  Layers,
} from 'lucide-react';
import { useModpacks } from '../features/modpacks/application/use-modpacks';
import { useLatestLauncherRelease } from '../shared/hooks/useLatestLauncherRelease';
import { WingetInstall } from '../shared/components/WingetInstall';
import { MinecraftButton } from '../shared/components/MinecraftButton';
import { MinecraftCard } from '../shared/components/MinecraftCard';
import { ServerStatusBadge } from '../features/server-status/presentation/ServerStatusBadge';
import { resolveImageUrl } from '../shared/utils/image';

export default function HomePage() {
  const { modpacks, loading } = useModpacks(false);
  const { release, loading: releaseLoading } = useLatestLauncherRelease();

  return (
    <div className="flex-1 flex flex-col bg-[#0a0606] text-white">
      {/* ========================================================
          1. HERO SECTION (Exclusivo para Descarga del Launcher)
          ======================================================== */}
      <section className="relative overflow-hidden border-b-2 border-black min-h-[580px] flex items-center justify-center">
        {/* Background Image with Dark Vignette */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 scale-105 transform pointer-events-none"
          style={{ backgroundImage: `url('/assets/nether_bg.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-[#0a0606] pointer-events-none" />

        {/* Ambient Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 text-center flex flex-col items-center">
          {/* Big Official Chaos Icon Centered */}
          <div className="mb-6 relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 minecraft-slot p-2 bg-[#120707] border-2 border-stone-700/80 flex items-center justify-center shadow-2xl relative">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
              <img
                src="/assets/chaos_icon.png"
                alt="Chaos Launcher"
                className="w-full h-full object-contain filter drop-shadow-[0_4px_16px_rgba(255,80,0,0.7)] group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/icon.png';
                }}
              />
            </div>
          </div>

          {/* Main Title */}
          <h1 className="font-minecraft text-4xl sm:text-6xl md:text-7xl font-bold tracking-wider text-white minecraft-text-shadow-lava leading-tight mb-8">
            CHAOS LAUNCHER
          </h1>

          {/* Download CTA Button (Dynamic GitHub Release) */}
          <div className="flex flex-col items-center gap-3">
            <a
              href={release.downloadUrl}
              download={release.fileName}
              className="inline-block"
            >
              <MinecraftButton
                variant="green"
                size="lg"
                className="px-10 py-5 text-xl tracking-wider shadow-2xl flex items-center gap-3 hover:scale-105 transition-transform"
              >
                <Download className="w-7 h-7 text-white animate-bounce" />
                <span>DESCARGAR LAUNCHER</span>
              </MinecraftButton>
            </a>

            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-minecraft text-stone-400 mt-2">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Windows 10 / 11 (64-bit)
              </span>
              <span>•</span>
              <span className="text-amber-300 font-bold">
                Versión {release.version} {release.isFallback ? 'Oficial' : 'Estable'}
              </span>
              <span>•</span>
              <span>{release.fileSizeMb}</span>
              <span>•</span>
              <span className="text-emerald-400">Gratuito & Seguro</span>
            </div>

            <WingetInstall />
          </div>
        </div>
      </section>

      {/* ========================================================
          2. CARACTERÍSTICAS DESTACADAS
          ======================================================== */}
      <section className="py-16 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <span className="text-amber-400 font-minecraft text-xs uppercase tracking-widest">
            ARQUITECTURA DE ALTO RENDIMIENTO
          </span>
          <h2 className="font-minecraft text-2xl sm:text-3xl font-bold text-white minecraft-text-shadow-lava mt-1">
            ¿POR QUÉ ELEGIR CHAOS LAUNCHER?
          </h2>
          <p className="text-stone-400 text-xs sm:text-sm font-minecraft max-w-xl mx-auto mt-2">
            Diseñado desde cero para resolver los problemas de lentitud, descargas pesadas e incompatibilidades de mods.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MinecraftCard className="p-6 flex flex-col justify-between border-t-4 border-t-amber-500">
            <div>
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="font-minecraft font-bold text-sm text-white minecraft-text-shadow-lava mb-2">
                Sincronización Diferencial
              </h3>
              <p className="text-stone-300 text-xs font-sans leading-relaxed">
                Solo descarga lo que cambia entre versiones mediante hashes SHA-1. Ahorra hasta un 95% de tiempo y ancho de banda en cada actualización.
              </p>
            </div>
          </MinecraftCard>

          <MinecraftCard className="p-6 flex flex-col justify-between border-t-4 border-t-emerald-500">
            <div>
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-minecraft font-bold text-sm text-white minecraft-text-shadow mb-2">
                Shaders y FPS Máximos
              </h3>
              <p className="text-stone-300 text-xs font-sans leading-relaxed">
                Afinado de fábrica con Sodium/Embeddium e Iris/Oculus. Disfruta de iluminación realista a 144+ FPS estables sin caídas de rendimiento.
              </p>
            </div>
          </MinecraftCard>

          <MinecraftCard className="p-6 flex flex-col justify-between border-t-4 border-t-blue-500">
            <div>
              <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-4">
                <Terminal className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-minecraft font-bold text-sm text-white minecraft-text-shadow mb-2">
                Java 100% Automático
              </h3>
              <p className="text-stone-300 text-xs font-sans leading-relaxed">
                Descarga e instala en sandboxes aislados la versión requerida de Java (8, 17 o 21). Olvídate de modificar variables del sistema.
              </p>
            </div>
          </MinecraftCard>

        </div>
      </section>

      {/* ========================================================
          3. PASOS DE INSTALACIÓN
          ======================================================== */}
      <section className="py-14 px-6 bg-[#0f0808] border-y-2 border-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-emerald-400 font-minecraft text-xs uppercase tracking-widest">
              INSTALACIÓN SENCILLA
            </span>
            <h2 className="font-minecraft text-2xl sm:text-3xl font-bold text-white minecraft-text-shadow mt-1">
              ¿CÓMO EMPEZAR A JUGAR?
            </h2>
            <p className="text-stone-400 text-xs sm:text-sm font-minecraft max-w-xl mx-auto mt-2">
              Sigue estos 3 simples pasos para conectarte al servidor y forjar tu aventura.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="minecraft-card p-6 relative">
              <div className="font-minecraft text-3xl font-bold text-amber-500/50 mb-2">01</div>
              <h3 className="font-minecraft text-base text-white font-bold mb-2 minecraft-text-shadow-lava">
                Descarga el Instalador
              </h3>
              <p className="text-stone-300 text-xs font-sans leading-relaxed">
                Obtén el archivo oficial de instalación haciendo clic en el botón superior y ejecútalo en tu equipo Windows.
              </p>
            </div>

            <div className="minecraft-card p-6 relative">
              <div className="font-minecraft text-3xl font-bold text-amber-500/50 mb-2">02</div>
              <h3 className="font-minecraft text-base text-white font-bold mb-2 minecraft-text-shadow-lava">
                Inicia Sesión
              </h3>
              <p className="text-stone-300 text-xs font-sans leading-relaxed">
                Autentícate con tu cuenta de Microsoft Minecraft o crea tu usuario en la plataforma oficial de Chaos Launcher.
              </p>
            </div>

            <div className="minecraft-card p-6 relative">
              <div className="font-minecraft text-3xl font-bold text-amber-500/50 mb-2">03</div>
              <h3 className="font-minecraft text-base text-white font-bold mb-2 minecraft-text-shadow-lava">
                Elige Modpack y Juega
              </h3>
              <p className="text-stone-300 text-xs font-sans leading-relaxed">
                Selecciona tu modpack preferido en la lista lateral, pulsa el botón JUGAR y la sincronización preparará todo de forma automática.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. REQUISITOS DEL SISTEMA
          ======================================================== */}
      <section className="py-14 px-6 max-w-5xl mx-auto w-full">
        <div className="text-center mb-10">
          <span className="text-amber-400 font-minecraft text-xs uppercase tracking-widest">
            COMPATIBILIDAD DE HARDWARE
          </span>
          <h2 className="font-minecraft text-2xl sm:text-3xl font-bold text-white minecraft-text-shadow-lava mt-1">
            REQUISITOS DEL SISTEMA
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MinecraftCard className="p-6 border-stone-800">
            <h3 className="font-minecraft font-bold text-base text-stone-200 mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
              <Monitor className="w-5 h-5 text-stone-400" />
              <span>REQUISITOS MÍNIMOS</span>
            </h3>
            <ul className="space-y-3 font-minecraft text-xs text-stone-300">
              <li className="flex justify-between py-1 border-b border-stone-800/40">
                <span className="text-stone-400">Sistema Operativo:</span>
                <span className="font-bold text-white">Windows 10 (64-bit)</span>
              </li>
              <li className="flex justify-between py-1 border-b border-stone-800/40">
                <span className="text-stone-400">Procesador:</span>
                <span className="font-bold text-white">Intel Core i3-3210 / AMD A8-7600</span>
              </li>
              <li className="flex justify-between py-1 border-b border-stone-800/40">
                <span className="text-stone-400">Memoria RAM:</span>
                <span className="font-bold text-amber-400">4 GB</span>
              </li>
              <li className="flex justify-between py-1 border-b border-stone-800/40">
                <span className="text-stone-400">Tarjeta Gráfica:</span>
                <span className="font-bold text-white">Intel HD 4000 / AMD Radeon R5</span>
              </li>
              <li className="flex justify-between py-1">
                <span className="text-stone-400">Almacenamiento:</span>
                <span className="font-bold text-white">4 GB libres en disco</span>
              </li>
            </ul>
          </MinecraftCard>

          <MinecraftCard className="p-6 border-amber-600/70">
            <h3 className="font-minecraft font-bold text-base text-amber-300 mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
              <Cpu className="w-5 h-5 text-amber-400" />
              <span className="minecraft-text-shadow-amber">REQUISITOS RECOMENDADOS</span>
            </h3>
            <ul className="space-y-3 font-minecraft text-xs text-stone-300">
              <li className="flex justify-between py-1 border-b border-stone-800/40">
                <span className="text-stone-400">Sistema Operativo:</span>
                <span className="font-bold text-emerald-400">Windows 10 / 11 (64-bit)</span>
              </li>
              <li className="flex justify-between py-1 border-b border-stone-800/40">
                <span className="text-stone-400">Procesador:</span>
                <span className="font-bold text-white">Intel Core i5-10400 / Ryzen 5 3600+</span>
              </li>
              <li className="flex justify-between py-1 border-b border-stone-800/40">
                <span className="text-stone-400">Memoria RAM:</span>
                <span className="font-bold text-emerald-400">8 GB - 16 GB DDR4</span>
              </li>
              <li className="flex justify-between py-1 border-b border-stone-800/40">
                <span className="text-stone-400">Tarjeta Gráfica:</span>
                <span className="font-bold text-white">NVIDIA GTX 1660 / AMD RX 580+</span>
              </li>
              <li className="flex justify-between py-1">
                <span className="text-stone-400">Almacenamiento:</span>
                <span className="font-bold text-white">15 GB libres en SSD</span>
              </li>
            </ul>
          </MinecraftCard>
        </div>
      </section>

      {/* ========================================================
          5. CATÁLOGO DE MODPACKS AL FINAL
          (Estilo panorámico con fondo Nether/Wallpaper y logo centrado)
          ======================================================== */}
      <section className="py-16 px-6 bg-[#0c0707] border-t-2 border-black flex-1">
        <div className="max-w-6xl mx-auto">
          {/* Ícono de Chaos Launcher Centrado en la parte superior del catálogo */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 minecraft-slot p-2 bg-[#140808] border-2 border-stone-700/80 flex items-center justify-center shadow-2xl relative">
              <div className="absolute inset-0 bg-amber-500/15 rounded-full blur-xl pointer-events-none" />
              <img
                src="/assets/chaos_icon.png"
                alt="Chaos Icon"
                className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(255,80,0,0.6)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/icon.png';
                }}
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-center gap-1 mb-10">
            <div className="flex items-center gap-2 text-amber-400 font-minecraft text-xs uppercase tracking-widest">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>UNIVERSOS DISPONIBLES</span>
            </div>
            <h2 className="font-minecraft text-2xl sm:text-4xl font-bold text-white minecraft-text-shadow-lava mt-1">
              CATÁLOGO DE MODPACKS
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 font-minecraft mt-1 max-w-xl">
              Explora los paquetes de mods oficiales optimizados y disponibles para jugar en Chaos Launcher.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-60 bg-stone-900 border-2 border-stone-800 animate-pulse flex items-center justify-center"
                >
                  <span className="font-minecraft text-stone-500 text-xs">CARGANDO UNIVERSOS...</span>
                </div>
              ))}
            </div>
          ) : modpacks.length === 0 ? (
            <div className="minecraft-card p-12 text-center text-stone-400 font-minecraft">
              <Anvil className="w-12 h-12 mx-auto mb-3 text-stone-500" />
              <p className="text-sm">No hay modpacks públicos forjados en este momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modpacks.map((pack) => {
                const wallpaperSrc = pack.wallpaperUrl
                  ? resolveImageUrl(pack.wallpaperUrl)
                  : '/assets/nether_bg.jpg';
                const iconSrc = pack.iconUrl
                  ? resolveImageUrl(pack.iconUrl)
                  : '/assets/chaos_icon.png';

                return (
                  <div
                    key={pack.id}
                    className="group relative block h-60 sm:h-64 overflow-hidden border-2 border-stone-800 shadow-xl select-none cursor-default"
                  >
                    {/* Background Wallpaper */}
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url('${wallpaperSrc}')` }}
                    />

                    {/* Dark Tint Overlay */}
                    <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-all duration-300" />

                    {/* Server Online Badge in Top Right */}
                    <div className="absolute top-3 right-3 z-20">
                      <ServerStatusBadge tag={pack.tag} />
                    </div>

                    {/* Centered Modpack Square Icon Container */}
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#180e0c]/85 border-2 border-black/90 shadow-2xl flex items-center justify-center p-3 group-hover:scale-110 transition-transform duration-300">
                        <img
                          src={iconSrc}
                          alt={pack.name}
                          className="w-full h-full object-contain filter drop-shadow"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/chaos_icon.png';
                          }}
                        />
                      </div>
                    </div>

                    {/* Bottom Metadata Bar */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent pt-8 pb-3.5 px-4 flex flex-col items-center justify-center z-20">
                      <h3 className="font-minecraft text-white text-base sm:text-lg font-bold tracking-wide minecraft-text-shadow-lava text-center">
                        {pack.name}
                      </h3>
                      <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-minecraft text-stone-300 mt-1">
                        <span className="text-amber-400 uppercase font-bold">{pack.loaderType}</span>
                        <span>•</span>
                        <span>MC {pack.minecraftVersion}</span>
                        <span>•</span>
                        <span className="text-stone-400">#{pack.tag}</span>
                        <span>•</span>
                        <span className="text-emerald-400">v{pack.version}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
