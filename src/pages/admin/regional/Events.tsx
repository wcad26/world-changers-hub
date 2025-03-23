
import React from "react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const RegionalEvents: React.FC = () => {
  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Event Management</h2>
        <p className="text-muted-foreground">
          Manage events within your region.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>Regional Events</CardTitle>
            <CardDescription>
              Plan, organize, and track events in your region.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center py-8">Event management functionality will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </RegionalAdminLayout>
  );
};

export default RegionalEvents;
