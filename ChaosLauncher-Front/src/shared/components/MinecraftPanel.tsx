import React from 'react';
import { cn } from '../utils/cn';

export interface MinecraftPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export const MinecraftPanel: React.FC<MinecraftPanelProps> = ({
  children,
  className,
  title,
  subtitle,
  icon,
  ...props
}) => {
  return (
    <div className={cn('minecraft-panel p-6 rounded-none space-y-4', className)} {...props}>
      {(title || icon) && (
        <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
          <div className="flex items-center gap-3">
            {icon && <div className="p-2 minecraft-slot rounded-none">{icon}</div>}
            <div>
              {title && (
                <h2 className="font-minecraft font-bold text-lg text-white minecraft-text-shadow-lava tracking-wide uppercase">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-xs text-amber-400 font-minecraft mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};
