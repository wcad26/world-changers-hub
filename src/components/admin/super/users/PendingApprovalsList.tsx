import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface PendingUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  region_id: string;
  region_name: string;
  role_id: string;
  created_at: string;
}

const PendingApprovalsList: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingUsers, isLoading } = useQuery({
    queryKey: ["pending-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          id,
          user_id,
          role,
          region_id,
          created_at,
          profiles!inner(
            id,
            email,
            first_name,
            last_name
          ),
          regions!inner(
            name
          )
        `)
        .eq("status", "pending")
        .eq("role", "regional_admin");

      if (error) throw error;

      return data.map((item: any) => ({
        id: item.profiles.id,
        email: item.profiles.email,
        first_name: item.profiles.first_name,
        last_name: item.profiles.last_name,
        region_id: item.region_id,
        region_name: item.regions.name,
        role_id: item.id,
        created_at: item.created_at,
      }));
    },
  });

  const approveUserMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ 
          status: "active",
          is_active: true 
        })
        .eq("id", roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-users"] });
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
                  ? `${user.first_name} ${user.last_name}`
                  : "N/A"
                }
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.region_name}</TableCell>
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
                        <AlertDialogDescription>
                          Are you sure you want to approve access for {user.first_name} {user.last_name}? 
                          They will be able to access the regional portal immediately.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => approveUserMutation.mutate(user.role_id)}
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
                          Are you sure you want to reject the access request for {user.first_name} {user.last_name}? 
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