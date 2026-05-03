import type { Database } from '@/integrations/supabase/types';

export const REGIONAL_BOOTSTRAP_KEY = 'wca-regional-bootstrap';

type Region = Database['public']['Tables']['regions']['Row'];

export type RegionalBootstrap = {
  userId: string;
  email?: string | null;
  regionId: string;
  savedAt: number;
};

const isBrowser = () => typeof window !== 'undefined' && !!window.sessionStorage;

export const readRegionalBootstrap = (): RegionalBootstrap | null => {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(REGIONAL_BOOTSTRAP_KEY);
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
  window.sessionStorage.setItem(
    REGIONAL_BOOTSTRAP_KEY,
    JSON.stringify({ ...bootstrap, savedAt: Date.now() }),
  );
};

export const clearRegionalBootstrap = () => {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(REGIONAL_BOOTSTRAP_KEY);
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