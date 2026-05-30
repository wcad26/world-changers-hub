import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Event } from "@/hooks/useEvents";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
}

type FamilyRow = { email: string; relationship_type: string; status?: "unknown" | "known" | "checking" };

const REL_OPTIONS = [
  { value: "spouse", label: "Spouse" },
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "sibling", label: "Sibling" },
  { value: "guardian", label: "Guardian" },
  { value: "other", label: "Other" },
];

export function EventPreRegistrationDialog({ open, onOpenChange, event }: Props) {
  const { toast } = useToast();
  const [type, setType] = useState<"individual" | "family">("individual");
  const [primaryEmail, setPrimaryEmail] = useState("");
  const [primaryStatus, setPrimaryStatus] = useState<"idle" | "checking" | "known" | "unknown">("idle");
  const [family, setFamily] = useState<FamilyRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const lookup = async (email: string): Promise<boolean> => {
    const { data, error } = await supabase.functions.invoke("event-pre-register-lookup", {
      body: { email },
    });
    if (error) return false;
    return !!data?.found;
  };

  const checkPrimary = async () => {
    if (!primaryEmail) return;
    setPrimaryStatus("checking");
    const found = await lookup(primaryEmail.trim().toLowerCase());
    setPrimaryStatus(found ? "known" : "unknown");
  };

  const checkFamilyRow = async (i: number) => {
    const row = family[i];
    if (!row?.email) return;
    setFamily((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "checking" } : r)));
    const found = await lookup(row.email.trim().toLowerCase());
    setFamily((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: found ? "known" : "unknown" } : r)));
  };

  const addRow = () => setFamily((prev) => [...prev, { email: "", relationship_type: "spouse" }]);
  const removeRow = (i: number) => setFamily((prev) => prev.filter((_, idx) => idx !== i));

  const onboardLink = (email?: string) => {
    // For regional events we can route to /member/register/<code>; for global, fallback to /member/register
    const params = email ? `?email=${encodeURIComponent(email)}` : "";
    return `/member/register${params}`;
  };

  const canSubmit =
    primaryStatus === "known" &&
    (type === "individual" ||
      (family.length > 0 && family.every((r) => r.email && r.status === "known" && r.relationship_type)));

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("event-pre-register", {
        body: {
          event_id: event.id,
          registration_type: type,
          primary_email: primaryEmail.trim().toLowerCase(),
          family: type === "family" ? family.map((r) => ({ email: r.email.trim().toLowerCase(), relationship_type: r.relationship_type })) : [],
        },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      setDone(true);
      toast({ title: "You're in!", description: `Reserved ${(data as any)?.registered ?? 1} spot(s).` });
    } catch (e: any) {
      toast({ title: "Could not reserve", description: e.message || "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(() => {
      setType("individual");
      setPrimaryEmail("");
      setPrimaryStatus("idle");
      setFamily([]);
      setDone(false);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : close())}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Reserve your spot</DialogTitle>
          <DialogDescription>{event.name}</DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 mx-auto text-primary" />
            <p className="font-semibold">You're registered!</p>
            <p className="text-sm text-muted-foreground">We look forward to seeing you at the event.</p>
            <Button onClick={close}>Close</Button>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-3 -mr-3">
            <div className="space-y-5 py-2">
              <div>
                <Label className="mb-2 block">Registering as</Label>
                <RadioGroup value={type} onValueChange={(v) => setType(v as any)} className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="individual" /> Individual
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="family" /> Family
                  </label>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Your email</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={primaryEmail}
                    onChange={(e) => { setPrimaryEmail(e.target.value); setPrimaryStatus("idle"); }}
                    placeholder="you@example.com"
                  />
                  <Button type="button" variant="outline" onClick={checkPrimary} disabled={!primaryEmail || primaryStatus === "checking"}>
                    {primaryStatus === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                  </Button>
                </div>
                {primaryStatus === "known" && (
                  <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Verified</p>
                )}
                {primaryStatus === "unknown" && (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                    <span>
                      We don't have this email in our system.{" "}
                      <a href={onboardLink(primaryEmail)} className="underline font-medium" target="_blank" rel="noreferrer">
                        Onboard first
                      </a>, then come back.
                    </span>
                  </div>
                )}
              </div>

              {type === "family" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Family members</Label>
                    <Button type="button" size="sm" variant="outline" onClick={addRow}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                  {family.length === 0 && (
                    <p className="text-xs text-muted-foreground">Add each family member's email and relationship to you.</p>
                  )}
                  {family.map((row, i) => (
                    <div key={i} className="border rounded p-3 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="member@example.com"
                          value={row.email}
                          onChange={(e) => setFamily((prev) => prev.map((r, idx) => idx === i ? { ...r, email: e.target.value, status: undefined } : r))}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(i)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Select value={row.relationship_type} onValueChange={(v) => setFamily((prev) => prev.map((r, idx) => idx === i ? { ...r, relationship_type: v } : r))}>
                          <SelectTrigger className="flex-1"><SelectValue placeholder="Relationship" /></SelectTrigger>
                          <SelectContent>
                            {REL_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="sm" onClick={() => checkFamilyRow(i)} disabled={!row.email || row.status === "checking"}>
                          {row.status === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                        </Button>
                      </div>
                      {row.status === "known" && (
                        <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Verified</p>
                      )}
                      {row.status === "unknown" && (
                        <p className="text-xs text-amber-700">
                          Not in system.{" "}
                          <a href={onboardLink(row.email)} className="underline" target="_blank" rel="noreferrer">Onboard this person</a>, then verify again.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {!done && (
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={submit} disabled={!canSubmit || submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Reserving...</> : "Reserve spot"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
