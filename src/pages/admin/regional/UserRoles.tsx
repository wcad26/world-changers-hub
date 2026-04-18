import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, KeyRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  GlassSection,
  GlassSectionHeader,
} from '@/components/ui/GlassSection';
import AccessKpiCards from '@/components/admin/regional/roles/AccessKpiCards';
import UsersWithAccessTable from '@/components/admin/regional/roles/UsersWithAccessTable';
import RoleManagementGrid from '@/components/admin/regional/roles/RoleManagementGrid';
import CreateRoleDialog from '@/components/admin/regional/roles/CreateRoleDialog';

const UserRoles: React.FC = () => {
  const { userRegion } = useAuth();
  const [createRoleOpen, setCreateRoleOpen] = useState(false);

  return (
    <div className="space-y-6">
      <AccessKpiCards />

      <GlassSection>
        <GlassSectionHeader
          icon={<KeyRound className="h-5 w-5" />}
          title="Access Management"
          description={`Control who can do what in ${userRegion?.name || 'your region'}.`}
          action={
            <Button onClick={() => setCreateRoleOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Role
            </Button>
          }
        />

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users with Access
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2">
              <KeyRound className="h-4 w-4" />
              Manage Roles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersWithAccessTable />
          </TabsContent>

          <TabsContent value="roles">
            <RoleManagementGrid />
          </TabsContent>
        </Tabs>
      </GlassSection>

      <CreateRoleDialog open={createRoleOpen} onOpenChange={setCreateRoleOpen} />
    </div>
  );
};

export default UserRoles;
