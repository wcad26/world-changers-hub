
import React from "react";
import SuperAdminLayout from "@/components/admin/SuperAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SuperFundraising: React.FC = () => {
  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Coordinate fundraising efforts across all WCA regions.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>Global Fundraising Campaigns</CardTitle>
            <CardDescription>
              Plan and manage organization-wide fundraising initiatives.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center py-8">Global fundraising management functionality will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperFundraising;
