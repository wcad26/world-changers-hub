
import React from 'react';
import { useNavigate } from 'react-router-dom';
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Download, Search, Pen, Heart, MoreVertical, Eye, Trash2 } from 'lucide-react';
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
import { useDiscipleshipRelationships } from '@/hooks/useDiscipleship';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Users, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import AssignDiscipleDialog from "@/components/admin/regional/discipleship/AssignDiscipleDialog";
import ManageDiscipleshipDialog from "@/components/admin/regional/discipleship/ManageDiscipleshipDialog";
import type { DiscipleshipRelationshipWithMembers } from '@/hooks/useDiscipleship';
import RoleBadge from "@/components/ui/RoleBadge";
import Papa from 'papaparse';

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

  // Filter relationships based on search and status
  const filteredRelationships = relationships?.filter(relationship => {
    const mentorName = `${relationship.mentor?.profiles?.first_name} ${relationship.mentor?.profiles?.last_name}`.toLowerCase();
    const discipleName = `${relationship.disciple?.profiles?.first_name} ${relationship.disciple?.profiles?.last_name}`.toLowerCase();
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
      
      // Member type filter
      const typeMatch = memberTypeFilter === 'all' || member.member_type === memberTypeFilter;
      
      return searchMatch && statusMatch && typeMatch;
    });
  }, [members, searchTerm, memberStatusFilter, memberTypeFilter]);

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
    <RegionalAdminLayout>
      <div className="space-y-6">

        {/* Edit Member Dialog */}
        <Dialog open={!!editMember} onOpenChange={() => setEditMember(null)}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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
        
        
        <Tabs defaultValue="members">
          <TabsList>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="visitors">Visitors</TabsTrigger>
            <TabsTrigger value="discipleship">
              <Heart className="mr-2 h-4 w-4" />
              Discipleship
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Member List</CardTitle>
                    <CardDescription>A list of all members in your region.</CardDescription>
                  </div>
                  <Dialog open={isRegisterDialogOpen} onOpenChange={setRegisterDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Register Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Register New Member</DialogTitle>
                        <DialogDescription>
                          Fill out the form below to register a new member. An invitation email will be sent to them to complete their account setup.
                        </DialogDescription>
                      </DialogHeader>
                      <RegisterMemberForm onSuccess={() => setRegisterDialogOpen(false)} />
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex flex-col gap-4 pt-4">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative flex-1 min-w-[250px]">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search by name, email, or phone..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    <Select value={memberStatusFilter} onValueChange={setMemberStatusFilter}>
                      <SelectTrigger className="w-[180px]">
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
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="visitor">Visitor</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button variant="outline" onClick={handleExportMembers}>
                      <Download className="mr-2 h-4 w-4" />
                      Export ({filteredMembers.length})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Join Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingMembers ? (
                        <TableRow><TableCell colSpan={7} className="text-center">Loading members...</TableCell></TableRow>
                      ) : membersError ? (
                         <TableRow><TableCell colSpan={7} className="text-center text-red-500">Error loading members.</TableCell></TableRow>
                       ) : filteredMembers.length > 0 ? (
                        filteredMembers.map(member => (
                          <TableRow 
                            key={member.id} 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/admin/regional/members/${member.id}`)}
                          >
                            <TableCell className="font-medium">
                              {member.profiles?.first_name} {member.profiles?.last_name}
                            </TableCell>
                            <TableCell>{member.profiles?.email || 'N/A'}</TableCell>
                            <TableCell>{member.profiles?.phone || 'N/A'}</TableCell>
                            <TableCell>
                              <RoleBadge roles={member.profiles?.user_roles || []} />
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
                        <TableRow><TableCell colSpan={7} className="text-center">No members found.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visitors" className="space-y-4">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Visitors</CardTitle>
                  <CardDescription>View and manage visitor registrations for your region.</CardDescription>
                </div>
                <div className="flex justify-between items-center pt-4">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search visitors..." 
                      className="pl-8" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" asChild>
                    <a href={`/visitor/register/${userRegion?.code.toLowerCase()}`} target="_blank" rel="noopener noreferrer">
                      Visitor Registration Link
                    </a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Visitor ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingMembers ? (
                        <TableRow><TableCell colSpan={8} className="text-center">Loading visitors...</TableCell></TableRow>
                      ) : filteredMembers?.filter(m => m.member_type === 'visitor').length > 0 ? (
                        filteredMembers
                          .filter(m => m.member_type === 'visitor')
                          .map((visitor) => (
                            <TableRow key={visitor.id} className="hover:bg-muted/50">
                              <TableCell className="font-medium">{visitor.member_id}</TableCell>
                              <TableCell>
                                {visitor.profiles ? `${visitor.profiles.first_name} ${visitor.profiles.last_name}` : 'N/A'}
                              </TableCell>
                              <TableCell>{visitor.profiles?.email || 'N/A'}</TableCell>
                              <TableCell>{visitor.profiles?.phone || 'N/A'}</TableCell>
                              <TableCell className="max-w-xs truncate">{visitor.profiles?.address || 'N/A'}</TableCell>
                              <TableCell>{visitor.join_date ? new Date(visitor.join_date).toLocaleDateString() : 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant={visitor.status === 'new' ? 'default' : 'secondary'}>
                                  {visitor.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setEditMember(visitor)}>
                                      <Pen className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => setMemberToDelete(visitor)}
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
                        <TableRow><TableCell colSpan={8} className="text-center">No visitors found.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discipleship">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Discipleship Relationships</CardTitle>
                    <CardDescription>
                      Manage mentor-disciple relationships and track progress
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsAssignDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign Relationship
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search mentors or disciples..."
                      value={discipleshipSearchTerm}
                      onChange={(e) => setDiscipleshipSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
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

                {/* Relationships Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mentor</TableHead>
                        <TableHead>Disciple</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {discipleshipLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">Loading relationships...</TableCell>
                        </TableRow>
                      ) : discipleshipError ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-red-500">Error loading relationships</TableCell>
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
                          <TableRow key={relationship.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {relationship.mentor?.profiles?.first_name} {relationship.mentor?.profiles?.last_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {relationship.mentor?.member_id}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {relationship.disciple?.profiles?.first_name} {relationship.disciple?.profiles?.last_name}
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
              </CardContent>
            </Card>
            
            {/* Assign Disciple Dialog */}
            <AssignDiscipleDialog
              isOpen={isAssignDialogOpen}
              onOpenChange={setIsAssignDialogOpen}
            />
            
            {/* Manage Discipleship Dialog */}
            <ManageDiscipleshipDialog
              relationship={selectedRelationship}
              isOpen={!!selectedRelationship}
              onOpenChange={(open) => !open && setSelectedRelationship(null)}
            />
          </TabsContent>
        </Tabs>
        
        {/* Existing dialogs remain outside the tabs */}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {memberToDelete?.profiles?.first_name} {memberToDelete?.profiles?.last_name} 
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
    </RegionalAdminLayout>
  );
};

export default Members;
