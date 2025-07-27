import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  email: string;
  firstName: string;
  lastName: string;
  tempPassword: string;
  regionName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName, tempPassword, regionName }: InvitationRequest = await req.json();

    console.log('Sending invitation email to:', email);

    // For now, we'll just log the invitation details
    // In a real implementation, you would integrate with an email service like Resend
    console.log('Invitation details:', {
      email,
      firstName,
      lastName,
      tempPassword,
      regionName,
    });

    // Simulate email sending
    const emailContent = `
      Dear ${firstName} ${lastName},

      Welcome to the WCA Regional Admin Portal!

      You have been appointed as a Regional Administrator for ${regionName}.

      Your login credentials are:
      Email: ${email}
      Temporary Password: ${tempPassword}

      Please log in to the regional admin portal and change your password immediately:
      ${Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://').replace('.supabase.co', '')}.lovable.app/auth/regional

      Best regards,
      WCA Super Admin Team
    `;

    console.log('Email content:', emailContent);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation email prepared (email service integration required)',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in send-admin-invitation function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to send invitation',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});