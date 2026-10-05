'use client';

import React, { useState } from 'react';
import { UserPlus, X, ShieldAlert } from 'lucide-react';
import { usersApi } from '../infrastructure/users.api';
import { MinecraftPanel } from '../../../shared/components/MinecraftPanel';
import { MinecraftInput } from '../../../shared/components/MinecraftInput';
import { MinecraftButton } from '../../../shared/components/MinecraftButton';
import { MinecraftSelect, SelectOption } from '../../../shared/components/MinecraftSelect';
import { SkinPicker } from '../../auth/presentation/SkinPicker';

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'CREATOR', label: 'CREATOR', sublabel: 'Creador de Packs' },
  { value: 'SUPERADMIN', label: 'SUPERADMIN', sublabel: 'Acceso Total al Sistema' },
];

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CREATOR' | 'SUPERADMIN'>('CREATOR');
  const [skinUrl, setSkinUrl] = useState('https://mc-heads.net/avatar/MHF_Steve/100');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await usersApi.create({
        username,
        password,
        skinUrl,
        role,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 minecraft-slot text-stone-400 hover:text-white z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <MinecraftPanel
          title="NUEVO CREADOR / USUARIO"
          subtitle="Panel de Superadmin: Alta directa de cuenta"
          icon={<UserPlus className="w-5 h-5 text-amber-400" />}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 minecraft-card border-red-500/70 text-red-300 text-xs font-minecraft flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <MinecraftInput
                label="Gamertag / Usuario *"
                placeholder="Steve_Dev"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

              <MinecraftSelect
                label="Rol Asignado *"
                value={role}
                onChange={(val) => setRole(val as 'CREATOR' | 'SUPERADMIN')}
                options={ROLE_OPTIONS}
              />
            </div>

            <MinecraftInput
              label="Contraseña Temporal"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <SkinPicker selectedUrl={skinUrl} onSelectSkin={setSkinUrl} />

            <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-black">
              <button
                type="button"
                onClick={onClose}
                className="minecraft-btn-gray px-4 py-2 text-xs font-minecraft"
              >
                Cancelar
              </button>

              <MinecraftButton type="submit" variant="green" size="md" isLoading={loading}>
                FORJAR USUARIO
              </MinecraftButton>
            </div>
          </form>
        </MinecraftPanel>
      </div>
    </div>
  );
};
