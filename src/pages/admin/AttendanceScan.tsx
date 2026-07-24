import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, X, Loader2, Send, CameraOff, ScanLine, Search } from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useAttendanceScan } from "@/hooks/useAttendanceScan";
import { useToast } from "@/hooks/use-toast";

type EventRow = {
  id: string;
  name: string;
  event_date: string;
  region_id: string | null;
  parent_event_id: string | null;
  day_index: number | null;
};

export default function AttendanceScan() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { cart, lastMessage, isSubmitting, resolveAndAdd, addMemberDirect, removeAt, submit, clear } = useAttendanceScan();

  const [events, setEvents] = useState<EventRow[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [manualQuery, setManualQuery] = useState("");
  const [manualResults, setManualResults] = useState<{ id: string; name: string }[]>([]);
  const isSuper = typeof window !== "undefined" && window.location.pathname.startsWith("/admin/super");

  useEffect(() => {
    (async () => {
      const q = supabase
        .from("attendance_events")
        .select("id, name, event_date, region_id, parent_event_id, day_index")
        .order("event_date", { ascending: false })
        .limit(200);
      const { data } = await q;
      setEvents((data as any) || []);
    })();
  }, [user?.id]);

  const days = useMemo(() => {
    if (!selectedEventId) return [] as EventRow[];
    const parent = events.find((e) => e.id === selectedEventId);
    if (!parent) return [];
    const children = events.filter((e) => e.parent_event_id === parent.id);
    return children.length > 0
      ? [parent, ...children].sort((a, b) => (a.day_index || 0) - (b.day_index || 0))
      : [];
  }, [selectedEventId, events]);
  const [dayEventId, setDayEventId] = useState<string>("");
  useEffect(() => {
    if (days.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      const match = days.find((d) => d.event_date === today);
      setDayEventId((match || days[0]).id);
    } else {
      setDayEventId("");
    }
  }, [days.map((d) => d.id).join(",")]);

  const targetEventId = dayEventId || selectedEventId;

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

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pb-32">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Record Attendance</h1>
            <p className="text-sm text-muted-foreground">Scan badges to mark attendees present.</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Event</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event…" />
                </SelectTrigger>
                <SelectContent>
                  {events.filter((e) => !e.parent_event_id).map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} — {e.event_date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {days.length > 0 && (
              <div>
                <Label className="text-xs">Day</Label>
                <Select value={dayEventId} onValueChange={setDayEventId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select day…" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        Day {d.day_index ?? 1} — {d.event_date}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ScanLine className="h-4 w-4" /> Scanner
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setScannerEnabled((v) => !v)}>
              {scannerEnabled ? (<><CameraOff className="mr-1 h-3 w-3" /> Pause</>) : "Resume"}
            </Button>
          </CardHeader>
          <CardContent>
            {scannerEnabled ? (
              <div className="overflow-hidden rounded-md bg-black aspect-square max-h-[360px] mx-auto">
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
              <p className="mt-2 text-xs text-center text-muted-foreground">{lastMessage}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" /> Add by name
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              placeholder="Type a name…"
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
            />
            {manualResults.length > 0 && (
              <div className="border rounded-md max-h-40 overflow-auto divide-y">
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

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Cart <Badge variant="secondary" className="ml-2">{cart.length}</Badge></CardTitle>
            {cart.length > 0 && (
              <Button size="sm" variant="ghost" onClick={clear}>Clear</Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[300px]">
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No scans yet.</p>
              ) : (
                <ul className="divide-y">
                  {cart.map((c, i) => (
                    <li key={`${c.member_id}-${i}`} className="flex items-center justify-between px-4 py-2 text-sm">
                      <span className="truncate">{c.display_name}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeAt(i)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur p-3 z-40">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {cart.length} to submit
          </div>
          <Button
            className="ml-auto"
            disabled={!targetEventId || cart.length === 0 || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Submit attendance
          </Button>
        </div>
      </div>
    </div>
  );
}
