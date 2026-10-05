'use client';

import React from 'react';
import { useAuth } from '../../../features/auth/application/auth.context';
import { UsersTable } from '../../../features/users/presentation/UsersTable';
import { MinecraftPanel } from '../../../shared/components/MinecraftPanel';
import { ShieldAlert } from 'lucide-react';

export default function AdminUsersPage() {
  const { user, isSuperadmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-xs font-minecraft text-stone-400">
        Verificando permisos de Superadmin...
      </div>
    );
  }

  if (!isSuperadmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-6">
        <MinecraftPanel
          title="ACCESO DENEGADO"
          icon={<ShieldAlert className="w-5 h-5 text-red-500" />}
          className="text-center"
        >
          <p className="text-xs font-minecraft text-stone-300">
            Esta zona requiere el rango de 👑 <span className="text-red-400 font-bold">SUPERADMIN</span>.
            Inicia sesión con las credenciales de administración configuradas en el archivo .env.
          </p>
        </MinecraftPanel>
      </div>
    );
  }

  return (
    <div className="max-w-7xl w-full mx-auto px-6 py-8 space-y-6 flex-1">
      <UsersTable />
    </div>
  );
}
