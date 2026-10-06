import React, { useState, useEffect } from 'react';
import {
  useBibleVersions,
  useBibleBooks,
  useBibleChapter,
  BibleVersion,
  BibleBook,
  BibleVerse,
} from '@/hooks/useBible';
import { useLanguage } from '@/hooks/useLanguage';
import { useBiblePreferences } from '@/hooks/useBiblePreferences';
import { BibleHeader } from '@/components/bible/BibleHeader';
import { BibleReaderView } from '@/components/bible/BibleReaderView';
import { BiblePickerModal } from '@/components/bible/BiblePickerModal';
import { BibleVersionModal } from '@/components/bible/BibleVersionModal';
import { BibleVerseActionBar } from '@/components/bible/BibleVerseActionBar';
import { BibleBottomNav } from '@/components/bible/BibleBottomNav';
import { BibleCompareModal } from '@/components/bible/BibleCompareModal';
import { BibleVerseImageModal } from '@/components/bible/BibleVerseImageModal';
import { BibleBookmarksModal } from '@/components/bible/BibleBookmarksModal';
import { MemberMoreSheet } from '@/components/layout/MemberMoreSheet';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const STORAGE_KEY = 'bible_reading_position';

interface ReadingPosition {
  versionId: string;
  bookNumber: number;
  chapter: number;
  verse?: number;
}

