
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, MapPin, Users, Phone, Plus } from 'lucide-react';
import { useLocations } from '@/hooks/useLocations';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import PeriodFilter, { PeriodFilters } from '../PeriodFilter';

const LocationsTab: React.FC = () => {
  const [filters, setFilters] = useState<PeriodFilters>({
    dateRange: { 
      from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, new Date().getDate()),
      to: new Date()
    },
    quickDateRange: '1-month'
  });
  const { userRegion } = useAuth();
  const { data: locations, isLoading, error } = useLocations(userRegion?.id);

  const getTypeBadge = (type: string) => {
    return type === 'WCA Center' ? (
      <Badge variant="default">WCA Center</Badge>
    ) : (
      <Badge variant="secondary">DCG Location</Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    return status === 'Active' ? (
      <Badge variant="outline" className="text-green-700 border-green-700">Active</Badge>
    ) : (
      <Badge variant="outline" className="text-red-700 border-red-700">Inactive</Badge>
    );
  };


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
        <AlertTitle>Error loading locations</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'An unknown error occurred'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <PeriodFilter 
        filters={filters} 
        onFiltersChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))} 
      />
    </div>
  );
};

export default LocationsTab;
