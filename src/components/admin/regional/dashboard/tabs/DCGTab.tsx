
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, Edit, Users, Home, Plus } from 'lucide-react';
import { useDcgs } from '@/hooks/useDCGs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { DashboardFilters } from '../DashboardFilters';

interface DCGTabProps {
  filters: DashboardFilters;
}

const DCGTab: React.FC<DCGTabProps> = ({ filters }) => {
  const { data: dcgs, isLoading, error } = useDcgs();

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  const filteredDcgs = React.useMemo(() => {
    if (!dcgs) return [];
    
    return dcgs.filter(dcg => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const leaderName = dcg.leader?.profiles 
          ? `${dcg.leader.profiles.first_name || ''} ${dcg.leader.profiles.last_name || ''}`.toLowerCase()
          : '';
        
        if (!dcg.name.toLowerCase().includes(searchTerm) &&
            !dcg.description?.toLowerCase().includes(searchTerm) &&
            !leaderName.includes(searchTerm) &&
            !dcg.location?.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        const isActive = dcg.is_active;
        if (filters.status === 'active' && !isActive) return false;
        if (filters.status === 'inactive' && isActive) return false;
      }

      return true;
    });
  }, [dcgs, filters]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading DCGs</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'An unknown error occurred'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* DCG Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Discipleship Cell Groups</CardTitle>
            <CardDescription>
              {filteredDcgs.length} of {dcgs?.length || 0} DCGs
            </CardDescription>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create DCG
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DCG Name</TableHead>
                <TableHead>Leader</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Meeting</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDcgs.map((dcg) => (
                <TableRow key={dcg.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{dcg.name}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {dcg.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {dcg.leader?.profiles?.first_name?.[0] || ''}
                          {dcg.leader?.profiles?.last_name?.[0] || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        {dcg.leader?.profiles 
                          ? `${dcg.leader.profiles.first_name || ''} ${dcg.leader.profiles.last_name || ''}`.trim()
                          : 'No leader assigned'
                        }
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{dcg.member_count || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{dcg.meeting_day || 'TBD'}</div>
                      <div className="text-muted-foreground">
                        {dcg.meeting_time ? 
                          new Date(`2000-01-01T${dcg.meeting_time}`).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          }) : 'TBD'
                        }
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm line-clamp-2">
                      {dcg.location || 'Location TBD'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(dcg.is_active)}
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

export default DCGTab;
