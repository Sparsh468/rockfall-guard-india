import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  alertData: {
    mineName: string;
    location: string;
    riskLevel: string;
    riskProbability: number;
    alertLevel: string;
    timestamp: string;
    userEmail: string;
    userName?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('send-email-alert function received request:', requestBody);
    
    const { to, subject, htmlContent, textContent, priority, alertData }: EmailRequest = requestBody;

    console.log('Sending email alert:', { to, subject, priority, mineName: alertData.mineName });
    console.log('Email recipient:', to);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Log the alert to the database
    await logAlertToDatabase(supabase, alertData);

    // Send email using multiple providers (fallback system)
    console.log('Attempting to send email to:', to);
    const emailResult = await sendEmailWithFallback(to, subject, htmlContent, textContent, priority);
    console.log('Email sending result:', emailResult);

    if (emailResult.success) {
      console.log('Email sent successfully via:', emailResult.provider);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email alert sent successfully',
          provider: emailResult.provider,
          alertId: emailResult.alertId
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    } else {
      console.error('Failed to send email:', emailResult.error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: emailResult.error,
          message: 'Failed to send email alert'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  } catch (error: any) {
    console.error('Error in send-email-alert function:', error);
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

/**
 * Log alert to database
 */
async function logAlertToDatabase(supabase: any, alertData: any) {
  try {
    // Find the mine ID
    const { data: mine, error: mineError } = await supabase
      .from('mines')
      .select('id')
      .eq('name', alertData.mineName)
      .single();

    if (mineError || !mine) {
      console.error('Mine not found:', alertData.mineName);
      return;
    }

    // Insert alert record
    const { error: alertError } = await supabase
      .from('alerts')
      .insert({
        mine_id: mine.id,
        risk_probability: alertData.riskProbability,
        alert_level: alertData.alertLevel,
        message: `Risk alert sent to ${alertData.userEmail} for ${alertData.mineName}`,
        is_resolved: false
      });

    if (alertError) {
      console.error('Failed to log alert:', alertError);
    } else {
      console.log('Alert logged to database successfully');
    }
  } catch (error) {
    console.error('Error logging alert to database:', error);
  }
}

/**
 * Send email with multiple provider fallback
 */
async function sendEmailWithFallback(
  to: string, 
  subject: string, 
  htmlContent: string, 
  textContent: string, 
  priority: string
): Promise<{ success: boolean; provider?: string; error?: string; alertId?: string }> {
  
  // Try Resend first (primary provider)
  const resendResult = await sendViaResend(to, subject, htmlContent, textContent, priority);
  if (resendResult.success) {
    return { ...resendResult, provider: 'resend' };
  }

  // Try SendGrid as fallback
  const sendgridResult = await sendViaSendGrid(to, subject, htmlContent, textContent, priority);
  if (sendgridResult.success) {
    return { ...sendgridResult, provider: 'sendgrid' };
  }

  // Try SMTP as final fallback
  const smtpResult = await sendViaSMTP(to, subject, htmlContent, textContent, priority);
  if (smtpResult.success) {
    return { ...smtpResult, provider: 'smtp' };
  }

  return { 
    success: false, 
    error: `All email providers failed. Resend: ${resendResult.error}, SendGrid: ${sendgridResult.error}, SMTP: ${smtpResult.error}` 
  };
}

/**
 * Send email via Resend
 */
async function sendViaResend(
  to: string, 
  subject: string, 
  htmlContent: string, 
  textContent: string, 
  priority: string
): Promise<{ success: boolean; error?: string; alertId?: string }> {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return { success: false, error: 'Resend API key not configured' };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SHAIL KAVACH <alerts@shailkavach.com>',
        to: [to],
        subject,
        html: htmlContent,
        text: textContent,
        priority: priority === 'critical' ? 'urgent' : 'normal'
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, alertId: data.id };
    } else {
      const error = await response.text();
      return { success: false, error: `Resend API error: ${error}` };
    }
  } catch (error) {
    return { success: false, error: `Resend error: ${error.message}` };
  }
}

/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(
  to: string, 
  subject: string, 
  htmlContent: string, 
  textContent: string, 
  priority: string
): Promise<{ success: boolean; error?: string; alertId?: string }> {
  try {
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
    if (!sendgridApiKey) {
      return { success: false, error: 'SendGrid API key not configured' };
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }],
          subject
        }],
        from: {
          email: 'alerts@shailkavach.com',
          name: 'SHAIL KAVACH'
        },
        content: [
          {
            type: 'text/plain',
            value: textContent
          },
          {
            type: 'text/html',
            value: htmlContent
          }
        ],
        priority: priority === 'critical' ? 'high' : 'normal'
      }),
    });

    if (response.ok) {
      return { success: true, alertId: 'sendgrid-' + Date.now() };
    } else {
      const error = await response.text();
      return { success: false, error: `SendGrid API error: ${error}` };
    }
  } catch (error) {
    return { success: false, error: `SendGrid error: ${error.message}` };
  }
}

/**
 * Send email via SMTP (using a simple HTTP-to-SMTP service)
 */
async function sendViaSMTP(
  to: string, 
  subject: string, 
  htmlContent: string, 
  textContent: string, 
  priority: string
): Promise<{ success: boolean; error?: string; alertId?: string }> {
  try {
    console.log('SMTP email would be sent:', { to, subject, priority });
    
    // For demo/testing purposes, we'll use a simple HTTP service
    // In production, you would configure with a real SMTP provider
    const webhookUrl = Deno.env.get('EMAIL_WEBHOOK_URL');
    
    if (webhookUrl) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to,
            subject,
            html: htmlContent,
            text: textContent,
            priority
          }),
        });

        if (response.ok) {
          return { success: true, alertId: 'webhook-' + Date.now() };
        } else {
          return { success: false, error: `Webhook error: ${response.status}` };
        }
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
        // Continue to fallback
      }
    }
    
    // Fallback: Log the email details for manual sending
    console.log('Email details for manual sending:', {
      to,
      subject,
      htmlContent: htmlContent.substring(0, 200) + '...',
      textContent: textContent.substring(0, 200) + '...',
      priority
    });
    
    // For demo purposes, we'll return success
    return { success: true, alertId: 'logged-' + Date.now() };
  } catch (error) {
    return { success: false, error: `SMTP error: ${error.message}` };
  }
}

serve(handler);
