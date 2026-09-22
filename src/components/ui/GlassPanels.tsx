
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
      'rounded-md border shadow-card backdrop-blur-xl',
      isDark ? 'border-event-border bg-event-surface/92 text-event-foreground' : 'border-border/80 bg-card/88 text-card-foreground',
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
        'rounded-md border shadow-card backdrop-blur-xl',
        isDark ? 'border-event-border bg-event-surface/92 text-event-foreground' : 'border-border/80 bg-card/88 text-card-foreground',
        hoverEffect && 'transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-regal',
        className
      )}
    >
      {children}
    </div>
  );
}
