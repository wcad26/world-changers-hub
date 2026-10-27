import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCreateDcgAttendanceEvent } from '@/hooks/useDcgAttendance';
import { useCurrentDcg } from '@/hooks/useDcgFinancials';
import { useAuth } from '@/hooks/useAuth';
import { SheetHeader } from '@/components/admin/dcg/DcgUI';

interface CreateDcgAttendanceEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dcgId: string;
}

export function CreateDcgAttendanceEventDialog({
  isOpen,
  onClose,
  dcgId,
}: CreateDcgAttendanceEventDialogProps) {
  const { userRegion, userDcg } = useAuth();
  const { data: resolvedDcg } = useCurrentDcg();
  const createEvent = useCreateDcgAttendanceEvent();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventDate: new Date(),
  });

  const regionId = userRegion?.id || userDcg?.region_id || resolvedDcg?.region_id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regionId) return;

    try {
      await createEvent.mutateAsync({
        name: formData.name,
        description: formData.description,
        event_date: format(formData.eventDate, 'yyyy-MM-dd'),
        region_id: regionId,
        dcg_id: dcgId,
      });

      setFormData({
        name: '',
        description: '',
        eventDate: new Date(),
      });
      onClose();
    } catch (error) {
      console.error('Error creating attendance event:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl sm:max-w-[440px]">
        <SheetHeader
          icon={Plus}
          title="Create Attendance Event"
          description="Log a DCG meeting or activity to record member attendance."
        />
        <DialogHeader className="sr-only">
          <DialogTitle>Create Attendance Event</DialogTitle>
          <DialogDescription>
            Create a new attendance event for DCG meetings or activities.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Event Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Weekly DCG Meeting"
              className="h-11 rounded-xl"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-date">Event Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'h-11 w-full justify-start rounded-xl text-left font-normal',
                    !formData.eventDate && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 opacity-60" />
                  {formData.eventDate ? format(formData.eventDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.eventDate}
                  onSelect={(date) => date && setFormData({ ...formData, eventDate: date })}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Optional notes or study topic..."
              className="min-h-[84px] resize-none rounded-xl"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createEvent.isPending}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createEvent.isPending || !formData.name}
              className="rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-regal hover:opacity-95"
            >
              {createEvent.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create Event
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
