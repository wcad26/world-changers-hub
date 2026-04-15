import React, { useState } from 'react';
import RegionalAdminLayout from '@/components/admin/RegionalAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Shield } from 'lucide-react';
import { useRegionalRoles } from '@/hooks/useRegionalRoles';
import { useAuth } from '@/hooks/useAuth';
import RoleManagementTab from '@/components/admin/regional/roles/RoleManagementTab';
import UserRoleAssignmentTab from '@/components/admin/regional/roles/UserRoleAssignmentTab';
import CreateRoleDialog from '@/components/admin/regional/roles/CreateRoleDialog';

const UserRoles: React.FC = () => {
  const { userRegion } = useAuth();
  const { data: roles, isLoading } = useRegionalRoles();
  const [createRoleOpen, setCreateRoleOpen] = useState(false);

  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">User Roles</h1>
            <p className="text-muted-foreground">
              Manage user roles and permissions for {userRegion?.name}
            </p>
          </div>
          <Button onClick={() => setCreateRoleOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Role
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : roles?.filter(r => r.is_active).length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">With assigned roles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custom Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : roles?.filter(r => r.is_active && r.name !== 'Regional Admin').length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="assignments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="assignments" className="gap-2">
              <Users className="h-4 w-4" />
              User Assignments
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2">
              <Shield className="h-4 w-4" />
              Manage Roles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assignments">
            <UserRoleAssignmentTab />
          </TabsContent>

          <TabsContent value="roles">
            <RoleManagementTab />
          </TabsContent>
        </Tabs>

        <CreateRoleDialog 
          open={createRoleOpen} 
          onOpenChange={setCreateRoleOpen} 
        />
      </div>
    </RegionalAdminLayout>
  );
};

export default UserRoles;