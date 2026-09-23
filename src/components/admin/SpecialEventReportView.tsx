import { useMemo, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, Bed, Utensils, CalendarDays, Baby, ArrowLeft, Download, Search,
  AlertTriangle, MapPin, UsersRound, Activity, ChevronDown,
} from "lucide-react";
import { format, parseISO, differenceInYears, eachDayOfInterval } from "date-fns";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, LineChart, Line, Legend,
} from "recharts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const calcAge = (dob?: string | null): number | null => {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  return differenceInYears(new Date(), d);
};

type AgeGroup = "adult" | "youth" | "child" | "unknown";
const ageGroup = (age: number | null): AgeGroup => {
  if (age === null) return "unknown";
  if (age >= 18) return "adult";
  if (age >= 15) return "youth";
  return "child";
};

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-6)", "var(--chart-5)", "var(--chart-7)", "var(--chart-8)", "var(--chart-4)"];
const ALLERGEN_KEYWORDS = ["nut", "peanut", "gluten", "dairy", "milk", "lactose", "shellfish", "egg", "soy", "sesame", "fish", "wheat"];

interface RegRow {
  id: string;
  event_id: string;
  member_id: string | null;
  group_id: string | null;
  is_primary: boolean;
  attending_with_family: boolean;
  needs_lodging: boolean;
  has_children: boolean;
  email: string | null;
  phone: string | null;
  meal_preferences: string[] | null;
  dietary_notes: string | null;
  arrival_date: string | null;
  departure_date: string | null;
  pledge_amount: number | null;
  members?: any;
}

interface SpecialEventReportViewProps {
  eventId?: string;
  regionId?: string | null;
  backTo: string;
  showRegionFilter?: boolean;
}

