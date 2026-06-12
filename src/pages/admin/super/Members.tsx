import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Search, MoreVertical, Eye, Users, Pen, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAllMembers } from '@/hooks/useAllMembers';
import { useAllRegions } from '@/hooks/useAllRegions';
import { useDeleteMember } from '@/hooks/useMembers';
import { buildChildrenSet } from '@/utils/childUtils';
import { fetchMemberRelationshipsForMembers } from '@/utils/fetchMemberRelationships';
import GlobalMemberKPICards from '@/components/admin/super/GlobalMemberKPICards';
import EditMemberForm from '@/components/admin/regional/EditMemberForm';

const SuperMembers: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [regionFilter, setRegionFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');

  const { data: regions } = useAllRegions();
  const { data: members, isLoading, error } = useAllMembers({});
  const [editMember, setEditMember] = React.useState<any | null>(null);
  const [memberToDelete, setMemberToDelete] = React.useState<any | null>(null);
  const deleteMutation = useDeleteMember();

  const handleDeleteMember = async () => {
    if (!memberToDelete?.profiles?.id) return;
    try {
      await deleteMutation.mutateAsync(memberToDelete.profiles.id);
      toast.success('Member deleted successfully');
      setMemberToDelete(null);
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete member');
    }
  };

  const memberIds = React.useMemo(() => members?.map(m => m.id) || [], [members]);
  const sortedKey = React.useMemo(() => [...memberIds].sort().join(','), [memberIds]);
  const { data: memberRelationships = [] } = useQuery({
    queryKey: ['super-global-member-relationships', sortedKey],
    queryFn: () => fetchMemberRelationshipsForMembers(memberIds),
    enabled: memberIds.length > 0,
  });

  const visitorEventIds = React.useMemo(() => {
    const ids = members?.filter(m => m.member_type === 'visitor' && m.rated_event_id)
      .map(m => m.rated_event_id as string) || [];
    return [...new Set(ids)];
  }, [members]);

  const { data: visitorEvents = [] } = useQuery({
    queryKey: ['super-global-visitor-events-special', visitorEventIds.sort().join(',')],
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
    () => buildChildrenSet((members || []) as any, memberRelationships),
    [members, memberRelationships]
  );

  const filteredMembers = React.useMemo(() => {
    if (!members) return [];
    return members.filter(member => {
      const profile = member.profiles;
      if (!profile) return false;

      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase();
      const email = (profile.email || '').toLowerCase();
      const phone = (profile.phone || '').toLowerCase();
      const s = searchTerm.toLowerCase();
      const searchMatch = !s || fullName.includes(s) || email.includes(s) || phone.includes(s);

      const regionMatch = regionFilter === 'all' || member.region_id === regionFilter;
      const statusMatch = statusFilter === 'all' || member.status === statusFilter;

      const isChild = childrenSet.has(member.id);
      let typeMatch = false;
      if (typeFilter === 'all') typeMatch = true;
      else if (typeFilter === 'children') typeMatch = isChild;
      else if (isChild) typeMatch = false;
      else if (typeFilter === 'visitor_special') typeMatch = member.member_type === 'visitor' && !!member.rated_event_id && specialEventIds.has(member.rated_event_id);
      else if (typeFilter === 'visitor_regular') typeMatch = member.member_type === 'visitor' && (!member.rated_event_id || !specialEventIds.has(member.rated_event_id));
      else typeMatch = member.member_type === typeFilter;

      return searchMatch && regionMatch && statusMatch && typeMatch;
    });
  }, [members, searchTerm, regionFilter, statusFilter, typeFilter, childrenSet, specialEventIds]);

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
    if (!filteredMembers.length) {
      toast.error('No members to export');
      return;
    }
    const rows = filteredMembers.map(m => ({
      'Member ID': m.member_id,
      'First Name': m.profiles?.first_name || '',
      'Last Name': m.profiles?.last_name || '',
      'Email': m.profiles?.email || '',
      'Phone': m.profiles?.phone || '',
      'Address': m.profiles?.address || '',
      'Region': m.regions?.name || '',
      'Gender': m.profiles?.gender || '',
      'Date of Birth': m.profiles?.date_of_birth || '',
      'Occupation': m.profiles?.occupation || '',
      'Member Type': m.member_type,
      'Status': m.status || '',
      'Join Date': m.join_date ? new Date(m.join_date).toLocaleDateString() : '',
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `global-members-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success(`Exported ${filteredMembers.length} members`);
  };

  return (
    <div className="space-y-6">
      <GlobalMemberKPICards
        members={members}
        isLoading={isLoading}
        memberRelationships={memberRelationships}
        specialEventIds={specialEventIds}
      />

      <div className="space-y-4">
        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Global Member Directory</h2>
                <p className="text-sm text-muted-foreground">A list of all members across all regions</p>
              </div>
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

            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background/60">
                <SelectValue placeholder="Filter by Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {regions?.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

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
                <SelectItem value="visitor_special">Special Event Visitors</SelectItem>
                <SelectItem value="visitor_regular">Regular Visitors</SelectItem>
                <SelectItem value="children">Children</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Export ({filteredMembers.length})
            </Button>
          </div>

          <div className="rounded-xl border border-border/40 overflow-hidden -mx-2 sm:mx-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Address</TableHead>
                    <TableHead className="hidden sm:table-cell">Phone</TableHead>
                    <TableHead className="hidden md:table-cell">Region</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Join Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}><div className="animate-pulse rounded-lg bg-muted h-5 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : error ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-destructive">Error loading members.</TableCell></TableRow>
                  ) : filteredMembers.length > 0 ? (
                    filteredMembers.map(member => (
                      <TableRow
                        key={member.id}
                        className="cursor-pointer hover:bg-muted/20 transition-colors"
                        onClick={() => navigate(`/admin/super/members/${member.id}`)}
                      >
                        <TableCell className="font-medium">
                          {member.profiles?.last_name} {member.profiles?.first_name}
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-xs truncate">{member.profiles?.address || 'N/A'}</TableCell>
                        <TableCell className="hidden sm:table-cell">{member.profiles?.phone || 'N/A'}</TableCell>
                        <TableCell className="hidden md:table-cell">{member.regions?.name || 'N/A'}</TableCell>
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
                        <TableCell className="hidden lg:table-cell">{member.join_date ? new Date(member.join_date).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/admin/super/members/${member.id}`)}>
                                <Eye className="h-4 w-4 mr-2" /> View
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={8} className="text-center h-24">No members found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperMembers;
