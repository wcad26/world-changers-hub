import React, { useRef, useEffect } from 'react';
import { BibleVerse, BibleBook, BibleVersion } from '@/hooks/useBible';
import { BibleTheme, BibleHighlight } from '@/hooks/useBiblePreferences';
import { Skeleton } from '@/components/ui/skeleton';
import { Book, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BibleReaderViewProps {
  verses: BibleVerse[] | undefined;
  isLoading: boolean;
  error: Error | null;
  currentBook: BibleBook | null;
  currentChapter: number;
  currentVersion: BibleVersion | null;
  selectedVerses: BibleVerse[];
  theme: BibleTheme;
  fontSize: number;
  serif: boolean;
  showVerseNumbers: boolean;
  lineHeight: number;
  language: string;
  onToggleVerseSelect: (verse: BibleVerse) => void;
  getHighlight: (verseNum: number) => BibleHighlight | undefined;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  isFirstChapter: boolean;
  isLastChapter: boolean;
}

export const BibleReaderView: React.FC<BibleReaderViewProps> = ({
  verses,
  isLoading,
  error,
  currentBook,
  currentChapter,
  currentVersion,
  selectedVerses,
  theme,
  fontSize,
  serif,
  showVerseNumbers,
  lineHeight,
  language,
  onToggleVerseSelect,
  getHighlight,
  onPrevChapter,
  onNextChapter,
  isFirstChapter,
  isLastChapter,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const getBookName = (book: BibleBook | null) => {
    if (!book) return '';
    return language === 'fr' && book.name_fr ? book.name_fr : book.name;
  };

  // Keyboard navigation (desktop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowLeft' && !isFirstChapter) {
        onPrevChapter();
      } else if (e.key === 'ArrowRight' && !isLastChapter) {
        onNextChapter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrevChapter, onNextChapter, isFirstChapter, isLastChapter]);

  // Touch swipe detection for mobile/tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX.current;
    const threshold = 65; // px

    if (diff > threshold && !isFirstChapter) {
      onPrevChapter(); // Swipe right -> previous chapter
    } else if (diff < -threshold && !isLastChapter) {
      onNextChapter(); // Swipe left -> next chapter
    }
    touchStartX.current = null;
  };

  const getHighlightClass = (color?: BibleHighlight['color']) => {
    switch (color) {
      case 'yellow':
        return 'bg-amber-300/40 dark:bg-amber-400/30 rounded px-1 -mx-1';
      case 'green':
        return 'bg-emerald-300/40 dark:bg-emerald-400/30 rounded px-1 -mx-1';
      case 'blue':
        return 'bg-sky-300/40 dark:bg-sky-400/30 rounded px-1 -mx-1';
      case 'pink':
        return 'bg-rose-300/40 dark:bg-rose-400/30 rounded px-1 -mx-1';
      case 'purple':
        return 'bg-purple-300/40 dark:bg-purple-400/30 rounded px-1 -mx-1';
      default:
        return '';
    }
  };

  // Theme wrappers
  const themeClasses = {
    light: 'bg-background text-foreground',
    sepia: 'bg-[#fbf0d9] text-[#2c2217] selection:bg-[#ecd5af]',
    dark: 'bg-[#121212] text-[#e0e0e0] selection:bg-neutral-800',
  }[theme];

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={cn(
        'relative min-h-[calc(100vh-140px)] w-full max-w-full overflow-x-hidden transition-colors duration-200 select-text',
        themeClasses
      )}
    >
      {/* Floating Left/Right Chapter Nav for Desktop (hidden on mobile/tablet) */}
      <div className="hidden lg:block">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrevChapter}
          disabled={isFirstChapter}
          className="fixed left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-lg border-border/80 bg-background/80 backdrop-blur-md opacity-40 hover:opacity-100 transition-opacity z-20"
          title="Previous Chapter (Left Arrow)"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onNextChapter}
          disabled={isLastChapter}
          className="fixed right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-lg border-border/80 bg-background/80 backdrop-blur-md opacity-40 hover:opacity-100 transition-opacity z-20"
          title="Next Chapter (Right Arrow)"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* Chapter Title Heading */}
        <div className="text-center mb-8 sm:mb-12 space-y-1">
          <h1
            className={cn(
              'text-2xl sm:text-3xl font-bold tracking-tight',
              serif ? 'font-serif' : 'font-sans'
            )}
          >
            {getBookName(currentBook)} {currentChapter}
          </h1>
          <p className="text-xs uppercase tracking-widest opacity-60 font-medium">
            {currentVersion?.name || 'King James Version'} ({currentVersion?.code})
          </p>
        </div>

        {/* Reading Text Content */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full rounded-md opacity-70" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 space-y-2 opacity-80">
            <p className="font-medium">
              {language === 'fr' ? 'Erreur de chargement' : 'Error loading chapter'}
            </p>
            <p className="text-xs opacity-75">{error.message}</p>
          </div>
        ) : verses && verses.length > 0 ? (
          <div
            className={cn(
              'space-y-4 leading-relaxed transition-all text-justify [text-justify:inter-word]',
              serif ? 'font-serif' : 'font-sans'
            )}
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight,
            }}
          >
            {verses.map((v) => {
              const isSelected = selectedVerses.some((sv) => sv.verse === v.verse);
              const highlight = getHighlight(v.verse);
              const highlightClass = getHighlightClass(highlight?.color);

              return (
                <span
                  key={v.verse}
                  onClick={() => onToggleVerseSelect(v)}
                  className={cn(
                    'cursor-pointer transition-all duration-150 inline rounded-sm mr-2 py-0.5',
                    highlightClass,
                    isSelected &&
                      'border-b-2 border-primary ring-2 ring-primary/30 rounded bg-primary/10'
                  )}
                >
                  {showVerseNumbers && (
                    <sup
                      className={cn(
                        'text-[10px] font-bold mr-1 select-none transition-opacity',
                        isSelected ? 'text-primary' : 'opacity-50'
                      )}
                    >
                      {v.verse}
                    </sup>
                  )}
                  <span className="align-baseline">{v.text}</span>
                </span>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 opacity-60 space-y-3">
            <Book className="h-10 w-10 mx-auto opacity-40" />
            <p className="text-sm font-medium">
              {language === 'fr' ? 'Aucun verset disponible' : 'No verses found in this chapter.'}
            </p>
          </div>
        )}

        {/* End of Chapter Navigation Prompts */}
        {!isLoading && verses && verses.length > 0 && (
          <div className="mt-16 pt-8 border-t border-current/10 flex items-center justify-between text-xs opacity-70">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevChapter}
              disabled={isFirstChapter}
              className="gap-1 rounded-xl"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>{language === 'fr' ? 'Chapitre précédent' : 'Previous Chapter'}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onNextChapter}
              disabled={isLastChapter}
              className="gap-1 rounded-xl"
            >
              <span>{language === 'fr' ? 'Chapitre suivant' : 'Next Chapter'}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
