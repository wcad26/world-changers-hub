import React from "react";
import SuperAdminLayout from "@/components/admin/SuperAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateRegionalAdminForm from "@/components/admin/super/users/CreateRegionalAdminForm";
import UsersList from "@/components/admin/super/users/UsersList";

const SuperUserManagement: React.FC = () => {
  return (
    <SuperAdminLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">
            Create and manage regional administrator accounts
          </p>
        </div>

        <Tabs defaultValue="create-admin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create-admin">Create Regional Admin</TabsTrigger>
            <TabsTrigger value="manage-users">Manage Users</TabsTrigger>
          </TabsList>

          <TabsContent value="create-admin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Regional Administrator</CardTitle>
                <CardDescription>
                  Create a new regional administrator account for a specific region.
                  An invitation email will be sent to the provided email address.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateRegionalAdminForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage-users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  View and manage all users in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UsersList />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperUserManagement;