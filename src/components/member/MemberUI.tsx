import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Shared building blocks for the member portal pages (WCA Heritage look). */

export function StatTile({ label, value, sub, icon: Icon, tone = 'var(--chart-1)', className }: {
  label: string; value: React.ReactNode; sub?: React.ReactNode; icon: LucideIcon; tone?: string; className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-4', className)}>
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${tone} 15%, transparent)`, color: tone }}>
          <Icon className="h-4 w-4" />
        </span>
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 truncate font-heading text-xl font-bold text-foreground sm:text-2xl">{value}</p>
      {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function Panel({ title, action, children, className, bodyClassName }: {
  title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; bodyClassName?: string;
}) {
  return (
    <section className={cn('rounded-2xl border border-border bg-card', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          {title && <h3 className="min-w-0 truncate font-heading text-base font-semibold text-foreground">{title}</h3>}
          {action}
        </div>
      )}
      <div className={cn('p-4 sm:p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({ icon: Icon, title, hint, action }: { icon: LucideIcon; title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
      <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground"><Icon className="h-6 w-6" /></span>
      <p className="font-medium text-foreground">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Pill-style segmented control, scrolls horizontally on small screens. */
export function Segmented<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode }[];
}) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <div className="inline-flex gap-1 rounded-full border border-border bg-muted/50 p-1">
        {options.map((o) => (
          <button key={o.value} type="button" onClick={() => onChange(o.value)}
            className={cn('whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              value === o.value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Restyles shadcn TabsList into the pill look. */
export const pillTabsList = 'h-auto w-full justify-start gap-1 overflow-x-auto rounded-full border border-border bg-muted/50 p-1 sm:w-auto';
export const pillTabsTrigger = 'rounded-full px-4 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground';

/** Honest placeholder for portal sections that don't have live content yet. */
export function ComingSoonPanel({ icon: Icon, title, text, features }: { icon: LucideIcon; title: string; text: string; features: { icon: LucideIcon; label: string }[] }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-10">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-secondary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative mx-auto max-w-2xl text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-regal"><Icon className="h-8 w-8" /></span>
        <span className="mt-5 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">Coming soon</span>
        <h2 className="mt-3 font-heading text-2xl font-bold text-foreground sm:text-3xl">{title}</h2>
        <p className="mt-2 text-muted-foreground">{text}</p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {features.map((f) => (
            <div key={f.label} className="rounded-xl border border-border bg-background/60 p-4">
              <f.icon className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-2 text-xs font-medium text-foreground">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
