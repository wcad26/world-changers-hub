
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Home, Users, Calendar, DollarSign, PlusCircle, Search, Eye, Edit, Trash2, MoreHorizontal, AlertCircle } from "lucide-react";
import { useDcgs, useDeleteDcg, DcgWithLeader } from "@/hooks/useDCGs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AddDcgDialog } from "./AddDcgDialog";
import { useToast } from "@/hooks/use-toast";
import { useRegionalDcgStats, useRecentDcgActivity } from "@/hooks/useRegionalStats";

const DcgOverviewTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDcgDialogOpen, setAddDcgDialogOpen] = useState(false);
  const { data: dcgs, isLoading, isError, error } = useDcgs();
  const { data: regionalStats, isLoading: statsLoading } = useRegionalDcgStats();
  const { data: recentActivity, isLoading: activityLoading } = useRecentDcgActivity();
  const deleteDcg = useDeleteDcg();
  const { toast } = useToast();

  const filteredDcgs = (dcgs || []).filter(dcg =>
    dcg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dcg.leader?.profiles && `${dcg.leader.profiles.first_name} ${dcg.leader.profiles.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (dcg.location && dcg.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getLeaderName = (dcg: DcgWithLeader) => {
    if (dcg.leader?.profiles) {
      return `${dcg.leader.profiles.first_name || ''} ${dcg.leader.profiles.last_name || ''}`.trim() || 'N/A';
    }
    return "N/A";
  };
  
  const formatMeetingTime = (time: string | null) => {
    if (!time) return 'N/A';
    // Handles `HH:MM:SS` format from Supabase
    const [hour, minute] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hour, 10));
    date.setMinutes(parseInt(minute, 10));
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleDeleteDcg = async (dcgId: string, dcgName: string) => {
    if (window.confirm(`Are you sure you want to delete "${dcgName}"? This action cannot be undone.`)) {
      try {
        await deleteDcg.mutateAsync(dcgId);
        toast({
          title: "DCG deleted",
          description: `${dcgName} has been successfully deleted.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete DCG. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Calculate metrics from real data
  const totalDcgs = dcgs?.length || 0;
  const totalMembers = regionalStats?.totalDcgMembers || 0;
  const avgAttendance = regionalStats?.averageAttendance || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>DCG Overview</CardTitle>
          <CardDescription>
            At-a-glance summary of your region's DCGs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total DCGs</p>
                  <p className="text-2xl font-bold">{statsLoading ? "..." : totalDcgs}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Home className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <p className="text-xs text-green-500 mt-2">Active DCGs in region</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Members</p>
                  <p className="text-2xl font-bold">{statsLoading ? "..." : totalMembers}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
              </div>
              <p className="text-xs text-green-500 mt-2">Across all DCGs</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg. Attendance</p>
                  <p className="text-2xl font-bold">{statsLoading ? "..." : avgAttendance}%</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Calendar className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <p className="text-xs text-green-500 mt-2">Regional average</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>DCG Directory</CardTitle>
          <CardDescription>
            Complete listing of all DCGs in your region.
          </CardDescription>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search DCGs..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setAddDcgDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New DCG
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Leader</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Meeting Schedule</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                      </TableRow>
                    ))
                  )}
                  {isError && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>
                            {error instanceof Error ? error.message : "Failed to fetch DCGs."}
                          </AlertDescription>
                        </Alert>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && !isError && filteredDcgs.length > 0 ? (
                    filteredDcgs.map((dcg) => (
                      <TableRow key={dcg.id}>
                        <TableCell className="font-medium">{dcg.name}</TableCell>
                        <TableCell>{getLeaderName(dcg)}</TableCell>
                        <TableCell>{dcg.location || 'N/A'}</TableCell>
                        <TableCell>N/A</TableCell>
                        <TableCell>{dcg.meeting_day || 'N/A'}, {formatMeetingTime(dcg.meeting_time)}</TableCell>
                        <TableCell>N/A</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-background border shadow-md z-50">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteDcg(dcg.id, dcg.name)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : null}
                  {!isLoading && !isError && filteredDcgs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24">
                        No DCGs found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>

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
                  {activityLoading && (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={`activity-skeleton-${i}`}>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                      </TableRow>
                    ))
                  )}
                  {!activityLoading && recentActivity && recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <TableRow key={`activity-${index}`}>
                        <TableCell className="font-medium">{activity.dcgName}</TableCell>
                        <TableCell>{activity.activity}</TableCell>
                        <TableCell>{activity.date}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            activity.status === 'Completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {activity.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : null}
                  {!activityLoading && (!recentActivity || recentActivity.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">
                        No recent activity found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <AddDcgDialog open={isAddDcgDialogOpen} setOpen={setAddDcgDialogOpen} />
    </div>
  );
};
export default DcgOverviewTab;
