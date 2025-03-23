
import React from "react";
import SuperAdminLayout from "@/components/admin/SuperAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SuperReports: React.FC = () => {
  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Global Reports & Analytics</h2>
        <p className="text-muted-foreground">
          Access comprehensive reports and analytics for the entire organization.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>Organizational Reports</CardTitle>
            <CardDescription>
              Generate and analyze organization-wide reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center py-8">Global reporting functionality will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperReports;
