
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Users, Plus, Search, Loader2, Eye } from "lucide-react";
import { useFundraisingCampaigns, type FundraisingCampaign } from "@/hooks/useFundraisingCampaigns";
import CreateFundraisingCampaignDialog from "@/components/admin/regional/CreateFundraisingCampaignDialog";
import CampaignDetailsDialog from "@/components/admin/regional/CampaignDetailsDialog";

const RegionalFundraising: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<FundraisingCampaign | null>(null);
  
  const { data: campaigns = [], isLoading: campaignsLoading } = useFundraisingCampaigns({ status: statusFilter });

  const filteredCampaigns = campaigns.filter(campaign => 
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCampaigns = filteredCampaigns.filter(campaign => campaign.status === "Active");
  const completedCampaigns = filteredCampaigns.filter(campaign => campaign.status === "Completed");

  const handleCampaignDetails = (campaign: FundraisingCampaign) => {
    setSelectedCampaign(campaign);
    setDetailsDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Fundraising Management</h2>
            <p className="text-muted-foreground">
              Manage fundraising campaigns and track donation progress.
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>
        
        <Tabs defaultValue="active">
          <TabsList className="grid grid-cols-1 md:grid-cols-2 w-full max-w-md">
            <TabsTrigger value="active">Active Campaigns</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Fundraising Campaigns</CardTitle>
                <CardDescription>
                  View and manage ongoing fundraising initiatives.
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search campaigns..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Campaign
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {campaignsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {activeCampaigns.map((campaign) => {
                      const raisedAmount = campaign.raised / 100;
                      const goalAmount = campaign.goal / 100;
                      const progress = Math.round((raisedAmount / goalAmount) * 100);
                      
                      return (
                        <Card key={campaign.id}>
                          <CardHeader className="pb-2">
                            <CardTitle>{campaign.name}</CardTitle>
                            <CardDescription>
                              {new Date(campaign.start_date).toLocaleDateString()} to {new Date(campaign.end_date).toLocaleDateString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span className="font-medium">{progress}%</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary" 
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-sm pt-1">
                                <span>
                                  <DollarSign className="inline h-3 w-3" /> 
                                  ${raisedAmount.toLocaleString()}
                                </span>
                                <span className="text-muted-foreground">
                                  Goal: ${goalAmount.toLocaleString()}
                                </span>
                              </div>
                              <div className="text-sm">
                                <Users className="inline h-3 w-3 mr-1" /> 
                                {campaign.raised > 0 ? 'View donors' : 'No donors yet'}
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCampaignDetails(campaign)}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              Details
                            </Button>
                            <Button variant="outline" size="sm">
                              Update
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                    
                    {activeCampaigns.length === 0 && (
                      <div className="col-span-2 text-center py-8">
                        {searchTerm ? "No campaigns match your search" : "No active campaigns found"}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Campaigns</CardTitle>
                <CardDescription>
                  View the history of completed fundraising initiatives.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campaign Name</TableHead>
                          <TableHead>Goal</TableHead>
                          <TableHead>Amount Raised</TableHead>
                          <TableHead>Donors</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Success Rate</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaignsLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center h-24">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            </TableCell>
                          </TableRow>
                        ) : completedCampaigns.length > 0 ? (
                          completedCampaigns.map((campaign) => {
                            const raisedAmount = campaign.raised / 100;
                            const goalAmount = campaign.goal / 100;
                            const successRate = Math.round((raisedAmount / goalAmount) * 100);
                            
                            return (
                              <TableRow key={campaign.id}>
                                <TableCell className="font-medium">{campaign.name}</TableCell>
                                <TableCell>${goalAmount.toLocaleString()}</TableCell>
                                <TableCell>${raisedAmount.toLocaleString()}</TableCell>
                                <TableCell>View donors</TableCell>
                                <TableCell>
                                  {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{successRate}%</TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleCampaignDetails(campaign)}
                                    >
                                      View
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      Duplicate
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center h-24">
                              No completed campaigns found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
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
    </>
  );
};

export default RegionalFundraising;
