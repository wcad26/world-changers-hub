import React from 'react';
import { BibleBookmark } from '@/hooks/useBiblePreferences';
import { BibleBook } from '@/hooks/useBible';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bookmark, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsTablet } from '@/hooks/use-tablet';

interface BibleBookmarksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookmarks: BibleBookmark[];
  books: BibleBook[];
  onNavigateToBookmark: (book: BibleBook, chapter: number, verse: number) => void;
  onRemoveBookmark: (bookmark: BibleBookmark) => void;
}

export const BibleBookmarksModal: React.FC<BibleBookmarksModalProps> = ({
  open,
  onOpenChange,
  bookmarks,
  books,
  onNavigateToBookmark,
  onRemoveBookmark,
}) => {
  const isTabletOrMobile = useIsTablet();

  const handleSelect = (b: BibleBookmark) => {
    const matchedBook = books.find((item) => item.book_number === b.bookNumber);
    if (matchedBook) {
      onNavigateToBookmark(matchedBook, b.chapter, b.verse);
      onOpenChange(false);
    }
  };

  const renderContent = () => (
    <div className="flex flex-col h-[65vh] sm:h-[460px]">
      <div className="p-4 border-b border-border/70 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-primary" />
          <span className="font-bold text-base">Saved Bookmarks</span>
        </div>
        <span className="text-xs text-muted-foreground">{bookmarks.length} saved</span>
      </div>

      <ScrollArea className="flex-1 p-4">
        {bookmarks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground space-y-2">
            <Bookmark className="h-10 w-10 mx-auto opacity-30" />
            <p className="text-sm">No saved bookmarks yet.</p>
            <p className="text-xs opacity-75">
              Select any verse while reading to bookmark your favorite passages.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="p-3.5 rounded-2xl border border-border/70 bg-card hover:bg-accent/40 transition-colors flex items-start justify-between gap-3 group"
              >
                <div
                  className="space-y-1 cursor-pointer flex-1"
                  onClick={() => handleSelect(bm)}
                >
                  <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <span>
                      {bm.bookName} {bm.chapter}:{bm.verse}
                    </span>
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs font-serif text-muted-foreground line-clamp-2">
                    "{bm.verseText}"
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => onRemoveBookmark(bm)}
                  title="Remove Bookmark"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  if (isTabletOrMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="rounded-t-3xl max-h-[85vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Saved Bookmarks</DrawerTitle>
          </DrawerHeader>
          {renderContent()}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl shadow-2xl border-border/80">
        <DialogHeader className="sr-only">
          <DialogTitle>Saved Bookmarks</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};
