import React from 'react';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DcgCommunication = () => {
  return (
    <DcgAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Communication</h1>
          <p className="text-muted-foreground">
            Manage communications with DCG members
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Communication Tools</CardTitle>
            <CardDescription>
              Send messages and announcements to DCG members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              Communication tools coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </DcgAdminLayout>
  );
};

export default DcgCommunication;