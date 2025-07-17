import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCreateDcgAttendanceEvent } from "@/hooks/useDcgAttendance";
import { useAuth } from "@/hooks/useAuth";

interface CreateDcgAttendanceEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dcgId: string;
}

export function CreateDcgAttendanceEventDialog({ 
  isOpen, 
  onClose, 
  dcgId 
}: CreateDcgAttendanceEventDialogProps) {
  const { userRegion } = useAuth();
  const createEvent = useCreateDcgAttendanceEvent();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    eventDate: new Date(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userRegion) return;

    try {
      await createEvent.mutateAsync({
        name: formData.name,
        description: formData.description,
        event_date: format(formData.eventDate, 'yyyy-MM-dd'),
        region_id: userRegion.id,
        dcg_id: dcgId,
      });
      
      // Reset form and close dialog
      setFormData({
        name: "",
        description: "",
        eventDate: new Date(),
      });
      onClose();
    } catch (error) {
      console.error('Error creating attendance event:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Attendance Event
          </DialogTitle>
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
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.eventDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.eventDate ? (
                    format(formData.eventDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description for the event"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createEvent.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createEvent.isPending || !formData.name}
            >
              {createEvent.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
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