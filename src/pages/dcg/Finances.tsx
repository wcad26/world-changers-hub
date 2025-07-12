import React from 'react';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DcgFinances = () => {
  return (
    <DcgAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">DCG Finances</h1>
          <p className="text-muted-foreground">
            Manage DCG financial records and transactions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Financial Management</CardTitle>
            <CardDescription>
              Track income, expenses, and financial reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              Financial management functionality coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </DcgAdminLayout>
  );
};

export default DcgFinances;