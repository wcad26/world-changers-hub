
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Home, Users, Calendar, DollarSign } from "lucide-react";

// Mock data will be replaced later
const mockDcgs = [ { id: 1, members: 15 }, { id: 2, members: 12 }, { id: 3, members: 18 }, { id: 4, members: 10 } ];

const DcgOverviewTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>DCG Overview</CardTitle>
        <CardDescription>
          At-a-glance summary of your region's DCGs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total DCGs</p>
                <p className="text-2xl font-bold">{mockDcgs.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Home className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <p className="text-xs text-green-500 mt-2">+2 from last month</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Members</p>
                <p className="text-2xl font-bold">{mockDcgs.reduce((acc, dcg) => acc + dcg.members, 0)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <p className="text-xs text-green-500 mt-2">+5 from last month</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg. Attendance</p>
                <p className="text-2xl font-bold">82%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Calendar className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <p className="text-xs text-green-500 mt-2">+3% from last month</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Offerings</p>
                <p className="text-2xl font-bold">$1,245</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <DollarSign className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
            <p className="text-xs text-green-500 mt-2">+$120 from last month</p>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DCG Name</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Victory DCG</TableCell>
                    <TableCell>Weekly Meeting</TableCell>
                    <TableCell>Yesterday</TableCell>
                    <TableCell><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Completed</span></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Faith DCG</TableCell>
                    <TableCell>Outreach Program</TableCell>
                    <TableCell>2 days ago</TableCell>
                    <TableCell><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Completed</span></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
export default DcgOverviewTab;
