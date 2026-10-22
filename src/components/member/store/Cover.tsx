import { toneVar } from '@/data/memberDemo';
import { cn } from '@/lib/utils';

/** Generated book/product cover used until real product photos are uploaded. */
export function Cover({ title, tone, className, small }: { title: string; tone: number; className?: string; small?: boolean }) {
  return (
    <div className={cn('relative grid place-items-center overflow-hidden rounded-2xl', className)}
      style={{ background: `linear-gradient(160deg, color-mix(in oklab, ${toneVar(tone)} 18%, var(--card)), color-mix(in oklab, ${toneVar(tone)} 45%, var(--card)))` }}>
      <div className="flex h-[74%] w-[54%] flex-col justify-end rounded-md p-2 shadow-xl" style={{ background: toneVar(tone) }}>
        <p className={cn('line-clamp-3 font-heading font-bold leading-tight text-primary-foreground', small ? 'text-[9px]' : 'text-xs')}>{title}</p>
      </div>
    </div>
  );
}
