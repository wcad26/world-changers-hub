import React from 'react';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DcgReports = () => {
  return (
    <DcgAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">DCG Reports</h1>
          <p className="text-muted-foreground">
            Generate and view DCG performance reports
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Generation</CardTitle>
            <CardDescription>
              Create detailed reports for DCG activities and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              Report generation functionality coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </DcgAdminLayout>
  );
};

export default DcgReports;