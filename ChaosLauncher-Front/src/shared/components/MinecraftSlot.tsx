import React from 'react';
import { cn } from '../utils/cn';

export interface MinecraftSlotProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const MinecraftSlot: React.FC<MinecraftSlotProps> = ({
  children,
  className,
  size = 'md',
  ...props
}) => {
  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div
      className={cn(
        'minecraft-slot flex items-center justify-center p-1 rounded-none shrink-0 overflow-hidden',
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
