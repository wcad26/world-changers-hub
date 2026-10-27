import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "@/lib/router-compat";
import {
  ArrowLeft, Users, Calendar as CalendarIcon2, MapPin, Phone, Clock, Edit,
  Wallet, TrendingUp, TrendingDown, CalendarIcon, Download,
  MoreVertical, Eye, UserMinus,
} from "lucide-react";
import { format, subMonths } from "date-fns";
import Papa from "papaparse";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditDcgDialog } from "@/components/admin/regional/dcg/EditDcgDialog";
import {
  HeroCard, RingTile, SearchBar, RoundButton, ChipRow, Initials, StatusPill, TypePill, InfoRow,
} from "@/components/admin/regional/RegionalUI";

import { useDcgs } from "@/hooks/useDCGs";
import { useDcgMembers, useRemoveMemberFromDcg } from "@/hooks/useDcgMembers";
import { useFinancialTransactions } from "@/hooks/useFinancials";

import { useRegionCurrency } from "@/hooks/useCurrencies";
import { useAttendanceHistoryWithMemberTypes } from "@/hooks/useAttendance";
import { useDcgEvents } from "@/hooks/useDcgEvents";
import { formatWithCurrency } from "@/utils/currencyUtils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type PeriodValue = "1-month" | "3-months" | "6-months" | "1-year" | "custom";

const periodOptions: { value: PeriodValue; label: string }[] = [
  { value: "1-month", label: "1 month" },
  { value: "3-months", label: "3 months" },
  { value: "6-months", label: "6 months" },
  { value: "1-year", label: "1 year" },
  { value: "custom", label: "Custom" },
];

