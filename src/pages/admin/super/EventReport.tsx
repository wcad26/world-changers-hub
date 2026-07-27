import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import EventReportView from "@/components/admin/EventReportView";
import { Badge } from "@/components/ui/badge";
import { Globe } from "lucide-react";

const SuperEventReport: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const { data: eventMeta } = useQuery({
    queryKey: ["super_event_report_meta", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, region_id, regions:region_id (name)")
        .eq("id", eventId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const regionName = (eventMeta as any)?.regions?.name as string | undefined;

  return (
    <EventReportView
      eventId={eventId}
      regionId={eventMeta?.region_id ?? null}
      backTo="/admin/super/events"
      headerSuffix={
        eventMeta ? (
          eventMeta.region_id ? (
            <Badge variant="outline">{regionName || "Regional"}</Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <Globe className="h-3 w-3" /> Global
            </Badge>
          )
        ) : null
      }
    />
  );
};

export default SuperEventReport;
