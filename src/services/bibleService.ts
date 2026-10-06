import { supabase } from '@/integrations/supabase/client';
import { BibleVerse, BibleVersion } from '@/hooks/useBible';

interface BibleBookData {
  abbrev: string;
  name: string;
  chapters: string[][];
}

// In-memory cache of parsed bible versions
const versionDataCache = new Map<string, BibleBookData[]>();

// Map version codes to the corresponding bundled dataset
const BUNDLED_VERSION_MAP: Record<string, string> = {
  KJV: '/bibles/en_kjv.json',
  NIV: '/bibles/en_niv.json',
  NKJV: '/bibles/en_nkjv.json',
  NLT: '/bibles/en_nlt.json',
  AMP: '/bibles/en_amp.json',
  LSG: '/bibles/fr_apee.json',
  DARBY: '/bibles/fr_apee.json',
};

async function loadBundledBible(code: string): Promise<BibleBookData[] | null> {
  const filePath = BUNDLED_VERSION_MAP[code] || BUNDLED_VERSION_MAP['KJV'];
  if (versionDataCache.has(filePath)) {
    return versionDataCache.get(filePath)!;
  }

  try {
    const res = await fetch(filePath);
    if (!res.ok) {
      console.warn(`Failed to fetch ${filePath}: ${res.statusText}`);
      return null;
    }
    const data: BibleBookData[] = await res.json();
    versionDataCache.set(filePath, data);
    return data;
  } catch (err) {
    console.error(`Error loading bible file ${filePath}:`, err);
    return null;
  }
}

export async function fetchChapterVerses(
  version: BibleVersion | null,
  bookNumber: number | null,
  chapter: number | null
): Promise<BibleVerse[]> {
  if (!version || !bookNumber || !chapter) {
    return [];
  }

  // Tier 1: Check Supabase database if version is marked as stored
  if (version.is_stored) {
    try {
      const { data: dbVerses, error } = await supabase
        .from('bible_verses')
        .select('verse, text')
        .eq('version_id', version.id)
        .eq('book_number', bookNumber)
        .eq('chapter', chapter)
        .order('verse');

      if (!error && dbVerses && dbVerses.length > 0) {
        return dbVerses as BibleVerse[];
      }
    } catch (e) {
      console.warn('Supabase bible query error, falling back to local dataset:', e);
    }
  }

  // Tier 2: Check bundled & cached high-speed dataset (covers all 66 books & all chapters)
  const bibleData = await loadBundledBible(version.code);
  if (bibleData && bookNumber >= 1 && bookNumber <= bibleData.length) {
    const bookIndex = bookNumber - 1; // 0-indexed books (1: Genesis -> index 0)
    const book = bibleData[bookIndex];
    if (book && chapter >= 1 && chapter <= book.chapters.length) {
      const chapterIndex = chapter - 1; // 0-indexed chapters
      const rawVerses = book.chapters[chapterIndex];

      return rawVerses.map((text, idx) => ({
        verse: idx + 1,
        text: text.trim(),
      }));
    }
  }

  // Tier 3: Edge function fallback for custom API-based versions (if api_id exists and not bundled)
  if (version.api_id && !BUNDLED_VERSION_MAP[version.code]) {
    try {
      const { data: bookData } = await supabase
        .from('bible_books')
        .select('abbreviation')
        .eq('book_number', bookNumber)
        .single();

      if (bookData?.abbreviation) {
        const { data, error } = await supabase.functions.invoke('get-bible-content', {
          body: {
            bibleId: version.api_id,
            bookId: bookData.abbreviation,
            chapter,
          },
        });

        if (!error && data?.verses) {
          return data.verses as BibleVerse[];
        }
      }
    } catch (e) {
      console.warn('Edge function fallback error:', e);
    }
  }

  return [];
}
