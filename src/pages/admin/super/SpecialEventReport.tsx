import SpecialEventReportView from "@/components/admin/SpecialEventReportView";
import { useParams } from "@/lib/router-compat";

export default function SpecialEventReport() {
  const { eventId } = useParams<{ eventId: string }>();

  return (
    <SpecialEventReportView
      eventId={eventId}
      backTo="/admin/super/events"
      showRegionFilter
    />
  );
}