import React, { useState } from 'react';
import { BibleVerse, BibleBook, BibleVersion } from '@/hooks/useBible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Copy, Download, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useIsTablet } from '@/hooks/use-tablet';

interface BibleVerseImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVerses: BibleVerse[];
  currentBook: BibleBook | null;
  currentChapter: number;
  currentVersion: BibleVersion | null;
  language: string;
}

const BACKGROUND_GRADIENTS = [
  'from-amber-700 via-orange-800 to-amber-950',
  'from-sky-700 via-indigo-900 to-slate-950',
  'from-emerald-800 via-teal-900 to-zinc-950',
  'from-purple-800 via-violet-950 to-neutral-950',
  'from-rose-800 via-pink-950 to-stone-950',
];

export const BibleVerseImageModal: React.FC<BibleVerseImageModalProps> = ({
  open,
  onOpenChange,
  selectedVerses,
  currentBook,
  currentChapter,
  currentVersion,
  language,
}) => {
  const isTabletOrMobile = useIsTablet();
  const [selectedBg, setSelectedBg] = useState(0);

  const sortedVerses = [...selectedVerses].sort((a, b) => a.verse - b.verse);
  const verseNums = sortedVerses.map((v) => v.verse);
  const bookName =
    language === 'fr' && currentBook?.name_fr ? currentBook.name_fr : currentBook?.name || '';
  const verseRange =
    verseNums.length === 1
      ? `${verseNums[0]}`
      : `${verseNums[0]}-${verseNums[verseNums.length - 1]}`;
  const reference = `${bookName} ${currentChapter}:${verseRange}`;
  const combinedText = sortedVerses.map((v) => v.text).join(' ');

  const handleCopyText = async () => {
    const citation = `"${combinedText}"\n— ${reference} (${currentVersion?.code || 'KJV'})`;
    await navigator.clipboard.writeText(citation);
    toast.success('Verse card text copied!');
  };

  const handleShareNative = async () => {
    const citation = `"${combinedText}"\n— ${reference} (${currentVersion?.code || 'KJV'})`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: reference,
          text: citation,
        });
      } catch {
        // Ignored if cancelled
      }
    } else {
      handleCopyText();
    }
  };

  const renderContent = () => (
    <div className="flex flex-col p-4 sm:p-6 space-y-4">
      {/* Shareable Card Canvas */}
      <div
        className={cn(
          'relative w-full rounded-3xl p-6 sm:p-8 flex flex-col justify-between min-h-[260px] sm:min-h-[300px] shadow-2xl bg-gradient-to-br text-white transition-all',
          BACKGROUND_GRADIENTS[selectedBg]
        )}
      >
        <div className="space-y-4">
          <div className="text-white/60 text-xs font-mono tracking-widest uppercase">
            Word of God
          </div>
          <p className="font-serif text-lg sm:text-xl md:text-2xl leading-relaxed italic text-white/95 line-clamp-6">
            "{combinedText}"
          </p>
        </div>

        <div className="pt-4 border-t border-white/20 flex items-center justify-between mt-auto">
          <div>
            <div className="font-bold text-sm sm:text-base text-white tracking-wide">
              {reference}
            </div>
            <div className="text-[11px] text-white/70 uppercase tracking-wider">
              {currentVersion?.name || 'King James Version'}
            </div>
          </div>
          <div className="text-[10px] tracking-widest text-white/50 uppercase font-bold">
            WCA HUB
          </div>
        </div>
      </div>

      {/* Style Chooser */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-xs text-muted-foreground font-medium">Style Background</span>
        <div className="flex items-center gap-2">
          {BACKGROUND_GRADIENTS.map((gradient, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedBg(idx)}
              className={cn(
                'h-6 w-6 rounded-full bg-gradient-to-br transition-all border border-white/40',
                gradient,
                selectedBg === idx ? 'ring-2 ring-primary scale-110' : 'opacity-80 hover:opacity-100'
              )}
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        <Button
          variant="outline"
          onClick={handleCopyText}
          className="rounded-xl gap-1.5 h-10 font-medium"
        >
          <Copy className="h-4 w-4" />
          <span>Copy Text</span>
        </Button>
        <Button
          onClick={handleShareNative}
          className="rounded-xl gap-1.5 h-10 font-medium shadow-md"
        >
          <Share2 className="h-4 w-4" />
          <span>Share Passage</span>
        </Button>
      </div>
    </div>
  );

  if (isTabletOrMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="rounded-t-3xl max-h-[90vh]">
          <DrawerHeader className="pb-0 pt-3">
            <DrawerTitle className="text-center text-sm font-semibold text-muted-foreground">
              Verse Share Card
            </DrawerTitle>
          </DrawerHeader>
          {renderContent()}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl shadow-2xl border-border/80">
        <DialogHeader className="sr-only">
          <DialogTitle>Verse Share Card</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};
