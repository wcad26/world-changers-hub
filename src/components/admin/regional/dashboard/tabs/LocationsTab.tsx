
import React from 'react';
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
import type { DashboardFilters } from '../DashboardFilters';

interface LocationsTabProps {
  filters: DashboardFilters;
}

const LocationsTab: React.FC<LocationsTabProps> = ({ filters }) => {
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

  const filteredLocations = React.useMemo(() => {
    if (!locations) return [];
    
    return locations.filter(location => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        if (!location.name.toLowerCase().includes(searchTerm) &&
            !location.address.toLowerCase().includes(searchTerm) &&
            !location.city.toLowerCase().includes(searchTerm) &&
            !location.contact_person?.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      // Category filter (Location Type)
      if (filters.category && filters.category !== 'all') {
        if (location.type !== filters.category) {
          return false;
        }
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        if (filters.status === 'active' && location.status !== 'Active') return false;
        if (filters.status === 'inactive' && location.status === 'Active') return false;
      }

      return true;
    });
  }, [locations, filters]);

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
      {/* Locations Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Locations Management</CardTitle>
            <CardDescription>
              {filteredLocations.length} of {locations?.length || 0} locations
            </CardDescription>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{location.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {location.city}, {location.state}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(location.type)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm max-w-48">
                      <div>{location.address}</div>
                      <div className="text-muted-foreground">
                        {location.city}, {location.state} {location.zip}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{location.capacity || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{location.contact_person || 'N/A'}</div>
                      {location.contact_phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {location.contact_phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(location.status)}
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

export default LocationsTab;