const DcgProfile: React.FC = () => {
  const { dcgId } = useParams<{ dcgId: string }>();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { userRegion } = useAuth();

  // Period filter
  const [quickPeriod, setQuickPeriod] = useState<PeriodValue>("1-month");
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
  const { data: transactions } = useFinancialTransactions();
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

  // Member filtering — must run before any early return to keep hook order stable.
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
        <RoundButton icon={ArrowLeft} label="Back" onClick={() => navigate(-1)} />
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

  // Latest gathering fill rate: most recent total attendance vs active membership.
  const latestPoint = trendChartData[trendChartData.length - 1];
  const latestTotal = latestPoint ? latestPoint.Members + latestPoint["Regular Visitors"] + latestPoint.Children : 0;
  const fillRate = activeMembers.length > 0 ? Math.min(100, (latestTotal / activeMembers.length) * 100) : 0;

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

  const memberMenu = (m: any) => {
    const memberId = m.members?.id;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Member actions"
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-50 border bg-popover shadow-md">
          <DropdownMenuItem onClick={() => memberId && navigate(`/admin/regional/members/${memberId}`)}>
            <Eye className="mr-2 h-4 w-4" /> View
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleRemove(m.id)}>
            <UserMinus className="mr-2 h-4 w-4" /> Remove from DCG
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center gap-2">
        <RoundButton icon={ArrowLeft} label="Back" onClick={() => navigate(-1)} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{dcg.name}</p>
          <p className="truncate text-xs text-muted-foreground">{dcg.location || "No location set"}</p>
        </div>
        <StatusPill status={dcg.is_active ? "active" : "inactive"} />
        <RoundButton icon={Edit} label="Edit DCG" onClick={() => setIsEditDialogOpen(true)} />
      </div>

      {/* Period filter */}
      <ChipRow<PeriodValue> value={quickPeriod} onChange={setQuickPeriod} options={periodOptions} />
      {quickPeriod === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-sm text-foreground transition hover:bg-muted sm:w-auto"
            >
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              {customRange.from
                ? `${format(customRange.from, "MMM d")}${customRange.to ? ` - ${format(customRange.to, "MMM d, y")}` : ""}`
                : "Pick dates"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto bg-popover p-0 z-50" align="start">
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

      {/* Hero summary */}
      <HeroCard
        eyebrow={`${dcg.meeting_day || "Weekly"} · ${formatMeetingTime(dcg.meeting_time)}`}
        value={activeMembers.length}
        sub={`members · led by ${getLeaderName(dcg)}`}
        ring={fillRate}
        ringLabel="Last gathering"
      />

      {/* Group details */}
      <section className="rounded-3xl border border-border bg-card p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow icon={Users} label="Leader" value={getLeaderName(dcg)} />
          <InfoRow icon={MapPin} label="Location" value={dcg.location || "Not set"} />
          <InfoRow icon={CalendarIcon2} label="Meeting day" value={dcg.meeting_day || "Not set"} />
          <InfoRow icon={Clock} label="Time" value={formatMeetingTime(dcg.meeting_time)} />
          {dcg.contact_phone && <InfoRow icon={Phone} label="Contact" value={dcg.contact_phone} />}
        </div>
        {dcg.description && (
          <p className="mt-2 border-t border-border/60 pt-3 text-sm text-muted-foreground">{dcg.description}</p>
        )}
      </section>

      {/* Financial KPI tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <RingTile icon={Users} label="Members" value={activeMembers.length} ring={fillRate} tone="var(--chart-1)" />
        <RingTile icon={TrendingUp} label="Income" value={fmt(totalIncome)} tone="var(--chart-2)" />
        <RingTile icon={TrendingDown} label="Expenses" value={fmt(totalExpenses)} tone="var(--chart-4)" />
        <RingTile
          icon={Wallet}
          label="Net balance"
          value={fmt(netBalance)}
          tone={netBalance >= 0 ? "var(--chart-3)" : "var(--destructive)"}
        />
      </div>

      {/* Attendance trend */}
      <section className="rounded-3xl border border-border bg-card p-4 sm:p-6">
        <h3 className="mb-4 font-heading text-base font-semibold text-foreground">Attendance trend</h3>
        {trendChartData.some(p => p.Members + p["Regular Visitors"] + p.Children > 0) ? (
          <div className="h-[260px] sm:h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dcgGradMembers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dcgGradVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dcgGradChildren" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const total = payload.reduce((sum, p: any) => sum + (Number(p.value) || 0), 0);
                    return (
                      <div style={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        fontSize: "12px",
                        padding: "8px 12px",
                        boxShadow: "0 4px 12px color-mix(in oklab, var(--foreground) calc(0.08 * 100%), transparent)",
                      }}>
                        <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--foreground)" }}>{label}</div>
                        {payload.map((p: any) => (
                          <div key={p.dataKey} style={{ color: p.color }}>
                            {p.dataKey} : {p.value}
                          </div>
                        ))}
                        <div style={{
                          marginTop: 6, paddingTop: 6,
                          borderTop: "1px solid var(--border)",
                          fontWeight: 600, color: "var(--foreground)",
                        }}>
                          Total : {total}
                        </div>
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="Members" stroke="var(--chart-1)" fill="url(#dcgGradMembers)" strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="Regular Visitors" stroke="var(--chart-2)" fill="url(#dcgGradVisitors)" strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="Children" stroke="var(--chart-3)" fill="url(#dcgGradChildren)" strokeWidth={2.5} dot={false} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No attendance data for the selected period
          </div>
        )}
      </section>

      {/* Members section */}
      <section className="space-y-4 rounded-3xl border border-border bg-card p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-lg font-semibold text-foreground">DCG members</h2>
            <p className="text-xs text-muted-foreground">{activeMembers.length} active in this group</p>
          </div>
          <RoundButton icon={Download} label={`Export ${filteredMembers.length} members`} onClick={handleExport} />
        </div>

        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by name, email, or phone..." />

        <ChipRow
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "All statuses" },
            { value: "new", label: "New" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
            { value: "transferred", label: "Transferred" },
          ]}
        />
        <ChipRow
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { value: "all", label: "All roles" },
            { value: "Leader", label: "Leader" },
            { value: "Assistant", label: "Assistant" },
            { value: "Member", label: "Member" },
          ]}
        />

        {/* Mobile / tablet member cards */}
        <div className="space-y-3 lg:hidden">
          {membersLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-card" />
            ))
          ) : filteredMembers.length > 0 ? (
            filteredMembers.map(m => {
              const p = m.members?.profiles;
              const memberId = m.members?.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => memberId && navigate(`/admin/regional/members/${memberId}`)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left transition active:scale-[0.99]"
                >
                  <Initials first={p?.first_name} last={p?.last_name} photo={(p as any)?.photo_url} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {p?.last_name} {p?.first_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{p?.phone || p?.email || "No contact"}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <TypePill label={m.role} />
                      <StatusPill status={m.members?.status || "new"} />
                    </div>
                  </div>
                  {memberMenu(m)}
                </button>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 py-10 text-center text-sm text-muted-foreground">
              No members found
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-2xl border border-border/40 lg:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[30%]">Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>DCG Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[60px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membersLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><div className="h-5 w-full animate-pulse rounded-lg bg-muted" /></TableCell>
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
                      className="cursor-pointer transition-colors hover:bg-muted/20"
                      onClick={() => memberId && navigate(`/admin/regional/members/${memberId}`)}
                    >
                      <TableCell className="font-medium">
                        {p?.last_name} {p?.first_name}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate">{p?.address || "N/A"}</TableCell>
                      <TableCell>{p?.phone || "N/A"}</TableCell>
                      <TableCell><TypePill label={m.role} /></TableCell>
                      <TableCell><StatusPill status={m.members?.status || "new"} /></TableCell>
                      <TableCell>
                        {m.joined_date ? new Date(m.joined_date).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>{memberMenu(m)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No members found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <EditDcgDialog
        open={isEditDialogOpen}
        setOpen={setIsEditDialogOpen}
        dcg={dcg}
      />
    </div>
  );
};

export default DcgProfile;
