import { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

/** Resolves a stored avatar path (private "avatars" bucket) into a viewable signed URL. */
export function useAvatarUrl(path?: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!path) { setUrl(null); return; }
    if (/^https?:\/\//.test(path)) { setUrl(path); return; }
    supabase.storage.from('avatars').createSignedUrl(path, 60 * 60 * 24).then(({ data }) => {
      if (alive) setUrl(data?.signedUrl ?? null);
    });
    return () => { alive = false; };
  }, [path]);
  return url;
}

export function MemberAvatar({ path, className, iconClassName }: { path?: string | null; className?: string; iconClassName?: string }) {
  const url = useAvatarUrl(path);
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [url]);
  return (
    <span className={cn('relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary/60 to-secondary/60 text-primary-foreground', className)}>
      {url && !broken
        ? <img src={url} alt="Profile photo" className="h-full w-full object-cover" onError={() => setBroken(true)} />
        : <User className={cn('h-1/2 w-1/2 opacity-90', iconClassName)} aria-label="Default profile image" />}
    </span>
  );
}
