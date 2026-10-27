import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchMemberRelationshipsForMembers } from '@/utils/fetchMemberRelationships';
import { Search, UserCheck, Users, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDcgMembers } from '@/hooks/useDcgMembers';
import { useSaveEventAttendance, useEventAttendanceRecords } from '@/hooks/useDcgEvents';
import { useQuery } from '@tanstack/react-query';
import { isChildMember } from '@/utils/childUtils';
import { Initials } from '@/components/admin/dcg/DcgUI';
import type { Event } from '@/hooks/useDcgEvents';

interface EventAttendanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  dcgId: string;
}

type AttendanceFilter = 'all' | 'member' | 'visitor' | 'child' | 'leadership';

export const EventAttendanceDialog: React.FC<EventAttendanceDialogProps> = ({
  isOpen,
  onClose,
  event,
  dcgId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [presentMembers, setPresentMembers] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<AttendanceFilter>('all');
  const [showPresentOnly, setShowPresentOnly] = useState(false);

  const { data: dcgMembers, isLoading: loadingMembers } = useDcgMembers(dcgId);
  const { data: existingRecords } = useEventAttendanceRecords(event.id, dcgId);
  const saveAttendance = useSaveEventAttendance();

  const activeMembers = useMemo(
    () => (dcgMembers || []).filter((m) => m.is_active !== false && m.members),
    [dcgMembers],
  );

  const memberIds = useMemo(() => activeMembers.map((m) => m.member_id), [activeMembers]);
  const { data: memberRelationships = [] } = useQuery({
    queryKey: ['dcg-attendance-member-relationships', [...memberIds].sort().join(',')],
    queryFn: () => fetchMemberRelationshipsForMembers(memberIds),
    enabled: memberIds.length > 0,
  });

  const getDisplayName = (dcgMember: any) => {
    const profile = dcgMember.members?.profiles;
    if (profile?.last_name || profile?.first_name) {
      return `${profile.last_name || ''} ${profile.first_name || ''}`.trim();
    }
    return dcgMember.members?.member_id || 'Unknown Member';
  };

  useEffect(() => {
    if (existingRecords) {
      const presentMemberIds = new Set(
        existingRecords.filter((record) => record.is_present).map((record) => record.member_id),
      );
      setPresentMembers(presentMemberIds);
    }
  }, [existingRecords]);

  const filteredMembers = useMemo(() => {
    return activeMembers.filter((dcgMember) => {
      const fullName = getDisplayName(dcgMember).toLowerCase();
      const memberCode = (dcgMember.members?.member_id || '').toLowerCase();
      const q = searchTerm.toLowerCase();
      if (q && !fullName.includes(q) && !memberCode.includes(q)) return false;

      const dob = dcgMember.members?.profiles?.date_of_birth || null;
      const isChild = isChildMember(dob, dcgMember.member_id, memberRelationships);
      const memberType = dcgMember.members?.member_type || 'member';

      if (typeFilter === 'child') return isChild;
      if (typeFilter === 'leadership') return dcgMember.role === 'Leader' || dcgMember.role === 'Assistant';
      if (typeFilter === 'visitor') return !isChild && memberType === 'visitor';
      if (typeFilter === 'member') return !isChild && memberType !== 'visitor';
      return true;
    });
  }, [activeMembers, searchTerm, typeFilter, memberRelationships]);

  const visibleMembers = useMemo(
    () => (showPresentOnly ? filteredMembers.filter((m) => presentMembers.has(m.member_id)) : filteredMembers),
    [filteredMembers, showPresentOnly, presentMembers],
  );

  const allFilteredSelected =
    filteredMembers.length > 0 && filteredMembers.every((m) => presentMembers.has(m.member_id));

  const handleToggleMember = (memberId: string) => {
    setPresentMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const handleSelectAll = () => {
    setPresentMembers((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredMembers.forEach((m) => next.delete(m.member_id));
      } else {
        filteredMembers.forEach((m) => next.add(m.member_id));
      }
      return next;
    });
  };

  const handleRecordAttendance = async () => {
    const attendanceRecords = activeMembers.map((dcgMember) => ({
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

  const total = activeMembers.length;
  const pct = total ? Math.round((presentMembers.size / total) * 100) : 0;
  const existingCount = (existingRecords || []).filter((r) => r.is_present).length;

  let dateLabel = '';
  try {
    dateLabel = format(new Date(event.start_datetime), 'EEE, dd MMM yyyy');
  } catch {
    /* ignore */
  }

  const chips: { key: AttendanceFilter; label: string }[] = [
    { key: 'all', label: 'Everyone' },
    { key: 'member', label: 'Members' },
    { key: 'visitor', label: 'Visitors' },
    { key: 'child', label: 'Children' },
    { key: 'leadership', label: 'Leadership' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[94dvh] max-h-[94dvh] flex-col gap-0 overflow-hidden bg-background p-0 pb-0 lg:h-[88vh] lg:max-h-[88vh] lg:max-w-2xl lg:rounded-3xl">
        {/* Gradient Sheet Header */}
        <div className="relative shrink-0 overflow-hidden rounded-t-3xl bg-gradient-to-br from-primary to-secondary px-4 pb-4 pt-6 text-primary-foreground sm:px-6 lg:pt-5">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl" />
          <DialogHeader className="relative space-y-0 pr-10 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-foreground/75">
              Mark DCG Attendance
            </p>
            <DialogTitle className="truncate font-heading text-lg font-bold text-primary-foreground sm:text-xl">
              {event.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-primary-foreground/80">
              {dateLabel} · Tap a person to mark them present
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <p className="font-heading text-3xl font-bold leading-none">
                {presentMembers.size}
                <span className="ml-1 text-sm font-medium text-primary-foreground/75">/ {total} present</span>
              </p>
              {existingCount > 0 && (
                <p className="mt-1.5 text-[11px] text-primary-foreground/80">
                  {existingCount} already saved — changes update the record
                </p>
              )}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primary-foreground/20">
                <div
                  className="h-full rounded-full bg-primary-foreground transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-foreground/15 font-heading text-sm font-bold">
              {pct}%
            </span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="shrink-0 space-y-2.5 border-b border-border px-4 py-3 sm:px-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <div className="relative min-w-0">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search name or ID…"
                className="h-11 rounded-full bg-card pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant={showPresentOnly ? 'default' : 'outline'}
              className="h-11 rounded-full px-4"
              onClick={() => setShowPresentOnly((v) => !v)}
              aria-pressed={showPresentOnly}
            >
              <UserCheck className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Present only</span>
            </Button>
          </div>

          <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setTypeFilter(c.key)}
                className={cn(
                  'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  typeFilter === c.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{visibleMembers.length} shown</span>
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={loadingMembers || !filteredMembers.length}
              className="font-semibold text-primary disabled:opacity-50"
            >
              {allFilteredSelected ? 'Clear shown' : 'Mark all shown present'}
            </button>
          </div>
        </div>

        {/* Member List */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6">
          {loadingMembers ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : visibleMembers.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Users className="mx-auto mb-2 h-8 w-8 opacity-40" />
              {searchTerm
                ? 'No members match your search.'
                : showPresentOnly
                  ? 'No one marked present yet.'
                  : 'No members in this filter.'}
            </div>
          ) : (
            <ul className="space-y-2">
              {visibleMembers.map((dcgMember) => {
                const checked = presentMembers.has(dcgMember.member_id);
                const p = dcgMember.members?.profiles;
                const dob = p?.date_of_birth || null;
                const isChild = isChildMember(dob, dcgMember.member_id, memberRelationships);
                const mType = isChild
                  ? 'Child'
                  : dcgMember.members?.member_type === 'visitor'
                    ? 'Visitor'
                    : 'Member';
                return (
                  <li key={dcgMember.id}>
                    <button
                      type="button"
                      onClick={() => handleToggleMember(dcgMember.member_id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]',
                        checked
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'border-border bg-card hover:bg-muted/40',
                      )}
                    >
                      <Initials
                        size="sm"
                        first={p?.first_name}
                        last={p?.last_name}
                        photo={(dcgMember.members as any)?.photo_url}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {getDisplayName(dcgMember)}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">
                            {dcgMember.role || 'Member'}
                          </span>
                          <span>·</span>
                          <span>{mType}</span>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'grid h-7 w-7 shrink-0 place-items-center rounded-full border transition',
                          checked
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-transparent',
                        )}
                      >
                        <Check className="h-4 w-4" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-card/80 px-4 py-3 backdrop-blur sm:px-6">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-full">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleRecordAttendance}
            disabled={saveAttendance.isPending || loadingMembers}
            className="gap-2 rounded-full px-5 shadow-regal"
          >
            {saveAttendance.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserCheck className="h-4 w-4" />
            )}
            {saveAttendance.isPending ? 'Saving…' : `Save Attendance (${presentMembers.size})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
