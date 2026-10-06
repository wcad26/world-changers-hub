import React from 'react';
import { BibleVerse, BibleBook, BibleVersion, useBibleVersions } from '@/hooks/useBible';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useIsTablet } from '@/hooks/use-tablet';

interface BibleCompareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verse: BibleVerse | null;
  book: BibleBook | null;
  chapter: number;
  language: string;
}

export const BibleCompareModal: React.FC<BibleCompareModalProps> = ({
  open,
  onOpenChange,
  verse,
  book,
  chapter,
  language,
}) => {
  const isTabletOrMobile = useIsTablet();
  const { data: versions } = useBibleVersions();

  const getBookName = (b: BibleBook | null) => {
    if (!b) return '';
    return language === 'fr' && b.name_fr ? b.name_fr : b.name;
  };

  const reference = verse && book ? `${getBookName(book)} ${chapter}:${verse.verse}` : '';

  // Query this specific verse across all active versions
  const { data: comparedVerses, isLoading } = useQuery({
    queryKey: ['bible-compare-verse', book?.book_number, chapter, verse?.verse, versions?.length],
    enabled: open && !!book && !!verse && !!versions && versions.length > 0,
    queryFn: async () => {
      if (!book || !verse || !versions) return [];
      
      const { fetchChapterVerses } = await import('@/services/bibleService');
      const results: { version_id: string; code: string; name: string; text: string }[] = [];

      for (const ver of versions) {
        try {
          const chVerses = await fetchChapterVerses(ver, book.book_number, chapter);
          const matched = chVerses.find((v) => v.verse === verse.verse);
          if (matched) {
            results.push({
              version_id: ver.id,
              code: ver.code,
              name: ver.name,
              text: matched.text,
            });
          }
        } catch (e) {
          console.warn(`Failed to compare version ${ver.code}:`, e);
        }
      }

      return results;
    },
  });

  const handleCopy = async (verCode: string, text: string) => {
    const citation = `"${text}" — ${reference} (${verCode})`;
    await navigator.clipboard.writeText(citation);
    toast.success(`Copied (${verCode})`);
  };

  const renderContent = () => (
    <div className="flex flex-col h-[65vh] sm:h-[460px]">
      <div className="p-4 border-b border-border/70 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="font-bold text-base">{reference}</span>
        </div>
        <span className="text-xs text-muted-foreground">Compare Translations</span>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : comparedVerses && comparedVerses.length > 0 ? (
          <div className="space-y-3">
            {comparedVerses.map((item) => {
              const code = item.code || 'VER';
              const name = item.name || '';

              return (
                <div
                  key={item.version_id}
                  className="p-3.5 rounded-2xl border border-border/70 bg-card hover:bg-accent/40 transition-colors space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase">
                        {code}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">{name}</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-70 group-hover:opacity-100"
                      onClick={() => handleCopy(code, item.text)}
                      title="Copy this version"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm font-serif leading-relaxed text-foreground">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No other local translations available to compare this verse.
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
            <DrawerTitle>{reference} - Compare</DrawerTitle>
          </DrawerHeader>
          {renderContent()}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl shadow-2xl border-border/80">
        <DialogHeader className="sr-only">
          <DialogTitle>{reference} - Compare</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};
