import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, UserCheck, Users } from 'lucide-react';
import { useDcgMembers } from '@/hooks/useDcgMembers';
import { useSaveEventAttendance, useEventAttendanceRecords } from '@/hooks/useDcgEvents';
import type { Event } from '@/hooks/useDcgEvents';

interface EventAttendanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  dcgId: string;
}

export const EventAttendanceDialog: React.FC<EventAttendanceDialogProps> = ({
  isOpen,
  onClose,
  event,
  dcgId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [presentMembers, setPresentMembers] = useState<Set<string>>(new Set());

  const { data: dcgMembers, isLoading: loadingMembers } = useDcgMembers(dcgId);
  const { data: existingRecords } = useEventAttendanceRecords(event.id, dcgId);
  const saveAttendance = useSaveEventAttendance();

  // Helper function to get display name
  const getDisplayName = (dcgMember: any) => {
    const profile = dcgMember.members?.profiles;
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return dcgMember.members?.member_id || 'Unknown Member';
  };

  // Load existing attendance records
  useEffect(() => {
    if (existingRecords) {
      const presentMemberIds = new Set(
        existingRecords
          .filter(record => record.is_present)
          .map(record => record.member_id)
      );
      setPresentMembers(presentMemberIds);
    }
  }, [existingRecords]);

  const filteredMembers = dcgMembers?.filter(dcgMember => {
    const fullName = getDisplayName(dcgMember);
    return fullName.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  const handleToggleMember = (memberId: string) => {
    const newPresentMembers = new Set(presentMembers);
    if (newPresentMembers.has(memberId)) {
      newPresentMembers.delete(memberId);
    } else {
      newPresentMembers.add(memberId);
    }
    setPresentMembers(newPresentMembers);
  };

  const handleSelectAll = () => {
    if (presentMembers.size === filteredMembers.length) {
      setPresentMembers(new Set());
    } else {
      setPresentMembers(new Set(filteredMembers.map(m => m.member_id)));
    }
  };

  const handleRecordAttendance = async () => {
    if (!dcgMembers) return;

    const attendanceRecords = dcgMembers.map(dcgMember => ({
      member_id: dcgMember.member_id,
      is_present: presentMembers.has(dcgMember.member_id),
    }));

    try {
      await saveAttendance.mutateAsync({
        eventId: event.id,
        eventName: event.name,
        eventDate: new Date(event.start_datetime).toISOString().split('T')[0],
        attendanceRecords,
      });
      onClose();
    } catch (error) {
      console.error('Error recording attendance:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Record Attendance
          </DialogTitle>
          <DialogDescription>
            {event.name} - {format(new Date(event.start_datetime), 'PPP')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search members..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                {presentMembers.size === filteredMembers.length ? 'Deselect All' : 'Select All'}
              </Button>
              <span className="text-sm text-muted-foreground">
                {presentMembers.size} of {filteredMembers.length} present
              </span>
            </div>
          </div>

          <div className="rounded-md border max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Present</TableHead>
                  <TableHead>Member Name</TableHead>
                  <TableHead>Member ID</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingMembers ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "No members match your search" : "No members found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((dcgMember) => (
                    <TableRow key={dcgMember.id}>
                      <TableCell>
                        <Checkbox
                          checked={presentMembers.has(dcgMember.member_id)}
                          onCheckedChange={() => handleToggleMember(dcgMember.member_id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {getDisplayName(dcgMember)}
                      </TableCell>
                      <TableCell>{dcgMember.members?.member_id}</TableCell>
                      <TableCell>{dcgMember.role}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleRecordAttendance}
            disabled={saveAttendance.isPending || loadingMembers}
            className="flex items-center gap-2"
          >
            <UserCheck className="h-4 w-4" />
            {saveAttendance.isPending ? 'Recording...' : 'Record Attendance'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};