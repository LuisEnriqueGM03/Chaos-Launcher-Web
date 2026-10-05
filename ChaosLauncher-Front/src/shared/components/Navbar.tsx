'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, UserPlus, Shield, Anvil, Layers } from 'lucide-react';
import { useAuth } from '../../features/auth/application/auth.context';
import { MinecraftSlot } from './MinecraftSlot';
import { MinecraftButton } from './MinecraftButton';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout, isSuperadmin } = useAuth();

  const navLinks = [
    { name: 'INICIO', href: '/', icon: <Layers className="w-4 h-4" /> },
  ];

  if (user) {
    navLinks.push({ name: 'STUDIO MODPACKS', href: '/dashboard', icon: <Anvil className="w-4 h-4" /> });
  }

  if (isSuperadmin) {
    navLinks.push({
      name: 'ADMINISTRACIÓN',
      href: '/admin/users',
      icon: <Shield className="w-4 h-4 text-red-400" />,
    });
  }

  return (
    <header className="relative z-30 bg-[#110808] border-b-2 border-black px-6 py-2.5 flex items-center justify-between select-none shadow-xl">
      {/* Brand & Logo */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 minecraft-slot flex items-center justify-center p-0.5">
            <img
              src="/assets/chaos_icon.png"
              alt="ChaosLauncher"
              className="w-full h-full object-contain filter drop-shadow"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://mc-heads.net/avatar/MHF_Steve/100';
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-minecraft font-bold text-sm tracking-wider text-white minecraft-text-shadow-lava leading-none group-hover:text-amber-400 transition">
              CHAOS LAUNCHER
            </span>
            <span className="font-minecraft text-[9px] text-amber-500 tracking-widest uppercase mt-0.5">
              WEB STUDIO & PACKS
            </span>
          </div>
        </Link>

        {/* Navigation Tabs (Minecraft button style) */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <button
                  className={`px-3.5 py-1.5 text-xs font-minecraft tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'minecraft-btn-lava border-b-2 border-b-amber-400 font-bold text-white'
                      : 'text-stone-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </button>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: Auth Profile / Login */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 minecraft-card px-3 py-1.5">
              <MinecraftSlot size="sm">
                <img
                  src={user.skinUrl || 'https://mc-heads.net/avatar/Steve/100'}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              </MinecraftSlot>

              <div className="text-left">
                <div className="text-xs font-bold text-white font-minecraft minecraft-text-shadow-lava leading-none">
                  {user.username}
                </div>
                <div className="text-[9px] text-emerald-400 font-minecraft mt-0.5">
                  {user.role === 'SUPERADMIN' ? '👑 Superadmin' : '⚒️ Creador'}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="minecraft-btn-lava p-2 text-red-300 hover:text-red-200 transition"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <MinecraftButton variant="lava" size="sm">
                INICIAR SESIÓN
              </MinecraftButton>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
