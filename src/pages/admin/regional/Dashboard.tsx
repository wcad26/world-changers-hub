
import React, { useState, useMemo } from "react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
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

// Import our new dashboard components
import DashboardFilters, { DashboardFilters as DashboardFiltersType } from "@/components/admin/regional/dashboard/DashboardFilters";
import KPICards from "@/components/admin/regional/dashboard/KPICards";
import MembersTab from "@/components/admin/regional/dashboard/tabs/MembersTab";
import EventsTab from "@/components/admin/regional/dashboard/tabs/EventsTab";
import FinanceTab from "@/components/admin/regional/dashboard/tabs/FinanceTab";
import DCGTab from "@/components/admin/regional/dashboard/tabs/DCGTab";
import LocationsTab from "@/components/admin/regional/dashboard/tabs/LocationsTab";

const RegionalDashboard: React.FC = () => {
  const { userRegion } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Initialize filters state
  const [filters, setFilters] = useState<DashboardFiltersType>({
    dateRange: { from: undefined, to: undefined },
    quickDateRange: 'this-month',
    search: '',
    status: 'all',
    category: 'all'
  });

  // Fetch all data
  const { data: reports, isLoading: reportsLoading, isError: reportsError, error: reportsErrorDetail } = useRegionalReports();
  const { data: members, isLoading: membersLoading } = useMembers(userRegion?.id);
  const { data: events, isLoading: eventsLoading } = useRegionalEvents();
  const { data: financialSummary, isLoading: financialsLoading } = useFinancialSummary();
  const { data: dcgs, isLoading: dcgsLoading } = useDcgs();
  const { data: locations, isLoading: locationsLoading } = useLocations(userRegion?.id);

  // Handle filter changes
  const handleFiltersChange = (newFilters: Partial<DashboardFiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Calculate KPI data based on fetched data
  const kpiData = useMemo(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Members data
    const totalMembers = members?.length || 0;
    const newMembers = members?.filter(m => 
      m.created_at && new Date(m.created_at) >= thisMonth
    ).length || 0;
    const activeMembers = members?.filter(m => m.status === 'active').length || totalMembers;
    const lastMonthMembers = members?.filter(m => 
      m.created_at && new Date(m.created_at) >= lastMonth && new Date(m.created_at) < thisMonth
    ).length || 0;
    const memberGrowth = lastMonthMembers > 0 ? ((newMembers - lastMonthMembers) / lastMonthMembers) * 100 : 0;

    // Events data
    const totalEvents = events?.length || 0;
    const upcomingEvents = events?.filter(e => new Date(e.start_datetime) > now).length || 0;
    const avgAttendance = reports?.kpis?.averageAttendance || 0;
    const completionRate = totalEvents > 0 ? 
      ((totalEvents - upcomingEvents) / totalEvents) * 100 : 0;

    // Finance data
    const totalIncome = financialSummary?.total_income || 0;
    const totalExpenses = financialSummary?.total_expenses || 0;
    const netBalance = financialSummary?.net_balance || 0;
    const financeGrowth = reports?.kpis?.totalIncome || 0;

    // DCG data
    const totalDcgs = dcgs?.length || 0;
    const activeDcgs = dcgs?.filter(d => d.is_active).length || 0;
    const dcgMembers = dcgs?.reduce((sum, dcg) => sum + (dcg.member_count || 0), 0) || 0;
    const dcgAttendance = 85; // Mock data - would need attendance tracking

    // Locations data
    const totalLocations = locations?.length || 0;
    const activeLocations = locations?.filter(l => l.status === 'Active').length || 0;
    const totalCapacity = locations?.reduce((sum, loc) => sum + (loc.capacity || 0), 0) || 0;
    const utilizationRate = 75; // Mock data - would need utilization tracking

    return {
      members: {
        total: totalMembers,
        new: newMembers,
        active: activeMembers,
        growth: memberGrowth
      },
      events: {
        total: totalEvents,
        upcoming: upcomingEvents,
        attendance: avgAttendance,
        completion: completionRate
      },
      finance: {
        income: totalIncome,
        expenses: totalExpenses,
        balance: netBalance,
        growth: financeGrowth
      },
      dcg: {
        total: totalDcgs,
        active: activeDcgs,
        members: dcgMembers,
        attendance: dcgAttendance
      },
      locations: {
        total: totalLocations,
        active: activeLocations,
        capacity: totalCapacity,
        utilization: utilizationRate
      }
    };
  }, [members, events, financialSummary, dcgs, locations, reports]);

  const isLoading = reportsLoading || membersLoading || eventsLoading || 
                   financialsLoading || dcgsLoading || locationsLoading;

  if (reportsError) {
    return (
      <RegionalAdminLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading dashboard</AlertTitle>
          <AlertDescription>
            {reportsErrorDetail instanceof Error ? reportsErrorDetail.message : "An unknown error occurred."}
          </AlertDescription>
        </Alert>
      </RegionalAdminLayout>
    );
  }

  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        {/* Filters */}
        <DashboardFilters 
          filters={filters}
          onFiltersChange={handleFiltersChange}
          activeTab={activeTab}
        />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
            <TabsTrigger value="dcg">DCG</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
          </TabsList>

          {/* KPI Cards */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <KPICards data={kpiData} activeTab={activeTab} />
            </div>
          )}

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Overview cards would go here - simplified for now */}
              <div className="text-center py-12 text-muted-foreground">
                <h3 className="text-lg font-medium mb-2">Dashboard Overview</h3>
                <p>Switch between tabs to view detailed reports for each area.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="members">
            <MembersTab filters={filters} />
          </TabsContent>

          <TabsContent value="events">
            <EventsTab filters={filters} />
          </TabsContent>

          <TabsContent value="finance">
            <FinanceTab filters={filters} />
          </TabsContent>

          <TabsContent value="dcg">
            <DCGTab filters={filters} />
          </TabsContent>

          <TabsContent value="locations">
            <LocationsTab filters={filters} />
          </TabsContent>
        </Tabs>
      </div>
    </RegionalAdminLayout>
  );
};

export default RegionalDashboard;
