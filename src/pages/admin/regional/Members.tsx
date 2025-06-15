
import React from 'react';
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, LineChart } from "@/components/ui/chart";
import { PlusCircle, Download, Search, Users, CalendarCheck2, BarChartHorizontal } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth.tsx';
import { useMembers, MemberWithProfile } from '@/hooks/useMembers';
import { useAttendanceHistory } from '@/hooks/useAttendance';
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
import RegisterMemberForm from '@/components/admin/regional/RegisterMemberForm';

const Members: React.FC = () => {
  const { userRegion } = useAuth();
  const { data: members, isLoading: isLoadingMembers, error: membersError } = useMembers(userRegion?.id);
  const { data: attendanceHistory, isLoading: isLoadingHistory, error: historyError } = useAttendanceHistory(userRegion?.id);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isRegisterDialogOpen, setRegisterDialogOpen] = React.useState(false);

  const filteredMembers = React.useMemo(() => {
    if (!members) return [];
    return members.filter(member => {
      const profile = member.profiles;
      if (!profile) return false;
      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
  }, [members, searchTerm]);

  const totalMembers = members?.length || 0;
  const activeMembers = members?.filter(m => m.status === 'active').length || 0;

  const attendanceSummary = React.useMemo(() => {
    if (!attendanceHistory || attendanceHistory.length === 0) return { avgAttendance: 0, lastEvent: null };
    const totalPresent = attendanceHistory.reduce((sum, event) => sum + (event.present_count || 0), 0);
    const avgAttendance = totalMembers > 0 ? (totalPresent / attendanceHistory.length) : 0;
    return {
      avgAttendance: Math.round(avgAttendance),
      lastEvent: attendanceHistory[0]
    };
  }, [attendanceHistory, totalMembers]);

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
            <DialogContent className="sm:max-w-[625px]">
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
            <div className="grid gap-4 md:grid-cols-3">
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
                  <div className="text-2xl font-bold">{attendanceSummary.lastEvent?.present_count || 0}</div>
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
                            placeholder="Search by name..." 
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingMembers ? (
                        <TableRow><TableCell colSpan={5} className="text-center">Loading members...</TableCell></TableRow>
                      ) : membersError ? (
                         <TableRow><TableCell colSpan={5} className="text-center text-red-500">Error loading members.</TableCell></TableRow>
                      ) : filteredMembers.length > 0 ? (
                        filteredMembers.map(member => (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium">{member.profiles?.first_name} {member.profiles?.last_name}</TableCell>
                            <TableCell>{member.profiles?.email}</TableCell>
                            <TableCell>{member.profiles?.phone || 'N/A'}</TableCell>
                            <TableCell>{member.status}</TableCell>
                            <TableCell>{member.join_date ? new Date(member.join_date).toLocaleDateString() : 'N/A'}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow><TableCell colSpan={5} className="text-center">No members found.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="attendance">
             <Card>
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
                <CardDescription>Summary of attendance for past events.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 {isLoadingHistory ? (
                  <p>Loading history...</p>
                ) : historyError ? (
                  <p className="text-red-500">Error loading attendance history.</p>
                ) : attendanceHistory && attendanceHistory.length > 0 ? (
                  <div className="h-[300px]">
                    <BarChart
                      data={attendanceHistory.map(e => ({...e, date: new Date(e.event_date).toLocaleDateString()}))}
                      index="date"
                      categories={["present_count", "absent_count"]}
                      colors={["#10b981", "#f43f5e"]}
                      valueFormatter={(value) => `${value} members`}
                      className="h-full"
                    />
                  </div>
                ) : (
                  <p>No attendance history found.</p>
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
