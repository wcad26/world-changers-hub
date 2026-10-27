import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDcgMembers, type DcgMemberWithDetails } from '@/hooks/useDcgMembers';
import { useSaveDcgAttendance } from '@/hooks/useDcgAttendance';
import { UserCheck, Save, Loader2, Check, Inbox } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  SheetHeader,
  SearchBar,
  Initials,
  TypePill,
  EmptyState,
} from '@/components/admin/dcg/DcgUI';

interface DcgAttendanceRecordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceEvent: {
    id: string;
    name: string;
    event_date: string;
  };
  dcgId: string;
}

export function DcgAttendanceRecordDialog({
  isOpen,
  onClose,
  attendanceEvent,
  dcgId,
}: DcgAttendanceRecordDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [presentMembers, setPresentMembers] = useState<Set<string>>(new Set());

  const {
    data: dcgMembers,
    isLoading: loadingMembers,
    error: membersError,
  } = useDcgMembers(dcgId);
  const saveAttendance = useSaveDcgAttendance();

  const filteredMembers = useMemo(() => {
    if (!dcgMembers) return [];
    const searchLower = searchTerm.toLowerCase().trim();
    return dcgMembers.filter((dcgMember) => {
      if (!dcgMember.members) return false;
      if (!searchLower) return true;
      const firstName = dcgMember.members.profiles?.first_name?.toLowerCase() || '';
      const lastName = dcgMember.members.profiles?.last_name?.toLowerCase() || '';
      const email = dcgMember.members.profiles?.email?.toLowerCase() || '';
      const memberId = dcgMember.members.member_id?.toLowerCase() || '';
      return (
        firstName.includes(searchLower) ||
        lastName.includes(searchLower) ||
        `${lastName} ${firstName}`.includes(searchLower) ||
        email.includes(searchLower) ||
        memberId.includes(searchLower)
      );
    });
  }, [dcgMembers, searchTerm]);

  const handleToggleMember = (memberId: string) => {
    setPresentMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (presentMembers.size === filteredMembers.length) {
      setPresentMembers(new Set());
    } else {
      setPresentMembers(new Set(filteredMembers.map((m) => m.members!.id)));
    }
  };

  const handleRecordAttendance = async () => {
    if (!dcgMembers) return;
    try {
      const attendanceRecords = dcgMembers
        .filter((dcgMember) => dcgMember.members)
        .map((dcgMember) => ({
          event_id: attendanceEvent.id,
          member_id: dcgMember.members!.id,
          is_present: presentMembers.has(dcgMember.members!.id),
        }));

      await saveAttendance.mutateAsync(attendanceRecords);
      onClose();
    } catch (error) {
      console.error('Error recording attendance:', error);
    }
  };

  const getDisplayName = (dcgMember: DcgMemberWithDetails) => {
    if (!dcgMember.members) return 'Unknown Member';
    const member = dcgMember.members;
    if (member.profiles?.first_name || member.profiles?.last_name) {
      return `${member.profiles?.last_name || ''} ${member.profiles?.first_name || ''}`.trim();
    }
    return member.profiles?.email || member.member_id || 'Unknown Member';
  };

  const totalCount = dcgMembers?.filter((m) => m.members).length || 0;
  const pct = totalCount > 0 ? Math.round((presentMembers.size / totalCount) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[88vh] max-w-2xl flex-col overflow-hidden rounded-3xl">
        <SheetHeader
          icon={UserCheck}
          title={attendanceEvent.name}
          description={`Tap members present · ${presentMembers.size}/${totalCount} (${pct}%)`}
        />
        <DialogHeader className="sr-only">
          <DialogTitle>Record Attendance - {attendanceEvent.name}</DialogTitle>
          <DialogDescription>
            Select DCG members who were present at this event.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search DCG members…"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleSelectAll}
            disabled={loadingMembers || !filteredMembers.length}
            className="h-11 shrink-0 rounded-full"
          >
            {presentMembers.size === filteredMembers.length && filteredMembers.length > 0
              ? 'Deselect All'
              : 'Select All'}
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {membersError && (
            <Alert variant="destructive" className="mb-3">
              <AlertDescription>
                Error loading DCG members: {membersError.message}
              </AlertDescription>
            </Alert>
          )}

          {loadingMembers ? (
            <div className="flex h-44 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
              <span className="text-sm">Loading DCG members…</span>
            </div>
          ) : filteredMembers.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={searchTerm ? 'No members match your search' : 'No DCG members found'}
            />
          ) : (
            <div className="space-y-2 py-1">
              {filteredMembers.map((dcgMember) => {
                const memberId = dcgMember.members!.id;
                const isPresent = presentMembers.has(memberId);
                return (
                  <button
                    key={dcgMember.id}
                    type="button"
                    onClick={() => handleToggleMember(memberId)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all active:scale-[0.99]',
                      isPresent
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/25'
                        : 'border-border bg-card hover:border-primary/40',
                    )}
                  >
                    <Initials
                      size="sm"
                      first={dcgMember.members?.profiles?.first_name}
                      last={dcgMember.members?.profiles?.last_name}
                      photo={(dcgMember.members?.profiles as any)?.avatar_url}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-heading text-sm font-semibold text-foreground">
                          {getDisplayName(dcgMember)}
                        </p>
                        <TypePill
                          label={dcgMember.role}
                          tone={
                            dcgMember.role === 'Leader'
                              ? 'var(--primary)'
                              : dcgMember.role === 'Assistant'
                                ? 'var(--chart-3)'
                                : 'var(--muted-foreground)'
                          }
                        />
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {dcgMember.members?.profiles?.email || dcgMember.members?.member_id || '—'}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-colors',
                        isPresent
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-transparent',
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <span className="text-xs font-medium text-muted-foreground">
            <strong>{presentMembers.size}</strong> of <strong>{totalCount}</strong> marked present
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saveAttendance.isPending}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleRecordAttendance}
              disabled={saveAttendance.isPending || loadingMembers || !dcgMembers?.length}
              className="rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-regal hover:opacity-95"
            >
              {saveAttendance.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-4 w-4" />
                  Save Attendance
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
