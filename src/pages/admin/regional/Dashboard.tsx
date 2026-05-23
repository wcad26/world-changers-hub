import React from "react";
import { useRegionalSession } from "@/contexts/regionalSessionContextCore";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import RegionalDashboardView from "@/components/admin/regional/dashboard/RegionalDashboardView";

const RegionalDashboard: React.FC = () => {
  const { region: userRegion, ready, user, retry: retryRegional, bootstrapAvailable } = useRegionalSession();

  if (!ready) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  if (!userRegion) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <p className="font-medium">We could not resolve your region yet.</p>
            <div className="mt-1 space-y-0.5 text-muted-foreground text-xs">
              <p>{user ? 'Your session exists, but the regional link is still being resolved.' : 'Your session is still loading.'}</p>
              <p>User: {user?.email || user?.id || 'not detected'} · Bootstrap: {bootstrapAvailable ? 'available' : 'missing'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={retryRegional}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return <RegionalDashboardView region={userRegion} />;
};

export default RegionalDashboard;
