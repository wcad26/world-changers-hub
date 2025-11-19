import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendEmailsRequest {
  certificate_ids: string[];
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

    const { certificate_ids }: SendEmailsRequest = await req.json();

    console.log('Sending emails for', certificate_ids.length, 'certificates');

    const results = [];

    for (const certificateId of certificate_ids) {
      try {
        // Fetch certificate details
        const { data: certificate, error: certError } = await supabase
          .from('certificates')
          .select('*')
          .eq('id', certificateId)
          .single();

        if (certError || !certificate) {
          console.error('Certificate not found:', certificateId);
          results.push({ certificateId, success: false, error: 'Certificate not found' });
          continue;
        }

        if (!certificate.recipient_email) {
          results.push({ certificateId, success: false, error: 'No email address' });
          continue;
        }

        // Download certificate file
        const certificateUrl = certificate.certificate_url;
        const response = await fetch(certificateUrl);
        const certificateBlob = await response.arrayBuffer();
        
        // Convert array buffer to base64 in chunks to avoid stack overflow
        const bytes = new Uint8Array(certificateBlob);
        let binary = '';
        const chunkSize = 0x8000; // 32KB chunks
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
          binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        const certificateBase64 = btoa(binary);

        // Send email with certificate attachment
        const emailResponse = await resend.emails.send({
          from: 'World Changers Association <certificates@wcaglobal.org>',
          to: [certificate.recipient_email],
          subject: `Your Certificate from World Changers Association - ${certificate.certificate_type}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                  .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                  .verification { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px; }
                  .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🎓 Certificate Issued</h1>
                  </div>
                  <div class="content">
                    <p>Dear <strong>${certificate.recipient_name}</strong>,</p>
                    
                    <p>Congratulations! Your certificate has been issued by World Changers Association.</p>
                    
                    <div class="verification">
                      <strong>Certificate Details:</strong><br>
                      <strong>Type:</strong> ${certificate.certificate_type}<br>
                      ${certificate.event_name ? `<strong>Event:</strong> ${certificate.event_name}<br>` : ''}
                      ${certificate.event_date ? `<strong>Date:</strong> ${new Date(certificate.event_date).toLocaleDateString()}<br>` : ''}
                      <strong>Certificate Number:</strong> ${certificate.certificate_number}<br>
                      <strong>Issued:</strong> ${new Date(certificate.issued_date).toLocaleDateString()}
                    </div>
                    
                    <p>You can verify the authenticity of this certificate anytime by visiting:</p>
                    
                    <center>
                      <a href="${certificate.qr_code_data}" class="button">
                        Verify Certificate Online
                      </a>
                    </center>
                    
                    <p style="font-size: 14px; color: #6b7280;">
                      Or scan the QR code on your certificate with any QR code reader.
                    </p>
                    
                    <p>Your certificate is attached to this email. You can download and print it for your records.</p>
                    
                    <div class="footer">
                      <p>
                        <strong>World Changers Association</strong><br>
                        Making a positive impact in communities worldwide
                      </p>
                      <p style="font-size: 12px;">
                        This is an automated email. Please do not reply to this message.<br>
                        For inquiries, please contact us through our website.
                      </p>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `,
          attachments: [
            {
              filename: `${certificate.certificate_number}.png`,
              content: certificateBase64,
            },
          ],
        });

        if (emailResponse.error) {
          throw emailResponse.error;
        }

        results.push({
          certificateId,
          success: true,
          emailId: emailResponse.data?.id
        });

        console.log('Email sent for certificate:', certificate.certificate_number);
      } catch (error: any) {
        console.error('Error sending email for certificate', certificateId, error);
        results.push({
          certificateId,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        totalSent: results.filter(r => r.success).length,
        totalFailed: results.filter(r => !r.success).length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error: any) {
    console.error('Error in send-certificate-emails function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
