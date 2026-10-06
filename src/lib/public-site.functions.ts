import { queryOptions } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";
import { generateSlug } from "@/utils/slugUtils";

function createPublicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Public content is temporarily unavailable.");

  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers, signal: AbortSignal.timeout(8_000) });
      },
    },
  });
}

export const getAboutContent = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await createPublicClient()
    .from("global_content")
    .select("id,page_type,content,updated_at")
    .eq("page_type", "about_us")
    .maybeSingle();
  if (error) throw new Error("Unable to load About content right now.");
  return data;
});

export const getHomepageContent = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await createPublicClient()
    .from("global_content")
    .select("id,page_type,content,updated_at")
    .eq("page_type", "homepage")
    .maybeSingle();
  if (error) return null;
  return data;
});

export const getFeaturedEvents = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await createPublicClient()
    .from("events")
    .select("*")
    .eq("is_public", true)
    .eq("is_featured", true)
    .gte("start_datetime", new Date().toISOString())
    .order("start_datetime", { ascending: true })
    .limit(4);
  if (error) return [];
  return data ?? [];
});

export const getPublicLocations = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await createPublicClient()
    .from("locations")
    .select("id,name,type,address,city,state,latitude,longitude,contact_phone,contact_person,whatsapp_link,capacity,fellowship_times,image_url,is_featured,region_id,region:regions(id,name)")
    .eq("status", "Active")
    .order("is_featured", { ascending: false })
    .order("name");
  if (error) throw new Error("Unable to load locations right now.");
  return data ?? [];
});

export const getPublicEvents = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await createPublicClient()
    .from("events")
    .select("*")
    .eq("is_public", true)
    .order("start_datetime", { ascending: true });
  if (error) throw new Error("Unable to load events right now.");
  return data ?? [];
});

export const getPublicFundraisingCampaigns = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await createPublicClient()
    .from("fundraising_campaigns")
    .select("*, region:regions(id,name,code)")
    .eq("is_public", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Unable to load fundraising projects right now.");
  return data ?? [];
});

const campaignInput = z.object({ id: z.string().uuid() });
const donationInput = z.object({ campaignId: z.string().uuid(), limit: z.number().int().min(1).max(50) });

export const getPublicFundraisingCampaign = createServerFn({ method: "GET" })
  .validator((input) => campaignInput.parse(input))
  .handler(async ({ data: input }) => {
    const { data, error } = await createPublicClient()
      .from("fundraising_campaigns")
      .select("*, region:regions(id,name,code)")
      .eq("id", input.id)
      .eq("is_public", true)
      .maybeSingle();
    if (error) throw new Error("Unable to load this fundraising project right now.");
    return data;
  });

export const getPublicCampaignDonations = createServerFn({ method: "GET" })
  .validator((input) => donationInput.parse(input))
  .handler(async ({ data: input }) => {
    const { data, error } = await createPublicClient()
      .from("fundraising_donations")
      .select("id,donor_name,amount,currency_code,anonymous,donation_date,status")
      .eq("campaign_id", input.campaignId)
      .eq("status", "completed")
      .order("donation_date", { ascending: false })
      .limit(input.limit);
    if (error) throw new Error("Unable to load recent supporters right now.");
    return data ?? [];
  });

export const aboutContentQueryOptions = () => queryOptions({
  queryKey: ["global-content", "about_us"],
  queryFn: () => getAboutContent(),
  staleTime: 10 * 60_000,
  gcTime: 30 * 60_000,
});

export const homepageContentQueryOptions = () => queryOptions({
  queryKey: ["global-content", "homepage"],
  queryFn: () => getHomepageContent(),
  staleTime: 10 * 60_000,
  gcTime: 30 * 60_000,
});

export const featuredEventsQueryOptions = () => queryOptions({
  queryKey: ["featuredEvents"],
  queryFn: () => getFeaturedEvents(),
  staleTime: 60_000,
  gcTime: 10 * 60_000,
});

export const publicLocationsQueryOptions = () => queryOptions({
  queryKey: ["public-locations"],
  queryFn: () => getPublicLocations(),
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
});

export const publicEventsQueryOptions = () => queryOptions({
  queryKey: ["public-events-all"],
  queryFn: () => getPublicEvents(),
  staleTime: 60_000,
  gcTime: 10 * 60_000,
});

export const publicFundraisingCampaignsQueryOptions = () => queryOptions({
  queryKey: ["public_fundraising_campaigns"],
  queryFn: () => getPublicFundraisingCampaigns(),
  staleTime: 2 * 60_000,
  gcTime: 15 * 60_000,
});

export const publicFundraisingCampaignQueryOptions = (id: string) => queryOptions({
  queryKey: ["public_fundraising_campaign", id],
  queryFn: () => getPublicFundraisingCampaign({ data: { id } }),
  staleTime: 2 * 60_000,
  gcTime: 15 * 60_000,
});

