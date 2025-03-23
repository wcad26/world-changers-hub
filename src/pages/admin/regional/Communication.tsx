
import React from "react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const RegionalCommunication: React.FC = () => {
  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Communication Center</h2>
        <p className="text-muted-foreground">
          Manage all communication with members in your region.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>Communication Tools</CardTitle>
            <CardDescription>
              Send messages, announcements, and updates to your members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center py-8">Communication management functionality will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </RegionalAdminLayout>
  );
};

export default RegionalCommunication;
