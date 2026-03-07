import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Eye, Edit } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDcgs } from '@/hooks/useDCGs';
import { useDcgAttendanceHistory } from '@/hooks/useDcgAttendance';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const DcgAttendanceTab = () => {
  const [selectedDcgId, setSelectedDcgId] = useState<string>('');
  const { data: dcgs, isLoading: dcgsLoading } = useDcgs();
  const { data: attendanceHistory, isLoading: historyLoading } = useDcgAttendanceHistory(selectedDcgId || undefined);

  const isLoading = dcgsLoading || historyLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Tracking</CardTitle>
        <CardDescription>Track and monitor attendance across all DCGs.</CardDescription>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex-1">
            <Select value={selectedDcgId} onValueChange={setSelectedDcgId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a DCG" />
              </SelectTrigger>
              <SelectContent>
                {dcgs?.map(dcg => (
                  <SelectItem key={dcg.id} value={dcg.id}>{dcg.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Present</TableHead>
                  <TableHead className="text-right">Absent</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}><Skeleton className="h-6 w-full" /></TableCell>
                    </TableRow>
                  ))
                )}
                {!isLoading && !selectedDcgId && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Select a DCG to view attendance records
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && selectedDcgId && attendanceHistory && attendanceHistory.length > 0 && (
                  attendanceHistory.map(record => {
                    const total = record.total_present + record.total_absent;
                    const rate = total > 0 ? (record.total_present / total) * 100 : 0;
                    return (
                      <TableRow key={record.event_id}>
                        <TableCell className="font-medium">{record.event_name}</TableCell>
                        <TableCell>{new Date(record.event_date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">{record.total_present}</TableCell>
                        <TableCell className="text-right">{record.total_absent}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={rate >= 70 ? 'default' : rate >= 40 ? 'secondary' : 'destructive'}>
                            {rate.toFixed(0)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
                {!isLoading && selectedDcgId && (!attendanceHistory || attendanceHistory.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No attendance records found for this DCG
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DcgAttendanceTab;
