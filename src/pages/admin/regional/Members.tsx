
import React from 'react';
import { useNavigate } from 'react-router-dom';
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Download, Search, Pen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth.tsx';
import { useMembers, MemberWithProfile } from '@/hooks/useMembers';
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

const Members: React.FC = () => {
  const navigate = useNavigate();
  const { userRegion } = useAuth();
  const { data: members, isLoading: isLoadingMembers, error: membersError } = useMembers(userRegion?.id);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isRegisterDialogOpen, setRegisterDialogOpen] = React.useState(false);
  const [editMember, setEditMember] = React.useState<MemberWithProfile | null>(null);

  const filteredMembers = React.useMemo(() => {
    if (!members) return [];
    return members.filter(member => {
      const profile = member.profiles;
      if (!profile) return false;
      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase();
      const email = (profile.email || '').toLowerCase();
      const phone = (profile.phone || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      return fullName.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower);
    });
  }, [members, searchTerm]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'transferred': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
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
        
        <Card>
          <CardHeader>
            <CardTitle>Member List</CardTitle>
            <CardDescription>A list of all members in your region.</CardDescription>
            <div className="flex justify-between items-center pt-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name, email, or phone..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
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
                    <TableHead>Status</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingMembers ? (
                    <TableRow><TableCell colSpan={6} className="text-center">Loading members...</TableCell></TableRow>
                  ) : membersError ? (
                     <TableRow><TableCell colSpan={6} className="text-center text-red-500">Error loading members.</TableCell></TableRow>
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
                          <Badge className={getStatusColor(member.status || 'new')}>
                            {member.status || 'new'}
                          </Badge>
                        </TableCell>
                        <TableCell>{member.join_date ? new Date(member.join_date).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditMember(member);
                            }}
                          >
                            <Pen className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={6} className="text-center">No members found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </RegionalAdminLayout>
  );
};

export default Members;
