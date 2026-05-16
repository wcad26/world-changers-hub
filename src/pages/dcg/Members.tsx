import React from 'react';
import { useNavigate } from 'react-router-dom';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Download, Users, UserPlus, MoreVertical, Eye, Trash2, UserMinus } from 'lucide-react';
import { useDcgMembers, useRemoveMemberFromDcg } from '@/hooks/useDcgMembers';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildChildrenSet } from '@/utils/childUtils';
import { fetchMemberRelationshipsForMembers } from '@/utils/fetchMemberRelationships';
import DcgMemberKPICards from '@/components/admin/dcg/DcgMemberKPICards';
import AddExistingMemberDialog from '@/components/admin/dcg/AddExistingMemberDialog';
import RegisterNewMemberDialog from '@/components/admin/dcg/RegisterNewMemberDialog';
import { toast } from 'sonner';
import Papa from 'papaparse';
import type { MemberWithProfile } from '@/hooks/useMembers';

const DcgMembers: React.FC = () => {
  const navigate = useNavigate();
  const { userDcg } = useAuth();
  const { data: dcgMembers, isLoading } = useDcgMembers(userDcg?.id);
  const removeMember = useRemoveMemberFromDcg();

  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [addExistingOpen, setAddExistingOpen] = React.useState(false);
  const [registerNewOpen, setRegisterNewOpen] = React.useState(false);
  const [memberToRemove, setMemberToRemove] = React.useState<{ dcgMemberId: string; name: string } | null>(null);

  // Flatten DCG members to MemberWithProfile shape (preserve dcg_member id for remove)
  const flatMembers = React.useMemo(() => {
    if (!dcgMembers) return [] as (MemberWithProfile & { __dcgMemberId: string })[];
    return dcgMembers
      .filter(dm => dm.members)
      .map(dm => ({ ...(dm.members as any), __dcgMemberId: dm.id })) as (MemberWithProfile & { __dcgMemberId: string })[];
  }, [dcgMembers]);

  const memberIds = React.useMemo(() => flatMembers.map(m => m.id), [flatMembers]);
  const sortedKey = React.useMemo(() => [...memberIds].sort().join(','), [memberIds]);

  const { data: memberRelationships = [] } = useQuery({
    queryKey: ['dcg-member-relationships', sortedKey],
    queryFn: () => fetchMemberRelationshipsForMembers(memberIds),
    enabled: memberIds.length > 0,
  });

  const visitorEventIds = React.useMemo(() => {
    const ids = flatMembers
      .filter(m => m.member_type === 'visitor' && m.rated_event_id)
      .map(m => m.rated_event_id as string);
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
    visitorEvents.forEach(e => { if (e.is_special) set.add(e.id); });
    return set;
  }, [visitorEvents]);

  const childrenSet = React.useMemo(
    () => buildChildrenSet(flatMembers, memberRelationships),
    [flatMembers, memberRelationships],
  );

  const filteredMembers = React.useMemo(() => {
    return flatMembers.filter(member => {
      const profile = member.profiles;
      if (!profile) return false;

      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase();
      const email = (profile.email || '').toLowerCase();
      const phone = (profile.phone || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      const searchMatch = fullName.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower);

      const statusMatch = statusFilter === 'all' || member.status === statusFilter;

      const isChild = childrenSet.has(member.id);
      const isSpecialVisitor = member.member_type === 'visitor' && !!member.rated_event_id && specialEventIds.has(member.rated_event_id);

      let typeMatch = false;
      if (typeFilter === 'all') {
        typeMatch = !isSpecialVisitor; // hide special-event visitors from default view (KPI scope)
      } else if (typeFilter === 'children') {
        typeMatch = isChild;
      } else if (isChild) {
        typeMatch = false;
      } else if (typeFilter === 'visitor_regular') {
        typeMatch = member.member_type === 'visitor' && !isSpecialVisitor;
      } else if (typeFilter === 'member') {
        typeMatch = member.member_type === 'member';
      }

      return searchMatch && statusMatch && typeMatch;
    });
  }, [flatMembers, searchTerm, statusFilter, typeFilter, childrenSet, specialEventIds]);

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

  const handleExport = () => {
    if (filteredMembers.length === 0) {
      toast.error('No members to export');
      return;
    }
    const data = filteredMembers.map(m => ({
      'Member ID': m.member_id,
      'Last Name': m.profiles?.last_name || '',
      'First Name': m.profiles?.first_name || '',
      'Email': m.profiles?.email || '',
      'Phone': m.profiles?.phone || '',
      'Address': m.profiles?.address || '',
      'Type': m.member_type,
      'Status': m.status || '',
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
    if (!memberToRemove || !userDcg?.id) return;
    try {
      await removeMember.mutateAsync({ dcgMemberId: memberToRemove.dcgMemberId, dcgId: userDcg.id });
      setMemberToRemove(null);
    } catch (e) {
      // toast handled by mutation
    }
  };

  return (
    <DcgAdminLayout>
      <div className="space-y-6 p-4 md:p-0 px-[10px]">
        <DcgMemberKPICards
          members={flatMembers}
          isLoading={isLoading}
          memberRelationships={memberRelationships}
          specialEventIds={specialEventIds}
          dcgId={userDcg?.id}
        />

        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Member Directory</h2>
                <p className="text-sm text-muted-foreground">A list of all members in this DCG</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" onClick={() => setAddExistingOpen(true)} disabled={!userDcg} className="gap-2">
                <Users className="h-4 w-4" /> Add Existing
              </Button>
              <Button onClick={() => setRegisterNewOpen(true)} disabled={!userDcg} className="gap-2">
                <UserPlus className="h-4 w-4" /> Register New
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 items-stretch sm:items-center mb-4">
            <div className="relative flex-1 sm:min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                className="pl-9 bg-background/60"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background/60">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background/60">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="visitor_regular">Regular Visitors</SelectItem>
                <SelectItem value="children">Children</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-border/40 overflow-hidden -mx-2 sm:mx-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[20%]">Name</TableHead>
                    <TableHead className="hidden md:table-cell w-[20%]">Address</TableHead>
                    <TableHead className="hidden sm:table-cell">Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Join Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading || !userDcg ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="animate-pulse rounded-lg bg-muted h-5 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredMembers.length > 0 ? (
                    filteredMembers.map(member => (
                      <TableRow
                        key={member.id}
                        className="cursor-pointer hover:bg-muted/20 transition-colors"
                        onClick={() => navigate(`/dcg/member/${member.id}`)}
                      >
                        <TableCell className="font-medium">
                          {member.profiles?.last_name} {member.profiles?.first_name}
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-xs truncate">
                          {member.profiles?.address || 'N/A'}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{member.profiles?.phone || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={member.member_type === 'visitor' ? 'secondary' : 'default'}
                            className={member.member_type === 'visitor' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'}
                          >
                            <Users className="w-3 h-3 mr-1" />
                            {member.member_type === 'visitor' ? 'Visitor' : 'Member'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(member.status || 'new')}>
                            {member.status || 'new'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {member.join_date ? new Date(member.join_date).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/dcg/member/${member.id}`)}>
                                <Eye className="h-4 w-4 mr-2" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setMemberToRemove({
                                  dcgMemberId: member.__dcgMemberId,
                                  name: `${member.profiles?.last_name || ''} ${member.profiles?.first_name || ''}`.trim(),
                                })}
                                className="text-destructive focus:text-destructive"
                              >
                                <UserMinus className="h-4 w-4 mr-2" /> Remove from DCG
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                        {searchTerm ? 'No members match your search.' : 'No members found.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      <AddExistingMemberDialog
        open={addExistingOpen}
        onOpenChange={setAddExistingOpen}
        dcgId={userDcg?.id || ''}
      />
      <RegisterNewMemberDialog
        open={registerNewOpen}
        onOpenChange={setRegisterNewOpen}
        dcgId={userDcg?.id || ''}
      />

      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from DCG?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {memberToRemove?.name} from this DCG. Their regional member record stays intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DcgAdminLayout>
  );
};

export default DcgMembers;
