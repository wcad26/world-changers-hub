import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Loader2, Eye, HeartHandshake } from "lucide-react";
import { useFundraisingCampaigns, type FundraisingCampaign } from "@/hooks/useFundraisingCampaigns";
import CreateFundraisingCampaignDialog from "@/components/admin/regional/CreateFundraisingCampaignDialog";
import CampaignDetailsDialog from "@/components/admin/regional/CampaignDetailsDialog";
import RecordDonationDialog from "@/components/admin/regional/finances/RecordDonationDialog";
import { useAuth } from "@/hooks/useAuth";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { formatCurrencyWithSymbol } from "@/utils/currencyUtils";

/**
 * Fundraising tab content rendered inside the Finance Management page.
 * KPI cards live in the parent FundraisingLedgerTab; this component handles
 * filters, campaign list and dialogs.
 */
const FundraisingTabContent: React.FC = () => {
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  const fc = (n: number) => formatCurrencyWithSymbol(n, regionCurrency);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [donationDialogOpen, setDonationDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<FundraisingCampaign | null>(null);

  const { data: campaigns = [], isLoading: campaignsLoading } = useFundraisingCampaigns({ status: statusFilter });

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleViewDetails = (campaign: FundraisingCampaign) => {
    setSelectedCampaign(campaign);
    setDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm px-2.5 py-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 bg-background/60 border-border/40"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-9 bg-background/60 border-border/40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setDonationDialogOpen(true)}
            className="border-border/60 bg-card/60 backdrop-blur-sm"
          >
            <HeartHandshake className="mr-2 h-4 w-4" /> Record Donation
          </Button>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-primary-foreground shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" /> New Campaign
          </Button>
        </div>
      </div>

      {/* Campaigns panel */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <HeartHandshake className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-base font-semibold text-foreground">Fundraising Campaigns</h3>
            <p className="text-xs text-muted-foreground">All fundraising campaigns in your region</p>
          </div>
        </div>
        {campaignsLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading campaigns...
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No campaigns found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/30">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Raised</TableHead>
                  <TableHead className="text-right">Goal</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => {
                  const raised = (campaign.raised || 0) / 100;
                  const goal = (campaign.goal || 0) / 100;
                  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
                  return (
                    <TableRow key={campaign.id} className="border-border/20 hover:bg-muted/30">
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <Badge variant={campaign.status === "Active" ? "default" : "secondary"}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-48">
                        <div className="space-y-1">
                          <Progress value={pct} className="h-2" />
                          <p className="text-xs text-muted-foreground">{pct}%</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">{fc(raised)}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{fc(goal)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(campaign)}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <CreateFundraisingCampaignDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <CampaignDetailsDialog
        campaign={selectedCampaign}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </div>
  );
};

export default FundraisingTabContent;
