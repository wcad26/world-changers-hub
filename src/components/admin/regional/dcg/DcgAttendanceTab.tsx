
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Eye, Edit } from "lucide-react";

// Mock data will be replaced later
const mockDcgs = [ { id: 1, name: "Victory DCG" }, { id: 2, name: "Faith DCG" } ];
const mockAttendance = [
  { dcgId: 1, dcgName: "Victory DCG", date: "2023-09-05", present: 12, absent: 3, rate: "80%" },
  { dcgId: 1, dcgName: "Victory DCG", date: "2023-09-12", present: 15, absent: 0, rate: "100%" },
];

const DcgAttendanceTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Tracking</CardTitle>
        <CardDescription>
          Track and monitor attendance across all DCGs.
        </CardDescription>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex-1">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="">All DCGs</option>
              {mockDcgs.map(dcg => (
                <option key={dcg.id} value={dcg.id}>{dcg.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <Input type="date" className="flex h-10 w-full" />
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Record Attendance
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DCG Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Attendance Rate</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAttendance.map((record, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{record.dcgName}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.present}</TableCell>
                    <TableCell>{record.absent}</TableCell>
                    <TableCell>{record.rate}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
export default DcgAttendanceTab;
