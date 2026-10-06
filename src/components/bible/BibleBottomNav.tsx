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
    <nav className="fixed bottom-0 inset-x-0 z-20 w-full max-w-full overflow-hidden backdrop-blur-md bg-background/95 border-t border-border/70 py-2 px-2 sm:px-6 safe-area-pb box-border shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-1 sm:gap-2 min-w-0">
        {/* Previous Chapter Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevChapter}
          disabled={isFirstChapter}
          className="h-9 sm:h-10 px-2.5 sm:px-4 rounded-xl font-medium gap-1 text-xs sm:text-sm border-border/80 hover:bg-accent active:scale-95 transition-all shadow-xs shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden xs:inline">{language === 'fr' ? 'Précédent' : 'Prev'}</span>
        </Button>

        {/* Center Chapter Indicator (Clickable to jump) */}
        <button
          type="button"
          onClick={onOpenBookPicker}
          className="px-2 py-1 rounded-xl hover:bg-accent/60 transition-colors flex flex-col items-center justify-center text-center min-w-0 shrink"
        >
          <span className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1 truncate max-w-[150px] xs:max-w-none">
            <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">{getBookName(currentBook)} {currentChapter}</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-mono truncate">
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
