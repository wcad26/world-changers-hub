import React, { useState } from 'react';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, Mail, Phone, MoreHorizontal, UserPlus, Users, Loader2, Calendar, Trash2 } from 'lucide-react';
import { useDcgMembers, useUpdateDcgMemberRole, useRemoveMemberFromDcg } from '@/hooks/useDcgMembers';
import { useAuth } from '@/hooks/useAuth';
import AddExistingMemberDialog from '@/components/admin/dcg/AddExistingMemberDialog';
import RegisterNewMemberDialog from '@/components/admin/dcg/RegisterNewMemberDialog';
import type { Database } from '@/integrations/supabase/types';

type DcgMemberRole = Database['public']['Enums']['dcg_member_role'];

const DcgMembers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [addExistingOpen, setAddExistingOpen] = useState(false);
  const [registerNewOpen, setRegisterNewOpen] = useState(false);
  
  const { userDcg, user } = useAuth();
  const { data: dcgMembers, isLoading } = useDcgMembers(userDcg?.id);
  const updateRole = useUpdateDcgMemberRole();
  const removeMember = useRemoveMemberFromDcg();

  // Filter members based on search term
  const filteredMembers = dcgMembers?.filter(dcgMember => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const member = dcgMember.members;
    if (!member) return false;
    
    const fullName = `${member.profiles?.first_name || ''} ${member.profiles?.last_name || ''}`.toLowerCase();
    const email = member.profiles?.email?.toLowerCase() || '';
    return fullName.includes(searchLower) || email.includes(searchLower) || member.member_id.toLowerCase().includes(searchLower);
  }) || [];

  const handleRoleUpdate = (dcgMemberId: string, newRole: DcgMemberRole) => {
    updateRole.mutate({ dcgMemberId, role: newRole });
  };

  const handleRemoveMember = (dcgMemberId: string) => {
    if (!userDcg) return;
    removeMember.mutate({ dcgMemberId, dcgId: userDcg.id });
  };

  return (
    <DcgAdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">DCG Members</h1>
            <p className="text-muted-foreground">
              Manage your DCG membership
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => setAddExistingOpen(true)} variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Add Existing
            </Button>
            <Button onClick={() => setRegisterNewOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Register New
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Member Directory</CardTitle>
            <CardDescription>
              View and manage all DCG members. Members shown here are also part of the regional portal.
            </CardDescription>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading DCG members...</span>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Users className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No DCG members found</p>
                <p className="text-sm">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Start by adding existing members or registering new ones.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>DCG Role</TableHead>
                    <TableHead>Joined DCG</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((dcgMember) => {
                    const member = dcgMember.members;
                    if (!member) return null;
                    
                    return (
                      <TableRow key={dcgMember.id}>
                        <TableCell>
                          <div className="font-medium">
                            {member.profiles?.first_name} {member.profiles?.last_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {member.profiles?.email && (
                              <div className="flex items-center text-sm">
                                <Mail className="mr-2 h-3 w-3" />
                                {member.profiles.email}
                              </div>
                            )}
                            {member.profiles?.phone && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Phone className="mr-2 h-3 w-3" />
                                {member.profiles.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.member_type === 'member' ? 'default' : 'secondary'}>
                            {member.member_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={dcgMember.role}
                            onValueChange={(value) => handleRoleUpdate(dcgMember.id, value as DcgMemberRole)}
                            disabled={updateRole.isPending}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Member">Member</SelectItem>
                              <SelectItem value="Assistant">Assistant</SelectItem>
                              <SelectItem value="Leader">Leader</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="mr-2 h-3 w-3" />
                            {new Date(dcgMember.joined_date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(dcgMember.id)}
                            disabled={removeMember.isPending}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      {userDcg && (
        <>
          <AddExistingMemberDialog
            open={addExistingOpen}
            onOpenChange={setAddExistingOpen}
            dcgId={userDcg.id}
          />
          <RegisterNewMemberDialog
            open={registerNewOpen}
            onOpenChange={setRegisterNewOpen}
            dcgId={userDcg.id}
          />
        </>
      )}
    </DcgAdminLayout>
  );
};

export default DcgMembers;