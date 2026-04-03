import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFundraisingCampaigns, useFundraisingAnalytics } from "@/hooks/useFundraisingCampaigns";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrencyWithSymbol } from "@/utils/currencyUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, DollarSign, Target, TrendingUp, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface FundraisingTabProps {
  selectedPeriod: string;
}

const FundraisingTab: React.FC<FundraisingTabProps> = ({ selectedPeriod }) => {
  const { userRegion } = useAuth();
  const { data: campaigns, isLoading: campaignsLoading, isError: campaignsError } = useFundraisingCampaigns();
  const { data: analytics, isLoading: analyticsLoading } = useFundraisingAnalytics();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);

  const isLoading = campaignsLoading || analyticsLoading;

  const fc = (amount: number) => formatCurrencyWithSymbol(amount, regionCurrency);

  const successRate = useMemo(() => {
    if (!campaigns || campaigns.length === 0) return 0;
    const successful = campaigns.filter(c => c.raised >= c.goal).length;
    return Math.round((successful / campaigns.length) * 100);
  }, [campaigns]);

  // Campaign performance data for chart
  const campaignChartData = useMemo(() => {
    if (!campaigns) return [];
    return campaigns.slice(0, 8).map(c => ({
      name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
      raised: c.raised / 100,
      goal: c.goal / 100,
    }));
  }, [campaigns]);

  if (campaignsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load fundraising data.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const kpis = [
    { label: "Total Raised", value: fc((analytics?.totalRaised || 0) * 100), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: "Active Campaigns", value: analytics?.activeCampaigns || 0, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: "Total Donors", value: analytics?.totalDonors || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: "Success Rate", value: `${successRate}%`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="bg-gradient-to-br from-background to-muted/30 backdrop-blur-sm border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaign Progress Chart */}
      {campaignChartData.length > 0 && (
        <Card className="bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm">Campaign Progress</CardTitle>
            <CardDescription>Raised vs Goal comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={campaignChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip formatter={(value: number) => fc(value * 100)} />
                <Bar dataKey="raised" fill="#22c55e" name="Raised" radius={[4, 4, 0, 0]} />
                <Bar dataKey="goal" fill="hsl(var(--muted-foreground))" name="Goal" radius={[4, 4, 0, 0]} opacity={0.3} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Campaign List */}
      <Card className="bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm">Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {campaigns?.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/10">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{campaign.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {fc(campaign.raised)} of {fc(campaign.goal)}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-medium">
                    {campaign.goal > 0 ? Math.round((campaign.raised / campaign.goal) * 100) : 0}%
                  </p>
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(campaign.goal > 0 ? (campaign.raised / campaign.goal) * 100 : 0, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {(!campaigns || campaigns.length === 0) && (
              <p className="text-center text-muted-foreground py-8 text-sm">No campaigns found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FundraisingTab;
