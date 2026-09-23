import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users } from 'lucide-react';
import { useRegionalDcgReports } from '@/hooks/useRegionalDcgReports';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface DcgAttendanceTrendChartProps {
  dcgId?: string;
}

const DcgAttendanceTrendChart: React.FC<DcgAttendanceTrendChartProps> = ({ dcgId }) => {
  const { data: report, isLoading, error } = useRegionalDcgReports({ dcgId });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-72 w-full" /></CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading attendance data</AlertTitle>
        <AlertDescription>{error instanceof Error ? error.message : 'An error occurred'}</AlertDescription>
      </Alert>
    );
  }

  const chartData = report?.trendData || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">DCG Attendance Trends</CardTitle>
          <CardDescription>Monthly attendance rate over the last 6 months</CardDescription>
        </div>
        <Users className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                  formatter={(value: number, name: string) =>
                    name === 'Attendance Rate' ? [`${value.toFixed(1)}%`, name] : [value, name]
                  }
                />
                <Legend />
                <Line type="monotone" dataKey="attendanceRate" name="Attendance Rate" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="totalPresent" name="Present" stroke="hsl(220, 100%, 60%)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-72 text-muted-foreground">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No DCG attendance data</p>
              <p className="text-sm">Record attendance to see trends</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DcgAttendanceTrendChart;
