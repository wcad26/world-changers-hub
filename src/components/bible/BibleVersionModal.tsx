import React, { useState } from 'react';
import { BibleVersion } from '@/hooks/useBible';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Globe, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsTablet } from '@/hooks/use-tablet';

interface BibleVersionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: BibleVersion[];
  currentVersion: BibleVersion | null;
  language: string;
  onSelect: (version: BibleVersion) => void;
}

export const BibleVersionModal: React.FC<BibleVersionModalProps> = ({
  open,
  onOpenChange,
  versions,
  currentVersion,
  language,
  onSelect,
}) => {
  const isTabletOrMobile = useIsTablet();
  const [langTab, setLangTab] = useState<string>(language === 'fr' ? 'fr' : 'en');

  React.useEffect(() => {
    if (open) {
      if (currentVersion?.language) {
        setLangTab(currentVersion.language);
      }
    }
  }, [open, currentVersion]);

  const filteredVersions = versions.filter((v) => v.language === langTab);

  const renderContent = () => (
    <div className="flex flex-col h-[65vh] sm:h-[480px]">
      <div className="p-3 sm:p-4 border-b border-border/70 shrink-0 space-y-3">
        <Tabs value={langTab} onValueChange={setLangTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-xl h-10 bg-muted/60 p-1">
            <TabsTrigger value="en" className="rounded-lg text-xs font-semibold gap-1.5">
              <Globe className="h-3.5 w-3.5" /> English (
              {versions.filter((v) => v.language === 'en').length})
            </TabsTrigger>
            <TabsTrigger value="fr" className="rounded-lg text-xs font-semibold gap-1.5">
              <Globe className="h-3.5 w-3.5" /> Français (
              {versions.filter((v) => v.language === 'fr').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1 p-3 sm:p-4">
        <div className="space-y-2">
          {filteredVersions.map((ver) => {
            const isSelected = currentVersion?.id === ver.id;
            return (
              <button
                key={ver.id}
                type="button"
                onClick={() => {
                  onSelect(ver);
                  onOpenChange(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all',
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-xs'
                    : 'border-border/60 hover:bg-accent/60 hover:border-border'
                )}
              >
                <div className="space-y-1 pr-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-sm font-bold uppercase tracking-wide px-2 py-0.5 rounded-md text-xs',
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                      )}
                    >
                      {ver.code}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{ver.name}</span>
                    {ver.is_stored && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                        <Sparkles className="h-2.5 w-2.5" /> Fast
                      </span>
                    )}
                  </div>
                  {ver.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 pl-1">
                      {ver.description}
                    </p>
                  )}
                </div>

                {isSelected ? (
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full border border-border/80 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );

  if (isTabletOrMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="rounded-t-3xl max-h-[85vh]">
          <DrawerHeader className="pb-1 pt-3">
            <DrawerTitle className="text-center text-sm font-semibold text-muted-foreground">
              Select Bible Translation
            </DrawerTitle>
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
          <DialogTitle>Select Bible Translation</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};
