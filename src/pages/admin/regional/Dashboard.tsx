import React, { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRegionalReports } from "@/hooks/useReports";
import { useMembers } from "@/hooks/useMembers";
import { useRegionalEvents } from "@/hooks/useEvents";
import { useFinancialSummary } from "@/hooks/useFinancials";
import { useDcgs } from "@/hooks/useDCGs";
import { useLocations } from "@/hooks/useLocations";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useRegionCurrency } from "@/hooks/useCurrencies";

import KPICards from "@/components/admin/regional/dashboard/KPICards";
import MembersTab from "@/components/admin/regional/dashboard/tabs/MembersTab";
import EventsTab from "@/components/admin/regional/dashboard/tabs/EventsTab";
import FinanceTab from "@/components/admin/regional/dashboard/tabs/FinanceTab";
import DCGTab from "@/components/admin/regional/dashboard/tabs/DCGTab";
import LocationsTab from "@/components/admin/regional/dashboard/tabs/LocationsTab";
import FundraisingTab from "@/components/admin/regional/dashboard/tabs/FundraisingTab";
import DiscipleshipTab from "@/components/admin/regional/discipleship/DiscipleshipTab";


const RegionalDashboard: React.FC = () => {
  const { userRegion, loading: authLoading } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  const [activeTab, setActiveTab] = useState('members');

  const { data: reports, isLoading: reportsLoading, isError: reportsError, error: reportsErrorDetail } = useRegionalReports();
  const { data: members, isLoading: membersLoading } = useMembers(userRegion?.id);
  const { data: events, isLoading: eventsLoading } = useRegionalEvents();
  const { data: financialSummary, isLoading: financialsLoading } = useFinancialSummary();
  const { data: dcgs, isLoading: dcgsLoading } = useDcgs();
  const { data: locations, isLoading: locationsLoading } = useLocations(userRegion?.id);

  const kpiData = useMemo(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const totalMembers = members?.length || 0;
    const newMembers = members?.filter(m => m.created_at && new Date(m.created_at) >= thisMonth).length || 0;
    const activeMembers = members?.filter(m => m.status === 'active').length || totalMembers;
    const lastMonthMembers = members?.filter(m =>
      m.created_at && new Date(m.created_at) >= lastMonth && new Date(m.created_at) < thisMonth
    ).length || 0;
    const memberGrowth = lastMonthMembers > 0 ? ((newMembers - lastMonthMembers) / lastMonthMembers) * 100 : 0;

    const totalIncome = financialSummary?.total_income || 0;
    const totalExpenses = financialSummary?.total_expenses || 0;
    const netBalance = financialSummary?.net_balance || 0;
    const financeGrowth = reports?.kpis?.totalIncome || 0;

    const totalDcgs = dcgs?.length || 0;
    const activeDcgs = dcgs?.filter(d => d.is_active).length || 0;
    const dcgMembers = dcgs?.reduce((sum, dcg) => sum + (dcg.member_count || 0), 0) || 0;

    const totalLocations = locations?.length || 0;
    const activeLocations = locations?.filter(l => l.status === 'Active').length || 0;
    const totalCapacity = locations?.reduce((sum, loc) => sum + (loc.capacity || 0), 0) || 0;

    return {
      members: { total: totalMembers, new: newMembers, active: activeMembers, growth: memberGrowth },
      finance: { income: totalIncome, expenses: totalExpenses, balance: netBalance, growth: financeGrowth },
      dcg: { total: totalDcgs, active: activeDcgs, members: dcgMembers, attendance: 0 },
      locations: { total: totalLocations, active: activeLocations, capacity: totalCapacity, utilization: 0 }
    };
  }, [members, financialSummary, dcgs, locations, reports]);

  const isLoading = reportsLoading || membersLoading || eventsLoading || financialsLoading || dcgsLoading || locationsLoading;

  if (authLoading || !userRegion) {
    return (
      <>
        <div className="space-y-6">
          <Skeleton className="h-10 w-[600px]" />
          <div className="grid gap-4 md:grid-cols-4 mt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </>
    );
  }

  if (reportsError) {
    return (
      <>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading dashboard</AlertTitle>
          <AlertDescription>
            {reportsErrorDetail instanceof Error ? reportsErrorDetail.message : "An unknown error occurred."}
          </AlertDescription>
        </Alert>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="bg-gradient-to-r from-background/80 to-muted/30 backdrop-blur-sm rounded-2xl p-1.5 border border-border/40 shadow-sm">
            <TabsList className="grid grid-cols-4 md:grid-cols-8 w-full bg-transparent gap-1 h-auto p-0">
              {[
                { value: 'overview', label: 'Overview' },
                { value: 'members', label: 'Members' },
                { value: 'events', label: 'Events' },
                { value: 'finance', label: 'Finance' },
                { value: 'dcg', label: 'DCG' },
                { value: 'locations', label: 'Locations' },
                { value: 'fundraising', label: 'Fundraising' },
                { value: 'discipleship', label: 'Discipleship' },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-xl text-xs md:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>


          {/* Finance/DCG/Locations KPI cards */}
          {['finance', 'dcg', 'locations'].includes(activeTab) && !isLoading && (
            <div className="mt-6">
              <KPICards data={kpiData} activeTab={activeTab} bankBalance={financialSummary?.net_balance || 0} selectedPeriod="1-month" regionCurrency={regionCurrency} />
            </div>
          )}

          <TabsContent value="overview" className="space-y-6 mt-4">
            <div className="bg-gradient-to-br from-card/90 to-muted/20 backdrop-blur-sm rounded-2xl border border-border/30 p-8 text-center shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Dashboard Overview</h3>
              <p className="text-muted-foreground">Switch between tabs to view detailed reports for each area.</p>
            </div>
          </TabsContent>

          <TabsContent value="members"><MembersTab selectedPeriod="1-month" /></TabsContent>
          <TabsContent value="events"><EventsTab selectedPeriod="1-month" /></TabsContent>
          <TabsContent value="finance"><FinanceTab selectedPeriod="1-month" /></TabsContent>
          <TabsContent value="dcg"><DCGTab selectedPeriod="1-month" /></TabsContent>
          <TabsContent value="locations"><LocationsTab selectedPeriod="1-month" /></TabsContent>
          <TabsContent value="fundraising"><FundraisingTab selectedPeriod="1-month" /></TabsContent>
          <TabsContent value="discipleship"><DiscipleshipTab /></TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default RegionalDashboard;
