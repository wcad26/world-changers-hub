import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

/**
 * All WCA media lives on YouTube. The channel ID is read from system_settings
 * (key `media_youtube_channel`, value `{ "channelId": "UC..." }`), falling back to
 * DEFAULT_CHANNEL_ID. Videos come from the channel's public feed — no API key needed.
 */
const DEFAULT_CHANNEL_ID = '';

export type MediaVideo = { id: string; title: string; description: string; published: string; thumbnail: string; views: number; channel: string };

const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const tag = (xml: string, name: string) => decode(xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1]?.trim() ?? '');

async function channelId() {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data } = await supabaseAdmin.from('system_settings').select('value').eq('key', 'media_youtube_channel').maybeSingle();
    const v = (data?.value as any)?.channelId;
    if (typeof v === 'string' && /^UC[\w-]{20,}$/.test(v)) return v;
  } catch { /* fall back */ }
  return DEFAULT_CHANNEL_ID;
}

export const getMediaFeed = createServerFn({ method: 'GET' }).handler(async () => {
  const id = await channelId();
  if (!id) return { configured: false, videos: [] as MediaVideo[] };
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
  if (!res.ok) throw new Error(`YouTube feed unavailable (${res.status})`);
  const xml = await res.text();
  const channel = tag(xml.split('<entry>')[0], 'title');
  const videos = xml.split('<entry>').slice(1).map((e) => {
    const vid = tag(e, 'yt:videoId');
    return {
      id: vid,
      title: tag(e, 'title'),
      description: tag(e, 'media:description'),
      published: tag(e, 'published'),
      thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
      views: Number(e.match(/views="(\d+)"/)?.[1] ?? 0),
      channel,
    } satisfies MediaVideo;
  }).filter((v) => v.id);
  return { configured: true, videos };
});

export const isValidVideoId = (id: string) => z.string().regex(/^[\w-]{11}$/).safeParse(id).success;
