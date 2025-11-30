
import React from "react";
import SuperAdminLayout from "@/components/admin/SuperAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SuperLocations: React.FC = () => {
  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Manage all WCA centers and locations worldwide.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>Global Locations Directory</CardTitle>
            <CardDescription>
              Comprehensive directory of all WCA centers and meeting locations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center py-8">Global location management functionality will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperLocations;
