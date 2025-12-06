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

// Fetch chapter content - handles both stored and API versions
export function useBibleChapter(
  versionId: string | null,
  bookNumber: number | null,
  chapter: number | null,
  version?: BibleVersion | null
) {
  return useQuery({
    queryKey: ['bible-chapter', versionId, bookNumber, chapter],
    queryFn: async () => {
      if (!versionId || !bookNumber || !chapter || !version) {
        return [];
      }

      // If version is stored in database, fetch from there
      if (version.is_stored) {
        const { data, error } = await supabase
          .from('bible_verses')
          .select('verse, text')
          .eq('version_id', versionId)
          .eq('book_number', bookNumber)
          .eq('chapter', chapter)
          .order('verse');
        
        if (error) throw error;
        return data as BibleVerse[];
      }

      // Otherwise, fetch from API.Bible via edge function
      if (!version.api_id) {
        throw new Error('API version missing api_id');
      }

      // Get the book abbreviation for API call
      const { data: bookData } = await supabase
        .from('bible_books')
        .select('abbreviation')
        .eq('book_number', bookNumber)
        .single();

      if (!bookData) {
        throw new Error('Book not found');
      }

      const { data, error } = await supabase.functions.invoke('get-bible-content', {
        body: {
          bibleId: version.api_id,
          bookId: bookData.abbreviation,
          chapter,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data.verses as BibleVerse[];
    },
    enabled: !!versionId && !!bookNumber && !!chapter && !!version,
  });
}
