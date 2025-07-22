
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
import DcgAttendanceTrendChart from './DcgAttendanceTrendChart';
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
      {/* DCG Attendance Trend Chart - only shown in DCG tab */}
      <DcgAttendanceTrendChart />
    </div>
  );
};

export default DCGTab;
