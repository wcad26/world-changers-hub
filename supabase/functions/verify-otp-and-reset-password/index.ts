import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyOtpRequest {
  email: string;
  otp_code: string;
  new_password: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp_code, new_password }: VerifyOtpRequest = await req.json();

    // Validate inputs
    if (!email || !otp_code || !new_password) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (otp_code.length !== 5 || !/^\d+$/.test(otp_code)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid OTP format. Must be 5 digits.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (new_password.length < 8) {
      return new Response(
        JSON.stringify({ success: false, message: 'Password must be at least 8 characters long' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find OTP record
    const { data: otpRecord, error: otpError } = await supabase
      .from('password_reset_otps')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('otp_code', otp_code)
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRecord) {
      console.log('Invalid OTP for email:', email);
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid OTP code' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if OTP is expired
    const expiresAt = new Date(otpRecord.expires_at);
    const now = new Date();
    if (now > expiresAt) {
      console.log('Expired OTP for email:', email);
      return new Response(
        JSON.stringify({ success: false, message: 'OTP has expired. Please request a new one.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check rate limiting for verification attempts (max 5 per OTP)
    const { data: verificationAttempts } = await supabase
      .from('password_reset_otps')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('otp_code', otp_code);

    if (verificationAttempts && verificationAttempts.length > 5) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Too many verification attempts. Please request a new OTP.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }

    // Update user password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      otpRecord.user_id,
      { password: new_password }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      throw new Error('Failed to update password');
    }

    // Mark OTP as used
    const { error: markUsedError } = await supabase
      .from('password_reset_otps')
      .update({ 
        is_used: true, 
        verified_at: new Date().toISOString() 
      })
      .eq('id', otpRecord.id);

    if (markUsedError) {
      console.error('Error marking OTP as used:', markUsedError);
    }

    // Clean up expired OTPs (optional cleanup)
    await supabase
      .from('password_reset_otps')
      .delete()
      .lt('expires_at', new Date().toISOString());

    console.log('Password reset successful for:', email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset successfully. You can now log in with your new password.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error in verify-otp-and-reset-password:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'An error occurred. Please try again.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
