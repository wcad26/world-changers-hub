import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, DollarSign, Target, Calendar } from 'lucide-react';
import { useFundraisingCampaigns } from '@/hooks/useFundraisingCampaigns';

export default function MemberFundraising() {
  const { data: campaigns, isLoading } = useFundraisingCampaigns({ status: 'Active' });

  // Mock donation history - will be replaced with actual hook when available
  const donationHistory = [
    { id: 1, campaign: "New Church Building", amount: 250, date: "2024-12-01", status: "completed" },
    { id: 2, campaign: "Community Outreach", amount: 100, date: "2024-11-15", status: "completed" },
    { id: 3, campaign: "Youth Program", amount: 75, date: "2024-11-01", status: "completed" },
  ];

  const totalDonated = donationHistory.reduce((sum, donation) => sum + donation.amount, 0);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Fundraising & Giving</h1>
      </div>

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
                const progressPercentage = (campaign.raised / campaign.goal) * 100;
                const remainingDays = Math.ceil((new Date(campaign.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <Card key={campaign.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{campaign.name}</CardTitle>
                          <CardDescription>{campaign.description}</CardDescription>
                        </div>
                        <Badge variant={remainingDays > 0 ? 'default' : 'secondary'}>
                          {remainingDays > 0 ? `${remainingDays} days left` : 'Ended'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium text-foreground">
                              ${(campaign.raised / 100).toFixed(2)} / ${(campaign.goal / 100).toFixed(2)}
                            </span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {progressPercentage.toFixed(1)}% raised
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" disabled={remainingDays <= 0}>
                            Donate $25
                          </Button>
                          <Button size="sm" variant="outline" disabled={remainingDays <= 0}>
                            Donate $50
                          </Button>
                          <Button size="sm" variant="outline" disabled={remainingDays <= 0}>
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
    </div>
  );
}