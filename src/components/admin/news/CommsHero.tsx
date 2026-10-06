import type { ReactNode } from 'react';
import { MessagesSquare } from 'lucide-react';

/** Branded gradient header for the Communication pages in admin portals. */
export function CommsHero({ title, subtitle, stats, action }: { title: string; subtitle: string; stats: { label: string; value: ReactNode }[]; action?: ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary via-primary to-secondary p-6 text-primary-foreground shadow-regal sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-foreground/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/4 h-48 w-48 rounded-full bg-secondary/40 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-foreground/15 backdrop-blur"><MessagesSquare className="h-6 w-6" /></span>
          <div>
            <h2 className="font-heading text-2xl font-bold text-primary-foreground sm:text-3xl">{title}</h2>
            <p className="mt-1 max-w-xl text-sm text-primary-foreground/80">{subtitle}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 p-3 backdrop-blur">
            <p className="text-xs text-primary-foreground/75">{s.label}</p>
            <p className="mt-1 font-heading text-xl font-bold text-primary-foreground">{s.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export const commsTabsList = 'flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl border border-border bg-card/70 p-1.5 backdrop-blur';
export const commsTabsTrigger = 'rounded-xl px-4 py-2 text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm';
