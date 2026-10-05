import React from 'react';
import { cn } from '../utils/cn';
import { Loader2 } from 'lucide-react';

export interface MinecraftButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'green' | 'lava' | 'amber' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const MinecraftButton: React.FC<MinecraftButtonProps> = ({
  children,
  className,
  variant = 'lava',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  const variantStyles = {
    green: 'minecraft-btn-green text-white minecraft-text-shadow',
    lava: 'minecraft-btn-lava text-white minecraft-text-shadow-lava',
    amber: 'minecraft-btn-amber text-white minecraft-text-shadow-amber',
    gray: 'minecraft-btn-gray text-slate-100 minecraft-text-shadow-gray',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-4 text-lg font-bold tracking-wider',
  };

  return (
    <button
      className={cn(
        'font-minecraft uppercase cursor-pointer rounded-none flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition duration-75',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : null}
      {children}
    </button>
  );
};
