import { queryOptions } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import type { Database } from "@/integrations/supabase/types";

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
    .select("id,name,type,address,city,state,latitude,longitude,contact_phone,contact_person,whatsapp_link,capacity,fellowship_times,image_url,is_featured,region_id,region:regions(id,name,slug)")
    .eq("status", "Active")
    .order("is_featured", { ascending: false })
    .order("name");
  if (error) throw new Error("Unable to load locations right now.");
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

export type PublicLocation = Awaited<ReturnType<typeof getPublicLocations>>[number];