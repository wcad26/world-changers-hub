import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMembers, MemberWithProfile } from "@/hooks/useMembers";
import { useCreateAttendanceEvent, useSaveAttendance } from "@/hooks/useAttendance";
import { useExistingEventAttendance } from "@/hooks/useExistingEventAttendance";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Search, UserCheck, Save, Loader2, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fetchMemberRelationshipsForMembers } from '@/utils/fetchMemberRelationships';
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isChildMember } from '@/utils/childUtils';

interface AttendanceManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    name: string;
    start_datetime: string;
  };
}

type MemberTypeFilter = 'all' | 'member' | 'regular_visitor' | 'special_visitor' | 'child';

const getMemberType = (
  member: MemberWithProfile,
  memberRelationships: Array<{ member_id: string; related_member_id: string }>
): { label: string; key: MemberTypeFilter } => {
  const isChild = isChildMember(member.profiles?.date_of_birth, member.id, memberRelationships);
  if (isChild) return { label: 'Child', key: 'child' };

  if (member.member_type === 'visitor') {
    const isSpecial = member.referral_source === 'special_event' || member.join_interest === 'special_event';
    return isSpecial
      ? { label: 'Special Event Visitor', key: 'special_visitor' }
      : { label: 'Regular Visitor', key: 'regular_visitor' };
  }

  return { label: 'Member', key: 'member' };
};

const memberTypeBadgeVariant = (key: MemberTypeFilter) => {
  switch (key) {
    case 'member': return 'default';
    case 'regular_visitor': return 'secondary';
    case 'special_visitor': return 'outline';
    case 'child': return 'secondary';
    default: return 'default';
  }
};

