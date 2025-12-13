import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAddDiscipleshipProgress } from '@/hooks/useDiscipleship';
import { useToast } from '@/hooks/use-toast';

interface AddProgressDialogProps {
  relationshipId: string;
  discipleName: string;
  children: React.ReactNode;
}

export function AddProgressDialog({ relationshipId, discipleName, children }: AddProgressDialogProps) {
  const [open, setOpen] = useState(false);
  const [milestone, setMilestone] = useState<string>('');
  const [achievedDate, setAchievedDate] = useState<Date>();
  const [notes, setNotes] = useState('');
  
  const addProgress = useAddDiscipleshipProgress();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!milestone) {
      toast({
        title: "Error",
        description: "Please select a milestone",
        variant: "destructive",
      });
      return;
    }

    try {
      await addProgress.mutateAsync({
        relationship_id: relationshipId,
        milestone: milestone as any,
        achieved_date: achievedDate?.toISOString(),
        notes: notes || undefined,
      });

      toast({
        title: "Success",
        description: "Progress added successfully",
      });

      // Reset form
      setMilestone('');
      setAchievedDate(undefined);
      setNotes('');
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add progress",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Progress for {discipleName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="milestone">Milestone</Label>
            <Select value={milestone} onValueChange={setMilestone}>
              <SelectTrigger>
                <SelectValue placeholder="Select a milestone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="talking_stage">Talking Stage</SelectItem>
                <SelectItem value="first_visit">First Visit</SelectItem>
                <SelectItem value="second_visit">Second Visit</SelectItem>
                <SelectItem value="committed">Committed to Faith</SelectItem>
                <SelectItem value="baptized">Baptized</SelectItem>
                <SelectItem value="became_member">Became Member</SelectItem>
                <SelectItem value="serving">Now Serving</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Achieved Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !achievedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {achievedDate ? format(achievedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={achievedDate}
                  onSelect={setAchievedDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this milestone..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addProgress.isPending}>
              {addProgress.isPending ? 'Adding...' : 'Add Progress'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}