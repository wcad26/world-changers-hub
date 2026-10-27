import React from 'react';
import { useNavigate } from '@/lib/router-compat';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Download,
  Users,
  UserPlus,
  MoreVertical,
  Eye,
  UserMinus,
  Pencil,
  ShieldCheck,
  ShieldOff,
  Phone,
} from 'lucide-react';
import { useDcgMembers, useRemoveMemberFromDcg, useUpdateDcgMemberRole } from '@/hooks/useDcgMembers';
import { useCurrentDcg } from '@/hooks/useDcgFinancials';
import EditMemberForm from '@/components/admin/regional/EditMemberForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildChildrenSet } from '@/utils/childUtils';
import { fetchMemberRelationshipsForMembers } from '@/utils/fetchMemberRelationships';
import DcgMemberKPICards from '@/components/admin/dcg/DcgMemberKPICards';
import AddExistingMemberDialog from '@/components/admin/dcg/AddExistingMemberDialog';
import RegisterNewMemberDialog from '@/components/admin/dcg/RegisterNewMemberDialog';
import {
  SearchBar,
  RoundButton,
  ChipRow,
  Initials,
  StatusPill,
  TypePill,
  SheetHeader,
  EmptyState,
} from '@/components/admin/dcg/DcgUI';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { format, subMonths } from 'date-fns';
import type { MemberWithProfile } from '@/hooks/useMembers';

type DcgMemberItem = MemberWithProfile & {
  __dcgMemberId: string;
  __dcgRole: string;
  __dcgJoinedDate?: string | null;
};

