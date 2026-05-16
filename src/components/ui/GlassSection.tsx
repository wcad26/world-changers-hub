import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface GlassSectionProps {
  children: ReactNode;
  className?: string;
}

export function GlassSection({ children, className }: GlassSectionProps) {
  return (
    <div className={cn(
      'rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6',
      className
    )}>
      {children}
    </div>
  );
}

interface GlassSectionHeaderProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function GlassSectionHeader({ icon, title, description, action }: GlassSectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface GlassKPICardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  isLoading?: boolean;
}

export function GlassKPICard({ icon, label, value, subtitle, isLoading }: GlassKPICardProps) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 transition-all duration-300 hover:shadow-md hover:border-border/60">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <>
          <p className="font-bold text-foreground text-lg">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </>
      )}
    </div>
  );
}

export function GlassTableSkeleton({ columns = 5, rows = 4 }: { columns?: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={`skeleton-${i}`} className="border-b border-border/40">
          {Array.from({ length: columns }).map((_, j) => (
            <td key={`skeleton-${i}-${j}`} className="p-4">
              <Skeleton className="h-5 w-full rounded-lg" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
