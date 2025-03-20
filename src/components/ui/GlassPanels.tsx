
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  isDark?: boolean;
}

export function GlassPanel({ children, className, isDark = false }: GlassPanelProps) {
  return (
    <div className={cn(
      isDark ? 'glass-panel-dark' : 'glass-panel',
      className
    )}>
      {children}
    </div>
  );
}

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  isDark?: boolean;
  hoverEffect?: boolean;
}

export function GlassCard({ children, className, isDark = false, hoverEffect = true }: GlassCardProps) {
  return (
    <div 
      className={cn(
        'overflow-hidden',
        isDark ? 'glass-panel-dark' : 'glass-panel',
        hoverEffect && 'transition-all duration-300 hover:translate-y-[-5px] hover:shadow-xl',
        className
      )}
    >
      {children}
    </div>
  );
}
