
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Download, Search, Pen, MoreVertical, Eye, Trash2, Star, Baby } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth.tsx';
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
import RoleBadge from "@/components/ui/RoleBadge";
import Papa from 'papaparse';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isChildMember } from '@/utils/childUtils';
import MemberKPICards from '@/components/admin/regional/MemberKPICards';

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
  
  // Discipleship state
  const [discipleshipSearchTerm, setDiscipleshipSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = React.useState(false);
  const [selectedRelationship, setSelectedRelationship] = React.useState<DiscipleshipRelationshipWithMembers | null>(null);
  const { data: relationships, isLoading: discipleshipLoading, error: discipleshipError } = useDiscipleshipRelationships(userRegion?.id);

  // Fetch member relationships for children filter
  const memberIds = React.useMemo(() => members?.map(m => m.id) || [], [members]);
  const { data: memberRelationships = [] } = useQuery({
    queryKey: ['region-member-relationships-filter', memberIds.sort().join(',')],
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

  // Filter relationships based on search and status
  const filteredRelationships = relationships?.filter(relationship => {
    const mentorName = `${relationship.mentor?.profiles?.last_name} ${relationship.mentor?.profiles?.first_name}`.toLowerCase();
    const discipleName = `${relationship.disciple?.profiles?.last_name} ${relationship.disciple?.profiles?.first_name}`.toLowerCase();
    const searchMatch = mentorName.includes(discipleshipSearchTerm.toLowerCase()) || discipleName.includes(discipleshipSearchTerm.toLowerCase());
    const statusMatch = statusFilter === 'all' || relationship.status === statusFilter;
    
    return searchMatch && statusMatch;
  }) || [];

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
      
      // Member type filter (includes children and visitor subtypes)
      let typeMatch = false;
      if (memberTypeFilter === 'all') {
        typeMatch = true;
      } else if (memberTypeFilter === 'children') {
        typeMatch = isChildMember(profile.date_of_birth, member.id, memberRelationships);
      } else if (memberTypeFilter === 'visitor_special') {
        typeMatch = member.member_type === 'visitor' && !!member.rated_event_id && specialEventIds.has(member.rated_event_id);
      } else if (memberTypeFilter === 'visitor_regular') {
        typeMatch = member.member_type === 'visitor' && (!member.rated_event_id || !specialEventIds.has(member.rated_event_id));
      } else {
        typeMatch = member.member_type === memberTypeFilter;
      }
      
      return searchMatch && statusMatch && typeMatch;
    });
  }, [members, searchTerm, memberStatusFilter, memberTypeFilter, memberRelationships, specialEventIds]);

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
      'Emergency Contact': member.profiles?.emergency_contact_name || '',
      'Emergency Phone': member.profiles?.emergency_contact_phone || '',
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




  return (
    <>
      <div className="space-y-6">

        {/* Edit Member Dialog */}
        <Dialog open={!!editMember} onOpenChange={(open) => { if (!open) setEditMember(null); }}>
          <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto bg-background border-border/50 p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Edit Member</DialogTitle>
              <DialogDescription>
                Update member information and details.
              </DialogDescription>
            </DialogHeader>
            {editMember && (
              <EditMemberForm 
                member={editMember} 
                onSuccess={() => setEditMember(null)} 
              />
            )}
          </DialogContent>
        </Dialog>
        
        {/* KPI Cards */}
        <MemberKPICards 
          members={members} 
          isLoading={isLoadingMembers} 
          memberRelationships={memberRelationships} 
          specialEventIds={specialEventIds} 
          regionId={userRegion?.id}
        />
        
        <Tabs defaultValue="members">
          <TabsList>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="discipleship">
              <Heart className="mr-2 h-4 w-4" />
              Discipleship
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="members" className="space-y-4">
            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Member Directory</h2>
                    <p className="text-sm text-muted-foreground">A list of all members in your region</p>
                  </div>
                </div>
                <Dialog open={isRegisterDialogOpen} onOpenChange={setRegisterDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 shrink-0">
                      <PlusCircle className="h-4 w-4" /> Register Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto bg-background border-border/50 p-4 sm:p-6">
                    <DialogHeader>
                      <DialogTitle>Register New Member</DialogTitle>
                      <DialogDescription>
                        Fill out the form below to register a new member.
                      </DialogDescription>
                    </DialogHeader>
                    <RegisterMemberForm onSuccess={() => setRegisterDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="flex flex-wrap gap-4 items-center mb-4">
                <div className="relative flex-1 min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name, email, or phone..." 
                    className="pl-9 bg-background/60" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Select value={memberStatusFilter} onValueChange={setMemberStatusFilter}>
                  <SelectTrigger className="w-[180px] bg-background/60">
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

                <Select value={memberTypeFilter} onValueChange={setMemberTypeFilter}>
                  <SelectTrigger className="w-[180px] bg-background/60">
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
                
                <Button variant="outline" onClick={handleExportMembers}>
                  <Download className="mr-2 h-4 w-4" />
                  Export ({filteredMembers.length})
                </Button>
              </div>

              <div className="rounded-xl border border-border/40 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-[20%]">Name</TableHead>
                      <TableHead className="w-[20%]">Address</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingMembers || !userRegion ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 7 }).map((_, j) => (
                            <TableCell key={j}><div className="animate-pulse rounded-lg bg-muted h-5 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : membersError ? (
                       <TableRow><TableCell colSpan={7} className="text-center text-destructive">Error loading members.</TableCell></TableRow>
                     ) : filteredMembers.length > 0 ? (
                      filteredMembers.map(member => (
                        <TableRow 
                          key={member.id} 
                          className="cursor-pointer hover:bg-muted/20 transition-colors"
                          onClick={() => navigate(`/admin/regional/members/${member.id}`)}
                        >
                          <TableCell className="font-medium">
                            {member.profiles?.last_name} {member.profiles?.first_name}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{member.profiles?.address || 'N/A'}</TableCell>
                          <TableCell>{member.profiles?.phone || 'N/A'}</TableCell>
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
                          <TableCell>{member.join_date ? new Date(member.join_date).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/admin/regional/members/${member.id}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditMember(member)}>
                                  <Pen className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setMemberToDelete(member)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                        {searchTerm ? 'No members match your search.' : 'No members found.'}
                      </TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="discipleship">
            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Discipleship Relationships</h2>
                    <p className="text-sm text-muted-foreground">Manage mentor-disciple relationships and track progress</p>
                  </div>
                </div>
                <Button onClick={() => setIsAssignDialogOpen(true)} className="gap-2 shrink-0">
                  <UserPlus className="h-4 w-4" />
                  Assign Relationship
                </Button>
              </div>
              
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search mentors or disciples..."
                    value={discipleshipSearchTerm}
                    onChange={(e) => setDiscipleshipSearchTerm(e.target.value)}
                    className="pl-9 bg-background/60"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-background/60">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="transferred">Transferred</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border border-border/40 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Mentor</TableHead>
                      <TableHead>Disciple</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discipleshipLoading || !userRegion ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 6 }).map((_, j) => (
                            <TableCell key={j}><div className="animate-pulse rounded-lg bg-muted h-5 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : discipleshipError ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-destructive">Error loading relationships</TableCell>
                      </TableRow>
                    ) : filteredRelationships.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {discipleshipSearchTerm || statusFilter !== 'all' 
                            ? 'No relationships match your filters'
                            : 'No discipleship relationships found. Create your first one!'
                          }
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRelationships.map((relationship) => (
                        <TableRow key={relationship.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {relationship.mentor?.profiles?.last_name} {relationship.mentor?.profiles?.first_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {relationship.mentor?.member_id}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {relationship.disciple?.profiles?.last_name} {relationship.disciple?.profiles?.first_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {relationship.disciple?.member_id}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(relationship.status || 'active')}>
                              {relationship.status || 'active'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {relationship.start_date ? 
                              new Date(relationship.start_date).toLocaleDateString() : 
                              'N/A'
                            }
                          </TableCell>
                          <TableCell className="max-w-xs">
                            {relationship.notes ? (
                              <p className="text-sm truncate" title={relationship.notes}>
                                {relationship.notes}
                              </p>
                            ) : (
                              <span className="text-muted-foreground">No notes</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRelationship(relationship);
                              }}
                            >
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <AssignDiscipleDialog
              isOpen={isAssignDialogOpen}
              onOpenChange={setIsAssignDialogOpen}
            />
            
            <ManageDiscipleshipDialog
              relationship={selectedRelationship}
              isOpen={!!selectedRelationship}
              onOpenChange={(open) => !open && setSelectedRelationship(null)}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {memberToDelete?.profiles?.last_name} {memberToDelete?.profiles?.first_name} 
              and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Members;
