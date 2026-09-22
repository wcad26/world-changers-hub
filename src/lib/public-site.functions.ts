import { queryOptions } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

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