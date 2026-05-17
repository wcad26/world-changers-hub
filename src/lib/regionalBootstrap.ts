import type { Database } from '@/integrations/supabase/types';

export const REGIONAL_BOOTSTRAP_KEY = 'wca-regional-bootstrap';

type Region = Database['public']['Tables']['regions']['Row'];

export type RegionalBootstrap = {
  userId: string;
  email?: string | null;
  regionId: string;
  savedAt: number;
};

const isBrowser = () => typeof window !== 'undefined';

const readStorage = (storage: Storage | undefined, key: string) => {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

export const readRegionalBootstrap = (): RegionalBootstrap | null => {
  if (!isBrowser()) return null;
  try {
    const raw =
      readStorage(window.sessionStorage, REGIONAL_BOOTSTRAP_KEY) ||
      readStorage(window.localStorage, REGIONAL_BOOTSTRAP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RegionalBootstrap>;
    if (!parsed.userId || !parsed.regionId) return null;
    return {
      userId: parsed.userId,
      email: parsed.email ?? null,
      regionId: parsed.regionId,
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
    };
  } catch {
    return null;
  }
};

export const writeRegionalBootstrap = (bootstrap: Omit<RegionalBootstrap, 'savedAt'>) => {
  if (!isBrowser()) return;
  const value = JSON.stringify({ ...bootstrap, savedAt: Date.now() });
  try { window.sessionStorage.setItem(REGIONAL_BOOTSTRAP_KEY, value); } catch {}
  try { window.localStorage.setItem(REGIONAL_BOOTSTRAP_KEY, value); } catch {}
};

export const clearRegionalBootstrap = () => {
  if (!isBrowser()) return;
  try { window.sessionStorage.removeItem(REGIONAL_BOOTSTRAP_KEY); } catch {}
  try { window.localStorage.removeItem(REGIONAL_BOOTSTRAP_KEY); } catch {}
};

export const createRegionStub = (regionId: string): Region => ({
  id: regionId,
  name: 'Loading region',
  code: '',
  address: null,
  contact_email: null,
  contact_phone: null,
  created_at: null,
  currency_code: null,
  description: null,
  established_date: null,
  hero_slide_images: null,
  hero_slide_images_mobile: null,
  hero_slide_images_tablet: null,
  is_active: true,
  regional_president: null,
  regional_president_photo: null,
  updated_at: null,
});