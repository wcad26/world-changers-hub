import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_BIBLE_KEY = Deno.env.get('API_BIBLE_KEY');
    
    if (!API_BIBLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'API Bible key not configured. Please add API_BIBLE_KEY to edge function secrets.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { bibleId, bookId, chapter } = await req.json();

    if (!bibleId || !bookId || chapter === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: bibleId, bookId, chapter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch chapter content from API.Bible
    const chapterId = `${bookId}.${chapter}`;
    const response = await fetch(
      `https://api.scripture.api.bible/v1/bibles/${bibleId}/chapters/${chapterId}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`,
      {
        headers: {
          'api-key': API_BIBLE_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API.Bible error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Bible content', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Parse the content to extract individual verses
    const content = data.data.content || '';
    const verses: { verse: number; text: string }[] = [];
    
    // API.Bible returns content with verse numbers like [1], [2], etc.
    const versePattern = /\[(\d+)\]\s*([^\[]*)/g;
    let match;
    
    while ((match = versePattern.exec(content)) !== null) {
      verses.push({
        verse: parseInt(match[1]),
        text: match[2].trim(),
      });
    }

    return new Response(
      JSON.stringify({ 
        verses,
        reference: data.data.reference,
        copyright: data.data.copyright 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-bible-content:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
