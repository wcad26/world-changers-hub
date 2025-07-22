
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
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
    </div>
  );
};

export default MembersTab;
