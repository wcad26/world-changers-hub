import React from 'react';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DcgCommunication = () => {
  return (
    <DcgAdminLayout>
      <div className="space-y-4 md:space-y-6 p-4 md:p-0 px-[10px]">
        <div className="hidden lg:block">
          <h1 className="text-3xl font-bold">Communication</h1>
          <p className="text-muted-foreground">Manage communications with DCG members</p>
        </div>

        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Communication Tools</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Send messages and announcements to DCG members
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <p className="text-center text-muted-foreground py-8 text-sm">
              Communication tools coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </DcgAdminLayout>
  );
};

export default DcgCommunication;
