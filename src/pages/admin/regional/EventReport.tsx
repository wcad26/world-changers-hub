import React from "react";
import { useParams } from "@/lib/router-compat";
import { useAuth } from "@/hooks/useAuth";
import EventReportView from "@/components/admin/EventReportView";
import { Skeleton } from "@/components/ui/skeleton";

const EventReport: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { userRegion, loading: authLoading } = useAuth();

  if (authLoading || !userRegion) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <EventReportView
      eventId={eventId}
      regionId={userRegion.id}
      backTo="/admin/regional/events"
    />
  );
};

export default EventReport;
