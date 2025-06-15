
import React from "react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DcgOverviewTab from "@/components/admin/regional/dcg/DcgOverviewTab";
import DcgListTab from "@/components/admin/regional/dcg/DcgListTab";
import DcgAttendanceTab from "@/components/admin/regional/dcg/DcgAttendanceTab";
import DcgFinancialsTab from "@/components/admin/regional/dcg/DcgFinancialsTab";
import DcgReportsTab from "@/components/admin/regional/dcg/DcgReportsTab";

const RegionalDCG: React.FC = () => {
  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">DCG Management</h2>
        <p className="text-muted-foreground">
          Manage Destiny Care Groups in your region.
        </p>
        
        <Tabs defaultValue="dcg-list">
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-5 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="dcg-list">DCG List</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <DcgOverviewTab />
          </TabsContent>
          
          <TabsContent value="dcg-list">
            <DcgListTab />
          </TabsContent>
          
          <TabsContent value="attendance">
            <DcgAttendanceTab />
          </TabsContent>
          
          <TabsContent value="financials">
            <DcgFinancialsTab />
          </TabsContent>
          
          <TabsContent value="reports">
            <DcgReportsTab />
          </TabsContent>
        </Tabs>
      </div>
    </RegionalAdminLayout>
  );
};

export default RegionalDCG;
