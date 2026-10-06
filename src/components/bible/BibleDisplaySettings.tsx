import React from 'react';
import { BibleTheme } from '@/hooks/useBiblePreferences';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sun, Moon, Palette, Type, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BibleDisplaySettingsProps {
  theme: BibleTheme;
  fontSize: number;
  serif: boolean;
  showVerseNumbers: boolean;
  lineHeight: number;
  onThemeChange: (theme: BibleTheme) => void;
  onFontSizeChange: (size: number) => void;
  onSerifChange: (serif: boolean) => void;
  onShowVerseNumbersChange: (show: boolean) => void;
  onLineHeightChange: (height: number) => void;
}

export const BibleDisplaySettings: React.FC<BibleDisplaySettingsProps> = ({
  theme,
  fontSize,
  serif,
  showVerseNumbers,
  lineHeight,
  onThemeChange,
  onFontSizeChange,
  onSerifChange,
  onShowVerseNumbersChange,
  onLineHeightChange,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 gap-1.5 font-medium rounded-full border-border/80 shadow-xs hover:bg-accent"
          aria-label="Reader Appearance Settings"
        >
          <span className="font-serif font-bold text-sm">A</span>
          <span className="font-sans text-xs">A</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 p-4 space-y-4 rounded-2xl shadow-xl border border-border/80 backdrop-blur-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-border/60">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5" /> Appearance
          </span>
          <span className="text-xs text-muted-foreground">{fontSize}px</span>
        </div>

        {/* Themes (Light / Sepia / Dark) */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Reading Theme</Label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onThemeChange('light')}
              className={cn(
                'flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-xs font-medium gap-1',
                'bg-white text-neutral-900 border-neutral-200 hover:border-neutral-400',
                theme === 'light' && 'ring-2 ring-primary border-primary shadow-xs'
              )}
            >
              <Sun className="h-4 w-4 text-amber-500" />
              <span>Light</span>
            </button>

            <button
              type="button"
              onClick={() => onThemeChange('sepia')}
              className={cn(
                'flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-xs font-medium gap-1',
                'bg-[#fbf0d9] text-[#433422] border-[#ecd5af] hover:border-[#dfc190]',
                theme === 'sepia' && 'ring-2 ring-amber-600 border-amber-600 shadow-xs'
              )}
            >
              <span className="text-base leading-none">📜</span>
              <span>Sepia</span>
            </button>

            <button
              type="button"
              onClick={() => onThemeChange('dark')}
              className={cn(
                'flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-xs font-medium gap-1',
                'bg-[#121212] text-neutral-100 border-neutral-800 hover:border-neutral-700',
                theme === 'dark' && 'ring-2 ring-primary border-primary shadow-xs'
              )}
            >
              <Moon className="h-4 w-4 text-sky-400" />
              <span>Dark</span>
            </button>
          </div>
        </div>

        {/* Font Family (Serif vs Sans) */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Typeface</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="sm"
              variant={serif ? 'default' : 'outline'}
              onClick={() => onSerifChange(true)}
              className={cn('rounded-xl font-serif text-sm h-9', serif ? 'shadow-xs' : '')}
            >
              Serif (Book)
            </Button>
            <Button
              type="button"
              size="sm"
              variant={!serif ? 'default' : 'outline'}
              onClick={() => onSerifChange(false)}
              className={cn('rounded-xl font-sans text-sm h-9', !serif ? 'shadow-xs' : '')}
            >
              Sans-Serif (Modern)
            </Button>
          </div>
        </div>

        {/* Font Size Stepper & Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">Font Size</Label>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-lg"
                disabled={fontSize <= 14}
                onClick={() => onFontSizeChange(Math.max(14, fontSize - 2))}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-lg"
                disabled={fontSize >= 30}
                onClick={() => onFontSizeChange(Math.min(30, fontSize + 2))}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <Slider
            value={[fontSize]}
            min={14}
            max={30}
            step={1}
            onValueChange={([val]) => onFontSizeChange(val)}
            className="cursor-pointer"
          />
        </div>

        {/* Verse Numbers & Spacing Toggles */}
        <div className="pt-2 border-t border-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="verse-numbers-toggle" className="text-xs font-medium cursor-pointer">
              Show Verse Numbers
            </Label>
            <Switch
              id="verse-numbers-toggle"
              checked={showVerseNumbers}
              onCheckedChange={onShowVerseNumbersChange}
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
