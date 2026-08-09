import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EventFeedbackRow {
  id: string;
  event_id: string;
  member_id: string;
  first_time_attending: boolean | null;
  fellowship: string | null;
  overall_rating: number | null;
  communication_rating: number | null;
  lodging_rating: number | null;
  food_rating: number | null;
  children_management_rating: number | null;
  teaching_impact: string | null;
  schedule_feedback: string | null;
  impactful_sessions: string | null;
  enjoyed_most: string[] | null;
  enjoyed_most_other: string | null;
  challenges: string | null;
  future_topics: string | null;
  suggestions: string | null;
  kids_attended: boolean | null;
  kids_daily_attendance: string | null;
  kids_comprehension_rating: number | null;
  kids_care_rating: number | null;
  kids_meals_rating: number | null;
  kids_remarks: string | null;
  submitted_at: string;
}

export interface EventTestimonialRow {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number | null;
  status: string;
  submitted_at: string | null;
  created_at: string;
}

export function useEventFeedback(eventId?: string) {
  return useQuery({
    queryKey: ["event-feedback", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_feedback")
        .select("*")
        .eq("event_id", eventId!)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as EventFeedbackRow[];
    },
  });
}

export function useEventTestimonialsAdmin(eventId?: string) {
  return useQuery({
    queryKey: ["event-testimonials-admin", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_testimonials")
        .select("id, name, role, content, rating, status, submitted_at, created_at")
        .eq("event_id", eventId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as EventTestimonialRow[];
    },
  });
}

export function useUpdateTestimonialStatus(eventId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "pending" | "hidden" }) => {
      const { error } = await supabase
        .from("event_testimonials")
        .update({ status } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-testimonials-admin", eventId] });
      qc.invalidateQueries({ queryKey: ["event-testimonials", eventId] });
    },
  });
}
