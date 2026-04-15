import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string | null;
  member_id?: string | null;
  member_status?: string | null;
}

const UserManagement: React.FC = () => {
  const { userRegion } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const queryClient = useQueryClient();

  // Fetch users in the region
  const { data: users, isLoading } = useQuery({
    queryKey: ['users', userRegion?.id],
    queryFn: async () => {
      if (!userRegion?.id) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          phone,
          created_at,
          members!inner(
            id,
            member_id,
            status
          )
        `)
        .eq('region_id', userRegion.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(profile => ({
        ...profile,
        member_id: profile.members?.[0]?.member_id || null,
        member_status: profile.members?.[0]?.status || null,
      })) as UserProfile[];
    },
    enabled: !!userRegion?.id,
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // First delete the member record (this will cascade due to foreign key)
      const { error: memberError } = await supabase
        .from('members')
        .delete()
        .eq('profile_id', userId);

      if (memberError) throw memberError;

      // Then delete the profile (auth.users will cascade from trigger if set up)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast.error('Failed to delete user: ' + error.message);
    },
  });

  const filteredUsers = React.useMemo(() => {
    if (!users) return [];
    return users.filter(user => {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      const phone = (user.phone || '').toLowerCase();
      const memberId = (user.member_id || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      return fullName.includes(searchLower) || 
             email.includes(searchLower) || 
             phone.includes(searchLower) ||
             memberId.includes(searchLower);
    });
  }, [users, searchTerm]);

  const handleDeleteClick = (user: UserProfile) => {
    setSelectedUser(user);
  };

  const handleDeleteConfirm = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Search and manage user accounts in your region
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Accounts</CardTitle>
            <CardDescription>
              Search by name, email, phone, or member ID to find and manage user accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Clear
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No users found matching your search' : 'No users found'}
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Member ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.last_name} {user.first_name}
                          </TableCell>
                          <TableCell>{user.email || 'N/A'}</TableCell>
                          <TableCell>{user.phone || 'N/A'}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {user.member_id || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {user.member_status && (
                              <Badge variant={
                                user.member_status === 'active' ? 'default' :
                                user.member_status === 'new' ? 'secondary' :
                                'outline'
                              }>
                                {user.member_status}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.created_at 
                              ? new Date(user.created_at).toLocaleDateString()
                              : 'N/A'
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(user)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex items-start gap-2 p-4 bg-muted/50 rounded-lg border border-muted">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                <div className="text-sm space-y-1">
                  <p className="font-medium text-foreground">Warning</p>
                  <p className="text-muted-foreground">
                    Deleting a user will permanently remove their profile, member record, and all associated data. 
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This will permanently delete the account for{' '}
                <strong className="text-foreground">
                  {selectedUser?.last_name} {selectedUser?.first_name}
                </strong>
                {selectedUser?.email && (
                  <span> ({selectedUser.email})</span>
                )}
              </p>
              <p className="text-destructive font-medium">
                This action cannot be undone. All associated data including member records will be permanently removed.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUserMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteUserMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserManagement;
