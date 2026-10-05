'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, ShieldAlert } from 'lucide-react';
import { useAuth } from '../application/auth.context';
import { MinecraftPanel } from '../../../shared/components/MinecraftPanel';
import { MinecraftInput } from '../../../shared/components/MinecraftInput';
import { MinecraftButton } from '../../../shared/components/MinecraftButton';
import { SkinPicker } from './SkinPicker';

export const RegisterForm: React.FC = () => {
  const router = useRouter();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [skinUrl, setSkinUrl] = useState('https://mc-heads.net/avatar/MHF_Steve/100');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await register({ username, password, skinUrl });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al registrar la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MinecraftPanel
      title="CREAR CUENTA"
      subtitle="Únete a ChaosLauncher como Creador de Modpacks"
      icon={<UserPlus className="w-5 h-5 text-amber-400" />}
      className="w-full max-w-lg mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 minecraft-card border-red-500/70 text-red-300 text-xs font-minecraft flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <MinecraftInput
          label="Nombre de Creador (Gamertag)"
          placeholder="Ej: Steve_Builder"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        {/* Skin picker */}
        <SkinPicker selectedUrl={skinUrl} onSelectSkin={setSkinUrl} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MinecraftInput
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <MinecraftInput
            label="Confirmar"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <div className="pt-3">
          <MinecraftButton
            type="submit"
            variant="green"
            size="lg"
            className="w-full"
            isLoading={loading}
          >
            FORJAR CUENTA
          </MinecraftButton>
        </div>

        <div className="pt-4 border-t-2 border-black flex items-center justify-between text-xs font-minecraft text-stone-400">
          <span>¿Ya tienes cuenta forjada?</span>
          <Link href="/login" className="text-amber-400 hover:text-amber-300 underline">
            Iniciar Sesión
          </Link>
        </div>
      </form>
    </MinecraftPanel>
  );
};
