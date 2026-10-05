'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, ShieldAlert } from 'lucide-react';
import { useAuth } from '../application/auth.context';
import { MinecraftPanel } from '../../../shared/components/MinecraftPanel';
import { MinecraftInput } from '../../../shared/components/MinecraftInput';
import { MinecraftButton } from '../../../shared/components/MinecraftButton';

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ username, password });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MinecraftPanel
      title="INICIAR SESIÓN"
      subtitle="Accede al Studio de Creador de ChaosLauncher"
      icon={<LogIn className="w-5 h-5 text-amber-400" />}
      className="w-full max-w-md mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 minecraft-card border-red-500/70 text-red-300 text-xs font-minecraft flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <MinecraftInput
          label="Usuario / Gamertag"
          placeholder="Ej: admin o Steve"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <MinecraftInput
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="pt-2">
          <MinecraftButton
            type="submit"
            variant="green"
            size="lg"
            className="w-full"
            isLoading={loading}
          >
            ENTRAR AL SERVIDOR
          </MinecraftButton>
        </div>
      </form>
    </MinecraftPanel>
  );
};
