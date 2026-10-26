
import React from 'react';
import { useNavigate } from '@/lib/router-compat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Download, Search, Pen, MoreVertical, Eye, Trash2, Star, Baby, Phone, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMembers, MemberWithProfile, useDeleteMember } from '@/hooks/useMembers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import RegisterMemberForm from '@/components/admin/regional/RegisterMemberForm';
import EditMemberForm from '@/components/admin/regional/EditMemberForm';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from 'lucide-react';

import Papa from 'papaparse';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildChildrenSet } from '@/utils/childUtils';
import { fetchMemberRelationshipsForMembers } from '@/utils/fetchMemberRelationships';
import MemberKPICards from '@/components/admin/regional/MemberKPICards';
import { SearchBar, RoundButton, ChipRow, Initials, StatusPill, TypePill, SheetHeader } from '@/components/admin/regional/RegionalUI';
import { EmptyState } from '@/components/member/MemberUI';
import { format } from 'date-fns';

const Members: React.FC = () => {
  const navigate = useNavigate();
  const { userRegion } = useAuth();
  const { data: members, isLoading: isLoadingMembers, error: membersError } = useMembers(userRegion?.id);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isRegisterDialogOpen, setRegisterDialogOpen] = React.useState(false);
  const [editMember, setEditMember] = React.useState<MemberWithProfile | null>(null);
  const [memberToDelete, setMemberToDelete] = React.useState<MemberWithProfile | null>(null);
  const deleteMutation = useDeleteMember();
  
  // Member filters
  const [memberStatusFilter, setMemberStatusFilter] = React.useState('all');
  const [memberTypeFilter, setMemberTypeFilter] = React.useState('all');
  const [joinedPeriod, setJoinedPeriod] = React.useState('all');
  



  // Fetch member relationships for children filter
  const memberIds = React.useMemo(() => members?.map(m => m.id) || [], [members]);
  const sortedMemberIdsKey = React.useMemo(() => [...memberIds].sort().join(','), [memberIds]);
  const { data: memberRelationships = [] } = useQuery({
    queryKey: ['region-member-relationships-filter', sortedMemberIdsKey],
    queryFn: () => fetchMemberRelationshipsForMembers(memberIds),
    enabled: memberIds.length > 0,
  });

  // Fetch events for visitor rated_event_id to distinguish special vs regular visitors
  const visitorEventIds = React.useMemo(() => {
    const ids = members?.filter(m => m.member_type === 'visitor' && m.rated_event_id)
      .map(m => m.rated_event_id as string) || [];
    return [...new Set(ids)];
  }, [members]);

  const { data: visitorEvents = [] } = useQuery({
    queryKey: ['visitor-events-special', visitorEventIds.sort().join(',')],
    queryFn: async () => {
      if (visitorEventIds.length === 0) return [];
      const { data } = await supabase.from('events')
        .select('id, is_special')
        .in('id', visitorEventIds);
      return data || [];
    },
    enabled: visitorEventIds.length > 0,
  });

  const specialEventIds = React.useMemo(() => {
    const set = new Set<string>();
    visitorEvents.forEach(e => { if (e.is_special) set.add(e.id); });
    return set;
  }, [visitorEvents]);




  // Strict children set (age<16 AND linked to an adult). Single source of truth
  // shared with the KPI cards so the table filter and KPI counts always agree.
  const childrenSet = React.useMemo(
    () => buildChildrenSet(members || [], memberRelationships),
    [members, memberRelationships]
  );

  const filteredMembers = React.useMemo(() => {
    if (!members) return [];
    return members.filter(member => {
      const profile = member.profiles;
      if (!profile) return false;
      
      // Search filter
      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase();
      const email = (profile.email || '').toLowerCase();
      const phone = (profile.phone || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      const searchMatch = fullName.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower);
      
      // Status filter
      const statusMatch = memberStatusFilter === 'all' || member.status === memberStatusFilter;
      
      // Member type filter (children always evaluated via the strict set)
      const isChild = childrenSet.has(member.id);
      let typeMatch = false;
      if (memberTypeFilter === 'all') {
        typeMatch = true;
      } else if (memberTypeFilter === 'children') {
        typeMatch = isChild;
      } else if (isChild) {
        // Children must NEVER appear under member/visitor filters
        typeMatch = false;
      } else if (memberTypeFilter === 'visitor_special') {
        typeMatch = member.member_type === 'visitor' && !!member.rated_event_id && specialEventIds.has(member.rated_event_id);
      } else if (memberTypeFilter === 'visitor_regular') {
        typeMatch = member.member_type === 'visitor' && (!member.rated_event_id || !specialEventIds.has(member.rated_event_id));
      } else {
        typeMatch = member.member_type === memberTypeFilter;
      }
      
      const months = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 }[joinedPeriod as '1m'];
      let periodMatch = true;
      if (months) {
        const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - months);
        periodMatch = !!member.created_at && new Date(member.created_at) >= cutoff;
      }
      return searchMatch && statusMatch && typeMatch && periodMatch;
    });
  }, [members, searchTerm, memberStatusFilter, memberTypeFilter, joinedPeriod, childrenSet, specialEventIds]);

  const periodMembers = React.useMemo(() => {
    const months = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 }[joinedPeriod as '1m'];
    if (!months || !members) return members;
    const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - months);
    return members.filter((m: any) => !!m.created_at && new Date(m.created_at) >= cutoff);
  }, [members, joinedPeriod]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'transferred': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'new': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete?.profiles?.id) return;
    
    try {
      await deleteMutation.mutateAsync(memberToDelete.profiles.id);
      toast.success('Member deleted successfully');
      setMemberToDelete(null);
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Failed to delete member');
    }
  };

  const handleExportMembers = () => {
    if (!filteredMembers || filteredMembers.length === 0) {
      toast.error('No members to export');
      return;
    }

    // Map the filtered members to CSV-friendly format
    const dataToExport = filteredMembers.map(member => ({
      'Member ID': member.member_id,
      'First Name': member.profiles?.first_name || '',
      'Last Name': member.profiles?.last_name || '',
      'Email': member.profiles?.email || '',
      'Phone': member.profiles?.phone || '',
      'Address': member.profiles?.address || '',
      'Gender': member.profiles?.gender || '',
      'Date of Birth': member.profiles?.date_of_birth || '',
      'Occupation': member.profiles?.occupation || '',
      'Member Type': member.member_type,
      'Status': member.status || '',
      'Join Date': member.join_date ? new Date(member.join_date).toLocaleDateString() : '',
    }));

    // Generate CSV
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `members-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${filteredMembers.length} members successfully`);
  };




  const typeLabel = (m: MemberWithProfile) => {
    if (childrenSet.has(m.id)) return { label: 'Child', tone: 'var(--chart-5)' };
    if (m.member_type === 'visitor') {
      return m.rated_event_id && specialEventIds.has(m.rated_event_id)
        ? { label: 'Special visitor', tone: 'var(--chart-4)' }
        : { label: 'Visitor', tone: 'var(--chart-3)' };
    }
    return { label: 'Member', tone: 'var(--chart-2)' };
  };

  const rowMenu = (member: MemberWithProfile) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" onClick={(e) => e.stopPropagation()} aria-label="Member actions"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground">
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate(`/admin/regional/members/${member.id}`)}>
          <Eye className="h-4 w-4 mr-2" /> View profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setEditMember(member)}>
          <Pen className="h-4 w-4 mr-2" /> Edit
        </DropdownMenuItem>
        {member.profiles?.phone && (
          <DropdownMenuItem onClick={() => { window.location.href = `tel:${member.profiles?.phone}`; }}>
            <Phone className="h-4 w-4 mr-2" /> Call
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setMemberToDelete(member)} className="text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <div className="space-y-5 pb-24 lg:pb-0">
        {/* Edit Member Dialog */}
        <Dialog open={!!editMember} onOpenChange={(open) => { if (!open) setEditMember(null); }}>
          <DialogContent className="lg:max-w-3xl">
            <SheetHeader icon={Pen} title="Edit member" description="Update personal, spiritual and family details." />
            <DialogHeader className="sr-only">
              <DialogTitle>Edit Member</DialogTitle>
              <DialogDescription>Update member information and details.</DialogDescription>
            </DialogHeader>
            {editMember && <EditMemberForm member={editMember} onSuccess={() => setEditMember(null)} />}
          </DialogContent>
        </Dialog>

        {/* Register Member Dialog */}
        <Dialog open={isRegisterDialogOpen} onOpenChange={setRegisterDialogOpen}>
          <DialogContent className="lg:max-w-3xl">
            <SheetHeader icon={UserPlus} title="Register member" description="Add a new member or visitor to your region." />
            <DialogHeader className="sr-only">
              <DialogTitle>Register New Member</DialogTitle>
              <DialogDescription>Fill out the form below to register a new member.</DialogDescription>
            </DialogHeader>
            <RegisterMemberForm onSuccess={() => setRegisterDialogOpen(false)} />
          </DialogContent>
        </Dialog>

        <ChipRow value={joinedPeriod} onChange={setJoinedPeriod} options={[
          { value: 'all', label: 'All time' },
          { value: '1m', label: '1 month' },
          { value: '3m', label: '3 months' },
          { value: '6m', label: '6 months' },
          { value: '1y', label: '1 year' },
        ]} />

        <MemberKPICards
          members={periodMembers}
          isLoading={isLoadingMembers}
          memberRelationships={memberRelationships}
          specialEventIds={specialEventIds}
          regionId={userRegion?.id}
          selected={memberTypeFilter}
          onSelect={setMemberTypeFilter}
        />

        {/* Search + actions */}
        <div className="flex items-center gap-2">
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search name, email or phone" />
          <RoundButton icon={Download} label={`Export ${filteredMembers.length} to CSV`} onClick={handleExportMembers} />
          <RoundButton icon={UserPlus} label="Register member" primary onClick={() => setRegisterDialogOpen(true)} />
        </div>

        <div className="space-y-2">
          <ChipRow value={memberTypeFilter} onChange={setMemberTypeFilter} options={[
            { value: 'all', label: 'Everyone' },
            { value: 'member', label: 'Members' },
            { value: 'visitor_regular', label: 'Visitors' },
            { value: 'visitor_special', label: 'Special visitors' },
            { value: 'children', label: 'Children' },
          ]} />
          <ChipRow value={memberStatusFilter} onChange={setMemberStatusFilter} options={[
            { value: 'all', label: 'Any status' },
            { value: 'new', label: 'New' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'transferred', label: 'Transferred' },
          ]} />
        </div>

        <p className="px-1 text-xs font-medium text-muted-foreground">
          Showing {filteredMembers.length} of {members?.length ?? 0}
        </p>

        {isLoadingMembers || !userRegion ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />)}</div>
        ) : membersError ? (
          <EmptyState icon={Users} title="Couldn't load members" hint="Please refresh and try again." />
        ) : filteredMembers.length === 0 ? (
          <EmptyState icon={Users} title={searchTerm ? 'No one matches your search' : 'No members found'} hint="Try another search or filter." />
        ) : (
          <>
            {/* Mobile / tablet list */}
            <ul className="grid gap-2 md:grid-cols-2 lg:hidden">
              {filteredMembers.map((member) => {
                const t = typeLabel(member);
                return (
                  <li key={member.id} className="min-w-0">
                    <div role="button" tabIndex={0}
                      onClick={() => navigate(`/admin/regional/members/${member.id}`)}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/admin/regional/members/${member.id}`)}
                      className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-card p-3 transition active:scale-[0.99]">
                      <Initials first={member.profiles?.first_name} last={member.profiles?.last_name} photo={member.photo_url} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{member.profiles?.last_name} {member.profiles?.first_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{member.profiles?.phone || member.profiles?.email || 'No contact'}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <TypePill label={t.label} tone={t.tone} />
                          <StatusPill status={member.status} />
                        </div>
                      </div>
                      {rowMenu(member)}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-2xl border border-border bg-card lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="hidden xl:table-cell">Address</TableHead>
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
                      <TableRow key={member.id} className="cursor-pointer" onClick={() => navigate(`/admin/regional/members/${member.id}`)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Initials size="sm" first={member.profiles?.first_name} last={member.profiles?.last_name} photo={member.photo_url} />
                            <div className="min-w-0">
                              <p className="truncate font-medium">{member.profiles?.last_name} {member.profiles?.first_name}</p>
                              <p className="truncate text-xs text-muted-foreground">{member.profiles?.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{member.profiles?.phone || '—'}</TableCell>
                        <TableCell className="hidden max-w-[220px] truncate xl:table-cell">{member.profiles?.address || '—'}</TableCell>
                        <TableCell><TypePill label={t.label} tone={t.tone} /></TableCell>
                        <TableCell><StatusPill status={member.status} /></TableCell>
                        <TableCell className="text-muted-foreground">{member.join_date ? format(new Date(member.join_date), 'dd/MM/yyyy') : '—'}</TableCell>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {memberToDelete?.profiles?.last_name} {memberToDelete?.profiles?.first_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes this person and all their personal data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMember} className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Members;
