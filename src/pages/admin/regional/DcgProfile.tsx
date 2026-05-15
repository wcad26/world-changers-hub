import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Calendar, MapPin, Phone, Clock, Edit, DollarSign, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDcgs } from "@/hooks/useDCGs";
import { useDcgMembers } from "@/hooks/useDcgMembers";
import { useFinancialTransactions } from "@/hooks/useFinancials";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { formatWithCurrency } from "@/utils/currencyUtils";
import { useDcgAttendanceHistory } from "@/hooks/useDcgAttendance";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EditDcgDialog } from "@/components/admin/regional/dcg/EditDcgDialog";
import DcgAttendanceTrendChart from "@/components/admin/regional/dashboard/tabs/DcgAttendanceTrendChart";

const DcgProfile: React.FC = () => {
  const { dcgId } = useParams<{ dcgId: string }>();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { userRegion } = useAuth();
  
  const { data: dcgs, isLoading: dcgsLoading } = useDcgs();
  const { data: members, isLoading: membersLoading } = useDcgMembers(dcgId || "");
  const { data: transactions, isLoading: financialsLoading } = useFinancialTransactions();
  const { data: currency } = useRegionCurrency(userRegion?.id);
  const { data: attendanceHistory, isLoading: attLoading } = useDcgAttendanceHistory(dcgId || undefined);

  const dcg = dcgs?.find(d => d.id === dcgId);
  const dcgTransactions = transactions?.filter(t => t.dcg_id === dcgId) || [];

  const fmt = (amount: number) => formatWithCurrency(amount, currency);

  if (dcgsLoading) {
    return (
      <>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </>
    );
  }

  if (!dcg) {
    return (
      <>
        <Alert>
          <AlertDescription>DCG not found</AlertDescription>
        </Alert>
      </>
    );
  }

  const formatMeetingTime = (time: string | null): string => {
    if (!time) return "Not set";
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getLeaderName = (dcg: any): string => {
    if (!dcg.leader || !dcg.leader.profiles) return "No leader assigned";
    const profile = dcg.leader.profiles;
    return `${profile.last_name || ""} ${profile.first_name || ""}`.trim() || "Unknown leader";
  };

  const activeMembers = members?.filter(m => m.is_active) || [];
  const totalIncome = dcgTransactions
    .filter(t => t.category?.type?.toLowerCase() === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = dcgTransactions
    .filter(t => t.category?.type?.toLowerCase() === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <>
      <div className="space-y-6">

        <div className="grid gap-6">
          {/* DCG Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{dcg.name}</CardTitle>
                  <p className="text-muted-foreground mt-2">{dcg.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Location
                  </Button>
                  <Badge variant={dcg.is_active ? "default" : "secondary"}>
                    {dcg.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Leader:</span>
                  <span className="text-sm">{getLeaderName(dcg)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Location:</span>
                  <span className="text-sm">{dcg.location || "Not set"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Meeting Day:</span>
                  <span className="text-sm">{dcg.meeting_day || "Not set"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Time:</span>
                  <span className="text-sm">{formatMeetingTime(dcg.meeting_time)}</span>
                </div>
                {dcg.contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Contact:</span>
                    <span className="text-sm">{dcg.contact_phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeMembers.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{fmt(totalIncome)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{fmt(totalExpenses)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(totalIncome - totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {fmt(totalIncome - totalExpenses)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Tabs */}
          <Tabs defaultValue="members" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>DCG Members</CardTitle>
                </CardHeader>
                <CardContent>
                  {membersLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                  ) : activeMembers.length > 0 ? (
                    <div className="space-y-2">
                      {activeMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">
                              {member.members?.profiles?.last_name} {member.members?.profiles?.first_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Role: {member.role} • Joined: {new Date(member.joined_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="outline">{member.role}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No members found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-4">
              <DcgAttendanceTrendChart dcgId={dcgId} />
              <Card>
                <CardHeader>
                  <CardTitle>Recent Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  {attLoading ? (
                    <Skeleton className="h-48 w-full" />
                  ) : attendanceHistory && attendanceHistory.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Present</TableHead>
                          <TableHead className="text-right">Absent</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceHistory.slice(0, 10).map(r => {
                          const total = r.total_present + r.total_absent;
                          const rate = total > 0 ? (r.total_present / total) * 100 : 0;
                          return (
                            <TableRow key={r.event_id}>
                              <TableCell className="font-medium">{r.event_name}</TableCell>
                              <TableCell>{new Date(r.event_date).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right">{r.total_present}</TableCell>
                              <TableCell className="text-right">{r.total_absent}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant={rate >= 70 ? 'default' : 'secondary'}>{rate.toFixed(0)}%</Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground">No attendance events recorded yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financials" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {financialsLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                  ) : dcgTransactions.length > 0 ? (
                    <div className="space-y-2">
                      {dcgTransactions.slice(0, 10).map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{transaction.category?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(transaction.transaction_date).toLocaleDateString()}
                              {transaction.description && ` • ${transaction.description}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${
                              transaction.category?.type?.toLowerCase() === 'income' 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {transaction.category?.type?.toLowerCase() === 'income' ? '+' : '-'}
                              {fmt(Number(transaction.amount))}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {transaction.category?.type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No financial transactions found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <EditDcgDialog
          open={isEditDialogOpen}
          setOpen={setIsEditDialogOpen}
          dcg={dcg}
        />
      </div>
    </>
  );
};

export default DcgProfile;
