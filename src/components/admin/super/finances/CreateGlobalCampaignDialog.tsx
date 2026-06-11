import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useCreateGlobalCampaign } from "@/hooks/useGlobalFundraising";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const CreateGlobalCampaignDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const { data: currencies = [] } = useCurrencies();
  const create = useCreateGlobalCampaign();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [isPublic, setIsPublic] = useState(true);

  const submit = async () => {
    if (!name || !description || !goal || !startDate) {
      toast({ title: "Missing fields", description: "All fields except end date are required.", variant: "destructive" });
      return;
    }
    try {
      await create.mutateAsync({
        name,
        description,
        goal: Number(goal),
        start_date: startDate,
        end_date: endDate || null,
        currency_code: currency,
        is_public: isPublic,
      });
      toast({ title: "Global campaign created" });
      setName(""); setDescription(""); setGoal(""); setEndDate("");
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message || "Unknown error", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Global Campaign</DialogTitle>
          <DialogDescription>This campaign is owned by the Super Admin and is not attributed to any region.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Goal</Label>
              <Input type="number" min="0" step="0.01" value={goal} onChange={(e) => setGoal(e.target.value)} />
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.code} — {c.symbol}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End Date (optional)</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2">
            <div>
              <Label>Public Campaign</Label>
              <p className="text-xs text-muted-foreground">Show on the public fundraising page</p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending}>{create.isPending ? "Creating…" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGlobalCampaignDialog;
