import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MessageSquareHeart, Check, EyeOff, Download, Baby } from "lucide-react";
import { format } from "date-fns";
import {
  useEventFeedback,
  useEventTestimonialsAdmin,
  useUpdateTestimonialStatus,
} from "@/hooks/useEventFeedback";
import { toast } from "@/hooks/use-toast";

const ENJOY_LABELS: Record<string, string> = {
  teachings: "The teachings",
  worship: "Worship sessions",
  fellowship: "Fellowship",
  prayer: "Prayer sessions",
  activities: "Activities & games",
  food: "The food",
  organization: "The organization",
  other: "Other",
};

const avg = (values: (number | null)[]) => {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
};

const RatingStat: React.FC<{ label: string; value: number | null; count: number }> = ({ label, value, count }) => (
  <div className="rounded-lg border p-4">
    <p className="text-sm text-muted-foreground">{label}</p>
    <div className="flex items-center gap-2 mt-1">
      <Star className="h-5 w-5 fill-primary text-primary" />
      <span className="text-2xl font-bold">{value === null ? "—" : value.toFixed(1)}</span>
      <span className="text-sm text-muted-foreground">/ 5</span>
    </div>
    <p className="text-xs text-muted-foreground mt-1">{count} response{count === 1 ? "" : "s"}</p>
  </div>
);

