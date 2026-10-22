import { useCallback, useEffect, useState } from 'react';

const KEY = 'wca-saved-videos';

/** Saved videos are kept on this device only. */
export function useSavedVideos() {
  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { /* ignore */ }
  }, []);
  const toggle = useCallback((id: string) => {
    setSaved((s) => {
      const next = s.includes(id) ? s.filter((x) => x !== id) : [id, ...s];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);
  return { saved, toggle };
}
