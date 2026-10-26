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
import { Search, UserCheck, Save, Loader2, Users, Check } from "lucide-react";
import { cn } from "@/lib/utils";
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
      setShowPresentOnly(false);
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

  const [showPresentOnly, setShowPresentOnly] = useState(false);
  const visibleMembers = showPresentOnly ? filteredMembers.filter(m => presentMembers.has(m.id)) : filteredMembers;
  const total = members?.length || 0;
  const pct = total ? Math.round((presentMembers.size / total) * 100) : 0;
  const chips: Array<{ key: MemberTypeFilter; label: string }> = [
    { key: 'all', label: 'Everyone' },
    { key: 'member', label: 'Members' },
    { key: 'regular_visitor', label: 'Visitors' },
    { key: 'special_visitor', label: 'Special visitors' },
    { key: 'child', label: 'Children' },
  ];
  const typeTone = (k: MemberTypeFilter) =>
    k === 'member' ? 'bg-primary/10 text-primary' : k === 'child' ? 'bg-accent/20 text-accent-foreground' : 'bg-secondary/15 text-secondary';
  const initials = (m: MemberWithProfile) => ((m.profiles?.last_name?.[0] || '') + (m.profiles?.first_name?.[0] || '')).toUpperCase() || '?';
  let dateLabel = '';
  try { dateLabel = new Date(event.start_datetime).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { /* ignore */ }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0 overflow-hidden rounded-none border-0 bg-background p-0 sm:h-[88vh] sm:max-h-[88vh] sm:max-w-2xl sm:rounded-3xl sm:border sm:border-border lg:max-w-3xl">
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-primary to-secondary px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] text-primary-foreground sm:px-6 sm:pt-5">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl" />
          <DialogHeader className="relative space-y-0 pr-10 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-foreground/75">Mark attendance</p>
            <DialogTitle className="truncate font-heading text-lg font-bold text-primary-foreground sm:text-xl">{event.name}</DialogTitle>
            <DialogDescription className="text-xs text-primary-foreground/80">{dateLabel} · Tap a person to mark them present</DialogDescription>
          </DialogHeader>
          <div className="relative mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <p className="font-heading text-3xl font-bold leading-none">{presentMembers.size}<span className="ml-1 text-sm font-medium text-primary-foreground/75">/ {total} present</span></p>
              {existingCount > 0 && <p className="mt-1.5 text-[11px] text-primary-foreground/80">{existingCount} already saved — changes update the record</p>}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primary-foreground/20">
                <div className="h-full rounded-full bg-primary-foreground transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-foreground/15 font-heading text-sm font-bold">{pct}%</span>
          </div>
        </div>

        {/* Controls */}
        <div className="shrink-0 space-y-2.5 border-b border-border px-4 py-3 sm:px-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <div className="relative min-w-0">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" placeholder="Search name or ID…" className="h-11 rounded-full bg-card pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Button type="button" variant={showPresentOnly ? 'default' : 'outline'} className="h-11 rounded-full px-4" onClick={() => setShowPresentOnly(v => !v)} aria-pressed={showPresentOnly}>
              <UserCheck className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Present only</span>
            </Button>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
            {chips.map(c => (
              <button key={c.key} type="button" onClick={() => setTypeFilter(c.key)}
                className={cn('whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors', typeFilter === c.key ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground hover:text-foreground')}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{visibleMembers.length} shown</span>
            <button type="button" onClick={handleSelectAll} disabled={isLoading || !filteredMembers.length} className="font-semibold text-primary disabled:opacity-50">
              {allFilteredSelected ? 'Clear shown' : 'Mark all shown present'}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6">
          {membersError && (
            <Alert variant="destructive" className="mb-3"><AlertDescription>Error loading members: {membersError.message}</AlertDescription></Alert>
          )}
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div>
          ) : visibleMembers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">{searchTerm || typeFilter !== 'all' || showPresentOnly ? 'Nobody matches these filters' : 'No members found'}</p>
            </div>
          ) : (
            <ul className="grid gap-2 lg:grid-cols-2">
              {visibleMembers.map(member => {
                const mt = getMemberType(member, memberRelationships);
                const on = presentMembers.has(member.id);
                const dcg = dcgMap.get(member.id);
                return (
                  <li key={member.id}>
                    <button type="button" onClick={() => handleToggleMember(member.id)} aria-pressed={on}
                      className={cn('grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border p-3 text-left transition-all active:scale-[0.99]',
                        on ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card hover:bg-muted/40')}>
                      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors', on ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                        {on ? <Check className="h-5 w-5" /> : initials(member)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-foreground">{getDisplayName(member)}</span>
                        <span className="mt-0.5 flex min-w-0 items-center gap-1.5">
                          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', typeTone(mt.key))}>{mt.label}</span>
                          {dcg && <span className="truncate text-[11px] text-muted-foreground">{dcg}</span>}
                        </span>
                      </span>
                      <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors', on ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>
                        {on && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border bg-card/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:px-6">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 sm:flex sm:justify-end">
            <Button variant="outline" className="h-12 rounded-full px-5" onClick={onClose}>Cancel</Button>
            <Button onClick={handleRecordAttendance} disabled={isRecording || isLoading || !members?.length} className="h-12 rounded-full px-6 shadow-regal">
              {isRecording ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : <><Save className="mr-2 h-4 w-4" />{existingCount > 0 ? 'Update' : 'Save'} · {presentMembers.size} present</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
