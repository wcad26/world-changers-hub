
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Eye, Edit, UserPlus } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertCircle, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { DashboardFilters } from '../DashboardFilters';

interface MembersTabProps {
  filters: DashboardFilters;
}

const MembersTab: React.FC<MembersTabProps> = ({ filters }) => {
  const { userRegion } = useAuth();
  const { data: members, isLoading, error } = useMembers(userRegion?.id);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, label: 'Active' },
      inactive: { variant: 'secondary' as const, label: 'Inactive' },
      new: { variant: 'outline' as const, label: 'New' },
      visitor: { variant: 'outline' as const, label: 'Visitor' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredMembers = React.useMemo(() => {
    if (!members) return [];
    
    return members.filter(member => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const fullName = `${member.profiles?.first_name || ''} ${member.profiles?.last_name || ''}`.toLowerCase();
        const email = member.profiles?.email?.toLowerCase() || '';
        if (!fullName.includes(searchTerm) && !email.includes(searchTerm) && !member.member_id.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        if (member.status !== filters.status) {
          return false;
        }
      }

      return true;
    });
  }, [members, filters]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading members</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'An unknown error occurred'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Members Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Members Directory</CardTitle>
            <CardDescription>
              {filteredMembers.length} of {members?.length || 0} members
            </CardDescription>
          </div>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Member ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.photo_url || undefined} />
                      <AvatarFallback>
                        {`${member.profiles?.first_name?.[0] || ''}${member.profiles?.last_name?.[0] || ''}`}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {member.profiles?.first_name} {member.profiles?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.member_type}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {member.member_id}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(member.status || 'active')}
                  </TableCell>
                  <TableCell>
                    {member.join_date ? new Date(member.join_date).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{member.profiles?.email}</div>
                      <div className="text-muted-foreground">{member.profiles?.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MembersTab;
