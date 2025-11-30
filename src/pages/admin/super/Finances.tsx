
import React from "react";
import SuperAdminLayout from "@/components/admin/SuperAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SuperFinances: React.FC = () => {
  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Oversee finances across all WCA regions worldwide.
        </p>
        
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="regional-finances">Regional Finances</TabsTrigger>
            <TabsTrigger value="global-collections">Global Collections</TabsTrigger>
            <TabsTrigger value="budget-planning">Budget Planning</TabsTrigger>
            <TabsTrigger value="financial-reports">Financial Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Global Financial Overview</CardTitle>
                <CardDescription>
                  Summary of WCA's global financial standing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8">Global financial overview dashboard will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="regional-finances">
            <Card>
              <CardHeader>
                <CardTitle>Regional Financial Performance</CardTitle>
                <CardDescription>
                  Compare and analyze financial performance across regions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8">Regional financial comparison tools will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="global-collections">
            <Card>
              <CardHeader>
                <CardTitle>Global Collections</CardTitle>
                <CardDescription>
                  Track tithes, offerings, and other collections globally.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8">Global collections tracking functionality will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="budget-planning">
            <Card>
              <CardHeader>
                <CardTitle>Budget Planning</CardTitle>
                <CardDescription>
                  Create and manage global and regional budgets.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8">Budget planning tools will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="financial-reports">
            <Card>
              <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
                <CardDescription>
                  Generate and view detailed global financial reports.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8">Global financial reporting functionality will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperFinances;
