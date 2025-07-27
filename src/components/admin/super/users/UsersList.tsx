import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, UserX, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserWithProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  region_id: string | null;
  region_name: string | null;
  roles: string[];
  created_at: string;
}

const UsersList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', searchTerm, roleFilter],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          phone,
          region_id,
          created_at,
          regions!profiles_region_id_fkey(name),
          user_roles!user_roles_user_id_fkey(role, is_active)
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform the data to include roles and region name
      const transformedData: UserWithProfile[] = data.map((user: any) => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        region_id: user.region_id,
        region_name: user.regions?.name || null,
        roles: user.user_roles
          ?.filter((role: any) => role.is_active)
          ?.map((role: any) => role.role) || [],
        created_at: user.created_at,
      }));

      // Filter by role if specified
      if (roleFilter !== "all") {
        return transformedData.filter(user => user.roles.includes(roleFilter));
      }

      return transformedData;
    },
  });

  const toggleUserRole = async (userId: string, role: string, isActive: boolean) => {
    try {
      const validRoles = ['super_admin', 'regional_admin', 'member', 'dcg_admin'];
      if (!validRoles.includes(role)) {
        throw new Error('Invalid role specified');
      }

      if (isActive) {
        // Deactivate role
        const { error } = await supabase
          .from('user_roles')
          .update({ is_active: false })
          .eq('user_id', userId)
          .eq('role', role as any);

        if (error) throw error;

        toast({
          title: "Success",
          description: `User role deactivated successfully.`,
        });
      } else {
        // Reactivate role
        const { error } = await supabase
          .from('user_roles')
          .update({ is_active: true })
          .eq('user_id', userId)
          .eq('role', role as any);

        if (error) throw error;

        toast({
          title: "Success",
          description: `User role reactivated successfully.`,
        });
      }

      refetch();
    } catch (error: any) {
      console.error('Error toggling user role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user role.",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'regional_admin':
        return 'default';
      case 'dcg_admin':
        return 'secondary';
      case 'member':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading users...</div>;
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
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="regional_admin">Regional Admin</SelectItem>
            <SelectItem value="dcg_admin">DCG Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
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
              <TableHead>Roles</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  {user.first_name || user.last_name
                    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                    : 'N/A'}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.region_name || 'No Region'}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.length > 0 ? (
                      user.roles.map((role) => (
                        <Badge
                          key={role}
                          variant={getRoleBadgeVariant(role)}
                          className="text-xs"
                        >
                          {role.replace('_', ' ')}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        No roles
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {user.roles.includes('regional_admin') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleUserRole(user.id, 'regional_admin', true)}
                      className="mr-2"
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {users?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No users found.
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