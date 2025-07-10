import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAttendanceHistory } from "@/hooks/useAttendance";
import { useAuth } from "@/hooks/useAuth";
import { CalendarDays, Users, TrendingUp, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function AttendanceReportView() {
  const { userRegion } = useAuth();
  const { data: attendanceHistory, isLoading, isError, error } = useAttendanceHistory(userRegion?.id);

  const totalEvents = attendanceHistory?.length || 0;
  const totalPresent = attendanceHistory?.reduce((sum, event) => sum + (event.present_count || 0), 0) || 0;
  const totalAbsent = attendanceHistory?.reduce((sum, event) => sum + (event.absent_count || 0), 0) || 0;
  const averageAttendance = totalEvents > 0 ? Math.round(totalPresent / totalEvents) : 0;

  const handleExportData = () => {
    if (!attendanceHistory) return;
    
    const csvData = [
      ['Event Name', 'Date', 'Present', 'Absent', 'Total', 'Attendance Rate'],
      ...attendanceHistory.map(event => [
        event.event_name,
        new Date(event.event_date).toLocaleDateString(),
        event.present_count.toString(),
        event.absent_count.toString(),
        (event.present_count + event.absent_count).toString(),
        `${Math.round((event.present_count / (event.present_count + event.absent_count)) * 100)}%`
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px]" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading attendance data</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "An unknown error occurred."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Present</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalPresent}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Absent</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalAbsent}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageAttendance}</div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Attendance History</CardTitle>
              <CardDescription>
                Detailed attendance records for all tracked events
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleExportData}
              disabled={!attendanceHistory || attendanceHistory.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!attendanceHistory || attendanceHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No attendance data available. Create attendance events to start tracking.
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-center">Present</TableHead>
                      <TableHead className="text-center">Absent</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Attendance Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceHistory.map((event) => {
                      const total = event.present_count + event.absent_count;
                      const attendanceRate = total > 0 ? Math.round((event.present_count / total) * 100) : 0;
                      
                      return (
                        <TableRow key={event.event_id}>
                          <TableCell className="font-medium">{event.event_name}</TableCell>
                          <TableCell>{new Date(event.event_date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {event.present_count}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              {event.absent_count}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-medium">{total}</TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant={attendanceRate >= 70 ? "default" : "secondary"}
                              className={attendanceRate >= 70 ? "bg-green-600" : "bg-yellow-600"}
                            >
                              {attendanceRate}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}