export default function SpecialEventReportView({
  eventId,
  regionId,
  backTo,
  showRegionFilter = false,
}: SpecialEventReportViewProps) {
  const navigate = useNavigate();

  const { data: event, isLoading: isEventLoading, error: eventError } = useQuery({
    queryKey: ["special-event-report-event", eventId, regionId ?? "all"],
    enabled: !!eventId,
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*")
        .eq("id", eventId ?? "")
        .eq("is_special", true);
      if (regionId) query = query.eq("region_id", regionId);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["special-event-registrations", eventId, regionId ?? "all"],
    enabled: !!event?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_pre_registrations")
        .select(
          "*, members:member_id(id, member_id, member_type, region_id, profiles:profile_id(first_name, last_name, email, phone, date_of_birth, gender, address), region:regions(name))"
        )
        .eq("event_id", event?.id ?? "");
      if (error) throw error;
      return (data || []) as RegRow[];
    },
  });

  const ev: any = event;

  // ---- Normalised attendees ----
  const attendees = useMemo(() => {
    return (registrations || []).map((r: any) => {
      const p = r.members?.profiles || {};
      const age = calcAge(p.date_of_birth);
      const name =
        `${p.last_name || ""} ${p.first_name || ""}`.trim() ||
        r.email ||
        r.phone ||
        "Unknown";
      const region = r.members?.region?.name || "—";
      const type: "member" | "visitor" = r.member_id ? "member" : "visitor";
      const arrival = r.arrival_date ? parseISO(r.arrival_date) : null;
      const departure = r.departure_date ? parseISO(r.departure_date) : null;
      const nights =
        arrival && departure
          ? Math.max(0, Math.round((departure.getTime() - arrival.getTime()) / 86400000))
          : 0;
      return {
        ...r,
        name,
        first_name: p.first_name || "",
        last_name: p.last_name || "",
        region,
        type,
        age,
        ageGroup: ageGroup(age),
        gender: (p.gender || "").toLowerCase(),
        email: p.email || r.email || "",
        phone: p.phone || r.phone || "",
        memberCode: r.members?.member_id || "",
        arrival,
        departure,
        nights,
        allergyFlag: !!(r.dietary_notes && r.dietary_notes.trim().length > 0),
      };
    });
  }, [registrations]);

  // ---- Global filters ----
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [lodgingFilter, setLodgingFilter] = useState("all");
  const [allergyFilter, setAllergyFilter] = useState("all");
  const [mealFilter, setMealFilter] = useState("all");

  const regions = useMemo(
    () => Array.from(new Set(attendees.map((a) => a.region))).filter(Boolean).sort(),
    [attendees]
  );
  const mealOptions = useMemo(() => {
    const s = new Set<string>();
    attendees.forEach((a) => (a.meal_preferences || []).forEach((m: string) => s.add(m)));
    return Array.from(s).sort();
  }, [attendees]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return attendees.filter((a) => {
      if (q && !(a.name.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.phone?.toLowerCase().includes(q))) return false;
      if (showRegionFilter && regionFilter !== "all" && a.region !== regionFilter) return false;
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (ageFilter !== "all" && a.ageGroup !== ageFilter) return false;
      if (genderFilter !== "all" && a.gender !== genderFilter) return false;
      if (lodgingFilter === "yes" && !a.needs_lodging) return false;
      if (lodgingFilter === "no" && a.needs_lodging) return false;
      if (allergyFilter === "yes" && !a.allergyFlag) return false;
      if (allergyFilter === "no" && a.allergyFlag) return false;
      if (mealFilter !== "all" && !(a.meal_preferences || []).includes(mealFilter)) return false;
      return true;
    });
  }, [attendees, search, regionFilter, typeFilter, ageFilter, genderFilter, lodgingFilter, allergyFilter, mealFilter, showRegionFilter]);

  // ---- KPIs ----
  // New Adult / Child buckets: adult = age >= 15 OR unknown; child = age < 15.
  const isChildBucket = (ag: AgeGroup) => ag === "child";
  const isAdultBucket = (ag: AgeGroup) => ag !== "child"; // adult, youth, unknown

  const stats = useMemo(() => {
    const total = filtered.length;
    const groups = new Map<string, any[]>();
    filtered.forEach((a) => {
      const key = a.group_id || `_solo_${a.id}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(a);
    });
    const familyGroups = Array.from(groups.values()).filter((g) => g.length > 1);
    const soloGroups = Array.from(groups.values()).filter((g) => g.length === 1);
    const families = familyGroups.length;
    const individuals = soloGroups.length;
    const familyMemberTotal = familyGroups.reduce((sum, g) => sum + g.length, 0);

    let adults = 0, youth = 0, children = 0, unknownAge = 0;
    let male = 0, female = 0, otherGender = 0;
    let lodgingPeople = 0, totalNights = 0;
    filtered.forEach((a) => {
      if (a.ageGroup === "adult") adults++;
      else if (a.ageGroup === "youth") youth++;
      else if (a.ageGroup === "child") children++;
      else unknownAge++;
      if (a.gender === "male") male++;
      else if (a.gender === "female") female++;
      else otherGender++;
      if (a.needs_lodging) lodgingPeople++;
      totalNights += a.nights;
    });

    // Lodging breakdowns
    let lodgingFamilies = 0;
    let lodgingIndividualsCount = 0;
    let familyChildrenLodging = 0;
    let familyParentsLodging = 0; // adults inside families that also have children
    let familyAdultsAloneLodging = 0; // adults inside families with no children
    familyGroups.forEach((g) => {
      if (!g.some((a) => a.needs_lodging)) return;
      lodgingFamilies++;
      const kids = g.filter((a) => isChildBucket(a.ageGroup)).length;
      const adultsInGroup = g.filter((a) => isAdultBucket(a.ageGroup)).length;
      familyChildrenLodging += kids;
      if (kids > 0) familyParentsLodging += adultsInGroup;
      else familyAdultsAloneLodging += adultsInGroup;
    });
    soloGroups.forEach((g) => { if (g[0].needs_lodging) lodgingIndividualsCount++; });

    return {
      total, families, individuals, familyMemberTotal,
      adults, youth, children, unknownAge,
      adultsCombined: adults + youth + unknownAge,
      childrenCombined: children,
      male, female, otherGender,
      lodgingPeople, lodgingFamilies, lodgingIndividualsCount,
      familyChildrenLodging, familyParentsLodging, familyAdultsAloneLodging,
      totalNights,
    };
  }, [filtered]);

  const ageChartData = [
    { name: "Adults", value: stats.adults },
    { name: "Youth", value: stats.youth },
    { name: "Children", value: stats.children },
    { name: "Unknown", value: stats.unknownAge },
  ].filter((item) => item.value > 0);
  const genderChartData = [
    { name: "Male", value: stats.male },
    { name: "Female", value: stats.female },
    { name: "Other/—", value: stats.otherGender },
  ].filter((item) => item.value > 0);
  const donutTooltip = (value: number, name: string) => [
    `${value} (${Math.round((value / Math.max(1, stats.total)) * 100)}%)`,
    name,
  ];

  // ---- Day rollups ----
  const dayRollup = useMemo(() => {
    if (filtered.length === 0) return [] as Array<{ date: string; attendance: number; lodging: number; adults: number; children: number; rawDate: Date }>;
    let min = filtered[0]?.arrival || null;
    let max = filtered[0]?.departure || filtered[0]?.arrival || null;
    filtered.forEach((a) => {
      if (a.arrival && (!min || a.arrival < min)) min = a.arrival;
      if (a.departure && (!max || a.departure > max)) max = a.departure;
      if (a.arrival && (!max || a.arrival > max)) max = a.arrival;
    });
    if (!min || !max) return [];
    const days = eachDayOfInterval({ start: min, end: max });
    return days.map((d) => {
      let attendance = 0, lodging = 0, adults = 0, children = 0;
      filtered.forEach((a) => {
        if (!a.arrival) return;
        const dep = a.departure || a.arrival;
        if (d >= a.arrival && d <= dep) {
          attendance++;
          if (a.needs_lodging) lodging++;
          if (isChildBucket(a.ageGroup)) children++;
          else adults++;
        }
      });
      return { date: format(d, "MMM d"), attendance, lodging, adults, children, rawDate: d };
    });
  }, [filtered]);

  // ---- Peak day ----
  const peakDay = useMemo(() => {
    if (dayRollup.length === 0) return null;
    let best = dayRollup[0];
    let bestIndex = 0;
    dayRollup.forEach((r, i) => {
      if (r.attendance > best.attendance) { best = r; bestIndex = i; }
    });
    return { ...best, index: bestIndex + 1, totalNights: dayRollup.length };
  }, [dayRollup]);

  // ---- Meal day rollup ----
  const mealDayRollup = useMemo(() => {
    if (filtered.length === 0 || mealOptions.length === 0) return [] as any[];
    let min: Date | null = null;
    let max: Date | null = null;
    filtered.forEach((a) => {
      if (a.arrival && (!min || a.arrival < min)) min = a.arrival;
      if (a.departure && (!max || a.departure > max)) max = a.departure;
      if (a.arrival && (!max || a.arrival > max)) max = a.arrival;
    });
    if (!min || !max) return [];
    const days = eachDayOfInterval({ start: min, end: max });
    return days.map((d) => {
      const row: any = { date: format(d, "MMM d") };
      mealOptions.forEach((m) => (row[m] = 0));
      filtered.forEach((a) => {
        if (!a.arrival) return;
        const dep = a.departure || a.arrival;
        if (d >= a.arrival && d <= dep) {
          (a.meal_preferences || []).forEach((m: string) => { row[m] = (row[m] || 0) + 1; });
        }
      });
      return row;
    });
  }, [filtered, mealOptions]);

  // ---- Families grouped ----
  const families = useMemo(() => {
    const map = new Map<string, any[]>();
    filtered.forEach((a) => {
      if (!a.group_id) return;
      if (!map.has(a.group_id)) map.set(a.group_id, []);
      map.get(a.group_id)!.push(a);
    });
    return Array.from(map.entries())
      .map(([id, members]) => {
        const primary = members.find((m) => m.is_primary) || members[0];
        const adults = members.filter((m) => m.ageGroup === "adult").length;
        const youth = members.filter((m) => m.ageGroup === "youth").length;
        const children = members.filter((m) => m.ageGroup === "child").length;
        const arrivals = members.map((m) => m.arrival).filter(Boolean);
        const departures = members.map((m) => m.departure).filter(Boolean);
        const arrival = arrivals.length ? new Date(Math.min(...arrivals.map((d: Date) => d.getTime()))) : null;
        const departure = departures.length ? new Date(Math.max(...departures.map((d: Date) => d.getTime()))) : null;
        const nights = arrival && departure ? Math.max(0, Math.round((departure.getTime() - arrival.getTime()) / 86400000)) : 0;
        const needsLodging = members.some((m) => m.needs_lodging);
        const meals = new Set<string>();
        members.forEach((m) => (m.meal_preferences || []).forEach((mp: string) => meals.add(mp)));
        const dietary = members.filter((m) => m.dietary_notes).map((m) => `${m.first_name}: ${m.dietary_notes}`);
        return {
          id, members, primary, size: members.length, adults, youth, children,
          arrival, departure, nights, needsLodging,
          meals: Array.from(meals), dietary,
          region: primary?.region || "—",
        };
      })
      .sort((a, b) => b.size - a.size);
  }, [filtered]);

  const lodgingIndividuals = useMemo(
    () => filtered.filter((a) => !a.group_id && a.needs_lodging),
    [filtered]
  );

  // ---- CSV export ----
  const exportCsv = () => {
    const headers = [
      "Name", "Region", "Type", "Age", "Age Group", "Gender", "Email", "Phone",
      "Arrival", "Departure", "Nights", "Needs Lodging", "Family Group", "Health/Allergies", "Notes",
    ];
    const rows = filtered.map((a) => [
      a.name, a.region, a.type, a.age ?? "", a.ageGroup, a.gender || "—",
      a.email, a.phone, a.arrival_date || "", a.departure_date || "", a.nights,
      a.needs_lodging ? "Yes" : "No", a.group_id || "—",
      (a.meal_preferences || []).join("; "), a.dietary_notes || "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ev?.name || "special-event"}-attendees.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isEventLoading) return <div className="p-6"><Skeleton className="h-24 w-full" /></div>;

  if (eventError || !ev) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(backTo)}>
          <ArrowLeft className="mr-1 h-4 w-4" />Back to events
        </Button>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            This special-event report is unavailable or does not belong to your region.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 text-muted-foreground" onClick={() => navigate(backTo)}>
            <ArrowLeft className="h-4 w-4 mr-1" />Back to events
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{ev.name}</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            {format(new Date(ev.start_datetime), "PPP")}
            {ev.end_datetime ? ` – ${format(new Date(ev.end_datetime), "PPP")}` : ""}
            {ev.location && <span className="ml-2 inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{ev.location}</span>}
          </p>
        </div>
        <Button onClick={exportCsv} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />Export CSV
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <KPI icon={Users} label="Total Registered" value={stats.total} sub={`${stats.individuals} Individuals · ${stats.families} Families${stats.families > 0 ? ` (${stats.familyMemberTotal} in families)` : ""}`} />
        <KPI icon={Activity} label="Adults / Children" value={`${stats.adultsCombined} / ${stats.childrenCombined}`} sub={stats.unknownAge > 0 ? `${stats.unknownAge} age unknown (counted as adults)` : "≥15 / <15"} />
        <KPI icon={UsersRound} label="Gender" value={`${stats.male} M · ${stats.female} F`} sub={stats.otherGender > 0 ? `${stats.otherGender} other/—` : "—"} />
        <KPI icon={Bed} label="Lodging Needed" value={stats.lodgingPeople} sub={`${stats.lodgingIndividualsCount} Individuals / ${stats.lodgingFamilies} Families (${stats.familyChildrenLodging} children · ${stats.familyParentsLodging} parents w/ kids · ${stats.familyAdultsAloneLodging} adults)`} />
        <KPI icon={CalendarDays} label="Peak Day Attendance" value={peakDay ? `${peakDay.adults} Adults / ${peakDay.children} Children` : "—"} sub={peakDay ? `Peak on ${peakDay.date} · night ${peakDay.index} of ${peakDay.totalNights}` : "No dated attendees"} />
        <KPI icon={Utensils} label="With Dietary Notes" value={attendees.filter((a) => a.allergyFlag).length} sub="Allergies & preferences" />
      </div>

      {/* Filter bar */}
      <Card className="bg-card/60 backdrop-blur-sm border-border/40">
        <CardContent className="p-4 grid gap-2 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
          <div className="relative col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search name, email, phone…" className="pl-9 bg-background/60 border-border/50" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {showRegionFilter && (
            <FilterSelect value={regionFilter} onChange={setRegionFilter} placeholder="Region"
              options={[{ value: "all", label: "All regions" }, ...regions.map((r) => ({ value: r, label: r }))]} />
          )}
          <FilterSelect value={typeFilter} onChange={setTypeFilter} placeholder="Type"
            options={[{ value: "all", label: "All types" }, { value: "member", label: "Members" }, { value: "visitor", label: "Visitors" }]} />
          <FilterSelect value={ageFilter} onChange={setAgeFilter} placeholder="Age"
            options={[{ value: "all", label: "All ages" }, { value: "adult", label: "Adults (≥18)" }, { value: "youth", label: "Youth (15-17)" }, { value: "child", label: "Children (<15)" }, { value: "unknown", label: "Unknown" }]} />
          <FilterSelect value={genderFilter} onChange={setGenderFilter} placeholder="Gender"
            options={[{ value: "all", label: "All genders" }, { value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
          <FilterSelect value={lodgingFilter} onChange={setLodgingFilter} placeholder="Lodging"
            options={[{ value: "all", label: "Any" }, { value: "yes", label: "Needs lodging" }, { value: "no", label: "No lodging" }]} />
          <FilterSelect value={allergyFilter} onChange={setAllergyFilter} placeholder="Dietary"
            options={[{ value: "all", label: "Any" }, { value: "yes", label: "Has notes" }, { value: "no", label: "No notes" }]} />
          <FilterSelect value={mealFilter} onChange={setMealFilter} placeholder="Health/Allergy"
            options={[{ value: "all", label: "All health & allergies" }, ...mealOptions.map((m) => ({ value: m, label: m }))]} />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-card/60 backdrop-blur-sm border border-border/30">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendees">Attendees</TabsTrigger>
          <TabsTrigger value="families">Families & Lodging</TabsTrigger>
          <TabsTrigger value="meals">Health & Allergies</TabsTrigger>
          <TabsTrigger value="travel">Travel & Schedule</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ChartCard title="Age groups">
               <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                   <Pie dataKey="value" nameKey="name" data={ageChartData} cx="50%" cy="43%" innerRadius={45} outerRadius={78} paddingAngle={3} stroke="var(--card)" strokeWidth={2}>
                     {ageChartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                   <text x="50%" y="43%" textAnchor="middle" dominantBaseline="middle" fill="var(--foreground)" fontSize="20" fontWeight="700">{stats.total}</text>
                   <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} formatter={donutTooltip} />
                   <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11, lineHeight: "20px" }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Gender split">
               <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                   <Pie dataKey="value" nameKey="name" data={genderChartData} cx="50%" cy="43%" innerRadius={45} outerRadius={78} paddingAngle={3} stroke="var(--card)" strokeWidth={2}>
                     {genderChartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                   <text x="50%" y="43%" textAnchor="middle" dominantBaseline="middle" fill="var(--foreground)" fontSize="20" fontWeight="700">{stats.total}</text>
                   <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} formatter={donutTooltip} />
                   <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11, lineHeight: "20px" }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {showRegionFilter && (
              <ChartCard title="By region">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={regions.map((r) => ({ region: r, count: filtered.filter((a) => a.region === r).length }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                    <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>

          <ChartCard title="Daily attendance & lodging need">
            {dayRollup.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No arrival/departure data captured yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dayRollup}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="attendance" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="lodging" stroke="var(--chart-4)" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </TabsContent>

        {/* ATTENDEES */}
        <TabsContent value="attendees">
          <Card>
            <CardHeader><CardTitle className="text-base">Attendees ({filtered.length})</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/30">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Arrival</TableHead>
                        <TableHead>Departure</TableHead>
                        <TableHead className="text-right">Nights</TableHead>
                        <TableHead>Family</TableHead>
                        <TableHead>Health/Allergies</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>
                            <div className="font-medium">{a.name}</div>
                            {a.email && <div className="text-xs text-muted-foreground">{a.email}</div>}
                          </TableCell>
                          <TableCell className="text-sm">{a.region}</TableCell>
                          <TableCell><Badge variant={a.type === "member" ? "default" : "secondary"} className="capitalize">{a.type}</Badge></TableCell>
                          <TableCell className="text-sm">
                            <Badge variant="outline" className="capitalize text-[10px]">{a.ageGroup}</Badge>
                          </TableCell>
                          <TableCell className="capitalize text-sm">{a.gender || "—"}</TableCell>
                          <TableCell className="text-sm">{a.phone || "—"}</TableCell>
                          <TableCell className="text-sm">{a.arrival_date || "—"}</TableCell>
                          <TableCell className="text-sm">{a.departure_date || "—"}</TableCell>
                          <TableCell className="text-right tabular-nums">{a.nights || "—"}</TableCell>
                          <TableCell>{a.group_id ? <Badge variant="outline">{a.is_primary ? "Primary" : "Family"}</Badge> : "—"}</TableCell>
                          <TableCell className="text-xs">{(a.meal_preferences || []).join(", ") || "—"}</TableCell>
                          <TableCell>{a.allergyFlag ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : "—"}</TableCell>
                        </TableRow>
                      ))}
                      {filtered.length === 0 && (
                        <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground py-8">No attendees match the filters.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAMILIES */}
        <TabsContent value="families" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UsersRound className="h-4 w-4" /> Family Groups ({families.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {families.length === 0 ? (
                <p className="text-sm text-muted-foreground">No family groups in the current filter.</p>
              ) : (
                <div className="space-y-3">
                  {families.map((fam) => (
                    <Collapsible key={fam.id} className="rounded-xl border border-border/30 bg-card/40">
                      <CollapsibleTrigger className="w-full flex items-center justify-between p-4 group">
                        <div className="flex items-center gap-3 flex-wrap text-left">
                          <span className="font-semibold">{fam.primary?.name || "Family"}</span>
                          <Badge variant="outline">{fam.size} people</Badge>
                          <Badge variant="secondary">{fam.adults} adults · {fam.youth} youth · {fam.children} children</Badge>
                          {fam.needsLodging && <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30"><Bed className="h-3 w-3 mr-1" />Needs lodging</Badge>}
                          <span className="text-xs text-muted-foreground">{fam.region}</span>
                          {fam.arrival && fam.departure && (
                            <span className="text-xs text-muted-foreground">{format(fam.arrival, "MMM d")} → {format(fam.departure, "MMM d")} ({fam.nights}n)</span>
                          )}
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-4 pb-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Age</TableHead>
                              <TableHead>Gender</TableHead>
                              <TableHead>Health/Allergies</TableHead>
                              <TableHead>Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {fam.members.map((m: any) => (
                              <TableRow key={m.id}>
                                <TableCell>
                                  {m.name} {m.is_primary && <Badge variant="secondary" className="ml-1">Primary</Badge>}
                                </TableCell>
                                <TableCell><Badge variant="outline" className="capitalize text-[10px]">{m.ageGroup}</Badge></TableCell>
                                <TableCell className="capitalize">{m.gender || "—"}</TableCell>
                                <TableCell className="text-xs">{(m.meal_preferences || []).join(", ") || "—"}</TableCell>
                                <TableCell className="text-xs">{m.dietary_notes || "—"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bed className="h-4 w-4" /> Individuals needing lodging ({lodgingIndividuals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lodgingIndividuals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No solo registrants need lodging.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Name</TableHead><TableHead>Region</TableHead><TableHead>Gender</TableHead><TableHead>Arrival</TableHead><TableHead>Departure</TableHead><TableHead className="text-right">Nights</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {lodgingIndividuals.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.name}</TableCell>
                        <TableCell>{a.region}</TableCell>
                        <TableCell className="capitalize">{a.gender || "—"}</TableCell>
                        <TableCell>{a.arrival_date || "—"}</TableCell>
                        <TableCell>{a.departure_date || "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{a.nights || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* MEALS */}
        <TabsContent value="meals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard title="Health & allergy concerns overall">
              {mealOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No health or allergy concerns captured.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={mealOptions.map((m) => ({ meal: m, count: filtered.filter((a) => (a.meal_preferences || []).includes(m)).length }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                    <XAxis dataKey="meal" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Daily health & allergy load">
              {mealDayRollup.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Needs arrival/departure dates.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={mealDayRollup}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    {mealOptions.map((m, i) => (
                      <Bar key={m} dataKey={m} stackId="a" fill={COLORS[i % COLORS.length]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Allergies & health notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filtered.filter((a) => a.allergyFlag).length === 0 ? (
                <p className="text-sm text-muted-foreground">No health or allergy notes submitted in the current filter.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Name</TableHead><TableHead>Region</TableHead><TableHead>Health/Allergies</TableHead><TableHead>Notes</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.filter((a) => a.allergyFlag).map((a) => {
                      const note = a.dietary_notes || "";
                      const lower = note.toLowerCase();
                      const matched = ALLERGEN_KEYWORDS.filter((k) => lower.includes(k));
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{a.name}</TableCell>
                          <TableCell className="text-sm">{a.region}</TableCell>
                          <TableCell className="text-xs">{(a.meal_preferences || []).join(", ") || "—"}</TableCell>
                          <TableCell className="text-sm">
                            <div>{note}</div>
                            {matched.length > 0 && (
                              <div className="mt-1 flex gap-1 flex-wrap">
                                {matched.map((m) => (
                                  <Badge key={m} className="bg-amber-500/15 text-amber-700 border-amber-500/30 capitalize">{m}</Badge>
                                ))}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TRAVEL */}
        <TabsContent value="travel" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Arrivals by day</CardTitle></CardHeader>
              <CardContent>
                <ArrivalDepartureTable rows={filtered} field="arrival_date" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Departures by day</CardTitle></CardHeader>
              <CardContent>
                <ArrivalDepartureTable rows={filtered} field="departure_date" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Nights distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={nightsHistogram(filtered)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                  <XAxis dataKey="nights" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPI({ icon: Icon, label, value, sub }: { icon: any; label: string; value: any; sub: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5">
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="font-semibold tabular-nums text-foreground text-lg">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/40">
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function FilterSelect({
  value, onChange, placeholder, options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-background/60 border-border/50"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value || "_blank"} value={o.value || "_blank"}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ArrivalDepartureTable({ rows, field }: { rows: any[]; field: "arrival_date" | "departure_date" }) {
  const buckets = new Map<string, any[]>();
  rows.forEach((r) => {
    const k = r[field] || "—";
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(r);
  });
  const entries = Array.from(buckets.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  if (entries.length === 0 || (entries.length === 1 && entries[0][0] === "—")) {
    return <p className="text-sm text-muted-foreground">No dates captured.</p>;
  }
  return (
    <Table>
      <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">People</TableHead><TableHead>Sample</TableHead></TableRow></TableHeader>
      <TableBody>
        {entries.map(([date, list]) => (
          <TableRow key={date}>
            <TableCell className="font-medium">{date}</TableCell>
            <TableCell className="text-right tabular-nums">{list.length}</TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {list.slice(0, 3).map((a) => a.name).join(", ")}{list.length > 3 ? ` +${list.length - 3} more` : ""}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function nightsHistogram(rows: any[]) {
  const buckets = new Map<number, number>();
  rows.forEach((r) => {
    if (r.nights > 0) buckets.set(r.nights, (buckets.get(r.nights) || 0) + 1);
  });
  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([nights, count]) => ({ nights: `${nights}n`, count }));
}
