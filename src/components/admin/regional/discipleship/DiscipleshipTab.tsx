import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, UserPlus, Users, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { useDiscipleshipRelationships } from '@/hooks/useDiscipleship';
import { useAuth } from '@/hooks/useAuth.tsx';
import AssignDiscipleDialog from './AssignDiscipleDialog';

const DiscipleshipTab: React.FC = () => {
  const { userRegion } = useAuth();
  const { data: relationships, isLoading, error } = useDiscipleshipRelationships(userRegion?.id);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  // Filter relationships based on search and status
  const filteredRelationships = relationships?.filter(relationship => {
    const mentorName = `${relationship.mentor?.profiles?.first_name} ${relationship.mentor?.profiles?.last_name}`.toLowerCase();
    const discipleName = `${relationship.disciple?.profiles?.first_name} ${relationship.disciple?.profiles?.last_name}`.toLowerCase();
    const searchMatch = mentorName.includes(searchTerm.toLowerCase()) || discipleName.includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === 'all' || relationship.status === statusFilter;
    
    return searchMatch && statusMatch;
  }) || [];

  // Calculate summary stats
  const stats = {
    total: relationships?.length || 0,
    active: relationships?.filter(r => r.status === 'active').length || 0,
    completed: relationships?.filter(r => r.status === 'completed').length || 0,
    inactive: relationships?.filter(r => r.status === 'inactive').length || 0,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'transferred': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error loading discipleship relationships: {error.message}</p>
            <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Relationships</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-primary">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Discipleship Management */}
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                {filteredRelationships.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm || statusFilter !== 'all' 
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
                        <Button variant="outline" size="sm">
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
    </div>
  );
};

export default DiscipleshipTab;