export default function BiblePage() {
  const { language } = useLanguage();
  const {
    preferences,
    updatePreference,
    addOrUpdateHighlight,
    removeHighlight,
    getVerseHighlight,
    bookmarks,
    toggleBookmark,
    isBookmarked,
  } = useBiblePreferences();

  const { data: versions, isLoading: versionsLoading } = useBibleVersions();
  const { data: books, isLoading: booksLoading } = useBibleBooks(language);

  const [selectedVersion, setSelectedVersion] = useState<BibleVersion | null>(null);
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [selectedVerses, setSelectedVerses] = useState<BibleVerse[]>([]);

  // Modals state
  const [isBookPickerOpen, setIsBookPickerOpen] = useState(false);
  const [isVersionPickerOpen, setIsVersionPickerOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState(false);
  const [isMorePagesOpen, setIsMorePagesOpen] = useState(false);

  // Restore saved reading position on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const position: ReadingPosition = JSON.parse(saved);
        if (versions && books) {
          const version = versions.find((v) => v.id === position.versionId);
          const book = books.find((b) => b.book_number === position.bookNumber);
          if (version) setSelectedVersion(version);
          if (book) {
            setSelectedBook(book);
            setSelectedChapter(position.chapter);
          }
        }
      } catch (e) {
        console.error('Failed to restore reading position:', e);
      }
    }
  }, [versions, books]);

  // Set default version & book
  useEffect(() => {
    if (versions && versions.length > 0 && !selectedVersion) {
      const defaultVersion =
        language === 'fr'
          ? versions.find((v) => v.code === 'LSG') || versions[0]
          : versions.find((v) => v.code === 'KJV') || versions[0];
      setSelectedVersion(defaultVersion);
    }
  }, [versions, language, selectedVersion]);

  useEffect(() => {
    if (books && books.length > 0 && !selectedBook) {
      setSelectedBook(books[0]); // Genesis
    }
  }, [books, selectedBook]);

  // Save position when changed
  useEffect(() => {
    if (selectedVersion && selectedBook) {
      const position: ReadingPosition = {
        versionId: selectedVersion.id,
        bookNumber: selectedBook.book_number,
        chapter: selectedChapter,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    }
  }, [selectedVersion, selectedBook, selectedChapter]);

  // Fetch chapter verses
  const {
    data: verses,
    isLoading: versesLoading,
    error: versesError,
  } = useBibleChapter(
    selectedVersion?.id || null,
    selectedBook?.book_number || null,
    selectedChapter,
    selectedVersion
  );

  // Chapter navigation helpers
  const handlePrevChapter = () => {
    setSelectedVerses([]);
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    } else if (selectedBook && books) {
      const currentIndex = books.findIndex((b) => b.book_number === selectedBook.book_number);
      if (currentIndex > 0) {
        const prevBook = books[currentIndex - 1];
        setSelectedBook(prevBook);
        setSelectedChapter(prevBook.chapters_count);
      }
    }
  };

  const handleNextChapter = () => {
    setSelectedVerses([]);
    if (selectedBook && selectedChapter < selectedBook.chapters_count) {
      setSelectedChapter(selectedChapter + 1);
    } else if (selectedBook && books) {
      const currentIndex = books.findIndex((b) => b.book_number === selectedBook.book_number);
      if (currentIndex < books.length - 1) {
        const nextBook = books[currentIndex + 1];
        setSelectedBook(nextBook);
        setSelectedChapter(1);
      }
    }
  };

  const isFirstChapter = selectedBook?.book_number === 1 && selectedChapter === 1;
  const isLastChapter =
    selectedBook?.book_number === 66 && selectedChapter === selectedBook?.chapters_count;

  // Verse multi-select toggle
  const handleToggleVerseSelect = (verse: BibleVerse) => {
    setSelectedVerses((prev) => {
      const exists = prev.some((v) => v.verse === verse.verse);
      if (exists) {
        return prev.filter((v) => v.verse !== verse.verse);
      } else {
        return [...prev, verse];
      }
    });
  };

  // Highlight actions
  const handleHighlight = (color: Parameters<typeof addOrUpdateHighlight>[4]) => {
    if (!selectedVersion || !selectedBook) return;
    selectedVerses.forEach((v) => {
      addOrUpdateHighlight(
        selectedVersion.id,
        selectedBook.book_number,
        selectedChapter,
        v.verse,
        color
      );
    });
    toast.success('Highlighted');
    setSelectedVerses([]);
  };

  const handleRemoveHighlight = () => {
    if (!selectedBook) return;
    selectedVerses.forEach((v) => {
      removeHighlight(selectedBook.book_number, selectedChapter, v.verse);
    });
    toast.success('Highlight removed');
    setSelectedVerses([]);
  };

  // Bookmark action
  const handleToggleBookmark = () => {
    if (!selectedVersion || !selectedBook || selectedVerses.length === 0) return;
    const firstVerse = selectedVerses[0];
    const bookName =
      language === 'fr' && selectedBook.name_fr ? selectedBook.name_fr : selectedBook.name;
    const added = toggleBookmark(
      selectedVersion.id,
      selectedBook.book_number,
      selectedChapter,
      firstVerse.verse,
      bookName,
      firstVerse.text
    );
    toast.success(added ? 'Bookmark added' : 'Bookmark removed');
  };

  const isCurrentSelectionBookmarked =
    selectedBook && selectedVerses.length > 0
      ? isBookmarked(selectedBook.book_number, selectedChapter, selectedVerses[0].verse)
      : false;

  // Jump from bookmark modal
  const handleNavigateToBookmark = (book: BibleBook, chapter: number, verse: number) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setSelectedVerses([]);
    // Once loaded, verse will scroll into view or can be inspected
  };

  if (versionsLoading || booksLoading) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-44 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-[60vh] w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-background selection:bg-primary/20">
      {/* YouVersion Top Navigation Header */}
      <BibleHeader
        currentBook={selectedBook}
        currentChapter={selectedChapter}
        currentVersion={selectedVersion}
        language={language}
        theme={preferences.theme}
        fontSize={preferences.fontSize}
        serif={preferences.serif}
        showVerseNumbers={preferences.showVerseNumbers}
        lineHeight={preferences.lineHeight}
        onOpenBookPicker={() => setIsBookPickerOpen(true)}
        onOpenVersionPicker={() => setIsVersionPickerOpen(true)}
        onOpenBookmarks={() => setIsBookmarksModalOpen(true)}
        onOpenMorePages={() => setIsMorePagesOpen(true)}
        onThemeChange={(th) => updatePreference('theme', th)}
        onFontSizeChange={(sz) => updatePreference('fontSize', sz)}
        onSerifChange={(sr) => updatePreference('serif', sr)}
        onShowVerseNumbersChange={(sn) => updatePreference('showVerseNumbers', sn)}
        onLineHeightChange={(lh) => updatePreference('lineHeight', lh)}
      />

      {/* Main Reading View with swipe gestures & responsive layout */}
      <main className="flex-1 w-full">
        <BibleReaderView
          verses={verses}
          isLoading={versesLoading}
          error={versesError as Error | null}
          currentBook={selectedBook}
          currentChapter={selectedChapter}
          currentVersion={selectedVersion}
          selectedVerses={selectedVerses}
          theme={preferences.theme}
          fontSize={preferences.fontSize}
          serif={preferences.serif}
          showVerseNumbers={preferences.showVerseNumbers}
          lineHeight={preferences.lineHeight}
          language={language}
          onToggleVerseSelect={handleToggleVerseSelect}
          getHighlight={(verseNum) =>
            selectedBook
              ? getVerseHighlight(selectedBook.book_number, selectedChapter, verseNum)
              : undefined
          }
          onPrevChapter={handlePrevChapter}
          onNextChapter={handleNextChapter}
          isFirstChapter={isFirstChapter}
          isLastChapter={isLastChapter}
        />
      </main>

      {/* Mobile/Tablet Sticky Bottom Chapter Nav */}
      <BibleBottomNav
        currentBook={selectedBook}
        currentChapter={selectedChapter}
        totalChapters={selectedBook?.chapters_count || 1}
        isFirstChapter={isFirstChapter}
        isLastChapter={isLastChapter}
        language={language}
        onPrevChapter={handlePrevChapter}
        onNextChapter={handleNextChapter}
        onOpenBookPicker={() => setIsBookPickerOpen(true)}
      />

      {/* YouVersion Floating Verse Action Bar (Shown when verses are selected) */}
      <BibleVerseActionBar
        selectedVerses={selectedVerses}
        currentBook={selectedBook}
        currentChapter={selectedChapter}
        currentVersion={selectedVersion}
        isBookmarked={isCurrentSelectionBookmarked}
        onClearSelection={() => setSelectedVerses([])}
        onHighlight={handleHighlight}
        onRemoveHighlight={handleRemoveHighlight}
        onToggleBookmark={handleToggleBookmark}
        onOpenCompare={() => setIsCompareModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        language={language}
      />

      {/* Book & Chapter Selection Modal / Drawer */}
      <BiblePickerModal
        open={isBookPickerOpen}
        onOpenChange={setIsBookPickerOpen}
        books={books || []}
        currentBook={selectedBook}
        currentChapter={selectedChapter}
        language={language}
        onSelect={(b, ch) => {
          setSelectedBook(b);
          setSelectedChapter(ch);
          setSelectedVerses([]);
        }}
      />

      {/* Translation Version Selection Modal / Drawer */}
      <BibleVersionModal
        open={isVersionPickerOpen}
        onOpenChange={setIsVersionPickerOpen}
        versions={versions || []}
        currentVersion={selectedVersion}
        language={language}
        onSelect={(v) => {
          setSelectedVersion(v);
          setSelectedVerses([]);
        }}
      />

      {/* Compare Translations Modal */}
      <BibleCompareModal
        open={isCompareModalOpen}
        onOpenChange={setIsCompareModalOpen}
        verse={selectedVerses[0] || null}
        book={selectedBook}
        chapter={selectedChapter}
        language={language}
      />

      {/* Share / Social Verse Card Modal */}
      <BibleVerseImageModal
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        selectedVerses={selectedVerses}
        currentBook={selectedBook}
        currentChapter={selectedChapter}
        currentVersion={selectedVersion}
        language={language}
      />

      {/* Bookmarks Modal */}
      <BibleBookmarksModal
        open={isBookmarksModalOpen}
        onOpenChange={setIsBookmarksModalOpen}
        bookmarks={bookmarks}
        books={books || []}
        onNavigateToBookmark={handleNavigateToBookmark}
        onRemoveBookmark={(bm) => {
          if (selectedVersion) {
            toggleBookmark(
              bm.versionId,
              bm.bookNumber,
              bm.chapter,
              bm.verse,
              bm.bookName,
              bm.verseText
            );
            toast.success('Bookmark removed');
          }
        }}
      />

      {/* Member Portal More Navigation Drawer */}
      <MemberMoreSheet open={isMorePagesOpen} onOpenChange={setIsMorePagesOpen} />
    </div>
  );
}
