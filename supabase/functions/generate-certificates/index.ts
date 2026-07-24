import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { createCanvas, loadImage } from "https://deno.land/x/canvas@v1.4.1/mod.ts";
import QRCode from "https://esm.sh/qrcode@1.5.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateCertificatesRequest {
  template_id: string;
  member_ids: string[];
  certificate_type: string;
  event_name?: string;
  event_date?: string;
  region_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization token
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const requestData: GenerateCertificatesRequest = await req.json();
    const { template_id, member_ids, certificate_type, event_name, event_date, region_id } = requestData;

    console.log('Generating certificates for', member_ids.length, 'members');

    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from('certificate_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (templateError || !template) {
      throw new Error('Template not found');
    }

    // Get template image from storage
    const { data: templateImageData } = await supabase.storage
      .from('certificate-templates')
      .download(template.template_url);

    if (!templateImageData) {
      throw new Error('Template image not found');
    }

    const templateBuffer = await templateImageData.arrayBuffer();
    const templateImage = await loadImage(new Uint8Array(templateBuffer));

    const results = [];

    // Generate certificates for each member
    for (const memberId of member_ids) {
      try {
        // Fetch member details
        const { data: member, error: memberError } = await supabase
          .from('members')
          .select(`
            id,
            member_id,
            profiles (
              first_name,
              last_name,
              email
            )
          `)
          .eq('id', memberId)
          .single();

        if (memberError || !member) {
          console.error('Member not found:', memberId);
          results.push({ memberId, success: false, error: 'Member not found' });
          continue;
        }

        const profile = member.profiles;
        const recipientName = `${profile.first_name} ${profile.last_name}`;
        const recipientEmail = profile.email;

        // Generate unique verification code (8 characters)
        const verificationCode = crypto.randomUUID().substring(0, 8).toUpperCase();
        
        // Generate certificate number
        const certificateNumber = `CERT-${region_id.substring(0, 4)}-${new Date().getFullYear()}-${crypto.randomUUID().substring(0, 5).toUpperCase()}`;

        // Generate QR payload — badges encode the member id directly for scanner resolution.
        const outputType = (template as any)?.output_type || 'certificate';
        const verificationUrl = `${supabaseUrl.replace('.supabase.co', '')}.vercel.app/verify/${verificationCode}`;
        const qrPayload = outputType === 'badge' ? String(memberId) : verificationUrl;
        const qrCodeDataURL = await QRCode.toDataURL(qrPayload, {
          width: 300,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Create canvas
        const canvas = createCanvas(templateImage.width(), templateImage.height());
        const ctx = canvas.getContext('2d');

        // Draw template
        ctx.drawImage(templateImage, 0, 0);

        // Name box (supports both legacy point-based and new box shape)
        const rawName = (template.name_position as any) || {};
        const canvasW = canvas.width;
        const canvasH = canvas.height;
        const fontSize = rawName.fontSize || 38;
        const fontFamily = rawName.fontFamily || 'Georgia, serif';
        const color = rawName.color || '#1a365d';
        const align = rawName.align || 'center';
        const verticalAlign = rawName.verticalAlign || 'middle';
        const autoShrink = rawName.autoShrink ?? true;

        let boxX: number, boxY: number, boxW: number, boxH: number;
        if (rawName.width && rawName.height) {
          boxX = rawName.x; boxY = rawName.y;
          boxW = rawName.width; boxH = rawName.height;
        } else {
          boxW = Math.round(canvasW * 0.6);
          boxH = Math.round(fontSize * 2.5);
          const cx = rawName.x ?? canvasW / 2;
          const cy = rawName.y ?? canvasH / 2;
          boxX = Math.round(cx - boxW / 2);
          boxY = Math.round(cy - boxH / 2);
        }

        const qrPos = (template.qr_position as any) || { x: canvasW - 92, y: canvasH - 109, size: 100 };

        // Wrap + fit
        const wrapLines = (text: string, maxWidth: number): string[] => {
          const words = text.split(/\s+/).filter(Boolean);
          const lines: string[] = [];
          let current = '';
          for (const w of words) {
            const trial = current ? `${current} ${w}` : w;
            if (ctx.measureText(trial).width <= maxWidth) { current = trial; continue; }
            if (ctx.measureText(w).width > maxWidth) {
              if (current) { lines.push(current); current = ''; }
              let chunk = '';
              for (const ch of w) {
                const t = chunk + ch;
                if (ctx.measureText(t).width <= maxWidth) chunk = t;
                else { if (chunk) lines.push(chunk); chunk = ch; }
              }
              current = chunk;
            } else {
              if (current) lines.push(current);
              current = w;
            }
          }
          if (current) lines.push(current);
          return lines.length ? lines : [text];
        };

        const minFont = Math.max(8, Math.floor(fontSize * 0.5));
        let size = fontSize;
        let lines: string[] = [];
        let lineHeight = size * 1.2;
        while (size >= minFont) {
          ctx.font = `bold ${size}px ${fontFamily}`;
          lines = wrapLines(recipientName, boxW);
          lineHeight = size * 1.2;
          if (!autoShrink || lines.length * lineHeight <= boxH) break;
          size -= 2;
        }
        ctx.font = `bold ${size}px ${fontFamily}`;
        ctx.fillStyle = color;
        const totalH = lines.length * lineHeight;
        let yStart: number;
        if (verticalAlign === 'top') yStart = boxY + lineHeight / 2;
        else if (verticalAlign === 'bottom') yStart = boxY + boxH - totalH + lineHeight / 2;
        else yStart = boxY + (boxH - totalH) / 2 + lineHeight / 2;
        let xAnchor: number;
        if (align === 'left') { ctx.textAlign = 'left'; xAnchor = boxX; }
        else if (align === 'right') { ctx.textAlign = 'right'; xAnchor = boxX + boxW; }
        else { ctx.textAlign = 'center'; xAnchor = boxX + boxW / 2; }
        ctx.textBaseline = 'middle';
        lines.forEach((line, i) => ctx.fillText(line, xAnchor, yStart + i * lineHeight));

        // Draw event name if provided
        if (event_name) {
          ctx.font = `24px Arial`;
          ctx.fillStyle = '#000000';
          ctx.textAlign = 'center';
          ctx.fillText(event_name, boxX + boxW / 2, boxY + boxH + 34);
        }

        // Draw event date if provided
        if (event_date) {
          ctx.font = `20px Arial`;
          ctx.fillStyle = '#666666';
          ctx.textAlign = 'center';
          ctx.fillText(new Date(event_date).toLocaleDateString(), boxX + boxW / 2, boxY + boxH + 64);
        }

        // Draw QR code
        const qrImage = await loadImage(qrCodeDataURL);
        ctx.drawImage(qrImage, qrPos.x, qrPos.y, qrPos.size, qrPos.size);

        // Draw certificate number
        ctx.font = '12px Arial';
        ctx.fillStyle = '#999999';
        ctx.textAlign = 'left';
        ctx.fillText(`Certificate No: ${certificateNumber}`, qrPos.x, qrPos.y + qrPos.size + 20);

        // Convert to PNG
        const pngBuffer = canvas.toBuffer('image/png');

        // Upload to storage
        const certificateFilePath = `${region_id}/${memberId}/${certificateNumber}.png`;
        const { error: uploadError } = await supabase.storage
          .from('certificates')
          .upload(certificateFilePath, pngBuffer, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('certificates')
          .getPublicUrl(certificateFilePath);

        // Create certificate record
        const { data: certificate, error: certError } = await supabase
          .from('certificates')
          .insert({
            certificate_number: certificateNumber,
            member_id: memberId,
            region_id: region_id,
            certificate_type: certificate_type,
            event_name: event_name,
            event_date: event_date,
            recipient_name: recipientName,
            recipient_email: recipientEmail,
            certificate_url: publicUrl,
            verification_code: verificationCode,
            qr_code_data: verificationUrl,
            issued_by: user.id,
            is_active: true
          })
          .select()
          .single();

        if (certError) {
          throw certError;
        }

        results.push({
          memberId,
          success: true,
          certificateId: certificate.id,
          certificateNumber,
          verificationCode
        });

        console.log('Certificate generated:', certificateNumber);
      } catch (error: any) {
        console.error('Error generating certificate for member', memberId, error);
        results.push({
          memberId,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        totalGenerated: results.filter(r => r.success).length,
        totalFailed: results.filter(r => !r.success).length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error: any) {
    console.error('Error in generate-certificates function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
