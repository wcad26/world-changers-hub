import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BibleVersion {
  id: string;
  code: string;
  name: string;
  language: string;
  is_stored: boolean;
  api_id: string | null;
  description: string | null;
  copyright_info: string | null;
}

export interface BibleBook {
  id: string;
  book_number: number;
  name: string;
  name_fr: string | null;
  abbreviation: string;
  testament: string;
  chapters_count: number;
}

export interface BibleVerse {
  verse: number;
  text: string;
}

// Fetch all available Bible versions
export function useBibleVersions() {
  return useQuery({
    queryKey: ['bible-versions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bible_versions')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return data as BibleVersion[];
    },
  });
}

// Fetch all Bible books
export function useBibleBooks(language: string = 'en') {
  return useQuery({
    queryKey: ['bible-books', language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bible_books')
        .select('*')
        .order('book_number');
      
      if (error) throw error;
      return data as BibleBook[];
    },
  });
}

import { fetchChapterVerses } from '@/services/bibleService';

// Fetch chapter content - handles stored database, bundled local dataset, and edge functions
export function useBibleChapter(
  versionId: string | null,
  bookNumber: number | null,
  chapter: number | null,
  version?: BibleVersion | null
) {
  return useQuery({
    queryKey: ['bible-chapter', versionId, version?.code, bookNumber, chapter],
    queryFn: async () => {
      return fetchChapterVerses(version || null, bookNumber, chapter);
    },
    enabled: !!version && !!bookNumber && !!chapter,
  });
}
