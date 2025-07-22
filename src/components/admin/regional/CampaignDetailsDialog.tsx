
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, DollarSign, Users, Share2, Edit, Copy } from "lucide-react";
import { useCampaignDonations, type FundraisingCampaign } from "@/hooks/useFundraisingCampaigns";
import { toast } from "@/hooks/use-toast";

interface CampaignDetailsDialogProps {
  campaign: FundraisingCampaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CampaignDetailsDialog: React.FC<CampaignDetailsDialogProps> = ({ 
  campaign, 
  open, 
  onOpenChange 
}) => {
  const { data: donations = [], isLoading: donationsLoading } = useCampaignDonations(campaign?.id || '');

  if (!campaign) return null;

  const raisedAmount = campaign.raised / 100;
  const goalAmount = campaign.goal / 100;
  const progress = Math.round((raisedAmount / goalAmount) * 100);

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/fundraising/${campaign.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied",
      description: "Campaign link has been copied to clipboard",
    });
  };

  const handleDuplicate = () => {
    toast({
      title: "Campaign Duplicated",
      description: "A copy of this campaign has been created",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{campaign.name}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campaign Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Amount Raised</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${raisedAmount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  of ${goalAmount.toLocaleString()} goal
                </p>
                <Progress value={progress} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Donors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{donations.length}</div>
                <p className="text-xs text-muted-foreground">
                  {donations.length === 1 ? 'supporter' : 'supporters'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge variant={campaign.status === 'Active' ? 'default' : 'secondary'}>
                  {campaign.status}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Details Tabs */}
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="donations">Donations ({donations.length})</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {campaign.description || "No description provided"}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="donations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Donations</CardTitle>
                </CardHeader>
                <CardContent>
                  {donationsLoading ? (
                    <div className="text-center py-4">Loading donations...</div>
                  ) : donations.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Donor</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Message</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {donations.map((donation) => (
                          <TableRow key={donation.id}>
                            <TableCell>
                              {donation.anonymous ? "Anonymous" : donation.donor_name || "Anonymous"}
                            </TableCell>
                            <TableCell>${(donation.amount / 100).toLocaleString()}</TableCell>
                            <TableCell>
                              {new Date(donation.donation_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {donation.message || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No donations received yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{progress}%</div>
                      <p className="text-sm text-muted-foreground">Goal Achieved</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        ${donations.length > 0 ? Math.round((raisedAmount / donations.length)) : 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Avg Donation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignDetailsDialog;
