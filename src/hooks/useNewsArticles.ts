import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { generateSlug } from '@/utils/slugUtils';

export type NewsArticle = {
  id: string; title: string; slug: string; summary: string; content: string | null; image_url: string | null;
  external_url: string | null; category: string; region_id: string | null; author_name: string | null;
  is_featured: boolean; is_published: boolean; published_at: string; created_at: string;
  regions?: { name: string } | null;
};
export type NewsInput = Omit<NewsArticle, 'id' | 'slug' | 'created_at' | 'regions'> & { id?: string };

export const NEWS_CATEGORIES = ['News', 'Update', 'Announcement', 'Testimony', 'Article', 'Event Recap'];

// The table is new and not yet in the generated types, so access it untyped.
const table = () => (supabase as any).from('news_articles');

/** scope: a region id (regional portal) or 'all' (super admin). */
export const useAdminNews = (scope: string | undefined) =>
  useQuery({
    queryKey: ['admin-news', scope],
    enabled: !!scope,
    queryFn: async (): Promise<NewsArticle[]> => {
      let q = table().select('*, regions(name)').order('published_at', { ascending: false });
      if (scope !== 'all') q = q.eq('region_id', scope);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

export const useSaveNews = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewsInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { id, ...rest } = input;
      const payload = { ...rest, external_url: rest.external_url?.trim() || null, content: rest.content?.trim() || null };
      if (id) {
        const { error } = await table().update(payload).eq('id', id);
        if (error) throw error;
        return;
      }
      const slug = `${generateSlug(rest.title).slice(0, 70) || 'story'}-${Math.random().toString(36).slice(2, 7)}`;
      const { error } = await table().insert({ ...payload, slug, created_by: user?.id ?? null });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-news'] });
      qc.invalidateQueries({ queryKey: ['public-news'] });
    },
  });
};

export const useDeleteNews = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await table().delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-news'] });
      qc.invalidateQueries({ queryKey: ['public-news'] });
    },
  });
};

export async function uploadNewsImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be 5 MB or smaller.');
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `news/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('campaign-images').upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return supabase.storage.from('campaign-images').getPublicUrl(path).data.publicUrl;
}