export function AttendanceManagementDialog({ isOpen, onClose, event }: AttendanceManagementDialogProps) {
  const { userRegion } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [presentMembers, setPresentMembers] = useState<Set<string>>(new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [typeFilter, setTypeFilter] = useState<MemberTypeFilter>('all');

  const { data: members, isLoading: loadingMembers, error: membersError } = useMembers(userRegion?.id);
  const { data: existingAttendance, isLoading: loadingExisting } = useExistingEventAttendance(event.id, userRegion?.id);
  const createAttendanceEvent = useCreateAttendanceEvent();
  const saveAttendance = useSaveAttendance();

  // Fetch DCG memberships
  const { data: dcgMemberships } = useQuery({
    queryKey: ['attendance-dcg-memberships', userRegion?.id],
    queryFn: async () => {
      if (!userRegion?.id) return [];
      const { data, error } = await supabase
        .from('dcg_members')
        .select('member_id, dcgs!inner(name)')
        .eq('is_active', true);
      if (error) throw error;
      return (data || []) as Array<{ member_id: string; dcgs: { name: string } }>;
    },
    enabled: !!userRegion?.id,
  });

  const dcgMap = useMemo(() => {
    const map = new Map<string, string>();
    dcgMemberships?.forEach(dm => {
      map.set(dm.member_id, dm.dcgs.name);
    });
    return map;
  }, [dcgMemberships]);

  // Fetch relationships for children filter
  const memberIds = useMemo(() => members?.map(m => m.id) || [], [members]);
  const { data: memberRelationships = [] } = useQuery({
    queryKey: ['attendance-member-relationships', memberIds.sort().join(',')],
    queryFn: () => fetchMemberRelationshipsForMembers(memberIds),
    enabled: memberIds.length > 0,
  });

  useEffect(() => {
    if (isOpen && existingAttendance && !isInitialized) {
      setPresentMembers(new Set(existingAttendance.presentMemberIds));
      setIsInitialized(true);
    }
  }, [isOpen, existingAttendance, isInitialized]);

  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false);
      setPresentMembers(new Set());
      setSearchTerm("");
      setTypeFilter('all');
    }
  }, [isOpen]);

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    return members.filter(member => {
      const searchLower = searchTerm.toLowerCase();
      const firstName = member.profiles?.first_name?.toLowerCase() || '';
      const lastName = member.profiles?.last_name?.toLowerCase() || '';
      const memberId = member.member_id?.toLowerCase() || '';

      const searchMatch = !searchTerm || firstName.includes(searchLower) ||
        lastName.includes(searchLower) || memberId.includes(searchLower);
      if (!searchMatch) return false;

      if (typeFilter !== 'all') {
        const mt = getMemberType(member, memberRelationships);
        if (mt.key !== typeFilter) return false;
      }

      return true;
    });
  }, [members, searchTerm, typeFilter, memberRelationships]);

  const handleToggleMember = (memberId: string) => {
    const next = new Set(presentMembers);
    if (next.has(memberId)) next.delete(memberId); else next.add(memberId);
    setPresentMembers(next);
  };

  const handleSelectAll = () => {
    if (filteredMembers.every(m => presentMembers.has(m.id))) {
      const next = new Set(presentMembers);
      filteredMembers.forEach(m => next.delete(m.id));
      setPresentMembers(next);
    } else {
      const next = new Set(presentMembers);
      filteredMembers.forEach(m => next.add(m.id));
      setPresentMembers(next);
    }
  };

  const handleRecordAttendance = async () => {
    if (!userRegion || !members) return;
    setIsRecording(true);
    try {
      let attendanceEventId = existingAttendance?.attendanceEventId;
      if (!attendanceEventId) {
        const ae = await createAttendanceEvent.mutateAsync({
          name: `Attendance - ${event.name}`,
          event_date: new Date(event.start_datetime).toISOString().split('T')[0],
          region_id: userRegion.id,
          description: `Attendance tracking for ${event.name}`,
          source_event_id: event.id,
        });
        attendanceEventId = ae.id;
      }
      const records = members.map(member => ({
        event_id: attendanceEventId!,
        member_id: member.id,
        is_present: presentMembers.has(member.id),
      }));
      await saveAttendance.mutateAsync(records);
      const prev = existingAttendance?.totalPresentCount || 0;
      toast({
        title: "Success",
        description: prev > 0
          ? `Attendance updated. ${presentMembers.size} total present.`
          : `Attendance recorded for ${presentMembers.size} present members.`,
      });
      onClose();
    } catch (error) {
      console.error('Error recording attendance:', error);
      toast({ title: "Error", description: "Failed to record attendance.", variant: "destructive" });
    } finally {
      setIsRecording(false);
    }
  };

  const getDisplayName = (member: MemberWithProfile) => {
    if (member.profiles?.first_name && member.profiles?.last_name) {
      return `${member.profiles.last_name} ${member.profiles.first_name}`;
    }
    return member.profiles?.email || member.member_id || 'Unknown Member';
  };

  const isLoading = loadingMembers || loadingExisting;
  const existingCount = existingAttendance?.totalPresentCount || 0;
  const allFilteredSelected = filteredMembers.length > 0 && filteredMembers.every(m => presentMembers.has(m.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] overflow-hidden flex flex-col bg-background border-border/50 p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <UserCheck className="h-5 w-5 text-primary" />
            Record Attendance — {event.name}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Select members who were present. Unselected members will be marked absent.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 flex-1 overflow-hidden">
          {existingCount > 0 && (
            <Alert className="bg-primary/10 border-primary/20 py-2">
              <Users className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm">
                <strong>{existingCount}</strong> attendee{existingCount !== 1 ? 's' : ''} already recorded. You can update records.
              </AlertDescription>
            </Alert>
          )}

          {/* Filter row */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name..."
                className="pl-8 h-9 text-sm bg-background/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as MemberTypeFilter)}>
              <SelectTrigger className="w-full sm:w-[200px] h-9 text-sm bg-background/50">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="member">Members</SelectItem>
                <SelectItem value="regular_visitor">Regular Visitors</SelectItem>
                <SelectItem value="special_visitor">Special Event Visitors</SelectItem>
                <SelectItem value="child">Children</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={isLoading || !filteredMembers.length}
              className="h-9 text-xs whitespace-nowrap"
            >
              {allFilteredSelected ? "Deselect All" : "Select All"}
            </Button>
          </div>

          {/* Summary */}
          <div className="bg-muted/50 px-3 py-2 rounded-md">
            <p className="text-xs sm:text-sm text-muted-foreground">
              <strong className="text-foreground">{presentMembers.size}</strong> of <strong className="text-foreground">{filteredMembers.length}</strong> selected as present
              {searchTerm && ` (filtered from ${members?.length || 0})`}
            </p>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto border border-border/50 rounded-lg bg-background/30">
            {membersError && (
              <Alert variant="destructive" className="m-3">
                <AlertDescription>Error loading members: {membersError.message}</AlertDescription>
              </Alert>
            )}

            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 px-2 sm:px-4">Present</TableHead>
                  <TableHead className="px-2 sm:px-4">Name</TableHead>
                  <TableHead className="hidden sm:table-cell px-2 sm:px-4">DCG</TableHead>
                  <TableHead className="px-2 sm:px-4">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-2 sm:px-4"><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell className="px-2 sm:px-4"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="hidden sm:table-cell px-2 sm:px-4"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="px-2 sm:px-4"><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                      {searchTerm ? "No members match your search" : "No members found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => {
                    const mt = getMemberType(member, memberRelationships);
                    return (
                      <TableRow
                        key={member.id}
                        className="hover:bg-muted/30 cursor-pointer"
                        onClick={() => handleToggleMember(member.id)}
                      >
                        <TableCell className="px-2 sm:px-4" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={presentMembers.has(member.id)}
                            onCheckedChange={() => handleToggleMember(member.id)}
                          />
                        </TableCell>
                        <TableCell className="px-2 sm:px-4 font-medium text-sm">
                          {getDisplayName(member)}
                          <span className="block sm:hidden text-xs text-muted-foreground mt-0.5">
                            {dcgMap.get(member.id) || '—'}
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell px-2 sm:px-4 text-sm text-muted-foreground">
                          {dcgMap.get(member.id) || '—'}
                        </TableCell>
                        <TableCell className="px-2 sm:px-4">
                          <Badge variant={memberTypeBadgeVariant(mt.key)} className="text-xs whitespace-nowrap">
                            {mt.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-2 border-t border-border/50">
            <Button
              onClick={handleRecordAttendance}
              disabled={isRecording || isLoading || !members?.length}
              className="w-full sm:w-auto"
            >
              {isRecording ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {existingCount > 0 ? 'Update Attendance' : 'Record Attendance'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
