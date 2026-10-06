import { useState, useEffect } from 'react';

export type BibleTheme = 'light' | 'sepia' | 'dark';

export interface BibleHighlight {
  id: string;
  versionId: string;
  bookNumber: number;
  chapter: number;
  verse: number;
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'purple';
  createdAt: string;
}

export interface BibleBookmark {
  id: string;
  versionId: string;
  bookNumber: number;
  chapter: number;
  verse: number;
  bookName: string;
  verseText: string;
  createdAt: string;
}

export interface BiblePreferences {
  theme: BibleTheme;
  fontSize: number; // in px: 14 to 28
  serif: boolean;
  showVerseNumbers: boolean;
  lineHeight: number; // 1.6 to 2.4
}

const PREFS_STORAGE_KEY = 'wca_bible_preferences';
const HIGHLIGHTS_STORAGE_KEY = 'wca_bible_highlights';
const BOOKMARKS_STORAGE_KEY = 'wca_bible_bookmarks';

const DEFAULT_PREFS: BiblePreferences = {
  theme: 'light',
  fontSize: 18,
  serif: true,
  showVerseNumbers: true,
  lineHeight: 1.85,
};

export function useBiblePreferences() {
  const [preferences, setPreferences] = useState<BiblePreferences>(() => {
    try {
      const saved = localStorage.getItem(PREFS_STORAGE_KEY);
      return saved ? { ...DEFAULT_PREFS, ...JSON.parse(saved) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  });

  const [highlights, setHighlights] = useState<BibleHighlight[]>(() => {
    try {
      const saved = localStorage.getItem(HIGHLIGHTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [bookmarks, setBookmarks] = useState<BibleBookmark[]>(() => {
    try {
      const saved = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(preferences));
    } catch (e) {
      console.error('Failed to save Bible preferences:', e);
    }
  }, [preferences]);

  // Sync highlights to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(highlights));
    } catch (e) {
      console.error('Failed to save Bible highlights:', e);
    }
  }, [highlights]);

  // Sync bookmarks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    } catch (e) {
      console.error('Failed to save Bible bookmarks:', e);
    }
  }, [bookmarks]);

  const updatePreference = <K extends keyof BiblePreferences>(key: K, value: BiblePreferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const addOrUpdateHighlight = (
    versionId: string,
    bookNumber: number,
    chapter: number,
    verse: number,
    color: BibleHighlight['color']
  ) => {
    setHighlights((prev) => {
      const filtered = prev.filter(
        (h) => !(h.bookNumber === bookNumber && h.chapter === chapter && h.verse === verse)
      );
      const newHighlight: BibleHighlight = {
        id: `${bookNumber}-${chapter}-${verse}`,
        versionId,
        bookNumber,
        chapter,
        verse,
        color,
        createdAt: new Date().toISOString(),
      };
      return [...filtered, newHighlight];
    });
  };

  const removeHighlight = (bookNumber: number, chapter: number, verse: number) => {
    setHighlights((prev) =>
      prev.filter((h) => !(h.bookNumber === bookNumber && h.chapter === chapter && h.verse === verse))
    );
  };

  const toggleBookmark = (
    versionId: string,
    bookNumber: number,
    chapter: number,
    verse: number,
    bookName: string,
    verseText: string
  ) => {
    const existingIndex = bookmarks.findIndex(
      (b) => b.bookNumber === bookNumber && b.chapter === chapter && b.verse === verse
    );

    if (existingIndex >= 0) {
      setBookmarks((prev) => prev.filter((_, idx) => idx !== existingIndex));
      return false; // Removed
    } else {
      const newBookmark: BibleBookmark = {
        id: `${bookNumber}-${chapter}-${verse}`,
        versionId,
        bookNumber,
        chapter,
        verse,
        bookName,
        verseText,
        createdAt: new Date().toISOString(),
      };
      setBookmarks((prev) => [newBookmark, ...prev]);
      return true; // Added
    }
  };

  const isBookmarked = (bookNumber: number, chapter: number, verse: number) => {
    return bookmarks.some(
      (b) => b.bookNumber === bookNumber && b.chapter === chapter && b.verse === verse
    );
  };

  const getVerseHighlight = (bookNumber: number, chapter: number, verse: number) => {
    return highlights.find(
      (h) => h.bookNumber === bookNumber && h.chapter === chapter && h.verse === verse
    );
  };

  return {
    preferences,
    updatePreference,
    highlights,
    addOrUpdateHighlight,
    removeHighlight,
    getVerseHighlight,
    bookmarks,
    toggleBookmark,
    isBookmarked,
  };
}