const EventFeedbackPanel: React.FC<{ eventId?: string }> = ({ eventId }) => {
  const { data: feedback, isLoading } = useEventFeedback(eventId);
  const { data: testimonials } = useEventTestimonialsAdmin(eventId);
  const updateStatus = useUpdateTestimonialStatus(eventId);

  const rows = feedback || [];

  const stats = React.useMemo(() => {
    const cnt = (k: keyof typeof rows[number]) => rows.filter(r => typeof r[k] === "number").length;
    return {
      overall: { v: avg(rows.map(r => r.overall_rating)), c: cnt("overall_rating") },
      communication: { v: avg(rows.map(r => r.communication_rating)), c: cnt("communication_rating") },
      lodging: { v: avg(rows.map(r => r.lodging_rating)), c: cnt("lodging_rating") },
      food: { v: avg(rows.map(r => r.food_rating)), c: cnt("food_rating") },
      children: { v: avg(rows.map(r => r.children_management_rating)), c: cnt("children_management_rating") },
      kidsComprehension: { v: avg(rows.map(r => r.kids_comprehension_rating)), c: cnt("kids_comprehension_rating") },
      kidsCare: { v: avg(rows.map(r => r.kids_care_rating)), c: cnt("kids_care_rating") },
      kidsMeals: { v: avg(rows.map(r => r.kids_meals_rating)), c: cnt("kids_meals_rating") },
    };
  }, [rows]);

  const parents = rows.filter(r => r.kids_attended === true).length;
  const sentDaily = rows.filter(r => r.kids_daily_attendance === "yes").length;
  const sentSometimes = rows.filter(r => r.kids_daily_attendance === "sometimes").length;
  const sentNever = rows.filter(r => r.kids_daily_attendance === "no").length;

  const firstTimers = rows.filter(r => r.first_time_attending === true).length;

  const enjoyedCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach(r => (r.enjoyed_most || []).forEach(v => map.set(v, (map.get(v) || 0) + 1)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const exportCsv = () => {
    const headers = [
      "Submitted", "First time", "Fellowship", "Overall", "Communication", "Lodging", "Food",
      "Children", "Impactful sessions", "Teaching impact", "Enjoyed most", "Schedule feedback",
      "Challenges", "Future topics", "Suggestions",
      "Child attended", "Sent child daily", "Kids comprehension", "Kids care", "Kids meals", "Kids remarks",
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      headers.join(","),
      ...rows.map(r => [
        format(new Date(r.submitted_at), "yyyy-MM-dd HH:mm"),
        r.first_time_attending === null ? "" : r.first_time_attending ? "Yes" : "No",
        r.fellowship, r.overall_rating, r.communication_rating, r.lodging_rating, r.food_rating,
        r.children_management_rating, r.impactful_sessions, r.teaching_impact,
        (r.enjoyed_most || []).map(v => ENJOY_LABELS[v] || v).join("; "),
        r.schedule_feedback, r.challenges, r.future_topics, r.suggestions,
        r.kids_attended === null ? "" : r.kids_attended ? "Yes" : "No",
        r.kids_daily_attendance, r.kids_comprehension_rating, r.kids_care_rating,
        r.kids_meals_rating, r.kids_remarks,
      ].map(esc).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `event-feedback-${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const setStatus = (id: string, status: "approved" | "pending" | "hidden") => {
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () => toast({ title: `Testimonial ${status}` }),
        onError: (e: any) => toast({ title: "Update failed", description: e?.message, variant: "destructive" }),
      },
    );
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquareHeart className="h-5 w-5 text-primary" />
              Feedback Summary
            </CardTitle>
            <CardDescription>
              {rows.length} response{rows.length === 1 ? "" : "s"} · {firstTimers} first-time attendee{firstTimers === 1 ? "" : "s"}
            </CardDescription>
          </div>
          {rows.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No feedback submitted yet.</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <RatingStat label="Overall experience" value={stats.overall.v} count={stats.overall.c} />
                <RatingStat label="Communication" value={stats.communication.v} count={stats.communication.c} />
                <RatingStat label="Lodging" value={stats.lodging.v} count={stats.lodging.c} />
                <RatingStat label="Food" value={stats.food.v} count={stats.food.c} />
                <RatingStat label="Children management" value={stats.children.v} count={stats.children.c} />
              </div>
              {enjoyedCounts.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium mb-2">Most enjoyed</p>
                  <div className="flex flex-wrap gap-2">
                    {enjoyedCounts.map(([k, c]) => (
                      <Badge key={k} variant="secondary">{ENJOY_LABELS[k] || k} · {c}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {parents > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Baby className="h-5 w-5 text-primary" />
              Children's Class
            </CardTitle>
            <CardDescription>
              {parents} parent{parents === 1 ? "" : "s"} indicated their child attended · sent daily: {sentDaily} · sometimes: {sentSometimes} · not sent: {sentNever}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <RatingStat label="Lesson comprehension & retention" value={stats.kidsComprehension.v} count={stats.kidsComprehension.c} />
              <RatingStat label="Daily care of child" value={stats.kidsCare.v} count={stats.kidsCare.c} />
              <RatingStat label="Meals provision" value={stats.kidsMeals.v} count={stats.kidsMeals.c} />
            </div>
          </CardContent>
        </Card>
      )}

      {rows.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Written Responses</CardTitle>
            <CardDescription>Comments shared by attendees</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {rows.map(r => (
              <div key={r.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{format(new Date(r.submitted_at), "PPP")}</span>
                  {r.fellowship && <Badge variant="outline">{r.fellowship}</Badge>}
                  {r.first_time_attending && <Badge variant="secondary">First time</Badge>}
                  {r.kids_attended && <Badge variant="secondary">Parent</Badge>}
                  {r.overall_rating && <Badge>{r.overall_rating}/5</Badge>}
                </div>
                {r.impactful_sessions && <p className="text-sm"><span className="font-medium">Sessions: </span>{r.impactful_sessions}</p>}
                {r.teaching_impact && <p className="text-sm"><span className="font-medium">Impact: </span>{r.teaching_impact}</p>}
                {r.schedule_feedback && <p className="text-sm"><span className="font-medium">Schedule: </span>{r.schedule_feedback}</p>}
                {r.challenges && <p className="text-sm"><span className="font-medium">Challenges: </span>{r.challenges}</p>}
                {r.future_topics && <p className="text-sm"><span className="font-medium">Future topics: </span>{r.future_topics}</p>}
                {r.suggestions && <p className="text-sm"><span className="font-medium">Suggestions: </span>{r.suggestions}</p>}
                {r.kids_remarks && <p className="text-sm"><span className="font-medium">Children's class: </span>{r.kids_remarks}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Testimonies</CardTitle>
          <CardDescription>Approve testimonies to publish them on the public event page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!testimonials?.length ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No testimonies yet.</p>
          ) : (
            testimonials.map(t => (
              <div key={t.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-sm text-muted-foreground">{t.role}</span>
                  <Badge
                    variant={t.status === "approved" ? "default" : t.status === "hidden" ? "outline" : "secondary"}
                    className="capitalize"
                  >
                    {t.status}
                  </Badge>
                </div>
                <p className="text-sm whitespace-pre-wrap">{t.content}</p>
                <div className="flex gap-2">
                  {t.status !== "approved" && (
                    <Button size="sm" onClick={() => setStatus(t.id, "approved")} disabled={updateStatus.isPending}>
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                  )}
                  {t.status !== "hidden" && (
                    <Button size="sm" variant="outline" onClick={() => setStatus(t.id, "hidden")} disabled={updateStatus.isPending}>
                      <EyeOff className="h-4 w-4 mr-1" /> Hide
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EventFeedbackPanel;
