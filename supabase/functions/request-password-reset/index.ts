import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordResetRequest {
  email: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid email address' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (profileError || !profile) {
      console.log('Profile not found for email:', email);
      return new Response(
        JSON.stringify({ success: false, message: 'Email not valid' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if user has admin roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', profile.id)
      .in('role', ['super_admin', 'regional_admin', 'dcg_admin'])
      .eq('is_active', true)
      .eq('status', 'active');

    if (rolesError || !roles || roles.length === 0) {
      console.log('User is not an admin:', email);
      return new Response(
        JSON.stringify({ success: false, message: 'Email not valid' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check rate limiting - max 3 requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentOtps, error: rateLimitError } = await supabase
      .from('password_reset_otps')
      .select('id')
      .eq('email', email.toLowerCase())
      .gte('created_at', oneHourAgo);

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    } else if (recentOtps && recentOtps.length >= 3) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Too many password reset requests. Please try again later.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }

    // Generate 5-digit OTP
    const otpCode = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    const { error: insertError } = await supabase
      .from('password_reset_otps')
      .insert({
        user_id: profile.id,
        email: email.toLowerCase(),
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Error storing OTP:', insertError);
      throw new Error('Failed to generate OTP');
    }

    // Send email via Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    const { error: emailError } = await resend.emails.send({
      from: 'WCA Admin Portal <noreply@resend.dev>',
      to: [email],
      subject: 'Password Reset - Your OTP Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px solid #667eea; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
            .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea; }
            .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password for the WCA Admin Portal. Use the OTP code below to proceed:</p>
              
              <div class="otp-box">
                <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">Your OTP Code</div>
                <div class="otp-code">${otpCode}</div>
                <div style="color: #6b7280; font-size: 12px; margin-top: 10px;">Valid for 10 minutes</div>
              </div>

              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>This OTP is valid for 10 minutes only</li>
                  <li>Never share this code with anyone</li>
                  <li>If you didn't request this, please ignore this email</li>
                </ul>
              </div>

              <p>After entering the OTP, you'll be able to set a new password for your account.</p>
              
              <div class="footer">
                <p>This is an automated message from WCA Admin Portal</p>
                <p>If you have questions, please contact your system administrator</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      throw new Error('Failed to send OTP email');
    }

    console.log('OTP sent successfully to:', email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP sent to your email. Please check your inbox.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error in request-password-reset:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'An error occurred. Please try again.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
