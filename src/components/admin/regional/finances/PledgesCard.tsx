import React, { useMemo, useState } from "react";
import { ChevronDown, HandCoins, Pencil, Trash2, MoreHorizontal, Search } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCampaignPledgesDetailed, type PledgeRow } from "@/hooks/useCampaignPledgesDetailed";
import EditPledgeDialog from "./EditPledgeDialog";
import RecordDonationDialog from "./RecordDonationDialog";
import { useCurrencies } from "@/hooks/useCurrencies";
import { formatCurrencyWithSymbol } from "@/utils/currencyUtils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  campaignId: string;
}

const PledgesCard: React.FC<Props> = ({ campaignId }) => {
  const { data: rows = [], isLoading } = useCampaignPledgesDetailed(campaignId);
  const { data: currencies = [] } = useCurrencies();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [editing, setEditing] = useState<PledgeRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState<PledgeRow | null>(null);
  const [donateOpen, setDonateOpen] = useState(false);

  const regions = useMemo(() => Array.from(new Set(rows.map((r) => r.region_name))).filter(Boolean), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (regionFilter !== "all" && r.region_name !== regionFilter) return false;
      if (statusFilter !== "all") {
        if (statusFilter === "unpaid" && r.paid > 0) return false;
        if (statusFilter === "partial" && (r.paid <= 0 || r.paid >= r.pledge_amount)) return false;
        if (statusFilter === "fulfilled" && r.paid < r.pledge_amount) return false;
      }
      if (q && !(r.name.toLowerCase().includes(q) || (r.email || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [rows, search, typeFilter, regionFilter, statusFilter]);

  const fmt = (amount: number, code: string) => {
    const cur = currencies.find((c) => c.code?.toLowerCase() === code.toLowerCase()) || null;
    return formatCurrencyWithSymbol(amount, cur);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase
      .from("event_pre_registrations")
      .update({ pledge_amount: 0, pledge_status: "cancelled" })
      .eq("id", deleting.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pledge removed" });
      qc.invalidateQueries({ queryKey: ["campaign_pledges_detailed", campaignId] });
      qc.invalidateQueries({ queryKey: ["campaign_pledges"] });
    }
    setDeleting(null);
  };

  const totalPledged = filtered.length;
  const totalPaid = filtered.filter((r) => r.paid >= r.pledge_amount && r.pledge_amount > 0).length;

  return (
    <>
      <Collapsible defaultOpen={false} className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-6 group">
          <div className="flex items-center gap-2">
            <HandCoins className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold">Pledges</h3>
            <span className="text-xs text-muted-foreground">
              ({totalPaid}/{totalPledged} fulfilled)
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-6 pb-6 space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/60 border-border/50"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="bg-background/60 border-border/50"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="member">Members</SelectItem>
                <SelectItem value="visitor">Visitors</SelectItem>
              </SelectContent>
            </Select>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="bg-background/60 border-border/50"><SelectValue placeholder="Region" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All regions</SelectItem>
                {regions.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-background/60 border-border/50"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <p className="py-8 text-center text-muted-foreground text-sm">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground text-sm">No pledges match the filters.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/30">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Pledge</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id} className="border-border/20">
                      <TableCell className="font-medium">
                        <div>{r.name}</div>
                        {(r.email || r.phone) && (
                          <div className="text-xs text-muted-foreground">{r.email || r.phone}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{r.region_name}</TableCell>
                      <TableCell>
                        <Badge variant={r.type === "member" ? "default" : "secondary"} className="capitalize">
                          {r.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmt(r.pledge_amount, r.pledge_currency_code)}
                      </TableCell>
                      <TableCell className="min-w-[160px]">
                        <div className="flex items-center gap-2">
                          <Progress value={r.paid_pct} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                            {r.paid_pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {fmt(r.paid, r.pledge_currency_code)} paid · {fmt(r.remaining, r.pledge_currency_code)} left
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditing(r); setDonateOpen(true); }}>
                              <HandCoins className="h-4 w-4 mr-2" /> Redeem
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setEditing(r); setEditOpen(true); }}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(r)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      <EditPledgeDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        pledge={editing}
        campaignId={campaignId}
      />

      <RecordDonationDialog
        open={donateOpen}
        onOpenChange={(o) => { setDonateOpen(o); if (!o) setEditing(null); }}
        defaultCampaignId={campaignId}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove pledge?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel <strong>{deleting?.name}</strong>'s pledge of{" "}
              {deleting ? fmt(deleting.pledge_amount, deleting.pledge_currency_code) : ""}.
              Donations already recorded remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={handleDelete}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PledgesCard;
