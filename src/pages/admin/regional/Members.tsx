
import React from 'react';
import { useNavigate } from 'react-router-dom';
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, LineChart } from "@/components/ui/chart";
import { PlusCircle, Download, Search, Users, CalendarCheck2, BarChartHorizontal, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth.tsx';
import { useMembers, MemberWithProfile } from '@/hooks/useMembers';
import { useAttendanceHistory, useAttendanceHistoryWithMemberTypes } from '@/hooks/useAttendance';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import RegisterMemberForm from '@/components/admin/regional/RegisterMemberForm';

const Members: React.FC = () => {
  const navigate = useNavigate();
  const { userRegion } = useAuth();
  const { data: members, isLoading: isLoadingMembers, error: membersError } = useMembers(userRegion?.id);
  const { data: attendanceHistory, isLoading: isLoadingHistory, error: historyError } = useAttendanceHistory(userRegion?.id);
  const { data: attendanceWithTypes, isLoading: isLoadingWithTypes } = useAttendanceHistoryWithMemberTypes(userRegion?.id);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isRegisterDialogOpen, setRegisterDialogOpen] = React.useState(false);

  const filteredMembers = React.useMemo(() => {
    if (!members) return [];
    return members.filter(member => {
      const profile = member.profiles;
      if (!profile) return false;
      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase();
      const email = (profile.email || '').toLowerCase();
      const phone = (profile.phone || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      return fullName.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower);
    });
  }, [members, searchTerm]);

  const totalMembers = members?.filter(m => m.member_type === 'member').length || 0;
  const totalVisitors = members?.filter(m => m.member_type === 'visitor').length || 0;

  // Calculate active members based on attendance (haven't missed last 3 events)
  const activeMembers = React.useMemo(() => {
    if (!attendanceWithTypes || !members) return 0;
    const last3Events = attendanceWithTypes.slice(0, 3);
    if (last3Events.length === 0) return totalMembers;

    return members.filter(member => {
      if (member.member_type !== 'member') return false;
      
      // Count how many of the last 3 events this member attended
      const attendedEvents = last3Events.filter(event => {
        // This is a simplified check - in reality you'd need attendance_records data for each member
        // For now, we'll use a placeholder logic
        return true; // Placeholder - would need actual attendance record lookup
      });
      
      // Member is active if they attended at least 1 of the last 3 events
      return attendedEvents.length > 0;
    }).length;
  }, [attendanceWithTypes, members, totalMembers]);

  // Calculate inactive visitors (missed last 2 events)
  const inactiveVisitors = React.useMemo(() => {
    if (!attendanceWithTypes || !members) return 0;
    const last2Events = attendanceWithTypes.slice(0, 2);
    if (last2Events.length === 0) return 0;

    return members.filter(member => {
      if (member.member_type !== 'visitor') return false;
      
      // Count how many of the last 2 events this visitor attended
      const attendedEvents = last2Events.filter(event => {
        // This is a simplified check - in reality you'd need attendance_records data for each member
        // For now, we'll use a placeholder logic
        return true; // Placeholder - would need actual attendance record lookup
      });
      
      // Visitor is inactive if they missed both of the last 2 events
      return attendedEvents.length === 0;
    }).length;
  }, [attendanceWithTypes, members]);

  const attendanceSummary = React.useMemo(() => {
    if (!attendanceWithTypes || attendanceWithTypes.length === 0) return { avgAttendance: 0, lastEvent: null };
    const totalAttendance = attendanceWithTypes.reduce((sum, event) => sum + event.total_present, 0);
    const avgAttendance = attendanceWithTypes.length > 0 ? (totalAttendance / attendanceWithTypes.length) : 0;
    return {
      avgAttendance: Math.round(avgAttendance),
      lastEvent: attendanceWithTypes[0]
    };
  }, [attendanceWithTypes]);

  const attendanceKPIs = React.useMemo(() => {
    if (!attendanceWithTypes || attendanceWithTypes.length === 0) {
      return {
        totalEvents: 0,
        avgMemberAttendance: 0,
        avgVisitorAttendance: 0,
        avgTotalAttendance: 0,
        highestAttendance: 0,
        attendanceRate: 0
      };
    }

    const totalEvents = attendanceWithTypes.length;
    const totalMemberAttendance = attendanceWithTypes.reduce((sum, event) => sum + event.members_present, 0);
    const totalVisitorAttendance = attendanceWithTypes.reduce((sum, event) => sum + event.visitors_present, 0);
    const totalAttendance = attendanceWithTypes.reduce((sum, event) => sum + event.total_present, 0);
    const highestAttendance = Math.max(...attendanceWithTypes.map(e => e.total_present));
    const totalRegistered = attendanceWithTypes.reduce((sum, event) => sum + event.total_present + event.total_absent, 0);

    return {
      totalEvents,
      avgMemberAttendance: Math.round(totalMemberAttendance / totalEvents),
      avgVisitorAttendance: Math.round(totalVisitorAttendance / totalEvents),
      avgTotalAttendance: Math.round(totalAttendance / totalEvents),
      highestAttendance,
      attendanceRate: totalRegistered > 0 ? Math.round((totalAttendance / totalRegistered) * 100) : 0
    };
  }, [attendanceWithTypes]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'transferred': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Member Management</h2>
            <p className="text-muted-foreground">
              Manage members and view attendance for your region.
            </p>
          </div>
          <Dialog open={isRegisterDialogOpen} onOpenChange={setRegisterDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Register Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Register New Member</DialogTitle>
                <DialogDescription>
                  Fill out the form below to register a new member. An invitation email will be sent to them to complete their account setup.
                </DialogDescription>
              </DialogHeader>
              <RegisterMemberForm onSuccess={() => setRegisterDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalMembers}</div>
                  <p className="text-xs text-muted-foreground">{activeMembers} active</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalVisitors}</div>
                  <p className="text-xs text-muted-foreground">{inactiveVisitors} inactive visitors</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Event Attendance</CardTitle>
                  <CalendarCheck2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{attendanceSummary.avgAttendance}</div>
                   <p className="text-xs text-muted-foreground">
                    {attendanceHistory ? `${attendanceHistory.length} events recorded` : 'No events recorded'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Event Turnout</CardTitle>
                  <BarChartHorizontal className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{attendanceSummary.lastEvent?.total_present || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {attendanceSummary.lastEvent ? `on ${new Date(attendanceSummary.lastEvent.event_date).toLocaleDateString()}` : 'N/A'}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Member List</CardTitle>
                <CardDescription>A list of all members in your region.</CardDescription>
                <div className="flex justify-between items-center pt-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name, email, or phone..." 
                            className="pl-8" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Join Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingMembers ? (
                        <TableRow><TableCell colSpan={6} className="text-center">Loading members...</TableCell></TableRow>
                      ) : membersError ? (
                         <TableRow><TableCell colSpan={6} className="text-center text-red-500">Error loading members.</TableCell></TableRow>
                      ) : filteredMembers.length > 0 ? (
                        filteredMembers.map(member => (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium">
                              {member.profiles?.first_name} {member.profiles?.last_name}
                            </TableCell>
                            <TableCell>{member.profiles?.email || 'N/A'}</TableCell>
                            <TableCell>{member.profiles?.phone || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(member.status || 'new')}>
                                {member.status || 'new'}
                              </Badge>
                            </TableCell>
                            <TableCell>{member.join_date ? new Date(member.join_date).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigate(`/admin/regional/members/${member.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow><TableCell colSpan={6} className="text-center">No members found.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="attendance" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                  <CalendarCheck2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{attendanceKPIs.totalEvents}</div>
                  <p className="text-xs text-muted-foreground">Events recorded</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{attendanceKPIs.avgMemberAttendance}</div>
                  <p className="text-xs text-muted-foreground">Per event</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Visitors</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{attendanceKPIs.avgVisitorAttendance}</div>
                  <p className="text-xs text-muted-foreground">Per event</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Total</CardTitle>
                  <BarChartHorizontal className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{attendanceKPIs.avgTotalAttendance}</div>
                  <p className="text-xs text-muted-foreground">Per event</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Highest</CardTitle>
                  <BarChartHorizontal className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{attendanceKPIs.highestAttendance}</div>
                  <p className="text-xs text-muted-foreground">Single event</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                  <BarChartHorizontal className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{attendanceKPIs.attendanceRate}%</div>
                  <p className="text-xs text-muted-foreground">Overall rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
                <CardDescription>Member and visitor attendance over time with trend lines.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingWithTypes ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <p>Loading attendance data...</p>
                  </div>
                ) : attendanceWithTypes && attendanceWithTypes.length > 0 ? (
                  <div className="h-[400px] w-full">
                    <div className="relative h-full">
                      {/* Bar Chart for Members vs Visitors */}
                      <BarChart
                        data={attendanceWithTypes}
                        index="date"
                        categories={["members_present", "visitors_present"]}
                        colors={["#3b82f6", "#10b981"]}
                        valueFormatter={(value) => `${value}`}
                        className="h-full w-full"
                      />
                      {/* Overlay Line Chart for Trends */}
                      <div className="absolute inset-0 pointer-events-none">
                        <LineChart
                          data={attendanceWithTypes}
                          index="date"
                          categories={["members_present", "visitors_present"]}
                          colors={["#1e40af", "#059669"]}
                          valueFormatter={(value) => `${value}`}
                          className="h-full w-full opacity-80"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center">
                    <p className="text-muted-foreground">No attendance data available.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RegionalAdminLayout>
  );
};

export default Members;
