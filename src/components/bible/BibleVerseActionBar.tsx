import React from 'react';
import { BibleVerse, BibleBook, BibleVersion } from '@/hooks/useBible';
import { BibleHighlight } from '@/hooks/useBiblePreferences';
import { Button } from '@/components/ui/button';
import {
  Copy,
  Share2,
  Bookmark,
  BookmarkCheck,
  Columns2,
  X,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BibleVerseActionBarProps {
  selectedVerses: BibleVerse[];
  currentBook: BibleBook | null;
  currentChapter: number;
  currentVersion: BibleVersion | null;
  isBookmarked: boolean;
  onClearSelection: () => void;
  onHighlight: (color: BibleHighlight['color']) => void;
  onRemoveHighlight: () => void;
  onToggleBookmark: () => void;
  onOpenCompare: () => void;
  onOpenShareModal: () => void;
  language: string;
}

const HIGHLIGHT_COLORS: { color: BibleHighlight['color']; label: string; bgClass: string }[] = [
  { color: 'yellow', label: 'Yellow', bgClass: 'bg-amber-300 dark:bg-amber-500/80 hover:scale-110' },
  { color: 'green', label: 'Green', bgClass: 'bg-emerald-300 dark:bg-emerald-500/80 hover:scale-110' },
  { color: 'blue', label: 'Blue', bgClass: 'bg-sky-300 dark:bg-sky-500/80 hover:scale-110' },
  { color: 'pink', label: 'Pink', bgClass: 'bg-rose-300 dark:bg-rose-500/80 hover:scale-110' },
  { color: 'purple', label: 'Purple', bgClass: 'bg-purple-300 dark:bg-purple-500/80 hover:scale-110' },
];

export const BibleVerseActionBar: React.FC<BibleVerseActionBarProps> = ({
  selectedVerses,
  currentBook,
  currentChapter,
  currentVersion,
  isBookmarked,
  onClearSelection,
  onHighlight,
  onRemoveHighlight,
  onToggleBookmark,
  onOpenCompare,
  onOpenShareModal,
  language,
}) => {
  if (selectedVerses.length === 0) return null;

  const sortedVerses = [...selectedVerses].sort((a, b) => a.verse - b.verse);
  const verseNums = sortedVerses.map((v) => v.verse);
  const bookName =
    language === 'fr' && currentBook?.name_fr ? currentBook.name_fr : currentBook?.name || '';
  const verseRange =
    verseNums.length === 1
      ? `${verseNums[0]}`
      : `${verseNums[0]}-${verseNums[verseNums.length - 1]}`;
  const reference = `${bookName} ${currentChapter}:${verseRange}`;

  const handleCopy = async () => {
    const formattedText = sortedVerses
      .map((v) => `${v.verse}. ${v.text}`)
      .join('\n');
    const citation = `"${formattedText}"\n— ${reference} (${currentVersion?.code || 'KJV'})`;

    try {
      await navigator.clipboard.writeText(citation);
      toast.success(
        language === 'fr' ? 'Passage copié dans le presse-papiers' : 'Passage copied to clipboard'
      );
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="fixed bottom-14 sm:bottom-6 left-0 right-0 z-40 px-3 sm:px-6 pointer-events-none animate-in slide-in-from-bottom-5 duration-200">
      <div className="max-w-xl mx-auto pointer-events-auto bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl sm:rounded-3xl p-3 sm:p-4 space-y-3">
        {/* Top Info Bar */}
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {reference}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              ({selectedVerses.length} {selectedVerses.length === 1 ? 'verse' : 'verses'})
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClearSelection}
            className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Highlight Color Palette */}
        <div className="flex items-center justify-between gap-1 pt-0.5">
          <div className="flex items-center gap-2 sm:gap-2.5">
            {HIGHLIGHT_COLORS.map(({ color, label, bgClass }) => (
              <button
                key={color}
                type="button"
                onClick={() => onHighlight(color)}
                title={`Highlight in ${label}`}
                className={cn(
                  'h-6 w-6 sm:h-7 sm:w-7 rounded-full shadow-xs border border-white/20 transition-all',
                  bgClass
                )}
              />
            ))}
            <button
              type="button"
              onClick={onRemoveHighlight}
              title="Remove highlight"
              className="text-[11px] text-muted-foreground hover:text-foreground underline pl-1"
            >
              Clear
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Copy */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-2 sm:px-2.5 rounded-xl gap-1 text-xs font-medium hover:bg-accent"
              title="Copy"
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Copy</span>
            </Button>

            {/* Share / Image */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenShareModal}
              className="h-8 px-2 sm:px-2.5 rounded-xl gap-1 text-xs font-medium hover:bg-accent"
              title="Share Card"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Share</span>
            </Button>

            {/* Compare (available if single verse) */}
            {selectedVerses.length === 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenCompare}
                className="h-8 px-2 sm:px-2.5 rounded-xl gap-1 text-xs font-medium hover:bg-accent"
                title="Compare Translations"
              >
                <Columns2 className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Compare</span>
              </Button>
            )}

            {/* Bookmark */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleBookmark}
              className="h-8 px-2 sm:px-2.5 rounded-xl gap-1 text-xs font-medium hover:bg-accent"
              title="Bookmark"
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-3.5 w-3.5 text-primary fill-primary" />
              ) : (
                <Bookmark className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
