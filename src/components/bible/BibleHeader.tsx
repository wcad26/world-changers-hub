import React from 'react';
import { BibleBook, BibleVersion } from '@/hooks/useBible';
import { BibleDisplaySettings } from './BibleDisplaySettings';
import { BibleTheme } from '@/hooks/useBiblePreferences';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { ChevronDown, Search, Bookmark, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BibleHeaderProps {
  currentBook: BibleBook | null;
  currentChapter: number;
  currentVersion: BibleVersion | null;
  language: string;
  theme: BibleTheme;
  fontSize: number;
  serif: boolean;
  showVerseNumbers: boolean;
  lineHeight: number;
  onOpenBookPicker: () => void;
  onOpenVersionPicker: () => void;
  onOpenBookmarks?: () => void;
  onOpenMorePages?: () => void;
  onThemeChange: (theme: BibleTheme) => void;
  onFontSizeChange: (size: number) => void;
  onSerifChange: (serif: boolean) => void;
  onShowVerseNumbersChange: (show: boolean) => void;
  onLineHeightChange: (height: number) => void;
}

export const BibleHeader: React.FC<BibleHeaderProps> = ({
  currentBook,
  currentChapter,
  currentVersion,
  language,
  theme,
  fontSize,
  serif,
  showVerseNumbers,
  lineHeight,
  onOpenBookPicker,
  onOpenVersionPicker,
  onOpenBookmarks,
  onOpenMorePages,
  onThemeChange,
  onFontSizeChange,
  onSerifChange,
  onShowVerseNumbersChange,
  onLineHeightChange,
}) => {
  const getBookName = (book: BibleBook | null) => {
    if (!book) return 'Genesis';
    return language === 'fr' && book.name_fr ? book.name_fr : book.name;
  };

  return (
    <header className="sticky top-0 z-30 w-full max-w-full overflow-hidden backdrop-blur-md bg-background/90 border-b border-border/70 transition-colors">
      <div className="w-full max-w-full px-2 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-1 sm:gap-2">
        {/* Left: Book & Chapter Selector Pill + Version */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 shrink">
          <Button
            variant="ghost"
            onClick={onOpenBookPicker}
            className="h-9 sm:h-10 px-2 sm:px-3.5 rounded-full font-bold text-xs sm:text-base hover:bg-accent/80 flex items-center gap-1 transition-all active:scale-95 shrink min-w-0"
            aria-label="Select book and chapter"
          >
            <span className="truncate max-w-[85px] xs:max-w-[120px] sm:max-w-none">
              {getBookName(currentBook)} {currentChapter}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Button>

          {/* Version Selector Pill */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenVersionPicker}
            className="h-7 sm:h-8 px-2 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider border-border/80 hover:bg-accent/80 transition-all active:scale-95 shrink-0"
            aria-label="Select Bible translation"
          >
            <span>{currentVersion?.code || 'KJV'}</span>
            <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 ml-0.5 sm:ml-1 text-muted-foreground shrink-0" />
          </Button>
        </div>

        {/* Right: Quick Tools (Bookmarks, Search, Appearance AA, ThemeToggle, and More Grid Button) */}
        <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
          {onOpenBookmarks && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenBookmarks}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full text-muted-foreground hover:text-foreground shrink-0"
              title="Saved Bookmarks"
            >
              <Bookmark className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}

          {/* Quick Search trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenBookPicker}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full text-muted-foreground hover:text-foreground shrink-0"
            title="Search Scripture"
          >
            <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>

          {/* YouVersion-style AA Appearance Trigger */}
          <BibleDisplaySettings
            theme={theme}
            fontSize={fontSize}
            serif={serif}
            showVerseNumbers={showVerseNumbers}
            lineHeight={lineHeight}
            onThemeChange={onThemeChange}
            onFontSizeChange={onFontSizeChange}
            onSerifChange={onSerifChange}
            onShowVerseNumbersChange={onShowVerseNumbersChange}
            onLineHeightChange={onLineHeightChange}
          />

          {/* System Dark / Light Mode Switcher */}
          <div className="shrink-0 scale-90 sm:scale-100">
            <ThemeToggle />
          </div>

          {/* Member Portal "More" Grid Button */}
          {onOpenMorePages && (
            <Button
              size="icon"
              onClick={onOpenMorePages}
              aria-label="Member portal pages"
              className={cn(
                'h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-transform active:scale-95 ml-0.5 shrink-0'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
