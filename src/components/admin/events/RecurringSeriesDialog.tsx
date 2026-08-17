import React from 'react';
import { format } from 'date-fns';
import { Repeat, Pause, Play, RefreshCw, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useRecurrenceRules,
  useUpdateRecurrenceRule,
  useDeleteRecurrenceRule,
  useGenerateRecurringEvents,
  frequencyLabel,
  WEEKDAYS,
} from '@/hooks/useRecurringEvents';

interface RecurringSeriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  regionId?: string | null;
  dcgId?: string | null;
  global?: boolean;
}

export const RecurringSeriesDialog: React.FC<RecurringSeriesDialogProps> = ({
  open,
  onOpenChange,
  regionId,
  dcgId,
  global,
}) => {
  const { data: rules, isLoading } = useRecurrenceRules({ regionId, dcgId, global });
  const updateRule = useUpdateRecurrenceRule();
  const deleteRule = useDeleteRecurrenceRule();
  const generate = useGenerateRecurringEvents();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-primary" /> Recurring Series
          </DialogTitle>
          <DialogDescription>
            Events that create themselves automatically. Pause a series to stop new occurrences.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => generate.mutate(undefined)}
            disabled={generate.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${generate.isPending ? 'animate-spin' : ''}`} />
            Generate now
          </Button>
        </div>

        <ScrollArea className="flex-1 pr-3">
          <div className="space-y-3 pb-4">
            {isLoading && <p className="text-sm text-muted-foreground">Loading series…</p>}
            {!isLoading && (!rules || rules.length === 0) && (
              <p className="text-sm text-muted-foreground">
                No recurring series yet. Turn on "Repeat this event" when creating an event.
              </p>
            )}
            {rules?.map((rule) => (
              <div key={rule.id} className="rounded-lg border border-border/60 p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.name}</span>
                      <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                        {rule.is_active ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {frequencyLabel(rule)}
                      {rule.days_of_week?.length > 0 &&
                        ` • ${rule.days_of_week
                          .map((d) => WEEKDAYS.find((w) => w.value === d)?.label)
                          .filter(Boolean)
                          .join(', ')}`}
                      {' • '}
                      {rule.start_time?.slice(0, 5)}
                      {' • '}
                      created {rule.lead_time_days} days ahead
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {rule.end_date
                        ? `Ends ${format(new Date(rule.end_date), 'dd/MM/yyyy')}`
                        : 'No end date'}
                      {rule.last_generated_until &&
                        ` • filled through ${format(new Date(rule.last_generated_until), 'dd/MM/yyyy')}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateRule.mutate({ id: rule.id, is_active: !rule.is_active })}
                      title={rule.is_active ? 'Pause series' : 'Resume series'}
                    >
                      {rule.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => generate.mutate(rule.id)}
                      title="Generate occurrences now"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove "{rule.name}" series?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Choose whether upcoming auto-created events should be deleted too. Past
                            events are always kept.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteRule.mutate({ id: rule.id, deleteFuture: false })}
                          >
                            Keep upcoming events
                          </AlertDialogAction>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteRule.mutate({ id: rule.id, deleteFuture: true })}
                          >
                            Delete upcoming events
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default RecurringSeriesDialog;
