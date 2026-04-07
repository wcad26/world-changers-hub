import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Mail, Phone, UserPlus, Users, Loader2, Calendar } from 'lucide-react';
import { useDcgMembers, useUpdateDcgMemberRole } from '@/hooks/useDcgMembers';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import AddExistingMemberDialog from '@/components/admin/dcg/AddExistingMemberDialog';
import RegisterNewMemberDialog from '@/components/admin/dcg/RegisterNewMemberDialog';
import type { Database } from '@/integrations/supabase/types';

type DcgMemberRole = Database['public']['Enums']['dcg_member_role'];

const DcgMembers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [addExistingOpen, setAddExistingOpen] = useState(false);
  const [registerNewOpen, setRegisterNewOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  const { userDcg } = useAuth();
  const { data: dcgMembers, isLoading } = useDcgMembers(userDcg?.id);
  const updateRole = useUpdateDcgMemberRole();

  const filteredMembers = dcgMembers?.filter(dcgMember => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const member = dcgMember.members;
    if (!member) return false;
    const fullName = `${member.profiles?.first_name || ''} ${member.profiles?.last_name || ''}`.toLowerCase();
    const email = member.profiles?.email?.toLowerCase() || '';
    return fullName.includes(searchLower) || email.includes(searchLower) || member.member_id.toLowerCase().includes(searchLower);
  }) || [];

  const handleRoleUpdate = (e: React.MouseEvent, dcgMemberId: string, newRole: DcgMemberRole) => {
    e.stopPropagation();
    updateRole.mutate({ dcgMemberId, role: newRole });
  };

  const handleRowClick = (memberId: string) => {
    navigate(`/dcg/member/${memberId}`);
  };

  return (
    <DcgAdminLayout>
      <div className="space-y-4 md:space-y-6 p-4 md:p-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
          <div className="hidden lg:block">
            <h1 className="text-3xl font-bold">DCG Members</h1>
            <p className="text-muted-foreground">Manage your DCG membership</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => setAddExistingOpen(true)} 
              variant="outline"
              disabled={!userDcg}
              className="flex-1 sm:flex-none"
              size={isMobile ? "sm" : "default"}
            >
              <Users className="mr-1.5 h-4 w-4" />
              {isMobile ? "Add" : "Add Existing"}
            </Button>
            <Button 
              onClick={() => setRegisterNewOpen(true)}
              disabled={!userDcg}
              className="flex-1 sm:flex-none"
              size={isMobile ? "sm" : "default"}
            >
              <UserPlus className="mr-1.5 h-4 w-4" />
              {isMobile ? "New" : "Register New"}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Member Directory</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              View and manage all DCG members
            </CardDescription>
            <div className="flex items-center space-x-2 pt-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading...</span>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Users className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No members found</p>
                <p className="text-sm">
                  {searchTerm ? 'Try adjusting your search.' : 'Start by adding members.'}
                </p>
              </div>
            ) : isMobile ? (
              /* Mobile card view */
              <div className="space-y-3">
                {filteredMembers.map((dcgMember) => {
                  const member = dcgMember.members;
                  if (!member) return null;
                  return (
                    <div
                      key={dcgMember.id}
                      className="border border-border rounded-lg p-3 space-y-2 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleRowClick(dcgMember.member_id)}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate min-w-0 flex-1">
                          {member.profiles?.last_name} {member.profiles?.first_name}
                        </p>
                        <Badge variant={member.member_type === 'member' ? 'default' : 'secondary'} className="text-[10px] ml-2 shrink-0">
                          {member.member_type}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {member.profiles?.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {member.profiles.email}
                          </span>
                        )}
                        {member.profiles?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {member.profiles.phone}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={dcgMember.role}
                            onValueChange={(value) => handleRoleUpdate({stopPropagation: () => {}} as any, dcgMember.id, value as DcgMemberRole)}
                            disabled={updateRole.isPending}
                          >
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Member">Member</SelectItem>
                              <SelectItem value="Assistant">Assistant</SelectItem>
                              <SelectItem value="Leader">Leader</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(dcgMember.joined_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Desktop/Tablet table view */
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>DCG Role</TableHead>
                    <TableHead>Joined DCG</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((dcgMember) => {
                    const member = dcgMember.members;
                    if (!member) return null;
                    return (
                      <TableRow
                        key={dcgMember.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(dcgMember.member_id)}
                      >
                        <TableCell>
                          <div className="font-medium">
                            {member.profiles?.last_name} {member.profiles?.first_name}
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
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={dcgMember.role}
                            onValueChange={(value) => updateRole.mutate({ dcgMemberId: dcgMember.id, role: value as DcgMemberRole })}
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
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
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
    </DcgAdminLayout>
  );
};

export default DcgMembers;
