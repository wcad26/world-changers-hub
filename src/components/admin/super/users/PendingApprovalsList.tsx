import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, User } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface PendingUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  region_id: string;
  region_name: string;
  role_id: string;
  user_id: string;
  created_at: string;
  requested_role_id: string | null;
  requested_role_name: string | null;
}

const PendingApprovalsList: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingUsers, isLoading } = useQuery({
    queryKey: ["pending-users"],
    queryFn: async () => {
      // First, get pending user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("id, user_id, role, region_id, assigned_at, requested_regional_role_id")
        .eq("status", "pending")
        .eq("role", "regional_admin");

      if (rolesError) throw rolesError;
      if (!userRoles || userRoles.length === 0) return [];

      // Get user IDs and region IDs
      const userIds = userRoles.map(role => role.user_id);
      const regionIds = userRoles.map(role => role.region_id).filter(Boolean);
      const roleIds = userRoles
        .map(role => role.requested_regional_role_id)
        .filter(Boolean) as string[];

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Get region names
      const { data: regions, error: regionsError } = await supabase
        .from("regions")
        .select("id, name")
        .in("id", regionIds.filter((id): id is string => Boolean(id)));

      if (regionsError) throw regionsError;

      // Get requested regional roles
      let regionalRoles: { id: string; name: string }[] = [];
      if (roleIds.length > 0) {
        const { data: rolesData, error: rolesDataError } = await supabase
          .from("regional_roles")
          .select("id, name")
          .in("id", roleIds);

        if (rolesDataError) throw rolesDataError;
        regionalRoles = rolesData || [];
      }

      // Combine the data
      return userRoles.map((role: any) => {
        const profile = profiles?.find(p => p.id === role.user_id);
        const region = regions?.find(r => r.id === role.region_id);
        const requestedRole = regionalRoles?.find(r => r.id === role.requested_regional_role_id);
        
        return {
          id: profile?.id || role.user_id,
          email: profile?.email || "N/A",
          first_name: profile?.first_name || null,
          last_name: profile?.last_name || null,
          region_id: role.region_id,
          region_name: region?.name || "Unknown Region",
          role_id: role.id,
          user_id: role.user_id,
          created_at: role.assigned_at,
          requested_role_id: role.requested_regional_role_id,
          requested_role_name: requestedRole?.name || null,
        };
      });
    },
  });

  const approveUserMutation = useMutation({
    mutationFn: async (user: PendingUser) => {
      // Update user_roles status to active
      const { error: updateError } = await supabase
        .from("user_roles")
        .update({ 
          status: "active",
          is_active: true 
        })
        .eq("id", user.role_id);

      if (updateError) throw updateError;

      // If there's a requested regional role, create the regional_user_roles entry
      if (user.requested_role_id && user.region_id) {
        const { error: regionalRoleError } = await supabase
          .from("regional_user_roles")
          .insert({
            user_id: user.user_id,
            region_id: user.region_id,
            regional_role_id: user.requested_role_id,
            is_active: true,
          });

        if (regionalRoleError) {
          console.error("Error creating regional user role:", regionalRoleError);
          // Don't throw, the main approval succeeded
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "User Approved",
        description: "The user has been approved and can now access the regional portal.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectUserMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ 
          status: "rejected",
          is_active: false 
        })
        .eq("id", roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-users"] });
      toast({
        title: "User Rejected",
        description: "The user request has been rejected.",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to reject user. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading pending requests...</div>;
  }

  if (!pendingUsers || pendingUsers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>No pending access requests at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Region</TableHead>
            <TableHead>Requested Role</TableHead>
            <TableHead>Request Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingUsers.map((user) => (
            <TableRow key={user.role_id}>
              <TableCell className="font-medium">
                {user.first_name && user.last_name 
                  ? `${user.last_name} ${user.first_name}`
                  : "N/A"
                }
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.region_name}</TableCell>
              <TableCell>
                {user.requested_role_name ? (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                    <User className="w-3 h-3 mr-1" />
                    {user.requested_role_name}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">No specific role</span>
                )}
              </TableCell>
              <TableCell>
                {new Date(user.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Approve Access Request</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>Are you sure you want to approve access for <strong>{user.last_name} {user.first_name}</strong>?</p>
                          {user.requested_role_name && (
                            <p>They will be assigned the <strong>{user.requested_role_name}</strong> role in <strong>{user.region_name}</strong>.</p>
                          )}
                          <p>They will be able to access the regional portal immediately.</p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => approveUserMutation.mutate(user)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve Access
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject Access Request</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to reject the access request for {user.last_name} {user.first_name}? 
                          This action cannot be easily undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => rejectUserMutation.mutate(user.role_id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Reject Request
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PendingApprovalsList;