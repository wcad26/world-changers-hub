import React from 'react';
import { BibleBook } from '@/hooks/useBible';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BibleBottomNavProps {
  currentBook: BibleBook | null;
  currentChapter: number;
  totalChapters: number;
  isFirstChapter: boolean;
  isLastChapter: boolean;
  language: string;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onOpenBookPicker: () => void;
}

export const BibleBottomNav: React.FC<BibleBottomNavProps> = ({
  currentBook,
  currentChapter,
  totalChapters,
  isFirstChapter,
  isLastChapter,
  language,
  onPrevChapter,
  onNextChapter,
  onOpenBookPicker,
}) => {
  const getBookName = (book: BibleBook | null) => {
    if (!book) return 'Genesis';
    return language === 'fr' && book.name_fr ? book.name_fr : book.name;
  };

  return (
    <nav className="sticky bottom-0 z-20 w-full backdrop-blur-md bg-background/95 border-t border-border/70 py-2 px-3 sm:px-6 safe-area-pb">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
        {/* Previous Chapter Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevChapter}
          disabled={isFirstChapter}
          className="h-10 px-3 sm:px-4 rounded-xl font-medium gap-1 text-xs sm:text-sm border-border/80 hover:bg-accent active:scale-95 transition-all shadow-xs"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden xs:inline">{language === 'fr' ? 'Précédent' : 'Prev'}</span>
        </Button>

        {/* Center Chapter Indicator (Clickable to jump) */}
        <button
          type="button"
          onClick={onOpenBookPicker}
          className="px-3 py-1.5 rounded-xl hover:bg-accent/60 transition-colors flex flex-col items-center justify-center text-center"
        >
          <span className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            {getBookName(currentBook)} {currentChapter}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            Chapter {currentChapter} of {totalChapters}
          </span>
        </button>

        {/* Next Chapter Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onNextChapter}
          disabled={isLastChapter}
          className="h-10 px-3 sm:px-4 rounded-xl font-medium gap-1 text-xs sm:text-sm border-border/80 hover:bg-accent active:scale-95 transition-all shadow-xs"
        >
          <span className="hidden xs:inline">{language === 'fr' ? 'Suivant' : 'Next'}</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
};
