import React from 'react';
import { cn } from '../utils/cn';

export interface MinecraftInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const MinecraftInput: React.FC<MinecraftInputProps> = ({
  label,
  error,
  helperText,
  className,
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="block font-minecraft font-bold text-xs uppercase tracking-wider text-slate-300"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full px-3.5 py-2.5 rounded-none minecraft-input text-sm text-white placeholder-stone-500 font-minecraft',
          error && 'border-red-500',
          className,
        )}
        {...props}
      />
      {error && <p className="text-[11px] text-red-400 font-minecraft mt-1">⚠️ {error}</p>}
      {helperText && !error && (
        <p className="text-[11px] text-stone-400 font-minecraft mt-1">{helperText}</p>
      )}
    </div>
  );
};
