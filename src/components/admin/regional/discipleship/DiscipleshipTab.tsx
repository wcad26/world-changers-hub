import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, UserPlus, Users, TrendingUp, CheckCircle, Clock, Award } from 'lucide-react';
import { useDiscipleshipRelationships } from '@/hooks/useDiscipleship';
import { useAuth } from '@/hooks/useAuth';
import AssignDiscipleDialog from './AssignDiscipleDialog';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const DiscipleshipTab: React.FC = () => {
  const { userRegion } = useAuth();
  const { data: relationships, isLoading, error } = useDiscipleshipRelationships(userRegion?.id);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  const filteredRelationships = relationships?.filter(relationship => {
    const mentorName = `${relationship.mentor?.profiles?.last_name} ${relationship.mentor?.profiles?.first_name}`.toLowerCase();
    const discipleName = `${relationship.disciple?.profiles?.last_name} ${relationship.disciple?.profiles?.first_name}`.toLowerCase();
    const searchMatch = mentorName.includes(searchTerm.toLowerCase()) || discipleName.includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === 'all' || relationship.status === statusFilter;
    return searchMatch && statusMatch;
  }) || [];

  const stats = {
    total: relationships?.length || 0,
    active: relationships?.filter(r => r.status === 'active').length || 0,
    completed: relationships?.filter(r => r.status === 'completed').length || 0,
    inactive: relationships?.filter(r => r.status === 'inactive').length || 0,
  };

  // Mentor leaderboard
  const mentorLeaderboard = useMemo(() => {
    if (!relationships) return [];
    const mentors: Record<string, { name: string; active: number; completed: number; total: number }> = {};
    relationships.forEach(r => {
      const mentorId = r.mentor_id;
      const mentorName = `${r.mentor?.profiles?.last_name || ''} ${r.mentor?.profiles?.first_name || ''}`.trim();
      if (!mentors[mentorId]) mentors[mentorId] = { name: mentorName, active: 0, completed: 0, total: 0 };
      mentors[mentorId].total++;
      if (r.status === 'active') mentors[mentorId].active++;
      if (r.status === 'completed') mentors[mentorId].completed++;
    });
    return Object.values(mentors).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [relationships]);

  // Status distribution for pie chart
  const statusData = useMemo(() => {
    return [
      { name: 'Active', value: stats.active },
      { name: 'Completed', value: stats.completed },
      { name: 'Inactive', value: stats.inactive },
    ].filter(d => d.value > 0);
  }, [stats]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><div className="animate-pulse"><div className="h-4 bg-muted rounded w-3/4 mb-2"></div><div className="h-8 bg-muted rounded w-1/2"></div></div></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card><CardContent className="p-6"><div className="text-center text-destructive"><p>Error: {error.message}</p><Button variant="outline" onClick={() => window.location.reload()} className="mt-4">Retry</Button></div></CardContent></Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Relationships', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Active', value: stats.active, icon: Clock, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Success Rate', value: `${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map((kpi, i) => (
          <Card key={i} className="bg-gradient-to-br from-background to-muted/30 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${kpi.bg}`}><kpi.icon className={`h-4 w-4 ${kpi.color}`} /></div>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        <Card className="bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
          <CardHeader><CardTitle className="text-sm">Status Distribution</CardTitle></CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">No data</p>
            )}
          </CardContent>
        </Card>

        {/* Mentor Leaderboard */}
        <Card className="bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Award className="h-4 w-4" /> Top Mentors</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mentorLeaderboard.map((mentor, i) => (
                <div key={i} className="flex items-center justify-between p-2 border rounded-lg bg-muted/10">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-muted-foreground w-5">#{i + 1}</span>
                    <span className="text-sm font-medium">{mentor.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{mentor.active} active</Badge>
                    <Badge variant="secondary" className="text-xs">{mentor.total} total</Badge>
                  </div>
                </div>
              ))}
              {mentorLeaderboard.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">No mentors yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relationships Table */}
      <Card className="bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Discipleship Relationships</CardTitle>
              <CardDescription>All mentor-disciple pairs</CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsAssignDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-1" />
              Assign
            </Button>
          </div>
          <div className="flex gap-2 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-8" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mentor</TableHead>
                <TableHead>Disciple</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRelationships.map(rel => (
                <TableRow key={rel.id}>
                  <TableCell className="font-medium text-sm">
                    {rel.mentor?.profiles?.last_name} {rel.mentor?.profiles?.first_name}
                  </TableCell>
                  <TableCell className="text-sm">
                    {rel.disciple?.profiles?.last_name} {rel.disciple?.profiles?.first_name}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(rel.status || 'active')}>{rel.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {rel.start_date ? format(new Date(rel.start_date), 'MMM d, yyyy') : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
              {filteredRelationships.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    No relationships found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AssignDiscipleDialog isOpen={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen} />
    </div>
  );
};

export default DiscipleshipTab;
