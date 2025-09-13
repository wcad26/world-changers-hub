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
import AssignRoleDialog from './AssignRoleDialog';

const UserRoleAssignmentTab: React.FC = () => {
  const { userRegion } = useAuth();
  const { data: members, isLoading } = useMembers(userRegion?.id);
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Filter members based on search query and role filter
  const filteredMembers = useMemo(() => {
    if (!members) return [];
    
    return members.filter((member) => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        `${member.profiles?.first_name} ${member.profiles?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Role filter (for now just showing Member role, but this can be expanded)
      const matchesRole = roleFilter === 'all' || roleFilter === 'member';
      
      return matchesSearch && matchesRole;
    });
  }, [members, searchQuery, roleFilter]);

  if (isLoading) {
    return <div className="text-center py-8">Loading members...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Role Assignments
          </CardTitle>
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
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
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
                No members match your search criteria.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current Roles</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.profiles?.first_name} {member.profiles?.last_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.profiles?.email}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {/* TODO: Show actual roles when user has them */}
                          <Badge variant="secondary">Member</Badge>
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
                            Assign Role
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
          userId={assigningUserId}
          open={!!assigningUserId}
          onOpenChange={(open) => !open && setAssigningUserId(null)}
        />
      )}
    </div>
  );
};

export default UserRoleAssignmentTab;