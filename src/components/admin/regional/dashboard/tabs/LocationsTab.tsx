import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, MapPin, Users, Phone, Plus, Building, BarChart3 } from 'lucide-react';
import { useLocations } from '@/hooks/useLocations';
import { useDCGs } from '@/hooks/useDCGs';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import PeriodFilter, { PeriodFilters } from '../PeriodFilter';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LocationsTabProps {
  selectedPeriod: string;
}

const LocationsTab: React.FC<LocationsTabProps> = ({ selectedPeriod }) => {
  const [filters, setFilters] = useState<PeriodFilters>({
    dateRange: { from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, new Date().getDate()), to: new Date() },
    quickDateRange: '1-month'
  });
  const { userRegion } = useAuth();
  const { data: locations, isLoading, error } = useLocations(userRegion?.id);
  const { data: dcgs } = useDCGs(userRegion?.id);

  const locationStats = useMemo(() => {
    if (!locations) return { total: 0, wcaCenters: 0, dcgLocations: 0, active: 0, totalCapacity: 0, withFellowship: 0 };
    return {
      total: locations.length,
      wcaCenters: locations.filter(l => l.type === 'WCA Center').length,
      dcgLocations: locations.filter(l => l.type === 'DCG Location').length,
      active: locations.filter(l => l.status === 'Active').length,
      totalCapacity: locations.reduce((s, l) => s + (l.capacity || 0), 0),
      withFellowship: locations.filter(l => l.fellowship_times && (l.fellowship_times as any[]).length > 0).length,
    };
  }, [locations]);

  const activeDcgs = dcgs?.filter(d => d.is_active).length || 0;

  // City distribution
  const cityData = useMemo(() => {
    if (!locations) return [];
    const cities: Record<string, number> = {};
    locations.forEach(l => { cities[l.city] = (cities[l.city] || 0) + 1; });
    return Object.entries(cities).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [locations]);

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-96" /></div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading locations</AlertTitle>
        <AlertDescription>{error instanceof Error ? error.message : 'An error occurred'}</AlertDescription>
      </Alert>
    );
  }

  const kpis = [
    { label: 'Total Locations', value: locationStats.total, icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'WCA Centers', value: locationStats.wcaCenters, icon: Building, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'DCG Locations', value: locationStats.dcgLocations, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20' },
    { label: 'Active DCGs', value: activeDcgs, icon: Users, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Total Capacity', value: locationStats.totalCapacity, icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Active', value: locationStats.active, icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Location Analytics</h3>
        <PeriodFilter filters={filters} onFiltersChange={(f) => setFilters({ ...filters, ...f })} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <Card key={i} className="bg-gradient-to-br from-background to-muted/30 backdrop-blur-sm border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* City Distribution */}
      {cityData.length > 0 && (
        <Card className="bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm">Locations by City</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Locations" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Locations Table */}
      <Card className="bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Location Directory</CardTitle>
          <CardDescription>Overview of all locations in your region</CardDescription>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations?.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{location.name}</p>
                      {location.capacity && <p className="text-sm text-muted-foreground">Capacity: {location.capacity}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={location.type === 'WCA Center' ? 'default' : 'secondary'}>{location.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm">{location.address}</p>
                      <p className="text-xs text-muted-foreground">{location.city}, {location.state}</p>
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
                    <Badge variant="outline" className={location.status === 'Active' ? 'text-green-700 border-green-700' : 'text-red-700 border-red-700'}>
                      {location.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(!locations || locations.length === 0) && (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No locations found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationsTab;
