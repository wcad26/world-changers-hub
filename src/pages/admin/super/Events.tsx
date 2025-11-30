
import React from "react";
import SuperAdminLayout from "@/components/admin/SuperAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SuperEvents: React.FC = () => {
  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Manage events across all WCA regions.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>Global Events Calendar</CardTitle>
            <CardDescription>
              Coordinate and manage all WCA events worldwide.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center py-8">Global event management functionality will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperEvents;
