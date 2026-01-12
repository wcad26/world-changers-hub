import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, UserX, Shield, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RegionalRole {
  id: string;
  name: string;
  is_active: boolean;
}

interface UserWithProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  region_id: string | null;
  region_name: string | null;
  app_roles: string[];
  regional_roles: RegionalRole[];
  created_at: string;
  is_active: boolean;
}

const UsersList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const { toast } = useToast();

  // Fetch all regions for filtering
  const { data: regions } = useQuery({
    queryKey: ['all-regions-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regions')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', searchTerm, regionFilter],
    queryFn: async () => {
      // Get users with regional_admin role
      let userRolesQuery = supabase
        .from('user_roles')
        .select('user_id, role, region_id, is_active, status')
        .eq('role', 'regional_admin')
        .eq('status', 'active');

      if (regionFilter !== "all") {
        userRolesQuery = userRolesQuery.eq('region_id', regionFilter);
      }

      const { data: userRoles, error: userRolesError } = await userRolesQuery;
      if (userRolesError) throw userRolesError;
      if (!userRoles || userRoles.length === 0) return [];

      const userIds = [...new Set(userRoles.map(ur => ur.user_id))];
      const regionIds = [...new Set(userRoles.map(ur => ur.region_id).filter(Boolean))];

      // Get profiles
      let profilesQuery = supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone, created_at')
        .in('id', userIds);

      if (searchTerm) {
        profilesQuery = profilesQuery.or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);
      }

      const { data: profiles, error: profilesError } = await profilesQuery;
      if (profilesError) throw profilesError;

      // Get regions
      const { data: regionsData, error: regionsError } = await supabase
        .from('regions')
        .select('id, name')
        .in('id', regionIds as string[]);
      if (regionsError) throw regionsError;

      // Get regional user roles
      const { data: regionalUserRoles, error: rurError } = await supabase
        .from('regional_user_roles')
        .select(`
          user_id,
          is_active,
          regional_roles (
            id,
            name
          )
        `)
        .in('user_id', userIds)
        .eq('is_active', true);

      if (rurError) throw rurError;

      // Transform data
      const transformedData: UserWithProfile[] = profiles?.map((profile) => {
        const userRole = userRoles.find(ur => ur.user_id === profile.id);
        const region = regionsData?.find(r => r.id === userRole?.region_id);
        const userRegionalRoles = regionalUserRoles
          ?.filter(rur => rur.user_id === profile.id)
          ?.map(rur => ({
            id: (rur.regional_roles as any)?.id || '',
            name: (rur.regional_roles as any)?.name || '',
            is_active: rur.is_active,
          })) || [];

        return {
          id: profile.id,
          email: profile.email || '',
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          region_id: userRole?.region_id || null,
          region_name: region?.name || null,
          app_roles: ['regional_admin'],
          regional_roles: userRegionalRoles,
          created_at: profile.created_at || '',
          is_active: userRole?.is_active || false,
        };
      }) || [];

      return transformedData;
    },
  });

  const toggleUserRole = async (userId: string, isActive: boolean) => {
    try {
      if (isActive) {
        // Deactivate role
        const { error } = await supabase
          .from('user_roles')
          .update({ is_active: false })
          .eq('user_id', userId)
          .eq('role', 'regional_admin');

        if (error) throw error;

        // Also deactivate regional user roles
        await supabase
          .from('regional_user_roles')
          .update({ is_active: false })
          .eq('user_id', userId);

        toast({
          title: "Success",
          description: "User access has been deactivated.",
        });
      } else {
        // Reactivate role
        const { error } = await supabase
          .from('user_roles')
          .update({ is_active: true })
          .eq('user_id', userId)
          .eq('role', 'regional_admin');

        if (error) throw error;

        toast({
          title: "Success",
          description: "User access has been reactivated.",
        });
      }

      refetch();
    } catch (error: any) {
      console.error('Error toggling user role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user status.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading regional administrators...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {regions?.map((region) => (
              <SelectItem key={region.id} value={region.id}>
                {region.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Regional Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    {user.first_name || user.last_name
                      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                      : 'N/A'}
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.region_name ? (
                    <Badge variant="outline">{user.region_name}</Badge>
                  ) : (
                    <span className="text-muted-foreground">No Region</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.regional_roles.length > 0 ? (
                      user.regional_roles.map((role) => (
                        <Badge
                          key={role.id}
                          variant="secondary"
                          className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                        >
                          <Users className="w-3 h-3 mr-1" />
                          {role.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">No regional roles</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={user.is_active ? "default" : "secondary"}
                    className={user.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}
                  >
                    {user.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell>
                  <Button
                    variant={user.is_active ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleUserRole(user.id, user.is_active)}
                    className={user.is_active ? "" : "bg-green-600 hover:bg-green-700"}
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    {user.is_active ? "Deactivate" : "Reactivate"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {users?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No regional administrators found.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UsersList;