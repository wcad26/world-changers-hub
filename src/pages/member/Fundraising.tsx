import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, DollarSign, Target, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MemberFundraising() {
  const { toast } = useToast();
  const [donationDialogOpen, setDonationDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const handleDonation = (campaign: any, amount: number | 'custom') => {
    setSelectedCampaign(campaign);
    if (amount === 'custom') {
      setSelectedAmount(null);
      setCustomAmount('');
    } else {
      setSelectedAmount(amount);
      setCustomAmount('');
    }
    setDonationDialogOpen(true);
  };

  const processDonation = () => {
    const donationAmount = selectedAmount || parseFloat(customAmount);
    
    if (!donationAmount || donationAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount.",
        variant: "destructive",
      });
      return;
    }

    // Simulate donation processing
    toast({
      title: "Donation Successful! 🎉",
      description: `Thank you for your $${donationAmount} donation to ${selectedCampaign?.name}. Your generosity makes a difference!`,
    });

    setDonationDialogOpen(false);
    setSelectedCampaign(null);
    setSelectedAmount(null);
    setCustomAmount('');
  };
  // Mock active campaigns data for demo purposes
  const mockCampaigns = [
    {
      id: 1,
      name: "New Church Building Fund",
      description: "Help us build a new sanctuary to accommodate our growing congregation and serve the community better.",
      goal: 50000000, // $500,000 in cents
      raised: 32500000, // $325,000 in cents
      start_date: "2024-10-01",
      end_date: "2025-03-31",
      status: "Active"
    },
    {
      id: 2,
      name: "Youth Summer Camp 2025",
      description: "Support our youth ministry by helping fund the annual summer camp experience for 50+ teenagers.",
      goal: 2500000, // $25,000 in cents
      raised: 1850000, // $18,500 in cents
      start_date: "2024-11-01",
      end_date: "2025-02-28",
      status: "Active"
    },
    {
      id: 3,
      name: "Community Food Bank",
      description: "Ongoing support for families in need within our local community. Every contribution makes a difference.",
      goal: 1500000, // $15,000 in cents
      raised: 1650000, // $16,500 in cents (exceeded goal!)
      start_date: "2024-09-15",
      end_date: "2024-12-15", // ended but still accepting donations
      status: "Goal Reached"
    },
    {
      id: 4,
      name: "Mission Trip to Guatemala",
      description: "Help send our mission team to serve communities in Guatemala through medical aid and construction projects.",
      goal: 3000000, // $30,000 in cents
      raised: 3000000, // $30,000 in cents (exactly reached goal!)
      start_date: "2024-08-01",
      end_date: "2024-12-10", // ended but still accepting donations
      status: "Goal Reached"
    },
    {
      id: 5,
      name: "Children's Christmas Program",
      description: "Fund costumes, decorations, and gifts for our annual Christmas program for 100+ children.",
      goal: 800000, // $8,000 in cents
      raised: 950000, // $9,500 in cents (exceeded goal!)
      start_date: "2024-10-15",
      end_date: "2024-12-05", // ended but still accepting donations
      status: "Goal Reached"
    },
    {
      id: 6,
      name: "Senior Ministry Outreach",
      description: "Support our elderly members with transportation, meals, and companionship programs.",
      goal: 1200000, // $12,000 in cents
      raised: 750000, // $7,500 in cents
      start_date: "2024-11-15",
      end_date: "2025-01-31",
      status: "Active"
    }
  ];

  // Enhanced donation history with more variety
  const donationHistory = [
    { id: 1, campaign: "New Church Building Fund", amount: 500, date: "2024-12-15", status: "completed" },
    { id: 2, campaign: "Community Food Bank", amount: 100, date: "2024-12-10", status: "completed" },
    { id: 3, campaign: "Youth Summer Camp 2025", amount: 250, date: "2024-12-05", status: "completed" },
    { id: 4, campaign: "Mission Trip to Guatemala", amount: 200, date: "2024-11-28", status: "completed" },
    { id: 5, campaign: "New Church Building Fund", amount: 300, date: "2024-11-20", status: "completed" },
    { id: 6, campaign: "Community Food Bank", amount: 75, date: "2024-11-15", status: "completed" },
    { id: 7, campaign: "Youth Summer Camp 2025", amount: 150, date: "2024-11-01", status: "completed" },
    { id: 8, campaign: "Mission Trip to Guatemala", amount: 400, date: "2024-10-15", status: "completed" },
  ];

  const totalDonated = donationHistory.reduce((sum, donation) => sum + donation.amount, 0);
  
  // Use mock data instead of hook for demo
  const campaigns = mockCampaigns;
  const isLoading = false;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">${totalDonated}</p>
                <p className="text-sm text-muted-foreground">Total Donated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-foreground">{campaigns?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-foreground">{donationHistory.length}</p>
                <p className="text-sm text-muted-foreground">Donations Made</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="campaigns">Active Campaigns</TabsTrigger>
          <TabsTrigger value="history">My Donations</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          {campaigns?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Active Campaigns</h3>
                <p className="text-muted-foreground">
                  There are currently no fundraising campaigns available.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {campaigns?.map((campaign) => {
                const progressPercentage = Math.min((campaign.raised / campaign.goal) * 100, 100);
                const remainingDays = Math.ceil((new Date(campaign.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const isGoalReached = campaign.raised >= campaign.goal;
                const hasEnded = remainingDays <= 0;
                
                return (
                  <Card key={campaign.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{campaign.name}</CardTitle>
                          <CardDescription>{campaign.description}</CardDescription>
                        </div>
                        <div className="flex flex-col gap-1">
                          {isGoalReached ? (
                            <Badge variant="default" className="bg-green-600">
                              🎉 Goal Reached!
                            </Badge>
                          ) : hasEnded ? (
                            <Badge variant="secondary">
                              Open Campaigns
                            </Badge>
                          ) : (
                            <Badge variant="default">
                              {remainingDays} days left
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium text-foreground">
                              ${(campaign.raised / 100).toFixed(2)} / ${(campaign.goal / 100).toFixed(2)}
                              {isGoalReached && (
                                <span className="text-green-600 ml-1">✓</span>
                              )}
                            </span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {isGoalReached 
                              ? `Goal exceeded by $${((campaign.raised - campaign.goal) / 100).toFixed(2)}! Still accepting donations.`
                              : `${progressPercentage.toFixed(1)}% raised`
                            }
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleDonation(campaign, 25)}
                            variant={isGoalReached ? "outline" : "default"}
                          >
                            Donate $25
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDonation(campaign, 50)}
                          >
                            Donate $50
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDonation(campaign, 'custom')}
                          >
                            Custom Amount
                          </Button>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          <p>Started: {new Date(campaign.start_date).toLocaleDateString()}</p>
                          <p>Ends: {new Date(campaign.end_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {donationHistory.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Donations Yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't made any donations yet. Check out the active campaigns!
                </p>
                <Button variant="outline">View Campaigns</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {donationHistory.map((donation) => (
                <Card key={donation.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-foreground">{donation.campaign}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(donation.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">${donation.amount}</p>
                        <Badge variant="default">Completed</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-foreground">Total Donations</h4>
                    <p className="text-xl font-bold text-primary">${totalDonated}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Donation Dialog */}
      <Dialog open={donationDialogOpen} onOpenChange={setDonationDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Make a Donation</DialogTitle>
            <DialogDescription>
              {selectedCampaign && `Support the ${selectedCampaign.name} campaign`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Campaign Info */}
            {selectedCampaign && (
              <div className="p-4 bg-accent rounded-lg">
                <h4 className="font-medium text-foreground">{selectedCampaign.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  ${(selectedCampaign.raised / 100).toFixed(2)} of ${(selectedCampaign.goal / 100).toFixed(2)} raised
                </p>
                <Progress 
                  value={(selectedCampaign.raised / selectedCampaign.goal) * 100} 
                  className="h-2 mt-2" 
                />
              </div>
            )}

            {/* Amount Selection */}
            <div className="space-y-3">
              <Label>Donation Amount</Label>
              
              {selectedAmount ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5">
                  <span className="font-medium">${selectedAmount}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedAmount(null)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    type="number"
                    placeholder="Enter custom amount"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    min="1"
                    step="0.01"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your desired donation amount in dollars
                  </p>
                </div>
              )}
            </div>

            {/* Payment Method Info */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                💳 This is a demo. In a real implementation, this would integrate with Stripe or another payment processor.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDonationDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={processDonation}
              disabled={!selectedAmount && (!customAmount || parseFloat(customAmount) <= 0)}
            >
              <Heart className="h-4 w-4 mr-2" />
              Donate {selectedAmount ? `$${selectedAmount}` : customAmount ? `$${customAmount}` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}