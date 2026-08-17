import React from 'react';
import { Repeat } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { WEEKDAYS, type RecurrenceInput, type RecurrenceFrequency } from '@/hooks/useRecurringEvents';

interface RecurrenceSettingsProps {
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  value: RecurrenceInput;
  onChange: (value: RecurrenceInput) => void;
  className?: string;
}

export const RecurrenceSettings: React.FC<RecurrenceSettingsProps> = ({
  enabled,
  onEnabledChange,
  value,
  onChange,
  className,
}) => {
  const set = (patch: Partial<RecurrenceInput>) => onChange({ ...value, ...patch });

  const toggleDay = (day: number) => {
    const days = value.days_of_week.includes(day)
      ? value.days_of_week.filter((d) => d !== day)
      : [...value.days_of_week, day].sort();
    set({ days_of_week: days });
  };

  return (
    <div className={cn('rounded-lg border border-border/60 bg-muted/30 p-4 space-y-4', className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-primary" />
          <div>
            <Label className="text-sm font-medium">Repeat this event</Label>
            <p className="text-xs text-muted-foreground">
              Future occurrences are created automatically, with attendance sessions.
            </p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </div>

      {enabled && (
        <div className="space-y-4 pt-2 border-t border-border/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Frequency</Label>
              <Select
                value={value.frequency}
                onValueChange={(v) => set({ frequency: v as RecurrenceFrequency })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                  <SelectItem value="monthly">Monthly (same weekday)</SelectItem>
                  <SelectItem value="custom_days">Custom day interval</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Create events ahead</Label>
              <Select
                value={String(value.lead_time_days)}
                onValueChange={(v) => set({ lead_time_days: Number(v) })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">1 week ahead</SelectItem>
                  <SelectItem value="30">1 month ahead</SelectItem>
                  <SelectItem value="90">3 months ahead</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {value.frequency === 'custom_days' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Repeat every (days)</Label>
              <Input
                type="number"
                min={1}
                value={value.interval_count}
                onChange={(e) => set({ interval_count: Math.max(1, Number(e.target.value) || 1) })}
              />
            </div>
          )}

          {(value.frequency === 'weekly' || value.frequency === 'biweekly') && (
            <div className="space-y-1.5">
              <Label className="text-xs">Days of the week</Label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    size="sm"
                    variant={value.days_of_week.includes(day.value) ? 'default' : 'outline'}
                    className="h-8 px-3"
                    onClick={() => toggleDay(day.value)}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Leave empty to use the weekday of the first event.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">End date (optional)</Label>
            <Input
              type="date"
              value={value.end_date ?? ''}
              onChange={(e) => set({ end_date: e.target.value || null })}
            />
            <p className="text-[11px] text-muted-foreground">
              Leave empty to repeat indefinitely. You can pause the series any time.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurrenceSettings;
