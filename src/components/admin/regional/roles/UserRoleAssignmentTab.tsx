import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Search, Filter } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';
import { useRegionalRoles } from '@/hooks/useRegionalRoles';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AssignRoleDialog from './AssignRoleDialog';

const UserRoleAssignmentTab: React.FC = () => {
  const { userRegion } = useAuth();
  const { data: members, isLoading } = useMembers(userRegion?.id);
  const { data: regionalRoles, isLoading: rolesLoading } = useRegionalRoles(userRegion?.id);
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Fetch regional user role assignments
  const { data: userRoleAssignments, isLoading: userRolesLoading } = useQuery({
    queryKey: ['regional-user-role-assignments', userRegion?.id],
    queryFn: async () => {
      if (!userRegion?.id) return [];
      
      const { data, error } = await supabase
        .from('regional_user_roles')
        .select(`
          user_id,
          regional_roles:regional_role_id (
            id,
            name,
            description
          )
        `)
        .eq('region_id', userRegion.id)
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userRegion?.id,
  });

  // Filter members based on search query and role filter - show only members with regional roles
  const filteredMembers = useMemo(() => {
    if (!members || !userRoleAssignments) return [];
    
    // Only include members who have been assigned regional roles
    const membersWithRoles = members.filter((member) => {
      return userRoleAssignments.some(assignment => assignment.user_id === member.profile_id);
    });
    
    return membersWithRoles.filter((member) => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        `${member.profiles?.first_name} ${member.profiles?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Role filter - check against actual assigned roles
      if (roleFilter === 'all') return matchesSearch;
      
      const memberRoles = userRoleAssignments
        .filter(assignment => assignment.user_id === member.profile_id)
        .map(assignment => assignment.regional_roles?.name)
        .filter(Boolean);
      
      const matchesRole = memberRoles.includes(roleFilter);
      
      return matchesSearch && matchesRole;
    });
  }, [members, userRoleAssignments, searchQuery, roleFilter]);

  // Get roles for a specific member
  const getMemberRoles = (profileId: string) => {
    if (!userRoleAssignments) return [];
    return userRoleAssignments
      .filter(assignment => assignment.user_id === profileId)
      .map(assignment => assignment.regional_roles)
      .filter(Boolean);
  };

  if (isLoading || rolesLoading || userRolesLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Role Assignments
            </CardTitle>
            <Button onClick={() => setAssigningUserId('general')}>
              <Plus className="h-4 w-4 mr-2" />
              Assign Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search members by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {regionalRoles?.filter(role => role.is_active).map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!members || members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No members found. Add members to assign roles.
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No members with regional roles match your search criteria.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.profiles?.last_name} {member.profiles?.first_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.profiles?.email}
                      </TableCell>
                       <TableCell>
                         <div className="flex gap-1 flex-wrap">
                           {getMemberRoles(member.profile_id ?? '').map((role) => (
                             <Badge key={role.id} variant="secondary">
                               {role.name}
                             </Badge>
                           ))}
                         </div>
                       </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAssigningUserId(member.profile_id)}
                          >
                            <Plus className="h-4 w-4" />
                            Edit Role
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {assigningUserId && (
        <AssignRoleDialog
          userId={assigningUserId === 'general' ? undefined : assigningUserId}
          open={!!assigningUserId}
          onOpenChange={(open) => !open && setAssigningUserId(null)}
        />
      )}
    </div>
  );
};

export default UserRoleAssignmentTab;