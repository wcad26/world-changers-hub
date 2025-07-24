import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Calendar, MapPin, Phone, Clock, Edit } from "lucide-react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useDcgs } from "@/hooks/useDCGs";
import { useDcgMembers } from "@/hooks/useDcgMembers";
import { useFinancialTransactions } from "@/hooks/useFinancials";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EditDcgDialog } from "@/components/admin/regional/dcg/EditDcgDialog";

const DcgProfile: React.FC = () => {
  const { dcgId } = useParams<{ dcgId: string }>();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const { data: dcgs, isLoading: dcgsLoading } = useDcgs();
  const { data: members, isLoading: membersLoading } = useDcgMembers(dcgId || "");
  const { data: transactions, isLoading: financialsLoading } = useFinancialTransactions();

  const dcg = dcgs?.find(d => d.id === dcgId);
  const dcgTransactions = transactions?.filter(t => t.dcg_id === dcgId) || [];

  if (dcgsLoading) {
    return (
      <RegionalAdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </RegionalAdminLayout>
    );
  }

  if (!dcg) {
    return (
      <RegionalAdminLayout>
        <Alert>
          <AlertDescription>DCG not found</AlertDescription>
        </Alert>
      </RegionalAdminLayout>
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
    return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Unknown leader";
  };

  const activeMembers = members?.filter(m => m.is_active) || [];
  const totalIncome = dcgTransactions
    .filter(t => t.category?.type === 'Income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = dcgTransactions
    .filter(t => t.category?.type === 'Expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/regional/dcg")}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2 text-primary" />
            Back to DCG Management
          </Button>
        </div>

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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditDialogOpen(true)}
                  >
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
                  <MapPin className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">Location:</span>
                  <span className="text-sm">{dcg.location || "Not set"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-secondary" />
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
                    <Phone className="h-4 w-4 text-accent" />
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
                <div className="h-4 w-4 text-secondary font-bold">₦</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{totalIncome.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <div className="h-4 w-4 text-accent font-bold">₦</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{totalExpenses.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
                <div className="h-4 w-4 text-primary font-bold">₦</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{(totalIncome - totalExpenses).toLocaleString()}</div>
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
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : activeMembers.length > 0 ? (
                    <div className="space-y-2">
                      {activeMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">
                              {member.members?.profiles?.first_name} {member.members?.profiles?.last_name}
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
              <Card>
                <CardHeader>
                  <CardTitle>Recent Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Attendance tracking coming soon</p>
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
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
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
                              transaction.category?.type === 'Income' 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {transaction.category?.type === 'Income' ? '+' : '-'}
                              ₦{Number(transaction.amount).toLocaleString()}
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
        
        {/* Edit DCG Dialog */}
        <EditDcgDialog
          open={isEditDialogOpen}
          setOpen={setIsEditDialogOpen}
          dcg={dcg}
        />
      </div>
    </RegionalAdminLayout>
  );
};

export default DcgProfile;