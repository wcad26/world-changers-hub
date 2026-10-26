import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Shared modern building blocks for regional portal pages (mirrors the member portal look). */

export function Ring({ value, size = 64, tone = 'var(--primary)', track = 'var(--muted)', label, textClass = 'text-foreground' }: {
  value: number; size?: number; tone?: string; track?: string; label?: string; textClass?: string;
}) {
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke={track} strokeWidth="3.5" />
        <circle cx="18" cy="18" r="15.5" fill="none" stroke={tone} strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={`${(v / 100) * 97.4} 97.4`} className="transition-all duration-700" />
      </svg>
      <span className={cn('absolute inset-0 grid place-items-center text-sm font-bold leading-none', textClass)}>
        {Math.round(v)}%{label && <span className="sr-only">{label}</span>}
      </span>
    </div>
  );
}

/** Gradient hero summary card with a ring. */
export function HeroCard({ eyebrow, value, sub, ring, ringLabel, children }: {
  eyebrow: string; value: React.ReactNode; sub?: React.ReactNode; ring?: number; ringLabel?: string; children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-secondary p-5 text-primary-foreground shadow-regal sm:p-6">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-primary-foreground/10 blur-3xl" />
      <div className="relative flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{eyebrow}</p>
          <p className="mt-1 font-heading text-4xl font-bold leading-none">{value}</p>
          {sub && <p className="mt-2 text-sm opacity-90">{sub}</p>}
        </div>
        {ring !== undefined && (
          <div className="flex flex-col items-center gap-1">
            <Ring value={ring} size={72} tone="var(--primary-foreground)" track="color-mix(in oklab, var(--primary-foreground) 25%, transparent)" textClass="text-primary-foreground" />
            {ringLabel && <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{ringLabel}</span>}
          </div>
        )}
      </div>
      {children && <div className="relative mt-4">{children}</div>}
    </section>
  );
}

/** Compact KPI tile with ring; acts as a toggle filter when onClick provided. */
export function RingTile({ icon: Icon, label, value, ring, ringLabel, tone = 'var(--chart-1)', active, onClick }: {
  icon: LucideIcon; label: string; value: React.ReactNode; ring?: number; ringLabel?: string; tone?: string; active?: boolean; onClick?: () => void;
}) {
  const Comp: any = onClick ? 'button' : 'div';
  return (
    <Comp type={onClick ? 'button' : undefined} onClick={onClick} aria-pressed={onClick ? !!active : undefined}
      className={cn('relative min-w-0 overflow-hidden rounded-2xl border bg-card p-4 text-left transition-all',
        active ? 'border-primary ring-2 ring-primary/30' : 'border-border', onClick && 'hover:border-primary/50 active:scale-[0.98]')}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full blur-2xl" style={{ background: `color-mix(in oklab, ${tone} 18%, transparent)` }} />
      <div className="relative flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <span className="grid h-8 w-8 place-items-center rounded-xl" style={{ background: `color-mix(in oklab, ${tone} 15%, transparent)`, color: tone }}><Icon className="h-4 w-4" /></span>
          <p className="mt-2 font-heading text-2xl font-bold leading-none text-foreground">{value}</p>
          <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{label}</p>
        </div>
        {ring !== undefined && (
          <div className="flex flex-col items-center gap-0.5">
            <Ring value={ring} size={48} tone={tone} />
            {ringLabel && <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{ringLabel}</span>}
          </div>
        )}
      </div>
    </Comp>
  );
}

export function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-10 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20" />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Clear search"
          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function RoundButton({ icon: Icon, label, onClick, primary }: { icon: LucideIcon; label: string; onClick?: () => void; primary?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-full transition active:scale-95',
        primary ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-regal' : 'border border-border bg-card text-foreground hover:bg-muted')}>
      <Icon className="h-5 w-5" />
    </button>
  );
}

/** Horizontally swipeable filter chips. */
export function ChipRow<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={cn('inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
            value === o.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>
          {o.label}
          {o.count !== undefined && (
            <span className={cn('rounded-full px-1.5 text-[10px]', value === o.value ? 'bg-primary-foreground/20' : 'bg-muted')}>{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Initials({ first, last, photo, size = 'md' }: { first?: string | null; last?: string | null; photo?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'h-24 w-24 text-3xl' : size === 'sm' ? 'h-9 w-9 text-xs' : 'h-11 w-11 text-sm';
  const text = `${last?.[0] || ''}${first?.[0] || ''}`.toUpperCase() || 'M';
  if (photo) return <img src={photo} alt="" className={cn('shrink-0 rounded-full object-cover', cls)} />;
  return <span className={cn('grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/30 font-heading font-bold text-primary', cls)}>{text}</span>;
}

const STATUS_TONES: Record<string, string> = {
  active: 'var(--chart-2)', new: 'var(--chart-1)', completed: 'var(--chart-3)',
  transferred: 'var(--chart-4)', inactive: 'var(--muted-foreground)',
};

export function StatusPill({ status, children }: { status?: string | null; children?: React.ReactNode }) {
  const s = status || 'new';
  const tone = STATUS_TONES[s] || 'var(--muted-foreground)';
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize"
      style={{ background: `color-mix(in oklab, ${tone} 15%, transparent)`, color: tone }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
      {children ?? s}
    </span>
  );
}

export function TypePill({ label, tone = 'var(--primary)' }: { label: string; tone?: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: `color-mix(in oklab, ${tone} 12%, transparent)`, color: tone }}>{label}</span>
  );
}

/** Icon-led detail row for profile pages. */
export function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"><Icon className="h-4 w-4" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="break-words text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

/** Gradient header for sheet-style dialogs. */
export function SheetHeader({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description?: string }) {
  return (
    <div className="relative -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-3xl bg-gradient-to-br from-primary to-secondary px-6 pb-5 pt-7 text-primary-foreground sm:rounded-t-2xl">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-foreground/15 blur-2xl" />
      <div className="relative flex items-center gap-3 pr-8">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-foreground/15 backdrop-blur"><Icon className="h-5 w-5" /></span>
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-bold leading-tight">{title}</h2>
          {description && <p className="text-xs opacity-85">{description}</p>}
        </div>
      </div>
    </div>
  );
}
