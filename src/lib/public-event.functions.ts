import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { isUUID } from "@/utils/slugUtils";

const inputSchema = z.object({ identifier: z.string().min(1).max(180) });

function createPublicClient() {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error("Public event data is temporarily unavailable.");

  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const getPublicEventDetail = createServerFn({ method: "GET" })
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const select = "*";
    const currentQuery = supabase.from("events").select(select).eq("is_public", true);
    const current = isUUID(data.identifier)
      ? await currentQuery.eq("id", data.identifier).maybeSingle()
      : await currentQuery.eq("slug", data.identifier).maybeSingle();

    if (current.error) throw new Error("Unable to load this event right now.");

    let event = current.data;
    let redirectSlug: string | null = null;

    if (!event && !isUUID(data.identifier)) {
      const history = await supabase
        .from("event_slug_history")
        .select("event_id")
        .eq("old_slug", data.identifier)
        .maybeSingle();
      if (history.error) throw new Error("Unable to resolve this event link.");
      if (history.data?.event_id) {
        const historical = await supabase
          .from("events")
          .select(select)
          .eq("id", history.data.event_id)
          .eq("is_public", true)
          .maybeSingle();
        if (historical.error) throw new Error("Unable to load this event right now.");
        event = historical.data;
        redirectSlug = historical.data?.slug ?? null;
      }
    }

    if (!event) return { event: null, hero: null, redirectSlug: null };

    const images = await supabase
      .from("event_images")
      .select("image_url,image_url_fr,display_order")
      .eq("event_id", event.id)
      .eq("is_hero_image", true)
      .order("display_order", { ascending: true })
      .limit(1);
    if (images.error) throw new Error("Unable to load this event's images.");

    return { event, hero: images.data?.[0] ?? null, redirectSlug };
  });

export const publicEventQueryOptions = (identifier: string) => queryOptions({
  queryKey: ["public-event-detail", identifier],
  queryFn: () => getPublicEventDetail({ data: { identifier } }),
  staleTime: 60_000,
});