'use client';

import React, { useState, useEffect } from 'react';
import { ServerStatusData } from '../../../core/types/modpack.types';
import { modpacksApi } from '../../modpacks/infrastructure/modpacks.api';

interface ServerStatusBadgeProps {
  tag?: string;
  ip?: string;
  port?: number;
  initialStatus?: ServerStatusData | null;
}

export const ServerStatusBadge: React.FC<ServerStatusBadgeProps> = ({
  tag,
  initialStatus,
}) => {
  const [status, setStatus] = useState<ServerStatusData | null>(initialStatus || null);
  const [loading, setLoading] = useState(!initialStatus);

  useEffect(() => {
    if (!tag) return;
    let isMounted = true;

    const check = async () => {
      try {
        const data = await modpacksApi.getServerStatus(tag);
        if (isMounted) setStatus(data);
      } catch {
        if (isMounted) {
          setStatus({
            online: false,
            players: 0,
            max: 20,
            ip: '',
            port: 25565,
            cached: false,
            checkedAt: new Date().toISOString(),
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [tag]);

  if (loading) {
    return (
      <div className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 minecraft-card border-stone-700 bg-black/60 rounded-none px-2 py-1 text-slate-400 font-minecraft text-[10px]">
        <span className="w-1.5 h-1.5 bg-amber-400 animate-pulse shrink-0" />
        <span>COMPROBANDO...</span>
      </div>
    );
  }

  if (status?.online) {
    return (
      <div
        className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 minecraft-card rounded-none border-emerald-500/60 bg-[#0c1810] px-2.5 py-1 shadow-sm select-none"
        title={`Servidor en línea: ${status.ip}:${status.port}`}
      >
        <span className="w-2 h-2 bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399] shrink-0" />
        <span className="font-minecraft font-bold text-[10px] sm:text-[11px] text-emerald-300 tracking-wider minecraft-text-shadow">
          EN LÍNEA
        </span>
        {status.players !== undefined && (
          <span className="font-minecraft text-[10px] text-emerald-400/90 font-semibold ml-0.5">
            ({status.players}/{status.max})
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 minecraft-card rounded-none border-red-700/60 bg-[#180a0a] px-2.5 py-1 shadow-sm select-none"
      title="Servidor actualmente desconectado"
    >
      <span className="w-2 h-2 bg-red-500 shrink-0" />
      <span className="font-minecraft font-bold text-[10px] sm:text-[11px] text-red-400 tracking-wider minecraft-text-shadow-lava">
        DESCONECTADO
      </span>
    </div>
  );
};
