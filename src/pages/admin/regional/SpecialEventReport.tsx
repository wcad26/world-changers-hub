import SpecialEventReportView from "@/components/admin/SpecialEventReportView";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "@/lib/router-compat";

export default function RegionalSpecialEventReport() {
  const { eventId } = useParams<{ eventId: string }>();
  const { userRegion, loading } = useAuth();

  if (loading || !userRegion) {
    return <div className="p-6"><Skeleton className="h-24 w-full" /></div>;
  }

  return (
    <SpecialEventReportView
      eventId={eventId}
      regionId={userRegion.id}
      backTo="/admin/regional/events"
    />
  );
}