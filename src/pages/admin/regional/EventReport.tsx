import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Users, UserCheck, UserPlus, Search, AlertCircle, Calendar, MapPin, Target, TrendingUp, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEventReport, EventAttendeeWithDetails } from "@/hooks/useEventReport";
import { format } from "date-fns";

const EventReport: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { userRegion, loading: authLoading } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [joinInterestFilter, setJoinInterestFilter] = useState<string>("all");
  const [memberTypeFilter, setMemberTypeFilter] = useState<string>("all");

  const { data: reportData, isLoading, error } = useEventReport(eventId, userRegion?.id);

  const filteredAttendees = useMemo(() => {
    if (!reportData?.attendees) return [];
    
    return reportData.attendees.filter(attendee => {
      const profile = attendee.member?.profile;
      const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.toLowerCase();
      const email = profile?.email?.toLowerCase() || '';
      const memberId = attendee.member?.member_id?.toLowerCase() || '';
      
      // Search filter
      const matchesSearch = searchTerm === "" || 
        fullName.includes(searchTerm.toLowerCase()) ||
        email.includes(searchTerm.toLowerCase()) ||
        memberId.includes(searchTerm.toLowerCase());
      
      // Gender filter
      const matchesGender = genderFilter === "all" || 
        profile?.gender?.toLowerCase() === genderFilter.toLowerCase();
      
      // Join interest filter
      const joinInterest = attendee.member?.join_interest || 'not_specified';
      const matchesJoinInterest = joinInterestFilter === "all" || 
        joinInterest === joinInterestFilter;
      
      // Member type filter
      const memberType = attendee.member?.member_type || '';
      const matchesMemberType = memberTypeFilter === "all" || 
        memberType === memberTypeFilter;
      
      return matchesSearch && matchesGender && matchesJoinInterest && matchesMemberType;
    });
  }, [reportData?.attendees, searchTerm, genderFilter, joinInterestFilter, memberTypeFilter]);

  const getJoinInterestBadge = (joinInterest: string | null | undefined) => {
    switch (joinInterest) {
      case 'yes':
        return <Badge className="bg-primary hover:bg-primary/90">Yes - Wants to Join</Badge>;
      case 'no':
        return <Badge variant="destructive">No</Badge>;
      case 'undecided':
        return <Badge variant="secondary">Undecided</Badge>;
      default:
        return <Badge variant="outline">Not Specified</Badge>;
    }
  };

  const exportToCSV = () => {
    if (!filteredAttendees.length) return;
    
    const headers = ['Name', 'Email', 'Phone', 'Gender', 'Member Type', 'Member ID', 'Join Interest'];
    const rows = filteredAttendees.map(a => [
      `${a.member?.profile?.last_name || ''} ${a.member?.profile?.first_name || ''}`.trim(),
      a.member?.profile?.email || '',
      a.member?.profile?.phone || '',
      a.member?.profile?.gender || '',
      a.member?.member_type || '',
      a.member?.member_id || '',
      a.member?.join_interest || 'not_specified',
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `event-report-${reportData?.event?.name || eventId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || !userRegion) {
    return (
      <>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading report</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "An unknown error occurred."}
          </AlertDescription>
        </Alert>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/regional/events')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Event Report</h1>
            {reportData?.event && (
              <p className="text-muted-foreground">{reportData.event.name}</p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Event Details */}
            {reportData?.event && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">{reportData.event.name}</CardTitle>
                  <CardDescription className="flex flex-wrap gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(reportData.event.start_datetime), 'PPP p')}
                    </span>
                    {reportData.event.location_name && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {reportData.event.location_name}
                      </span>
                    )}
                    {reportData.event.category && (
                      <Badge variant="outline">{reportData.event.category}</Badge>
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Attendees</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-3xl font-bold">{reportData?.stats.totalAttendees || 0}</span>
                  </div>
                  {reportData?.event?.attendance_target && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Target: {reportData.event.attendance_target} ({reportData.stats.attendanceRate.toFixed(0)}%)
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Members vs Visitors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-primary" />
                      <span className="text-xl font-bold">{reportData?.stats.members || 0}</span>
                      <span className="text-sm text-muted-foreground">Members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-accent-foreground" />
                      <span className="text-xl font-bold">{reportData?.stats.visitors || 0}</span>
                      <span className="text-sm text-muted-foreground">Visitors</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Gender Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-xl font-bold">{reportData?.stats.maleCount || 0}</span>
                      <span className="text-sm text-muted-foreground ml-1">Male</span>
                    </div>
                    <div>
                      <span className="text-xl font-bold">{reportData?.stats.femaleCount || 0}</span>
                      <span className="text-sm text-muted-foreground ml-1">Female</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Join Interest (Visitors)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">{reportData?.stats.wantToJoin || 0} Yes</Badge>
                    <Badge variant="destructive">{reportData?.stats.notWantToJoin || 0} No</Badge>
                    <Badge variant="secondary">{reportData?.stats.undecided || 0} Undecided</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Participants Table */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <CardTitle>Participants</CardTitle>
                    <CardDescription>
                      {filteredAttendees.length} of {reportData?.attendees.length || 0} participants shown
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={exportToCSV} disabled={!filteredAttendees.length}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
                
                {/* Filters */}
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mt-4">
                  <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search by name, email, or member ID..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={memberTypeFilter} onValueChange={setMemberTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Member Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="member">Members</SelectItem>
                      <SelectItem value="visitor">Visitors</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={genderFilter} onValueChange={setGenderFilter}>
                    <SelectTrigger className="w-full sm:w-[130px]">
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genders</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={joinInterestFilter} onValueChange={setJoinInterestFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Join Interest" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Interests</SelectItem>
                      <SelectItem value="yes">Wants to Join</SelectItem>
                      <SelectItem value="no">Doesn't Want to Join</SelectItem>
                      <SelectItem value="undecided">Undecided</SelectItem>
                      <SelectItem value="not_specified">Not Specified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {filteredAttendees.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No participants found matching your filters.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Gender</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Member ID</TableHead>
                          <TableHead>Join Interest</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAttendees.map((attendee) => (
                          <TableRow key={attendee.id || attendee.member_id}>
                            <TableCell className="font-medium">
                              {attendee.member?.profile?.last_name} {attendee.member?.profile?.first_name}
                            </TableCell>
                            <TableCell>{attendee.member?.profile?.email || '-'}</TableCell>
                            <TableCell>{attendee.member?.profile?.phone || '-'}</TableCell>
                            <TableCell className="capitalize">
                              {attendee.member?.profile?.gender || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={attendee.member?.member_type === 'visitor' ? 'secondary' : 'default'}>
                                {attendee.member?.member_type === 'visitor' ? 'Visitor' : 'Member'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {attendee.member?.member_id || '-'}
                            </TableCell>
                            <TableCell>
                              {getJoinInterestBadge(attendee.member?.join_interest)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
};

export default EventReport;
