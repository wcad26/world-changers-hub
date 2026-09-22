import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, X, Loader2, Send, CameraOff, ScanLine, Search, LogOut } from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useAttendanceScan } from "@/hooks/useAttendanceScan";
import { useToast } from "@/hooks/use-toast";

type EventRow = {
  id: string;
  name: string;
  event_date: string;
  region_id: string | null;
  parent_event_id: string | null;
  source_event_id: string | null;
  day_index: number | null;
};

// Group key: use the source event id when set (so all days of a multi-day event group
// together), otherwise fall back to the attendance_event's own id.
const groupKey = (e: EventRow) => e.source_event_id || e.id;

const today = () => new Date().toISOString().slice(0, 10);

export default function AttendanceScan() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { cart, lastMessage, isSubmitting, resolveAndAdd, addMemberDirect, removeAt, submit, clear } = useAttendanceScan();

  const [events, setEvents] = useState<EventRow[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [manualQuery, setManualQuery] = useState("");
  const [manualResults, setManualResults] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    (async () => {
      let query = supabase
        .from("attendance_events")
        .select("id, name, event_date, region_id, parent_event_id, source_event_id, day_index")
        .order("event_date", { ascending: false });
      // TEMP: include today + future events so upcoming DESCO can be tested with the scanner.
      if (!showAll) query = query.gte("event_date", today());
      const { data } = await query.limit(showAll ? 400 : 200);
      setEvents((data as any) || []);
    })();
  }, [user?.id, showAll]);

  // Auto-select when there is exactly one event group.
  useEffect(() => {
    const groups = Array.from(new Set(events.map(groupKey)));
    if (!selectedEventId && groups.length === 1) {
      // Pick the day 1 (or earliest) row within the group as the "root".
      const inGroup = events
        .filter((e) => groupKey(e) === groups[0])
        .sort((a, b) => (a.day_index ?? 99) - (b.day_index ?? 99));
      if (inGroup[0]) setSelectedEventId(inGroup[0].id);
    }
  }, [events, selectedEventId]);

  // One entry per group for the picker; label uses the earliest day's name.
  const rootEvents = useMemo(() => {
    const byGroup = new Map<string, EventRow>();
    for (const e of events) {
      const key = groupKey(e);
      const cur = byGroup.get(key);
      if (!cur || (e.day_index ?? 99) < (cur.day_index ?? 99)) byGroup.set(key, e);
    }
    return Array.from(byGroup.values());
  }, [events]);

  // All days for the selected group (a "day" is any attendance_event sharing the group key).
  const days = useMemo(() => {
    if (!selectedEventId) return [] as EventRow[];
    const selected = events.find((e) => e.id === selectedEventId);
    if (!selected) return [];
    const key = groupKey(selected);
    const siblings = events.filter((e) => groupKey(e) === key);
    if (siblings.length <= 1) return [];
    return siblings.slice().sort((a, b) => {
      const ai = a.day_index ?? 99, bi = b.day_index ?? 99;
      if (ai !== bi) return ai - bi;
      return (a.event_date || "").localeCompare(b.event_date || "");
    });
  }, [selectedEventId, events]);
  const [dayEventId, setDayEventId] = useState<string>("");
  useEffect(() => {
    if (days.length > 0) {
      const t = today();
      const match = days.find((d) => d.event_date === t);
      setDayEventId((match || days[0]).id);
    } else {
      setDayEventId("");
    }
  }, [days.map((d) => d.id).join(",")]);

  const targetEventId = dayEventId || selectedEventId;
  const currentDay = days.find((d) => d.id === dayEventId);
  const totalDays = days.length;
  const parentEvent = events.find((e) => e.id === selectedEventId);
  const activeEventName = (parentEvent?.name || currentDay?.name || "").replace(/\s*—\s*Day\s*\d+\s*$/i, "");
  const activeEventDate = currentDay?.event_date || parentEvent?.event_date;
  const todayMatchesADay = totalDays === 0 ? true : days.some((d) => d.event_date === today());

  // Manual search
  useEffect(() => {
    if (!manualQuery.trim()) { setManualResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc("search_all_members", { _search: manualQuery.trim() });
      setManualResults(((data as any) || []).map((m: any) => ({
        id: m.id,
        name: `${m.last_name || ""} ${m.first_name || ""}`.trim(),
      })));
    }, 250);
    return () => clearTimeout(t);
  }, [manualQuery]);

  const handleScan = (results: any[]) => {
    if (!results || results.length === 0) return;
    if (!targetEventId) {
      toast({ title: "Select an event first", variant: "destructive" });
      return;
    }
    const code = results[0]?.rawValue || results[0]?.text;
    if (code) void resolveAndAdd(code);
  };

  const handleSubmit = async () => {
    if (!targetEventId || cart.length === 0) return;
    try {
      const res = await submit(targetEventId);
      if (res) {
        toast({
          title: "Attendance submitted",
          description: `${res.newly_marked} newly marked · ${res.already_present} already present · ${res.submitted} total`,
        });
      }
    } catch (e: any) {
      toast({ title: "Submit failed", description: e?.message || "", variant: "destructive" });
    }
  };

  const noEventsToday = !showAll && rootEvents.length === 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Compact header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
        <div className="mx-auto max-w-2xl flex items-center gap-2 px-3 py-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold leading-tight truncate">
              {activeEventName || "Record Attendance"}
            </h1>
            <p className="text-[11px] text-muted-foreground leading-tight truncate">
              {totalDays > 0 && currentDay
                ? `Day ${currentDay.day_index ?? 1} of ${totalDays} · ${currentDay.event_date}`
                : activeEventDate
                  ? `Session · ${activeEventDate}`
                  : "Scan badges to mark attendees present"}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">{cart.length}</Badge>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            onClick={async () => {
              try { await supabase.auth.signOut({ scope: "local" }); } catch {}
              navigate("/attendance/login", { replace: true });
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-3 py-3 space-y-3">
        {/* Event picker */}
        <Card>
          <CardContent className="p-3 space-y-2">
            {noEventsToday ? (
              <div className="text-sm">
                <p className="text-muted-foreground">No upcoming events scheduled.</p>
                <button
                  className="mt-1 text-xs text-primary underline"
                  onClick={() => setShowAll(true)}
                >
                  Show recent events
                </button>
              </div>
            ) : (
              <>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={showAll ? "Select event…" : "Today's event"} />
                  </SelectTrigger>
                  <SelectContent>
                    {rootEvents.map((e) => {
                      const label = e.name.replace(/\s*—\s*Day\s*\d+\s*$/i, "");
                      return (
                        <SelectItem key={e.id} value={e.id}>
                          {label}{showAll ? ` — ${e.event_date}` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {days.length > 0 && (
                  <>
                    <div className={`rounded-md border p-2 text-xs flex items-center justify-between ${todayMatchesADay ? "bg-primary/5 border-primary/20" : "bg-yellow-50 border-yellow-300"}`}>
                      <span className="font-medium">
                        {currentDay
                          ? `Marking Day ${currentDay.day_index ?? 1} of ${totalDays}`
                          : `Pick a day (${totalDays} total)`}
                      </span>
                      {currentDay && (
                        <Badge variant={currentDay.event_date === today() ? "default" : "outline"}>
                          {currentDay.event_date === today() ? "Today" : currentDay.event_date}
                        </Badge>
                      )}
                    </div>
                    {!todayMatchesADay && (
                      <p className="text-[11px] text-yellow-800">
                        Today's date is outside the event schedule — confirm the day below.
                      </p>
                    )}
                    <Select value={dayEventId} onValueChange={setDayEventId}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select day…" />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            Day {d.day_index ?? 1} · {d.event_date}
                            {d.event_date === today() ? " (today)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
                {!showAll && (
                  <button
                    className="text-[11px] text-muted-foreground underline"
                    onClick={() => setShowAll(true)}
                  >
                    Show recent events
                  </button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Scanner */}
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ScanLine className="h-4 w-4" /> Scanner
              </div>
              <Button variant="outline" size="sm" onClick={() => setScannerEnabled((v) => !v)}>
                {scannerEnabled ? (<><CameraOff className="mr-1 h-3 w-3" /> Pause</>) : "Resume"}
              </Button>
            </div>
            {scannerEnabled ? (
              <div className="overflow-hidden rounded-md bg-black aspect-square w-full">
                <Scanner
                  onScan={handleScan}
                  onError={() => {}}
                  constraints={{ facingMode: "environment" }}
                  scanDelay={400}
                  components={{ finder: true }}
                  styles={{ container: { width: "100%", height: "100%" } }}
                />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">Scanner paused</div>
            )}
            {lastMessage && (
              <p className="text-xs text-center text-muted-foreground min-h-[1rem]">{lastMessage}</p>
            )}
          </CardContent>
        </Card>

        {/* Manual add */}
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Search className="h-4 w-4" /> Add by name
            </div>
            <Input
              className="h-11"
              placeholder="Type a name…"
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
            />
            {manualResults.length > 0 && (
              <div className="border rounded-md max-h-48 overflow-auto divide-y">
                {manualResults.map((m) => (
                  <button
                    key={m.id}
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                    onClick={() => { addMemberDirect(m.id, m.name); setManualQuery(""); setManualResults([]); }}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cart */}
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <div className="text-sm font-medium">
                Cart <span className="text-muted-foreground">({cart.length})</span>
              </div>
              {cart.length > 0 && (
                <Button size="sm" variant="ghost" onClick={clear}>Clear</Button>
              )}
            </div>
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No scans yet.</p>
            ) : (
              <ul className="divide-y">
                {cart.map((c, i) => (
                  <li key={`${c.member_id}-${i}`} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="truncate">{c.display_name}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeAt(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Inline sticky submit — no admin bottom bar */}
        <div className="sticky bottom-0 -mx-3 px-3 py-3 bg-background/95 backdrop-blur border-t pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button
            className="w-full h-12 text-base"
            disabled={!targetEventId || cart.length === 0 || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Submit {cart.length > 0 ? `(${cart.length})` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
