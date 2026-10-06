import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ChevronLeft, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsTablet } from '@/hooks/use-tablet';

interface BiblePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  books: BibleBook[];
  currentBook: BibleBook | null;
  currentChapter: number;
  language: string;
  onSelect: (book: BibleBook, chapter: number) => void;
}

export const BiblePickerModal: React.FC<BiblePickerModalProps> = ({
  open,
  onOpenChange,
  books,
  currentBook,
  currentChapter,
  language,
  onSelect,
}) => {
  const isTabletOrMobile = useIsTablet();
  const [activeTab, setActiveTab] = useState<'OT' | 'NT'>('OT');
  const [searchQuery, setSearchQuery] = useState('');
  const [browsingBook, setBrowsingBook] = useState<BibleBook | null>(null);

  // Sync browsing book when opened
  React.useEffect(() => {
    if (open) {
      setBrowsingBook(null);
      setSearchQuery('');
      if (currentBook) {
        setActiveTab(currentBook.testament as 'OT' | 'NT');
      }
    }
  }, [open, currentBook]);

  const getBookName = (book: BibleBook) => {
    return language === 'fr' && book.name_fr ? book.name_fr : book.name;
  };

  const filteredBooks = books.filter((book) => {
    const name = getBookName(book).toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase().trim());
    if (searchQuery.trim().length > 0) return matchesSearch;
    return book.testament === activeTab;
  });

  const handleBookClick = (book: BibleBook) => {
    setBrowsingBook(book);
  };

  const handleChapterClick = (chapter: number) => {
    if (browsingBook) {
      onSelect(browsingBook, chapter);
      onOpenChange(false);
    }
  };

  const renderContent = () => (
    <div className="flex flex-col h-[70vh] sm:h-[540px]">
      {/* Top Search & Navigation */}
      <div className="p-3 sm:p-4 space-y-3 border-b border-border/70 shrink-0">
        {browsingBook ? (
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBrowsingBook(null)}
              className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground font-medium"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Books</span>
            </Button>
            <div className="text-sm font-semibold flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-primary" />
              {getBookName(browsingBook)}
            </div>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'fr' ? 'Rechercher un livre...' : 'Search books...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-accent/40 border-border/80 focus-visible:ring-primary"
              />
            </div>

            {searchQuery.trim().length === 0 && (
              <Tabs
                value={activeTab}
                onValueChange={(val) => setActiveTab(val as 'OT' | 'NT')}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 rounded-xl h-9 bg-muted/60 p-1">
                  <TabsTrigger value="OT" className="rounded-lg text-xs font-semibold">
                    {language === 'fr' ? 'Ancien Testament' : 'Old Testament'} (39)
                  </TabsTrigger>
                  <TabsTrigger value="NT" className="rounded-lg text-xs font-semibold">
                    {language === 'fr' ? 'Nouveau Testament' : 'New Testament'} (27)
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </>
        )}
      </div>

      {/* Main Grid View */}
      <ScrollArea className="flex-1 p-3 sm:p-4">
        {browsingBook ? (
          /* Chapter Selection Grid */
          <div className="space-y-3">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-1">
              Select Chapter (1 - {browsingBook.chapters_count})
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {Array.from({ length: browsingBook.chapters_count }, (_, i) => i + 1).map((ch) => {
                const isCurrent =
                  currentBook?.book_number === browsingBook.book_number && currentChapter === ch;
                return (
                  <Button
                    key={ch}
                    variant={isCurrent ? 'default' : 'outline'}
                    onClick={() => handleChapterClick(ch)}
                    className={cn(
                      'h-12 text-base font-semibold rounded-xl transition-all',
                      isCurrent
                        ? 'shadow-md scale-[1.02]'
                        : 'border-border/70 hover:bg-primary/10 hover:border-primary/40'
                    )}
                  >
                    {ch}
                  </Button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Books Grid / List */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filteredBooks.length > 0 ? (
              filteredBooks.map((book) => {
                const isCurrent = currentBook?.book_number === book.book_number;
                return (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => handleBookClick(book)}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl border text-left transition-all',
                      isCurrent
                        ? 'border-primary/70 bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border/60 hover:bg-accent/60 hover:border-border text-foreground font-medium'
                    )}
                  >
                    <span className="text-sm truncate mr-1">{getBookName(book)}</span>
                    <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                      {book.chapters_count} ch
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground text-sm">
                No books matching "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  // If Mobile or Tablet: Bottom Drawer Sheet for ergonomic touch operation
  if (isTabletOrMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="rounded-t-3xl max-h-[90vh]">
          <DrawerHeader className="pb-1 pt-3">
            <DrawerTitle className="text-center text-sm font-semibold text-muted-foreground">
              {browsingBook ? getBookName(browsingBook) : 'Select Scripture'}
            </DrawerTitle>
          </DrawerHeader>
          {renderContent()}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Centered Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl shadow-2xl border-border/80">
        <DialogHeader className="sr-only">
          <DialogTitle>Select Scripture</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};
