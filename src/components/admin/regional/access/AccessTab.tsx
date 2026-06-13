import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, KeyRound, ListChecks } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { GlassSection, GlassSectionHeader } from '@/components/ui/GlassSection';
import AccessKpiCards from '@/components/admin/regional/roles/AccessKpiCards';
import UsersWithAccessTable from '@/components/admin/regional/roles/UsersWithAccessTable';
import RoleManagementGrid from '@/components/admin/regional/roles/RoleManagementGrid';
import CreateRoleDialog from '@/components/admin/regional/roles/CreateRoleDialog';
import MyRequestsList from './MyRequestsList';

const RegionalAccessTab: React.FC = () => {
  const { userRegion } = useAuth();
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [innerTab, setInnerTab] = useState('users');

  return (
    <div className="space-y-6">
      <AccessKpiCards />

      <GlassSection>
        <GlassSectionHeader
          icon={<KeyRound className="h-5 w-5" />}
          title="Access Management"
          description={`Control who can do what in ${userRegion?.name || 'your region'}. New role assignments are sent to the Super Admin for approval.`}
          action={
            innerTab === 'roles' ? (
              <Button onClick={() => setCreateRoleOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Role
              </Button>
            ) : undefined
          }
        />

        <Tabs value={innerTab} onValueChange={setInnerTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users with Access</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2">
              <KeyRound className="h-4 w-4" />
              <span className="hidden sm:inline">Roles &amp; Permissions</span>
              <span className="sm:hidden">Roles</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <ListChecks className="h-4 w-4" />
              <span className="hidden sm:inline">My Requests</span>
              <span className="sm:hidden">Requests</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            <UsersWithAccessTable />
          </TabsContent>

          <TabsContent value="roles" className="mt-4">
            <RoleManagementGrid />
          </TabsContent>

          <TabsContent value="requests" className="mt-4">
            <MyRequestsList />
          </TabsContent>
        </Tabs>
      </GlassSection>

      <CreateRoleDialog open={createRoleOpen} onOpenChange={setCreateRoleOpen} />
    </div>
  );
};

export default RegionalAccessTab;