export const publicCampaignDonationsQueryOptions = (campaignId: string, limit = 10) => queryOptions({
  queryKey: ["public_campaign_donations", campaignId, limit],
  queryFn: () => getPublicCampaignDonations({ data: { campaignId, limit } }),
  staleTime: 60_000,
  gcTime: 10 * 60_000,
});

export type PublicLocation = Awaited<ReturnType<typeof getPublicLocations>>[number];
const regionPageInput = z.object({ slug: z.string().min(1).max(120) });

export const getPublicRegionPage = createServerFn({ method: "GET" })
  .validator((input) => regionPageInput.parse(input))
  .handler(async ({ data: input }) => {
    const client = createPublicClient();
    const { data: regions, error } = await client
      .from("regions")
      .select("id,name,code,description,address,contact_phone,contact_email,regional_president,regional_president_photo,established_date,hero_slide_images,hero_slide_images_mobile,hero_slide_images_tablet,currency_code")
      .eq("is_active", true);
    if (error) throw new Error("Unable to load this region right now.");

    const slug = input.slug.toLowerCase();
    const region = (regions ?? []).find((entry) => generateSlug(entry.name) === slug);
    if (!region) return null;

    const [locationsRes, dcgsRes, eventsRes] = await Promise.all([
      client
        .from("locations")
        .select("id,name,type,address,city,state,latitude,longitude,contact_phone,contact_person,whatsapp_link,capacity,fellowship_times,image_url,is_featured")
        .eq("region_id", region.id)
        .eq("status", "Active")
        .order("is_featured", { ascending: false })
        .order("name"),
      client.rpc("get_public_region_dcgs", { _region_id: region.id }),
      client
        .from("events")
        .select("id,name,name_fr,category,start_datetime,end_datetime,location_name,location_name_fr,address,image_url,image_url_fr,slug,status")
        .eq("region_id", region.id)
        .eq("is_public", true)
        .gte("start_datetime", new Date().toISOString())
        .order("start_datetime", { ascending: true })
        .limit(12),
    ]);

    return {
      region,
      locations: locationsRes.error ? [] : locationsRes.data ?? [],
      dcgs: dcgsRes.error ? [] : dcgsRes.data ?? [],
      events: eventsRes.error ? [] : eventsRes.data ?? [],
    };
  });

export const publicRegionPageQueryOptions = (slug: string) => queryOptions({
  queryKey: ["public-region-page", slug.toLowerCase()],
  queryFn: () => getPublicRegionPage({ data: { slug } }),
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
});

export type PublicRegionPage = NonNullable<Awaited<ReturnType<typeof getPublicRegionPage>>>;
export type PublicRegionDcg = PublicRegionPage["dcgs"][number];
export type PublicRegionLocation = PublicRegionPage["locations"][number];
export type PublicRegionEvent = PublicRegionPage["events"][number];

const NEWS_COLUMNS = "id,title,slug,summary,image_url,external_url,category,author_name,is_featured,published_at,region_id,regions(name)";

export const getLatestNews = createServerFn({ method: "GET" })
  .inputValidator((data: { limit?: number } | undefined) => z.object({ limit: z.number().int().min(1).max(60).optional() }).parse(data ?? {}))
  .handler(async ({ data }) => {
    const { data: rows, error } = await createPublicClient()
      .from("news_articles")
      .select(NEWS_COLUMNS)
      .eq("is_published", true)
      .lte("published_at", new Date().toISOString())
      .order("is_featured", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(data.limit ?? 6);
    if (error) return [];
    return (rows ?? []) as unknown as PublicNewsItem[];
  });

export const getNewsArticle = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => z.object({ slug: z.string().min(1).max(200) }).parse(data))
  .handler(async ({ data }) => {
    const { data: row, error } = await createPublicClient()
      .from("news_articles")
      .select(`${NEWS_COLUMNS},content`)
      .eq("is_published", true)
      .eq("slug", data.slug)
      .maybeSingle();
    if (error || !row) return null;
    return row as unknown as PublicNewsItem & { content: string | null };
  });

export type PublicNewsItem = {
  id: string; title: string; slug: string; summary: string; image_url: string | null; external_url: string | null;
  category: string; author_name: string | null; is_featured: boolean; published_at: string; region_id: string | null;
  regions: { name: string } | null;
};

export const latestNewsQueryOptions = (limit = 6) => queryOptions({
  queryKey: ["public-news", limit],
  queryFn: () => getLatestNews({ data: { limit } }),
  staleTime: 2 * 60_000,
});

export const newsArticleQueryOptions = (slug: string) => queryOptions({
  queryKey: ["public-news-article", slug],
  queryFn: () => getNewsArticle({ data: { slug } }),
  staleTime: 2 * 60_000,
});
