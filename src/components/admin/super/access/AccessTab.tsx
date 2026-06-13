import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShieldCheck,
  Clock,
  Crown,
  KeyRound,
  Users,
  Building2,
  Activity,
  UserPlus,
} from 'lucide-react';
import { GlassSection, GlassSectionHeader } from '@/components/ui/GlassSection';
import GlobalAccessKpiCards from './GlobalAccessKpiCards';
import PendingApprovalsTable from './PendingApprovalsTable';
import SuperAdminsTable from './SuperAdminsTable';
import SuperAdminRolesGrid from './SuperAdminRolesGrid';
import RegionalUsersTable from './RegionalUsersTable';
import RegionalRolesPanel from './RegionalRolesPanel';
import AccessActivityFeed from './AccessActivityFeed';
import CreateRegionalAdminForm from '@/components/admin/super/users/CreateRegionalAdminForm';

const SuperAccessTab: React.FC = () => {
  const [tab, setTab] = useState('pending');

  return (
    <div className="space-y-6">
      <GlobalAccessKpiCards />

      <GlassSection>
        <GlassSectionHeader
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Global Access Management"
          description="Approve role requests, manage super admin tiers, and govern every region's access from one place."
        />

        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="flex w-full flex-wrap h-auto gap-1 justify-start">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Pending Approvals</span>
              <span className="sm:hidden">Pending</span>
            </TabsTrigger>
            <TabsTrigger value="super-admins" className="gap-2">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Super Admins</span>
              <span className="sm:hidden">Super</span>
            </TabsTrigger>
            <TabsTrigger value="super-roles" className="gap-2">
              <KeyRound className="h-4 w-4" />
              <span className="hidden sm:inline">Super Admin Roles</span>
              <span className="sm:hidden">SA Roles</span>
            </TabsTrigger>
            <TabsTrigger value="regional-users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Regional Users</span>
              <span className="sm:hidden">Regional</span>
            </TabsTrigger>
            <TabsTrigger value="regional-roles" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Regional Roles</span>
              <span className="sm:hidden">R. Roles</span>
            </TabsTrigger>
            <TabsTrigger value="create-admin" className="gap-2">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Admin</span>
              <span className="sm:hidden">New</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Activity Log</span>
              <span className="sm:hidden">Log</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <PendingApprovalsTable />
          </TabsContent>
          <TabsContent value="super-admins" className="mt-4">
            <SuperAdminsTable />
          </TabsContent>
          <TabsContent value="super-roles" className="mt-4">
            <SuperAdminRolesGrid />
          </TabsContent>
          <TabsContent value="regional-users" className="mt-4">
            <RegionalUsersTable />
          </TabsContent>
          <TabsContent value="regional-roles" className="mt-4">
            <RegionalRolesPanel />
          </TabsContent>
          <TabsContent value="create-admin" className="mt-4">
            <div className="max-w-2xl">
              <CreateRegionalAdminForm />
            </div>
          </TabsContent>
          <TabsContent value="activity" className="mt-4">
            <AccessActivityFeed />
          </TabsContent>
        </Tabs>
      </GlassSection>
    </div>
  );
};

export default SuperAccessTab;
