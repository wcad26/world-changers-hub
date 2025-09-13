import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, UserX } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';
import AssignRoleDialog from './AssignRoleDialog';

const UserRoleAssignmentTab: React.FC = () => {
  const { userRegion } = useAuth();
  const { data: members, isLoading } = useMembers(userRegion?.id);
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);

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
          {!members || members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No members found. Add members to assign roles.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Roles</TableHead>
                  <TableHead>Member Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
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
                      <Badge 
                        variant={member.status === 'active' ? 'default' : 'secondary'}
                      >
                        {member.status}
                      </Badge>
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