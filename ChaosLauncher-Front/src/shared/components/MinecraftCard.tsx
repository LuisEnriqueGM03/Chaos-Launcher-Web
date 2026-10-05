import React from 'react';
import { cn } from '../utils/cn';

export interface MinecraftCardProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
}

export const MinecraftCard: React.FC<MinecraftCardProps> = ({
  children,
  className,
  active = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'minecraft-card p-4 rounded-none transition-colors duration-150',
        active && 'border-red-500/70 shadow-[0_0_15px_rgba(255,30,30,0.35)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
