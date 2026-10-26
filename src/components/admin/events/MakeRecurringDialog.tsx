import React, { useState, useEffect } from 'react';
import { Repeat, Calendar, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RecurrenceSettings } from './RecurrenceSettings';
import {
  useCreateRecurrenceRule,
  DEFAULT_RECURRENCE,
  type RecurrenceInput,
} from '@/hooks/useRecurringEvents';
import { useAuth } from '@/hooks/useAuth';
import { formatDateRange, formatTimeRange } from '@/utils/dateUtils';

interface MakeRecurringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: any | null;
  regionId?: string | null;
  dcgId?: string | null;
  onSuccess?: () => void;
  onOpenSeriesDialog?: () => void;
}

export const MakeRecurringDialog: React.FC<MakeRecurringDialogProps> = ({
  open,
  onOpenChange,
  event,
  regionId,
  dcgId,
  onSuccess,
  onOpenSeriesDialog,
}) => {
  const { user } = useAuth();
  const createRule = useCreateRecurrenceRule();
  const [recurrence, setRecurrence] = useState<RecurrenceInput>(DEFAULT_RECURRENCE);

  const startDate = event?.start_datetime ? new Date(event.start_datetime) : null;
  const isPast = !!(startDate && !isNaN(startDate.getTime()) && startDate < new Date());
  const isAlreadyRecurring = !!event?.recurrence_rule_id;

  // When event changes, initialize recurrence with template event's weekday
  useEffect(() => {
    if (event && startDate && !isNaN(startDate.getTime())) {
      setRecurrence({
        ...DEFAULT_RECURRENCE,
        days_of_week: [startDate.getUTCDay()],
      });
    } else {
      setRecurrence(DEFAULT_RECURRENCE);
    }
  }, [event?.id]);

  if (!event) return null;

  const handleTransform = async () => {
    try {
      await createRule.mutateAsync({
        templateEventId: event.id,
        name: event.name,
        regionId: event.region_id ?? regionId ?? null,
        dcgId: event.dcg_id ?? dcgId ?? null,
        startDatetime: event.start_datetime,
        endDatetime: event.end_datetime,
        createdBy: user?.id ?? null,
        recurrence,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // Error handled by hook's onError toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-full h-[100dvh] max-h-[100dvh] rounded-none sm:h-auto sm:max-w-2xl sm:max-h-[90vh] sm:rounded-2xl overflow-y-auto p-0 gap-0 border-0 sm:border border-border/40 bg-gradient-to-br from-card/95 to-muted/20 backdrop-blur-xl shadow-2xl rounded-2xl">
        <div className="relative overflow-hidden rounded-t-2xl border-b border-border/30 bg-gradient-to-br from-primary/15 via-primary/5 to-purple-500/10 px-6 pt-6 pb-5">
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
          <DialogHeader className="relative space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20">
                <Repeat className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold tracking-tight">
                  Make Event Recurrent
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Transform this event into an automatically recurring series
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5">
          {/* Event Context Card */}
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-base text-foreground">{event.name}</h4>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    {formatDateRange(event.start_datetime, event.end_datetime)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    {formatTimeRange(event.start_datetime, event.end_datetime)}
                  </span>
                  {event.location_name && (
                    <>
                      <span>•</span>
                      <span>{event.location_name}</span>
                    </>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {event.category || 'Event'}
              </Badge>
            </div>

            {/* Past Event Information Box */}
            {isPast && (
              <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold">Past Event:</span> This event occurred in the past. It will be used as the template (schedule, location, content, and fees). New occurrences will automatically generate starting from the next upcoming occurrence according to your recurrence schedule.
                </div>
              </div>
            )}

            {/* Already Recurring Warning */}
            {isAlreadyRecurring && (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs text-primary">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>This event is already linked to an active recurring series.</span>
                </div>
                {onOpenSeriesDialog && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs ml-2"
                    onClick={() => {
                      onOpenChange(false);
                      onOpenSeriesDialog();
                    }}
                  >
                    Manage Series
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Recurrence Configuration */}
          {!isAlreadyRecurring && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-medium text-foreground">Configure Recurrence Schedule</h4>
              </div>

              <RecurrenceSettings
                enabled={true}
                onEnabledChange={() => {}}
                value={recurrence}
                onChange={setRecurrence}
              />
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/30 bg-card/40 backdrop-blur-sm rounded-b-2xl gap-2">
          <Button
            type="button"
            variant="outline"
            className="bg-background/60 border-border/50"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          {!isAlreadyRecurring && (
            <Button
              type="button"
              disabled={createRule.isPending}
              onClick={handleTransform}
              className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30"
            >
              <Repeat className={`h-4 w-4 mr-2 ${createRule.isPending ? 'animate-spin' : ''}`} />
              {createRule.isPending ? "Generating Series..." : "Transform to Recurring Series"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MakeRecurringDialog;
