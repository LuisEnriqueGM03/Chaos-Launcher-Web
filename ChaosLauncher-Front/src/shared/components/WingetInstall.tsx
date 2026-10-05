'use client';

import React, { useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';
import { ENV } from '../../core/config/env';

const COMMAND = `winget install ${ENV.WINGET_PACKAGE_ID}`;

/** Instalación alternativa con winget (sin pasar por el navegador, por lo que Windows no muestra el aviso de SmartScreen). */
export const WingetInstall: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const live = ENV.WINGET_LIVE;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(COMMAND);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // El portapapeles puede estar bloqueado; el usuario aún puede seleccionar el texto.
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-6">
      <div className="flex items-center justify-center gap-2.5 text-xs sm:text-sm font-minecraft text-stone-300 mb-2.5">
        <Terminal className="w-4 h-4 text-amber-400" />
        <span>O INSTALA CON WINGET</span>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-3 minecraft-slot bg-black">
        <code className="font-mono text-sm sm:text-base text-white truncate select-all">{COMMAND}</code>
        <button
          onClick={handleCopy}
          disabled={!live}
          className="flex items-center gap-2 px-3 py-2 text-[11px] sm:text-xs font-minecraft text-stone-200 hover:text-white transition cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          title={live ? 'Copiar comando' : 'Disponible cuando Microsoft apruebe el paquete'}
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'COPIADO' : 'COPIAR'}</span>
        </button>
      </div>

      <p className="text-[11px] sm:text-xs font-minecraft text-stone-400 text-center mt-2">
        Abre PowerShell o el Terminal de Windows, pega el comando y pulsa Enter.
      </p>
    </div>
  );
};
