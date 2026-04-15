import React, { useState, useEffect, useMemo } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, UserCheck, Users, Baby } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDcgMembers } from '@/hooks/useDcgMembers';
import { useSaveEventAttendance, useEventAttendanceRecords } from '@/hooks/useDcgEvents';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isChildMember } from '@/utils/childUtils';
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
  const [showChildrenOnly, setShowChildrenOnly] = useState(false);
  const isMobile = useIsMobile();

  const { data: dcgMembers, isLoading: loadingMembers } = useDcgMembers(dcgId);
  const { data: existingRecords } = useEventAttendanceRecords(event.id, dcgId);
  const saveAttendance = useSaveEventAttendance();

  // Fetch relationships for children filter
  const memberIds = useMemo(() => dcgMembers?.map(m => m.member_id) || [], [dcgMembers]);
  const { data: memberRelationships = [] } = useQuery({
    queryKey: ['dcg-attendance-member-relationships', memberIds.sort().join(',')],
    queryFn: async () => {
      if (memberIds.length === 0) return [];
      const { data, error } = await supabase
        .from('member_relationships' as any)
        .select('member_id, related_member_id')
        .or(`member_id.in.(${memberIds.join(',')}),related_member_id.in.(${memberIds.join(',')})`);
      if (error) throw error;
      return ((data || []) as any[]).map((r: any) => ({
        member_id: r.member_id as string,
        related_member_id: r.related_member_id as string,
      }));
    },
    enabled: memberIds.length > 0,
  });

  const getDisplayName = (dcgMember: any) => {
    const profile = dcgMember.members?.profiles;
    if (profile?.last_name || profile?.first_name) {
      return `${profile.last_name || ''} ${profile.first_name || ''}`.trim();
    }
    return dcgMember.members?.member_id || 'Unknown Member';
  };

  const getDob = (dcgMember: any): string | null => {
    return dcgMember.members?.profiles?.date_of_birth || null;
  };

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

  const filteredMembers = useMemo(() => {
    const list = dcgMembers || [];
    return list.filter(dcgMember => {
      const fullName = getDisplayName(dcgMember);
      const searchMatch = fullName.toLowerCase().includes(searchTerm.toLowerCase());
      if (!searchMatch) return false;

      if (showChildrenOnly) {
        return isChildMember(getDob(dcgMember), dcgMember.member_id, memberRelationships);
      }
      return true;
    });
  }, [dcgMembers, searchTerm, showChildrenOnly, memberRelationships]);

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
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 md:p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Record Attendance
          </DialogTitle>
          <DialogDescription>
            {event.name} - {format(new Date(event.start_datetime), 'PPP')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-4 md:px-6">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="relative flex-1 w-full sm:max-w-sm">
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
                <Toggle
                  pressed={showChildrenOnly}
                  onPressedChange={setShowChildrenOnly}
                  variant="outline"
                  size="sm"
                  className="gap-1"
                >
                  <Baby className="h-4 w-4" />
                  Children
                </Toggle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  {presentMembers.size === filteredMembers.length ? 'Deselect All' : 'Select All'}
                </Button>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {presentMembers.size}/{filteredMembers.length}
                </span>
              </div>
            </div>

            <ScrollArea className="h-[calc(85vh-280px)] sm:h-[calc(85vh-220px)]">
              {isMobile ? (
                <div className="space-y-2 pr-2">
                  {loadingMembers ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))
                  ) : filteredMembers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {searchTerm ? "No members match your search" : showChildrenOnly ? "No children found" : "No members found"}
                    </div>
                  ) : (
                    filteredMembers.map((dcgMember) => (
                      <div
                        key={dcgMember.id}
                        className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50"
                        onClick={() => handleToggleMember(dcgMember.member_id)}
                      >
                        <Checkbox
                          checked={presentMembers.has(dcgMember.member_id)}
                          onCheckedChange={() => handleToggleMember(dcgMember.member_id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{getDisplayName(dcgMember)}</p>
                          <p className="text-xs text-muted-foreground">{dcgMember.role}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Present</TableHead>
                        <TableHead>Member Name</TableHead>
                        <TableHead>Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingMembers ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          </TableRow>
                        ))
                      ) : filteredMembers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                            {searchTerm ? "No members match your search" : showChildrenOnly ? "No children found" : "No members found"}
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
                            <TableCell>{dcgMember.role}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="p-4 md:p-6 pt-2 border-t">
          {!isMobile && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
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
