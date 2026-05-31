import React from "react";
import { useRegionalSession } from "@/contexts/regionalSessionContextCore";
import RegionalDashboardView from "@/components/admin/regional/dashboard/RegionalDashboardView";

/**
 * Always render the dashboard view. If the region has not hydrated yet we
 * pass null down — the view shows itself with empty data instead of blanking
 * the whole portal. RLS is the source of truth for what data shows up.
 */
const RegionalDashboard: React.FC = () => {
  const { region: userRegion } = useRegionalSession();
  return <RegionalDashboardView region={userRegion ?? null} />;
};

export default RegionalDashboard;
