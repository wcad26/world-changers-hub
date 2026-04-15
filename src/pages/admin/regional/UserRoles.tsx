import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Shield } from 'lucide-react';
import { useRegionalRoles } from '@/hooks/useRegionalRoles';
import { useAuth } from '@/hooks/useAuth';
import RoleManagementTab from '@/components/admin/regional/roles/RoleManagementTab';
import UserRoleAssignmentTab from '@/components/admin/regional/roles/UserRoleAssignmentTab';
import CreateRoleDialog from '@/components/admin/regional/roles/CreateRoleDialog';
import { GlassSection, GlassSectionHeader, GlassKPICard } from '@/components/ui/GlassSection';
import { useState } from 'react';

const UserRoles: React.FC = () => {
  const { userRegion } = useAuth();
  const { data: roles, isLoading } = useRegionalRoles();
  const [createRoleOpen, setCreateRoleOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <GlassKPICard
            icon={<Shield className="h-5 w-5" />}
            label="Total Roles"
            value={roles?.filter(r => r.is_active).length || 0}
            isLoading={isLoading}
          />
          <GlassKPICard
            icon={<Users className="h-5 w-5" />}
            label="Active Users"
            value="--"
            subtitle="With assigned roles"
            isLoading={isLoading}
          />
          <GlassKPICard
            icon={<Shield className="h-5 w-5" />}
            label="Custom Roles"
            value={roles?.filter(r => r.is_active && r.name !== 'Regional Admin').length || 0}
            isLoading={isLoading}
          />
        </div>

        {/* Main Content */}
        <GlassSection>
          <GlassSectionHeader
            icon={<Shield className="h-5 w-5" />}
            title="Role Management"
            description={`Manage user roles and permissions for ${userRegion?.name || 'your region'}`}
            action={
              <Button onClick={() => setCreateRoleOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Role
              </Button>
            }
          />

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
        </GlassSection>

        <CreateRoleDialog 
          open={createRoleOpen} 
          onOpenChange={setCreateRoleOpen} 
        />
      </div>
    </>
  );
};

export default UserRoles;
