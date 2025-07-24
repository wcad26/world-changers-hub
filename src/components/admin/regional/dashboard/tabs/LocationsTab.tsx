
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

interface LocationsTabProps {
  selectedPeriod: string;
}

const LocationsTab: React.FC<LocationsTabProps> = ({ selectedPeriod }) => {
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

  const locationStats = {
    totalLocations: locations?.length || 0,
    wcaCenters: locations?.filter(l => l.type === 'WCA Center').length || 0,
    dcgLocations: locations?.filter(l => l.type === 'DCG Location').length || 0,
    activeLocations: locations?.filter(l => l.status === 'Active').length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Location Analytics</h3>
        <PeriodFilter 
          filters={filters} 
          onFiltersChange={(newFilters) => setFilters({ ...filters, ...newFilters })} 
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Locations</p>
                <p className="text-2xl font-bold">{locationStats.totalLocations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">WCA Centers</p>
                <p className="text-2xl font-bold">{locationStats.wcaCenters}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/20 rounded-lg">
                <Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">DCG Locations</p>
                <p className="text-2xl font-bold">{locationStats.dcgLocations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Locations</p>
                <p className="text-2xl font-bold">{locationStats.activeLocations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Locations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Location Directory</CardTitle>
          <CardDescription>
            Overview of all locations in your region with key details and status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations?.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{location.name}</p>
                      {location.capacity && (
                        <p className="text-sm text-gray-500">Capacity: {location.capacity}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(location.type)}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm">{location.address}</p>
                      <p className="text-xs text-gray-500">{location.city}, {location.state}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {location.contact_phone && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {location.contact_phone}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(location.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {(!locations || locations.length === 0) && (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No locations found in your region</p>
              <Button variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add First Location
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationsTab;