const DcgMembers: React.FC = () => {
  const navigate = useNavigate();
  const { userDcg } = useAuth();
  const { data: resolvedDcg } = useCurrentDcg();
  const dcgId = userDcg?.id || resolvedDcg?.id;

  const { data: dcgMembers, isLoading } = useDcgMembers(dcgId);
  const removeMember = useRemoveMemberFromDcg();
  const updateRole = useUpdateDcgMemberRole();

  const [searchTerm, setSearchTerm] = React.useState('');
  const [joinedPeriod, setJoinedPeriod] = React.useState('all');
  const [memberTypeFilter, setMemberTypeFilter] = React.useState('all');
  const [memberStatusFilter, setMemberStatusFilter] = React.useState('all');
  const [dcgRoleFilter, setDcgRoleFilter] = React.useState('all');

  const [addExistingOpen, setAddExistingOpen] = React.useState(false);
  const [registerNewOpen, setRegisterNewOpen] = React.useState(false);
  const [memberToRemove, setMemberToRemove] = React.useState<{ dcgMemberId: string; name: string } | null>(null);
  const [editMember, setEditMember] = React.useState<MemberWithProfile | null>(null);

  // Flatten DCG members to MemberWithProfile shape (preserve dcg_member id + role)
  const flatMembers = React.useMemo(() => {
    if (!dcgMembers) return [] as DcgMemberItem[];
    return dcgMembers
      .filter((dm) => dm.members && dm.is_active !== false)
      .map((dm) => ({
        ...(dm.members as any),
        __dcgMemberId: dm.id,
        __dcgRole: dm.role,
        __dcgJoinedDate: dm.joined_date,
      })) as DcgMemberItem[];
  }, [dcgMembers]);

  const memberIds = React.useMemo(() => flatMembers.map((m) => m.id), [flatMembers]);
  const sortedKey = React.useMemo(() => [...memberIds].sort().join(','), [memberIds]);

  const { data: memberRelationships = [] } = useQuery({
    queryKey: ['dcg-member-relationships', sortedKey],
    queryFn: () => fetchMemberRelationshipsForMembers(memberIds),
    enabled: memberIds.length > 0,
  });

  const visitorEventIds = React.useMemo(() => {
    const ids = flatMembers
      .filter((m) => m.member_type === 'visitor' && m.rated_event_id)
      .map((m) => m.rated_event_id as string);
    return [...new Set(ids)];
  }, [flatMembers]);

  const { data: visitorEvents = [] } = useQuery({
    queryKey: ['dcg-visitor-events-special', visitorEventIds.sort().join(',')],
    queryFn: async () => {
      if (visitorEventIds.length === 0) return [];
      const { data } = await supabase.from('events').select('id, is_special').in('id', visitorEventIds);
      return data || [];
    },
    enabled: visitorEventIds.length > 0,
  });

  const specialEventIds = React.useMemo(() => {
    const set = new Set<string>();
    visitorEvents.forEach((e) => {
      if (e.is_special) set.add(e.id);
    });
    return set;
  }, [visitorEvents]);

  const childrenSet = React.useMemo(
    () => buildChildrenSet(flatMembers, memberRelationships),
    [flatMembers, memberRelationships],
  );

  // Period-filtered subset (shared between KPIs and directory)
  const periodMembers = React.useMemo(() => {
    if (joinedPeriod === 'all') return flatMembers;
    const now = new Date();
    const monthsMap: Record<string, number> = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 };
    const months = monthsMap[joinedPeriod];
    if (!months) return flatMembers;
    const cutoff = subMonths(now, months);
    return flatMembers.filter((m) => {
      const d = m.__dcgJoinedDate || m.join_date;
      if (!d) return false;
      return new Date(d) >= cutoff;
    });
  }, [flatMembers, joinedPeriod]);

  const filteredMembers = React.useMemo(() => {
    return periodMembers.filter((member) => {
      const profile = member.profiles;
      if (!profile) return false;

      // Hide special-event visitors to match DCG KPI scope
      const isSpecialVisitor =
        member.member_type === 'visitor' && !!member.rated_event_id && specialEventIds.has(member.rated_event_id);
      if (isSpecialVisitor) return false;

      // Search filter
      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase();
      const reverseName = `${profile.last_name || ''} ${profile.first_name || ''}`.toLowerCase();
      const email = (profile.email || '').toLowerCase();
      const phone = (profile.phone || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      const searchMatch =
        !searchLower ||
        fullName.includes(searchLower) ||
        reverseName.includes(searchLower) ||
        email.includes(searchLower) ||
        phone.includes(searchLower);

      // Status filter
      const statusMatch = memberStatusFilter === 'all' || member.status === memberStatusFilter;

      // DCG role filter
      const roleMatch = dcgRoleFilter === 'all' || member.__dcgRole === dcgRoleFilter;

      // Member type filter
      const isChild = childrenSet.has(member.id);
      let typeMatch = false;
      if (memberTypeFilter === 'all') {
        typeMatch = true;
      } else if (memberTypeFilter === 'children') {
        typeMatch = isChild;
      } else if (isChild) {
        typeMatch = false;
      } else if (memberTypeFilter === 'visitor_regular') {
        typeMatch = member.member_type === 'visitor';
      } else {
        typeMatch = member.member_type === memberTypeFilter;
      }

      return searchMatch && statusMatch && roleMatch && typeMatch;
    });
  }, [periodMembers, searchTerm, memberStatusFilter, dcgRoleFilter, memberTypeFilter, childrenSet, specialEventIds]);

  const typeLabel = (m: MemberWithProfile) => {
    if (childrenSet.has(m.id)) return { label: 'Child', tone: 'var(--chart-5)' };
    if (m.member_type === 'visitor') return { label: 'Visitor', tone: 'var(--chart-3)' };
    return { label: 'Member', tone: 'var(--chart-2)' };
  };

  const handleExport = () => {
    if (filteredMembers.length === 0) {
      toast.error('No members to export');
      return;
    }
    const data = filteredMembers.map((m) => ({
      'Member ID': m.member_id,
      'Last Name': m.profiles?.last_name || '',
      'First Name': m.profiles?.first_name || '',
      Email: m.profiles?.email || '',
      Phone: m.profiles?.phone || '',
      Address: m.profiles?.address || '',
      'DCG Role': m.__dcgRole || 'Member',
      Type: childrenSet.has(m.id) ? 'Child' : m.member_type,
      Status: m.status || '',
      'Join Date': m.join_date ? new Date(m.join_date).toLocaleDateString() : '',
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dcg-members-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredMembers.length} members`);
  };

  const handleRemove = async () => {
    if (!memberToRemove || !dcgId) return;
    try {
      await removeMember.mutateAsync({ dcgMemberId: memberToRemove.dcgMemberId, dcgId });
      setMemberToRemove(null);
    } catch {
      // toast handled by mutation
    }
  };

  const rowMenu = (member: DcgMemberItem) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          aria-label="Member actions"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => navigate(`/dcg/member/${member.id}`)}>
          <Eye className="mr-2 h-4 w-4" /> View profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setEditMember(member)}>
          <Pencil className="mr-2 h-4 w-4" /> Edit details
        </DropdownMenuItem>
        {member.profiles?.phone && (
          <DropdownMenuItem
            onClick={() => {
              window.location.href = `tel:${member.profiles?.phone}`;
            }}
          >
            <Phone className="mr-2 h-4 w-4" /> Call
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {member.__dcgRole === 'Assistant' ? (
          <DropdownMenuItem
            onClick={() => updateRole.mutate({ dcgMemberId: member.__dcgMemberId, role: 'Member' })}
          >
            <ShieldOff className="mr-2 h-4 w-4" /> Remove as Assistant
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => updateRole.mutate({ dcgMemberId: member.__dcgMemberId, role: 'Assistant' })}
          >
            <ShieldCheck className="mr-2 h-4 w-4" /> Make DCG Assistant
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            setMemberToRemove({
              dcgMemberId: member.__dcgMemberId,
              name: `${member.profiles?.last_name || ''} ${member.profiles?.first_name || ''}`.trim(),
            })
          }
          className="text-destructive focus:text-destructive"
        >
          <UserMinus className="mr-2 h-4 w-4" /> Remove from DCG
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <DcgAdminLayout>
      <div className="space-y-5">
        {/* Joined Period Filter */}
        <ChipRow
          value={joinedPeriod}
          onChange={setJoinedPeriod}
          options={[
            { value: 'all', label: 'All time' },
            { value: '1m', label: '1 month' },
            { value: '3m', label: '3 months' },
            { value: '6m', label: '6 months' },
            { value: '1y', label: '1 year' },
          ]}
        />

        {/* Hero + KPI Ring Tiles */}
        <DcgMemberKPICards
          members={periodMembers}
          isLoading={isLoading}
          memberRelationships={memberRelationships}
          specialEventIds={specialEventIds}
          dcgId={dcgId}
          selected={memberTypeFilter}
          onSelect={setMemberTypeFilter}
        />

        {/* Search + Quick Actions */}
        <div className="flex items-center gap-2">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search name, email or phone"
          />
          <RoundButton
            icon={Download}
            label={`Export ${filteredMembers.length} to CSV`}
            onClick={handleExport}
          />
          <RoundButton
            icon={Users}
            label="Add existing regional member"
            onClick={() => setAddExistingOpen(true)}
          />
          <RoundButton
            icon={UserPlus}
            label="Register new member"
            primary
            onClick={() => setRegisterNewOpen(true)}
          />
        </div>

        {/* Filter Chip Rows */}
        <div className="space-y-2">
          <ChipRow
            value={memberTypeFilter}
            onChange={setMemberTypeFilter}
            options={[
              { value: 'all', label: 'Everyone' },
              { value: 'member', label: 'Members' },
              { value: 'visitor_regular', label: 'Visitors' },
              { value: 'children', label: 'Children' },
            ]}
          />
          <div className="flex flex-wrap gap-2">
            <div className="min-w-0 flex-1">
              <ChipRow
                value={memberStatusFilter}
                onChange={setMemberStatusFilter}
                options={[
                  { value: 'all', label: 'Any status' },
                  { value: 'new', label: 'New' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'transferred', label: 'Transferred' },
                ]}
              />
            </div>
            <div className="min-w-0">
              <ChipRow
                value={dcgRoleFilter}
                onChange={setDcgRoleFilter}
                options={[
                  { value: 'all', label: 'All roles' },
                  { value: 'Leader', label: 'Leader' },
                  { value: 'Assistant', label: 'Assistant' },
                  { value: 'Member', label: 'Member' },
                ]}
              />
            </div>
          </div>
        </div>

        <p className="px-1 text-xs font-medium text-muted-foreground">
          Showing {filteredMembers.length} of {flatMembers.length}
        </p>

        {/* Directory List / Table */}
        {isLoading || !dcgId ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchTerm ? 'No one matches your search' : 'No members found'}
            hint="Try adjusting your filters, adding an existing regional member, or registering someone new."
          />
        ) : (
          <>
            {/* Mobile / Tablet Card Grid */}
            <ul className="grid gap-2 md:grid-cols-2 lg:hidden">
              {filteredMembers.map((member) => {
                const t = typeLabel(member);
                return (
                  <li key={member.id} className="min-w-0">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/dcg/member/${member.id}`)}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/dcg/member/${member.id}`)}
                      className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-card p-3 transition active:scale-[0.99]"
                    >
                      <Initials
                        first={member.profiles?.first_name}
                        last={member.profiles?.last_name}
                        photo={member.photo_url}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">
                          {member.profiles?.last_name} {member.profiles?.first_name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {member.profiles?.phone || member.profiles?.email || 'No contact'}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <TypePill label={t.label} tone={t.tone} />
                          {member.__dcgRole && member.__dcgRole !== 'Member' && (
                            <TypePill label={member.__dcgRole} tone="var(--primary)" />
                          )}
                          <StatusPill status={member.status} />
                        </div>
                      </div>
                      {rowMenu(member)}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-2xl border border-border bg-card lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="hidden xl:table-cell">Address</TableHead>
                    <TableHead>DCG Role</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => {
                    const t = typeLabel(member);
                    return (
                      <TableRow
                        key={member.id}
                        className="cursor-pointer transition-colors hover:bg-muted/30"
                        onClick={() => navigate(`/dcg/member/${member.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Initials
                              size="sm"
                              first={member.profiles?.first_name}
                              last={member.profiles?.last_name}
                              photo={member.photo_url}
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {member.profiles?.last_name} {member.profiles?.first_name}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {member.profiles?.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{member.profiles?.phone || '—'}</TableCell>
                        <TableCell className="hidden max-w-[220px] truncate xl:table-cell">
                          {member.profiles?.address || '—'}
                        </TableCell>
                        <TableCell>
                          <TypePill label={member.__dcgRole || 'Member'} />
                        </TableCell>
                        <TableCell>
                          <TypePill label={t.label} tone={t.tone} />
                        </TableCell>
                        <TableCell>
                          <StatusPill status={member.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {member.join_date ? format(new Date(member.join_date), 'dd/MM/yyyy') : '—'}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>{rowMenu(member)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* Add Existing Regional Member Dialog */}
      <AddExistingMemberDialog
        open={addExistingOpen}
        onOpenChange={setAddExistingOpen}
        dcgId={dcgId || ''}
      />

      {/* Register New Member Dialog */}
      <RegisterNewMemberDialog
        open={registerNewOpen}
        onOpenChange={setRegisterNewOpen}
        dcgId={dcgId || ''}
      />

      {/* Remove Confirmation AlertDialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {memberToRemove?.name} from DCG?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {memberToRemove?.name} from this DCG. Their regional member record remains intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Member Dialog */}
      <Dialog
        open={!!editMember}
        onOpenChange={(open) => {
          if (!open) setEditMember(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl lg:max-w-3xl">
          <SheetHeader
            icon={Pencil}
            title="Edit member"
            description="Update personal, spiritual and family details."
          />
          <DialogHeader className="sr-only">
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>Update member information and details.</DialogDescription>
          </DialogHeader>
          {editMember && <EditMemberForm member={editMember} onSuccess={() => setEditMember(null)} />}
        </DialogContent>
      </Dialog>
    </DcgAdminLayout>
  );
};

export default DcgMembers;
