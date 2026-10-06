import { Link } from '@tanstack/react-router';
import { ArrowUpRight, ExternalLink, Newspaper } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { PublicNewsItem } from '@/lib/public-site.functions';

type Props = { item: PublicNewsItem; variant?: 'lead' | 'standard'; className?: string };

/** One news/blog card. External posts open the source website in a new tab; others open the WCA article page. */
export function NewsCard({ item, variant = 'standard', className }: Props) {
  const lead = variant === 'lead';
  const date = format(new Date(item.published_at), 'dd/MM/yyyy');
  const scope = item.regions?.name ?? 'Global';

  const body = (
    <>
      <div className={cn('relative overflow-hidden bg-muted', lead ? 'absolute inset-0' : 'aspect-[16/10]')}>
        {item.image_url
          ? <img src={item.image_url} alt={item.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
          : <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/25 via-card to-secondary/25"><Newspaper className="h-10 w-10 text-muted-foreground" /></div>}
        {lead && <div className="absolute inset-0 bg-gradient-to-t from-event-background via-event-background/60 to-transparent" />}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-background/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground backdrop-blur">{item.category}</span>
          <span className="rounded-full bg-primary/90 px-3 py-1 text-[11px] font-semibold text-primary-foreground backdrop-blur">{scope}</span>
        </div>
        <span className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-background/85 text-foreground opacity-0 backdrop-blur transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          {item.external_url ? <ExternalLink className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
        </span>
      </div>
      <div className={cn(lead ? 'relative mt-auto p-6 text-event-foreground sm:p-8' : 'flex flex-1 flex-col p-5')}>
        <p className={cn('text-xs', lead ? 'text-event-muted' : 'text-muted-foreground')}>
          {date}{item.author_name ? ` · ${item.author_name}` : ''}
        </p>
        <h3 className={cn('mt-2 font-heading font-semibold leading-snug transition-colors', lead ? 'max-w-2xl text-2xl sm:text-3xl' : 'line-clamp-2 text-lg group-hover:text-primary')}>{item.title}</h3>
        <p className={cn('mt-2 line-clamp-3 text-sm leading-6', lead ? 'max-w-xl text-event-muted' : 'text-muted-foreground')}>{item.summary}</p>
        <span className={cn('mt-4 inline-flex items-center gap-1.5 text-sm font-semibold', lead ? 'text-secondary' : 'text-primary', !lead && 'mt-auto pt-4')}>
          {item.external_url ? <>Read on source website <ExternalLink className="h-3.5 w-3.5" /></> : <>Read story <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></>}
        </span>
      </div>
    </>
  );

  const cls = cn(
    'group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-regal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    lead && 'min-h-[440px] bg-event-background',
    className,
  );

  return item.external_url
    ? <a href={item.external_url} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>
    : <Link to="/news/$slug" params={{ slug: item.slug }} className={cls}>{body}</Link>;
}
