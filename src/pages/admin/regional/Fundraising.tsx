
import React from "react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const RegionalFundraising: React.FC = () => {
  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Fundraising Management</h2>
        <p className="text-muted-foreground">
          Manage fundraising campaigns and activities in your region.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>Fundraising Campaigns</CardTitle>
            <CardDescription>
              Create and manage fundraising initiatives for your region.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center py-8">Fundraising management functionality will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </RegionalAdminLayout>
  );
};

export default RegionalFundraising;
