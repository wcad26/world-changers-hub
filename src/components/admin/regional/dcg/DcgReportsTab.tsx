
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BarChart2, DollarSign, Users, Calendar } from "lucide-react";

const DcgReportsTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>DCG Reports</CardTitle>
        <CardDescription>
          Generate and view reports for your DCGs.
        </CardDescription>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex-1">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="">Select Report Type</option>
              <option value="attendance">Attendance Report</option>
            </select>
          </div>
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 p-8 text-center rounded-md border">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">No Reports Generated Yet</h3>
          <p className="text-gray-500 mt-2 mb-4">Select a report type and click "Generate Report" to get started</p>
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Available Report Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-md border">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-md"><BarChart2 className="h-5 w-5 text-blue-600" /></div>
                <div>
                  <h4 className="font-medium">Attendance Report</h4>
                  <p className="text-sm text-gray-500">Weekly/Monthly stats</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
export default DcgReportsTab;
