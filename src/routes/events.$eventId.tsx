import { createFileRoute, redirect } from "@tanstack/react-router";
import Page from "@/pages/EventDetail";
import { publicEventQueryOptions } from "@/lib/public-event.functions";

const SITE_URL = "https://wcaglobal.org";

function plainText(value: string | null | undefined) {
  return (value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export const Route = createFileRoute("/events/$eventId")({
  loader: async ({ context, params }) => {
    const result = await context.queryClient.ensureQueryData(publicEventQueryOptions(params.eventId));
    if (result.redirectSlug && result.redirectSlug !== params.eventId) {
      throw redirect({ to: "/events/$eventId", params: { eventId: result.redirectSlug }, replace: true });
    }
    return result;
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
  errorComponent: ({ error }) => (
    <main className="grid min-h-screen place-items-center bg-event-background p-6 text-event-foreground">
      <div className="max-w-md text-center" role="alert">
        <h1 className="font-sora text-2xl font-semibold">Event unavailable</h1>
        <p className="mt-3 text-event-muted">{error.message || "This event could not be loaded. Please try again."}</p>
        <a className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-primary-foreground" href="/events">Back to events</a>
      </div>
    </main>
  ),
  notFoundComponent: () => (
    <main className="grid min-h-screen place-items-center bg-event-background p-6 text-event-foreground">
      <div className="max-w-md text-center">
        <h1 className="font-sora text-2xl font-semibold">Event not found</h1>
        <a className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-primary-foreground" href="/events">Back to events</a>
      </div>
    </main>
  ),
  component: Page,
});
