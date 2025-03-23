
import React from "react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const RegionalLocations: React.FC = () => {
  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Location Management</h2>
        <p className="text-muted-foreground">
          Manage all locations within your region.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>Region Locations</CardTitle>
            <CardDescription>
              Manage all WCA centers and meeting locations in your region.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center py-8">Location management functionality will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </RegionalAdminLayout>
  );
};

export default RegionalLocations;
