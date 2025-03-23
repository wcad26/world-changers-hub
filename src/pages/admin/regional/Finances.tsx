
import React from "react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RegionalFinances: React.FC = () => {
  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Financial Management</h2>
        <p className="text-muted-foreground">
          Manage all financial aspects of your region.
        </p>
        
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tithes">Tithes</TabsTrigger>
            <TabsTrigger value="offerings">Offerings</TabsTrigger>
            <TabsTrigger value="special-giving">Special Giving</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>
                  Summary of your region's financial standing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8">Financial overview dashboard will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tithes">
            <Card>
              <CardHeader>
                <CardTitle>Tithe Collections</CardTitle>
                <CardDescription>
                  Track and manage tithe collections.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8">Tithe collection management will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="offerings">
            <Card>
              <CardHeader>
                <CardTitle>Offering Collections</CardTitle>
                <CardDescription>
                  Track and manage all offering collections.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8">Offering collection management will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="special-giving">
            <Card>
              <CardHeader>
                <CardTitle>Special Giving</CardTitle>
                <CardDescription>
                  Manage special donations and contributions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8">Special giving management will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle>Expense Management</CardTitle>
                <CardDescription>
                  Track and manage all regional expenses.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8">Expense management tools will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
                <CardDescription>
                  Generate and view detailed financial reports.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8">Financial reporting functionality will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RegionalAdminLayout>
  );
};

export default RegionalFinances;
