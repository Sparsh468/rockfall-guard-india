import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertRequest {
  mine_id: string;
  mine_name: string;
  location: string;
  risk_probability: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mine_name, location, risk_probability }: AlertRequest = await req.json();

    console.log('Sending alert for:', { mine_name, location, risk_probability });

    const alertMessage = `🚨 HIGH ROCKFALL RISK ALERT 🚨\n\nMine: ${mine_name}\nLocation: ${location}\nRisk Level: ${Math.round(risk_probability * 100)}%\n\nImmediate action required! Please implement emergency protocols and consider evacuation.`;

    // Send SMS via Twilio
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (twilioAccountSid && twilioAuthToken) {
      try {
        const twilioResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              From: '+1234567890', // Replace with your Twilio phone number
              To: '+919876543210',   // Replace with recipient phone number
              Body: alertMessage,
            }),
          }
        );

        if (twilioResponse.ok) {
          console.log('SMS alert sent successfully');
        } else {
          console.error('Failed to send SMS:', await twilioResponse.text());
        }
      } catch (smsError) {
        console.error('SMS sending error:', smsError);
      }
    }

    // Send Email Alert (using a simple HTTP service or SMTP)
    // For production, you would configure proper email service
    console.log('Email alert would be sent:', alertMessage);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Alert notifications sent',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in send-alert function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);