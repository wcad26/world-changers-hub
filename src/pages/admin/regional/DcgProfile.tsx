import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Calendar, MapPin, Phone, Clock, Edit, DollarSign, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useDcgs } from "@/hooks/useDCGs";
import { useDcgMembers } from "@/hooks/useDcgMembers";
import { useFinancialTransactions } from "@/hooks/useFinancials";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { formatWithCurrency } from "@/utils/currencyUtils";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EditDcgDialog } from "@/components/admin/regional/dcg/EditDcgDialog";
import DcgAttendanceTrendChart from "@/components/admin/regional/dashboard/tabs/DcgAttendanceTrendChart";
import { GlassSection, GlassKPICard } from "@/components/ui/GlassSection";

const DcgProfile: React.FC = () => {
  const { dcgId } = useParams<{ dcgId: string }>();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { userRegion } = useAuth();

  const { data: dcgs, isLoading: dcgsLoading } = useDcgs();
  const { data: members, isLoading: membersLoading } = useDcgMembers(dcgId || "");
  const { data: transactions, isLoading: financialsLoading } = useFinancialTransactions();
  const { data: currency } = useRegionCurrency(userRegion?.id);

  const dcg = dcgs?.find(d => d.id === dcgId);
  const dcgTransactions = transactions?.filter(t => t.dcg_id === dcgId) || [];

  const fmt = (amount: number) => formatWithCurrency(amount, currency);

  if (dcgsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!dcg) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Alert>
          <AlertDescription>DCG not found</AlertDescription>
        </Alert>
      </div>
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
  const netBalance = totalIncome - totalExpenses;

  const metaItems = [
    { icon: Users, label: "Leader", value: getLeaderName(dcg) },
    { icon: MapPin, label: "Location", value: dcg.location || "Not set" },
    { icon: Calendar, label: "Meeting Day", value: dcg.meeting_day || "Not set" },
    { icon: Clock, label: "Time", value: formatMeetingTime(dcg.meeting_time) },
    ...(dcg.contact_phone ? [{ icon: Phone, label: "Contact", value: dcg.contact_phone }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      {/* Modern glass header */}
      <GlassSection className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">{dcg.name}</h1>
              {dcg.description && (
                <p className="text-muted-foreground mt-2 max-w-2xl">{dcg.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Location
              </Button>
              <Badge variant={dcg.is_active ? "default" : "secondary"}>
                {dcg.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {metaItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/50 px-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium text-foreground truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassSection>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassKPICard icon={<Users className="h-4 w-4" />} label="Total Members" value={activeMembers.length} />
        <GlassKPICard icon={<TrendingUp className="h-4 w-4" />} label="Total Income" value={fmt(totalIncome)} />
        <GlassKPICard icon={<TrendingDown className="h-4 w-4" />} label="Total Expenses" value={fmt(totalExpenses)} />
        <GlassKPICard icon={<Wallet className="h-4 w-4" />} label="Net Balance" value={fmt(netBalance)} subtitle={netBalance >= 0 ? "Positive balance" : "Deficit"} />
      </div>

      {/* DCG-scoped attendance trend */}
      <DcgAttendanceTrendChart dcgId={dcgId} />

      {/* Tabs: Members | Financials */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4 mt-4">
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
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card/40 hover:bg-card/60 transition-colors">
                      <div className="min-w-0">
                        <p className="font-medium truncate">
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

        <TabsContent value="financials" className="space-y-4 mt-4">
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
                  {dcgTransactions.slice(0, 10).map((transaction) => {
                    const isIncome = transaction.category?.type?.toLowerCase() === 'income';
                    return (
                      <div key={transaction.id} className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card/40 hover:bg-card/60 transition-colors">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{transaction.category?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.transaction_date).toLocaleDateString()}
                            {transaction.description && ` • ${transaction.description}`}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-medium ${isIncome ? 'text-primary' : 'text-destructive'}`}>
                            {isIncome ? '+' : '-'}{fmt(Number(transaction.amount))}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {transaction.category?.type}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No financial transactions found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditDcgDialog
        open={isEditDialogOpen}
        setOpen={setIsEditDialogOpen}
        dcg={dcg}
      />
    </div>
  );
};

export default DcgProfile;
