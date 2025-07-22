import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFundraisingCampaigns, useFundraisingAnalytics } from "@/hooks/useFundraisingCampaigns";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, DollarSign, Target, TrendingUp, Users } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface FundraisingTabProps {
  selectedPeriod: string;
}

const FundraisingTab: React.FC<FundraisingTabProps> = ({ selectedPeriod }) => {
  const { data: campaigns, isLoading: campaignsLoading, isError: campaignsError } = useFundraisingCampaigns();
  const { data: analytics, isLoading: analyticsLoading } = useFundraisingAnalytics();

  const isLoading = campaignsLoading || analyticsLoading;

  // Generate trend data for the selected period
  const generateTrendData = () => {
    const data = [];
    const today = new Date();
    const days = selectedPeriod === '1-month' ? 30 : selectedPeriod === '3-months' ? 90 : 365;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        raised: Math.floor(Math.random() * 5000) + 1000,
        goal: Math.floor(Math.random() * 2000) + 3000,
        donors: Math.floor(Math.random() * 20) + 5
      });
    }
    return data;
  };

  const trendData = generateTrendData();

  if (campaignsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load fundraising data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const kpis = [
    {
      title: "Total Raised",
      value: formatCurrency(analytics?.totalRaised || 0),
      description: "This period",
      icon: DollarSign,
      trend: "+12.5%",
      trendUp: true
    },
    {
      title: "Active Campaigns",
      value: analytics?.activeCampaigns || 0,
      description: "Currently running",
      icon: Target,
      trend: "+2",
      trendUp: true
    },
    {
      title: "Total Donors",
      value: analytics?.totalDonors || 0,
      description: "Unique contributors",
      icon: Users,
      trend: "+8.3%",
      trendUp: true
    },
    {
      title: "Success Rate",
      value: "78%",
      description: "Goals achieved",
      icon: TrendingUp,
      trend: "+5.2%",
      trendUp: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={`inline-flex items-center ${kpi.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.trend}
                </span>
                {' '}{kpi.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trend Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Fundraising Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Fundraising Progress</CardTitle>
            <CardDescription>Daily raised amounts vs goals</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  formatter={(value, name) => [`$${value}`, name === 'raised' ? 'Raised' : 'Goal']}
                />
                <Line 
                  type="monotone" 
                  dataKey="raised" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="goal" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donor Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Donor Activity</CardTitle>
            <CardDescription>Daily donor participation</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  formatter={(value) => [value, 'Donors']}
                />
                <Bar 
                  dataKey="donors" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>Overview of active campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns?.slice(0, 5).map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">{campaign.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(campaign.raised)} of {formatCurrency(campaign.goal)}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-medium">
                    {Math.round((campaign.raised / campaign.goal) * 100)}%
                  </p>
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((campaign.raised / campaign.goal) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )) || (
              <p className="text-center text-muted-foreground py-8">
                No active campaigns found.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FundraisingTab;