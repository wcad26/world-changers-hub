import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Phone,
  Loader2,
  MapPin,
  AlertCircle,
  Users,
  Check,
  Inbox,
} from 'lucide-react';
import { useAvailableRegionalMembers, useAddMemberToDcg } from '@/hooks/useDcgMembers';
import { useCurrentDcg } from '@/hooks/useDcgFinancials';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';
import {
  SheetHeader,
  SearchBar,
  Initials,
  TypePill,
  EmptyState,
} from '@/components/admin/dcg/DcgUI';

type DcgMemberRole = Database['public']['Enums']['dcg_member_role'];

interface AddExistingMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dcgId: string;
}

const AddExistingMemberDialog: React.FC<AddExistingMemberDialogProps> = ({
  open,
  onOpenChange,
  dcgId,
}) => {
  const { userRegion, userDcg } = useAuth();
  const { data: resolvedDcg } = useCurrentDcg();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<DcgMemberRole>('Member');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  const regionId = userRegion?.id || userDcg?.region_id || resolvedDcg?.region_id;
  const { data: availableMembers, isLoading } = useAvailableRegionalMembers(dcgId, regionId);
  const addMemberToDcg = useAddMemberToDcg();

  const filteredMembers =
    availableMembers?.filter((member) => {
      const searchLower = searchTerm.toLowerCase().trim();
      if (!searchLower) return true;
      const firstName = member.profiles?.first_name || '';
      const lastName = member.profiles?.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
      const reverseName = `${lastName} ${firstName}`.trim().toLowerCase();
      const email = member.profiles?.email?.toLowerCase() || '';
      const phone = member.profiles?.phone?.toLowerCase() || '';
      const memberCode = member.member_id?.toLowerCase() || '';

      return (
        fullName.includes(searchLower) ||
        reverseName.includes(searchLower) ||
        email.includes(searchLower) ||
        phone.includes(searchLower) ||
        memberCode.includes(searchLower)
      );
    }) || [];

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const handleAddSelected = async () => {
    if (selectedMembers.size === 0) return;

    const promises = Array.from(selectedMembers).map((memberId) =>
      addMemberToDcg.mutateAsync({
        dcgId,
        memberId,
        role: selectedRole,
      }),
    );

    try {
      await Promise.all(promises);
      setSelectedMembers(new Set());
      setSearchTerm('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add members:', error);
    }
  };

  if (!dcgId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Add Existing Members</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              DCG information not available. Please try again later.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end pt-2">
            <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] max-w-2xl flex-col overflow-hidden rounded-3xl">
        <SheetHeader
          icon={Users}
          title="Add Existing Members"
          description="Select registered regional members to add to your DCG."
        />
        <DialogHeader className="sr-only">
          <DialogTitle>Add Existing Members to DCG</DialogTitle>
          <DialogDescription>
            Select regional members to add to this DCG.
          </DialogDescription>
        </DialogHeader>

        {/* Search & Role Selector */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search name, phone, email, or member ID…"
          />
          <Select
            value={selectedRole}
            onValueChange={(value) => setSelectedRole(value as DcgMemberRole)}
          >
            <SelectTrigger className="h-11 w-full rounded-full sm:w-40">
              <SelectValue placeholder="DCG Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Member">Member</SelectItem>
              <SelectItem value="Assistant">Assistant</SelectItem>
              <SelectItem value="Leader">Leader</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Scrollable Member Cards */}
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
              <span className="text-sm">Loading available regional members…</span>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-4">
              <EmptyState
                icon={Inbox}
                title={
                  searchTerm
                    ? 'No matching members found'
                    : 'All regional members are already in a DCG'
                }
                hint={
                  searchTerm
                    ? 'Try searching with a different name, phone number, or member ID.'
                    : 'You can register a brand-new member instead.'
                }
              />
            </div>
          ) : (
            <div className="space-y-2 py-1">
              {filteredMembers.map((member) => {
                const isSelected = selectedMembers.has(member.id);
                const firstName = member.profiles?.first_name || '';
                const lastName = member.profiles?.last_name || '';
                const displayName =
                  firstName || lastName
                    ? `${lastName} ${firstName}`.trim()
                    : 'Unknown Member';

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleMemberToggle(member.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all active:scale-[0.99]',
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/25'
                        : 'border-border bg-card hover:border-primary/40',
                    )}
                  >
                    <Initials
                      size="sm"
                      first={firstName}
                      last={lastName}
                      photo={(member.profiles as any)?.avatar_url}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-heading text-sm font-semibold text-foreground">
                          {displayName}
                        </p>
                        {member.member_type && (
                          <TypePill
                            label={member.member_type.replace('_', ' ')}
                            tone={
                              member.member_type === 'member'
                                ? 'var(--chart-2)'
                                : 'var(--chart-3)'
                            }
                          />
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {member.profiles?.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {member.profiles.phone}
                          </span>
                        )}
                        {member.profiles?.address && (
                          <span className="inline-flex max-w-[220px] items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{member.profiles.address}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={cn(
                        'grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-colors',
                        isSelected
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

        {/* Sticky Footer */}
        <div className="flex flex-col-reverse items-stretch justify-between gap-2 border-t border-border pt-3 sm:flex-row sm:items-center">
          <span className="text-center text-xs font-medium text-muted-foreground sm:text-left">
            {selectedMembers.size > 0
              ? `${selectedMembers.size} member${selectedMembers.size === 1 ? '' : 's'} selected as ${selectedRole}`
              : `${filteredMembers.length} available regional member${filteredMembers.length === 1 ? '' : 's'}`}
          </span>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddSelected}
              disabled={selectedMembers.size === 0 || addMemberToDcg.isPending}
              className="rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-regal hover:opacity-95"
            >
              {addMemberToDcg.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding…
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add {selectedMembers.size > 0 ? `(${selectedMembers.size})` : 'Selected'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddExistingMemberDialog;
