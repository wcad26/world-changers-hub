import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/EventDetail";
import { supabase } from "@/integrations/supabase/client";
import { isUUID } from "@/utils/slugUtils";

const SITE_URL = "https://wcaglobal.org";

function plainText(value: string | null | undefined) {
  return (value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export const Route = createFileRoute("/events/$eventId")({
  loader: async ({ params }) => {
    const query = supabase.from("events").select("id,slug,name,name_fr,description,description_fr,image_url,image_url_fr,is_public");
    const { data } = isUUID(params.eventId)
      ? await query.eq("id", params.eventId).eq("is_public", true).maybeSingle()
      : await query.eq("slug", params.eventId).eq("is_public", true).maybeSingle();
    if (!data) return null;

    const { data: images } = await supabase
      .from("event_images")
      .select("image_url,image_url_fr,display_order")
      .eq("event_id", data.id)
      .eq("is_hero_image", true)
      .order("display_order", { ascending: true })
      .limit(1);
    return { event: data, hero: images?.[0] ?? null };
  },
  head: ({ loaderData, params }) => {
    const event = loaderData?.event;
    if (!event) return {};
    const title = `${event.name} | World Changers Association`;
    const description = plainText(event.description) || "View event details and registration information from World Changers Association.";
    const image = loaderData?.hero?.image_url || event.image_url || undefined;
    const canonical = `${SITE_URL}/events/${event.slug || params.eventId}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonical },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: Page,
});
