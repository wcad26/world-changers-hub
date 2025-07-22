
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useFundraisingAnalytics } from "@/hooks/useFundraisingCampaigns";

const FundraisingAnalyticsChart: React.FC = () => {
  const { data: analytics, isLoading } = useFundraisingAnalytics();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  // Generate sample trend data for demonstration
  const trendData = [
    { month: 'Jan', raised: 12000, campaigns: 2 },
    { month: 'Feb', raised: 19000, campaigns: 3 },
    { month: 'Mar', raised: 15000, campaigns: 2 },
    { month: 'Apr', raised: 25000, campaigns: 4 },
    { month: 'May', raised: 22000, campaigns: 3 },
    { month: 'Jun', raised: 30000, campaigns: 5 },
  ];

  const campaignPerformance = analytics?.campaigns?.map(campaign => ({
    name: campaign.name.length > 15 ? campaign.name.substring(0, 15) + '...' : campaign.name,
    raised: campaign.raised / 100,
    goal: campaign.goal / 100,
    progress: Math.round((campaign.raised / campaign.goal) * 100)
  })) || [];

  return (
    <div className="space-y-6">
      {/* Fundraising Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Fundraising Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Amount Raised']} />
              <Line type="monotone" dataKey="raised" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Campaign Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campaignPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                name === 'raised' ? `$${Number(value).toLocaleString()}` : `$${Number(value).toLocaleString()}`,
                name === 'raised' ? 'Raised' : 'Goal'
              ]} />
              <Bar dataKey="raised" fill="#8884d8" />
              <Bar dataKey="goal" fill="#82ca9d" opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default FundraisingAnalyticsChart;
