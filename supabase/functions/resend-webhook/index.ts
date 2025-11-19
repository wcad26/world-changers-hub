import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
};

interface ResendWebhookEvent {
  type: string;
  data: {
    email_id: string;
    to: string[];
    from: string;
    subject: string;
    created_at: string;
    bounce?: {
      bounced_at: string;
      bounce_type: string;
      message: string;
    };
    complaint?: {
      complained_at: string;
      complaint_type: string;
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('svix-signature');
    const timestamp = req.headers.get('svix-timestamp');
    const id = req.headers.get('svix-id');

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature && timestamp && id) {
      const signedContent = `${id}.${timestamp}.${body}`;
      
      // Use Web Crypto API for HMAC verification
      const encoder = new TextEncoder();
      const keyData = encoder.encode(webhookSecret);
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(signedContent)
      );
      const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

      // Svix uses base64 with URL-safe encoding
      const signatures = signature.split(' ');
      const isValid = signatures.some(sig => {
        const [version, hash] = sig.split(',');
        return version === 'v1' && hash === expectedSignature;
      });

      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    const event: ResendWebhookEvent = JSON.parse(body);
    console.log('Received webhook event:', event.type, 'for email:', event.data.email_id);

    // Find the certificate by Resend email ID
    const { data: certificate, error: findError } = await supabase
      .from('certificates')
      .select('id')
      .eq('resend_email_id', event.data.email_id)
      .single();

    if (findError || !certificate) {
      console.log('Certificate not found for email ID:', event.data.email_id);
      return new Response(JSON.stringify({ received: true, message: 'Certificate not found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Map webhook event types to email status
    let emailStatus: string | null = null;
    let deliveryDetails: any = {
      event_type: event.type,
      timestamp: event.data.created_at,
    };

    switch (event.type) {
      case 'email.sent':
        emailStatus = 'sent';
        break;
      case 'email.delivered':
        emailStatus = 'delivered';
        break;
      case 'email.delivery_delayed':
        deliveryDetails.delay_reason = 'Delivery delayed by recipient server';
        break;
      case 'email.bounced':
        emailStatus = 'bounced';
        if (event.data.bounce) {
          deliveryDetails.bounce = {
            bounced_at: event.data.bounce.bounced_at,
            bounce_type: event.data.bounce.bounce_type,
            message: event.data.bounce.message,
          };
        }
        break;
      case 'email.complained':
        emailStatus = 'complained';
        if (event.data.complaint) {
          deliveryDetails.complaint = {
            complained_at: event.data.complaint.complained_at,
            complaint_type: event.data.complaint.complaint_type,
          };
        }
        break;
      default:
        console.log('Unhandled event type:', event.type);
        deliveryDetails.unhandled = true;
    }

    // Update the certificate record
    const updateData: any = {
      email_delivery_details: deliveryDetails,
      email_last_status_update: new Date().toISOString(),
    };

    if (emailStatus) {
      updateData.email_status = emailStatus;
    }

    const { error: updateError } = await supabase
      .from('certificates')
      .update(updateData)
      .eq('id', certificate.id);

    if (updateError) {
      console.error('Error updating certificate:', updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Successfully updated certificate', certificate.id, 'with status:', emailStatus || 'details only');

    return new Response(JSON.stringify({ 
      received: true, 
      certificate_id: certificate.id,
      status: emailStatus || 'updated'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
