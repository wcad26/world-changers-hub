import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Users, Calendar as CalendarIcon2, MapPin, Phone, Clock, Edit,
  Wallet, TrendingUp, TrendingDown, Search, CalendarIcon, Download,
  MoreVertical, Eye, UserMinus,
} from "lucide-react";
import { format, subMonths } from "date-fns";
import Papa from "papaparse";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlassSection, GlassKPICard } from "@/components/ui/GlassSection";
import { EditDcgDialog } from "@/components/admin/regional/dcg/EditDcgDialog";

import { useDcgs } from "@/hooks/useDCGs";
import { useDcgMembers, useRemoveMemberFromDcg } from "@/hooks/useDcgMembers";
import { useFinancialTransactions } from "@/hooks/useFinancials";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { useAttendanceHistoryWithMemberTypes } from "@/hooks/useAttendance";
import { useDcgEvents } from "@/hooks/useDcgEvents";
import { formatWithCurrency } from "@/utils/currencyUtils";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const periodOptions = [
  { value: "1-month", label: "1M" },
  { value: "3-months", label: "3M" },
  { value: "6-months", label: "6M" },
  { value: "1-year", label: "1Y" },
  { value: "custom", label: "Custom" },
];

const DcgProfile: React.FC = () => {
  const { dcgId } = useParams<{ dcgId: string }>();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { userRegion } = useAuth();

  // Period filter
  const [quickPeriod, setQuickPeriod] = useState("1-month");
  const [customRange, setCustomRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });

  const dateRange = useMemo(() => {
    const now = new Date();
    let from: Date;
    switch (quickPeriod) {
      case "1-month": from = subMonths(now, 1); break;
      case "3-months": from = subMonths(now, 3); break;
      case "6-months": from = subMonths(now, 6); break;
      case "1-year": from = subMonths(now, 12); break;
      case "custom": return { from: customRange.from, to: customRange.to || now };
      default: from = subMonths(now, 1);
    }
    return { from, to: now };
  }, [quickPeriod, customRange]);

  // Member table filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: dcgs, isLoading: dcgsLoading } = useDcgs();
  const { data: members, isLoading: membersLoading } = useDcgMembers(dcgId || "");
  const { data: transactions, isLoading: financialsLoading } = useFinancialTransactions();
  const { data: currency } = useRegionCurrency(userRegion?.id);
  const { data: attendanceData } = useAttendanceHistoryWithMemberTypes(userRegion?.id);
  const { data: dcgEvents } = useDcgEvents(dcgId);
  const removeMember = useRemoveMemberFromDcg();

  const dcg = dcgs?.find(d => d.id === dcgId);
  const fmt = (amount: number) => formatWithCurrency(amount, currency);

  // Period-filtered transactions
  const dcgTransactions = useMemo(() => {
    const base = (transactions || []).filter(t => t.dcg_id === dcgId);
    return base.filter(t => {
      const d = new Date(t.transaction_date);
      if (dateRange.from && d < dateRange.from) return false;
      if (dateRange.to && d > dateRange.to) return false;
      return true;
    });
  }, [transactions, dcgId, dateRange]);

  const totalIncome = dcgTransactions
    .filter(t => t.category?.type?.toLowerCase() === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = dcgTransactions
    .filter(t => t.category?.type?.toLowerCase() === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);
  const netBalance = totalIncome - totalExpenses;

  // Trend chart data — only attendance for events OWNED by this DCG (events.dcg_id === dcgId).
  // This excludes regional-event submissions, which would otherwise inflate counts beyond the DCG's own membership.
  const trendChartData = useMemo(() => {
    if (!attendanceData) return [];
    const ownedEventIds = new Set((dcgEvents || []).map((e: any) => e.id));
    const scoped = (attendanceData as any[]).filter(
      a => a.source_event_id && ownedEventIds.has(a.source_event_id)
    );
    const filtered = scoped.filter(a => {
      const d = new Date(a.event_date);
      if (dateRange.from && d < dateRange.from) return false;
      if (dateRange.to && d > dateRange.to) return false;
      return true;
    });

    // Group by source event (or by date when source missing) so multiple
    // submissions for the same event collapse into one point.
    const groups = new Map<string, { date: Date; m: number; v: number; c: number }>();
    filtered.forEach(a => {
      const key = a.source_event_id || a.event_date;
      const cur = groups.get(key) || { date: new Date(a.event_date), m: 0, v: 0, c: 0 };
      cur.m += a.members_present || 0;
      cur.v += a.visitors_present || 0;
      cur.c += a.children_present || 0;
      groups.set(key, cur);
    });

    return Array.from(groups.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(g => ({
        date: format(g.date, "MMM d"),
        Members: g.m,
        "Regular Visitors": g.v,
        Children: g.c,
      }));
  }, [attendanceData, dcgEvents, dateRange]);

  // Member table filtering — must run before any early return to keep hook order stable.
  const filteredMembers = useMemo(() => {
    const active = (members || []).filter(m => m.is_active);
    return active.filter(m => {
      const p = m.members?.profiles;
      const fullName = `${p?.last_name || ""} ${p?.first_name || ""}`.toLowerCase();
      const email = (p?.email || "").toLowerCase();
      const phone = (p?.phone || "").toLowerCase();
      const q = searchTerm.toLowerCase();
      const searchMatch = !q || fullName.includes(q) || email.includes(q) || phone.includes(q);
      const statusMatch = statusFilter === "all" || m.members?.status === statusFilter;
      const roleMatch = roleFilter === "all" || m.role === roleFilter;
      return searchMatch && statusMatch && roleMatch;
    });
  }, [members, searchTerm, statusFilter, roleFilter]);

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
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getLeaderName = (d: any): string => {
    if (!d.leader || !d.leader.profiles) return "No leader assigned";
    const p = d.leader.profiles;
    return `${p.last_name || ""} ${p.first_name || ""}`.trim() || "Unknown leader";
  };

  const activeMembers = (members || []).filter(m => m.is_active);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "completed": return "bg-blue-100 text-blue-800 border-blue-200";
      case "transferred": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "inactive": return "bg-gray-100 text-gray-800 border-gray-200";
      case "new": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleExport = () => {
    if (filteredMembers.length === 0) {
      toast.error("No members to export");
      return;
    }
    const data = filteredMembers.map(m => ({
      "Member ID": m.members?.member_id || "",
      Name: `${m.members?.profiles?.last_name || ""} ${m.members?.profiles?.first_name || ""}`.trim(),
      Email: m.members?.profiles?.email || "",
      Phone: m.members?.profiles?.phone || "",
      Address: m.members?.profiles?.address || "",
      "DCG Role": m.role,
      Status: m.members?.status || "",
      "Joined Date": m.joined_date ? new Date(m.joined_date).toLocaleDateString() : "",
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `dcg-members-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredMembers.length} members`);
  };

  const handleRemove = async (dcgMemberId: string) => {
    if (!dcgId) return;
    await removeMember.mutateAsync({ dcgMemberId, dcgId });
  };

  const metaItems = [
    { icon: Users, label: "Leader", value: getLeaderName(dcg) },
    { icon: MapPin, label: "Location", value: dcg.location || "Not set" },
    { icon: CalendarIcon2, label: "Meeting Day", value: dcg.meeting_day || "Not set" },
    { icon: Clock, label: "Time", value: formatMeetingTime(dcg.meeting_time) },
    ...(dcg.contact_phone ? [{ icon: Phone, label: "Contact", value: dcg.contact_phone }] : []),
  ];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      {/* Header */}
      <GlassSection className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">{dcg.name}</h1>
              {dcg.description && (
                <p className="text-muted-foreground mt-2 max-w-2xl">{dcg.description}</p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
              {/* Period filter */}
              <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1">
                {periodOptions.map(opt => (
                  <Button
                    key={opt.value}
                    variant={quickPeriod === opt.value ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setQuickPeriod(opt.value)}
                    className={cn(
                      "h-8 px-3 rounded-lg text-xs",
                      quickPeriod === opt.value && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              {quickPeriod === "custom" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-2">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {customRange.from
                        ? `${format(customRange.from, "MMM d")}${customRange.to ? ` - ${format(customRange.to, "MMM d, y")}` : ""}`
                        : "Pick dates"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                    <Calendar
                      mode="range"
                      selected={{ from: customRange.from, to: customRange.to }}
                      onSelect={(range) => setCustomRange({ from: range?.from, to: range?.to })}
                      numberOfMonths={2}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              )}
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

      {/* Attendance Trend (DCG-scoped, dashboard look) */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
        <h3 className="text-base font-semibold mb-4 text-foreground">Attendance Trend</h3>
        {trendChartData.some(p => p.Members + p["Regular Visitors"] + p.Children > 0) ? (
          <ResponsiveContainer width="100%" height={380}>
            <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="dcgGradMembers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="dcgGradVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="dcgGradChildren" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const total = payload.reduce((sum, p: any) => sum + (Number(p.value) || 0), 0);
                  return (
                    <div style={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                      padding: "8px 12px",
                      boxShadow: "0 4px 12px hsl(var(--foreground) / 0.08)",
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: 4, color: "hsl(var(--foreground))" }}>{label}</div>
                      {payload.map((p: any) => (
                        <div key={p.dataKey} style={{ color: p.color }}>
                          {p.dataKey} : {p.value}
                        </div>
                      ))}
                      <div style={{
                        marginTop: 6, paddingTop: 6,
                        borderTop: "1px solid hsl(var(--border))",
                        fontWeight: 600, color: "hsl(var(--foreground))",
                      }}>
                        Total : {total}
                      </div>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="Members" stroke="hsl(var(--chart-1))" fill="url(#dcgGradMembers)" strokeWidth={2.5} dot={false} />
              <Area type="monotone" dataKey="Regular Visitors" stroke="hsl(var(--chart-2))" fill="url(#dcgGradVisitors)" strokeWidth={2.5} dot={false} />
              <Area type="monotone" dataKey="Children" stroke="hsl(var(--chart-4))" fill="url(#dcgGradChildren)" strokeWidth={2.5} dot={false} />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[380px] flex items-center justify-center text-muted-foreground text-sm">
            No attendance data for the selected period
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
        </TabsList>

        {/* Members tab — table styled like Member Directory */}
        <TabsContent value="members" className="space-y-4 mt-4">
          <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">DCG Members</h2>
                  <p className="text-sm text-muted-foreground">All active members in this DCG</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 items-stretch sm:items-center mb-4">
              <div className="relative flex-1 sm:min-w-[250px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  className="pl-9 bg-background/60"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-background/60">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-background/60">
                  <SelectValue placeholder="Filter by Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Leader">Leader</SelectItem>
                  <SelectItem value="Assistant">Assistant</SelectItem>
                  <SelectItem value="Member">Member</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Export ({filteredMembers.length})
              </Button>
            </div>

            <div className="rounded-xl border border-border/40 overflow-hidden -mx-2 sm:mx-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-[20%]">Name</TableHead>
                      <TableHead className="hidden md:table-cell w-[20%]">Address</TableHead>
                      <TableHead className="hidden sm:table-cell">Phone</TableHead>
                      <TableHead>DCG Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {membersLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 7 }).map((_, j) => (
                            <TableCell key={j}><div className="animate-pulse rounded-lg bg-muted h-5 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filteredMembers.length > 0 ? (
                      filteredMembers.map(m => {
                        const p = m.members?.profiles;
                        const memberId = m.members?.id;
                        return (
                          <TableRow
                            key={m.id}
                            className="cursor-pointer hover:bg-muted/20 transition-colors"
                            onClick={() => memberId && navigate(`/admin/regional/members/${memberId}`)}
                          >
                            <TableCell className="font-medium">
                              {p?.last_name} {p?.first_name}
                            </TableCell>
                            <TableCell className="hidden md:table-cell max-w-xs truncate">{p?.address || "N/A"}</TableCell>
                            <TableCell className="hidden sm:table-cell">{p?.phone || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{m.role}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(m.members?.status || "new")}>
                                {m.members?.status || "new"}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {m.joined_date ? new Date(m.joined_date).toLocaleDateString() : "N/A"}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => memberId && navigate(`/admin/regional/members/${memberId}`)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" /> View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleRemove(m.id)}
                                  >
                                    <UserMinus className="h-4 w-4 mr-2" /> Remove from DCG
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No members found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="financials" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {financialsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : dcgTransactions.length > 0 ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="hidden md:table-cell">Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...dcgTransactions]
                        .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
                        .map((transaction) => {
                          const type = transaction.category?.type?.toLowerCase();
                          const isIncome = type === "income";
                          return (
                            <TableRow key={transaction.id}>
                              <TableCell className="whitespace-nowrap">
                                {format(new Date(transaction.transaction_date), "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell className="font-medium">{transaction.category?.name || "—"}</TableCell>
                              <TableCell className="hidden md:table-cell text-muted-foreground">
                                {transaction.description || "—"}
                              </TableCell>
                              <TableCell>
                                <Badge variant={isIncome ? "default" : "secondary"}>
                                  {transaction.category?.type || "—"}
                                </Badge>
                              </TableCell>
                              <TableCell className={`text-right whitespace-nowrap font-medium ${isIncome ? "text-primary" : "text-destructive"}`}>
                                {isIncome ? "+" : "-"}{fmt(Number(transaction.amount))}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground py-8 text-center">No financial transactions in selected period</p>
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
