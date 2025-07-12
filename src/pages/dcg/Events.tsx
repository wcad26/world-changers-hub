import React from 'react';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DcgEvents = () => {
  return (
    <DcgAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">DCG Events</h1>
          <p className="text-muted-foreground">
            Manage and schedule DCG events and activities
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Management</CardTitle>
            <CardDescription>
              Create, edit, and manage DCG events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              Event management functionality coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </DcgAdminLayout>
  );
};

export default DcgEvents;