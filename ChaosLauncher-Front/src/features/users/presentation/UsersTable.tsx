'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../../core/types/user.types';
import { usersApi } from '../infrastructure/users.api';
import { MinecraftCard } from '../../../shared/components/MinecraftCard';
import { MinecraftSlot } from '../../../shared/components/MinecraftSlot';
import { MinecraftButton } from '../../../shared/components/MinecraftButton';
import { CreateUserModal } from './CreateUserModal';
import { UserPlus, Trash2, Shield, RefreshCw } from 'lucide-react';

export const UsersTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id: string, username: string) => {
    if (confirm(`¿Estás seguro de desterrar al usuario "${username}"?`)) {
      try {
        await usersApi.delete(id);
        fetchUsers();
      } catch (err: any) {
        alert(err.message || 'Error al eliminar usuario');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-minecraft text-xl font-bold text-white minecraft-text-shadow-lava tracking-wide">
            GESTIÓN DE CREADORES & USUARIOS
          </h2>
          <p className="text-xs text-amber-400 font-minecraft mt-1">
            Solo el Superadmin puede gestionar usuarios y forjar nuevas cuentas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            className="minecraft-btn-lava p-2.5 text-stone-300 hover:text-white"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <MinecraftButton variant="green" size="md" onClick={() => setIsModalOpen(true)}>
            <UserPlus className="w-4 h-4" />
            <span>CREAR USUARIO</span>
          </MinecraftButton>
        </div>
      </div>

      {error && (
        <div className="p-3 minecraft-card border-red-500/70 text-red-300 text-xs font-minecraft">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 minecraft-card text-center font-minecraft text-stone-400 text-xs">
          Cargando usuarios...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-minecraft text-xs border-collapse">
            <thead>
              <tr className="bg-[#140a0a] text-stone-400 border-b-2 border-black">
                <th className="p-3">AVATAR</th>
                <th className="p-3">USUARIO</th>
                <th className="p-3">ROL</th>
                <th className="p-3 text-center">MODPACKS</th>
                <th className="p-3">REGISTRO</th>
                <th className="p-3 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-900">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition">
                  <td className="p-3">
                    <MinecraftSlot size="sm">
                      <img
                        src={u.skinUrl || 'https://mc-heads.net/avatar/Steve/100'}
                        alt={u.username}
                        className="w-full h-full object-cover"
                      />
                    </MinecraftSlot>
                  </td>

                  <td className="p-3 font-bold text-white minecraft-text-shadow-lava">
                    {u.username}
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold ${
                        u.role === 'SUPERADMIN'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {u.role === 'SUPERADMIN' ? '👑 SUPERADMIN' : '⚒️ CREADOR'}
                    </span>
                  </td>

                  <td className="p-3 text-center text-amber-400 font-bold">
                    {u._count?.modpacks || 0}
                  </td>

                  <td className="p-3 text-stone-400 text-[10px] font-mono">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                  </td>

                  <td className="p-3 text-right">
                    {u.role !== 'SUPERADMIN' && (
                      <button
                        onClick={() => handleDelete(u.id, u.username)}
                        className="p-1.5 minecraft-slot text-stone-400 hover:text-red-400 transition"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUsers}
      />
    </div>
  );
};
