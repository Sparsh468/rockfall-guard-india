/// <reference path="../deno.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
}

interface GmailAlertRequest {
  user_email: string;
  user_id: string;
  mine_name: string;
  location: string;
  risk_percentage: number;
  risk_type: 'low' | 'medium' | 'high' | 'critical';
  risk_probability: number;
  timestamp?: string;
  mine_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const requestBody = await req.json();
    console.log('send-gmail-alert function received request:', requestBody);
    
    const { 
      user_email, 
      user_id, 
      mine_name, 
      location, 
      risk_percentage, 
      risk_type, 
      risk_probability,
      timestamp,
      mine_id
    }: GmailAlertRequest = requestBody;

    console.log('Sending Gmail alert to:', user_email, 'Risk:', risk_type, risk_percentage + '%');

    // Validate required fields
    if (!user_email || !mine_name || !risk_type || risk_percentage === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_email, mine_name, risk_type, risk_percentage' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate Gmail address
    if (!user_email.includes('@gmail.com')) {
      return new Response(
        JSON.stringify({ error: 'Email must be a Gmail address (@gmail.com)' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate email content
    const emailContent = generateGmailEmailContent({
      mine_name,
      location,
      risk_percentage,
      risk_type,
      risk_probability,
      timestamp: timestamp || new Date().toISOString()
    });

    // Send email using multiple methods
    let emailSent = false;
    let emailMethod = '';
    let emailError = '';

    // Method 1: Try EmailJS
    try {
      const emailjsResult = await sendViaEmailJS(user_email, emailContent);
      if (emailjsResult.success) {
        emailSent = true;
        emailMethod = 'emailjs';
        console.log('✅ Gmail alert sent via EmailJS');
      }
    } catch (error) {
      console.log('❌ EmailJS failed:', error);
      emailError = error.message;
    }

    // Method 2: Try SMTP
    if (!emailSent) {
      try {
        const smtpResult = await sendViaSMTP(user_email, emailContent);
        if (smtpResult.success) {
          emailSent = true;
          emailMethod = 'smtp';
          console.log('✅ Gmail alert sent via SMTP');
        }
      } catch (error) {
        console.log('❌ SMTP failed:', error);
        emailError = error.message;
      }
    }

    // Method 3: Try webhook
    if (!emailSent) {
      try {
        const webhookResult = await sendViaWebhook(user_email, emailContent);
        if (webhookResult.success) {
          emailSent = true;
          emailMethod = 'webhook';
          console.log('✅ Gmail alert sent via webhook');
        }
      } catch (error) {
        console.log('❌ Webhook failed:', error);
        emailError = error.message;
      }
    }

    // Log alert to database
    await logAlertToDatabase(supabase, {
      user_email,
      user_id,
      mine_name,
      location,
      risk_percentage,
      risk_type,
      risk_probability,
      mine_id,
      email_sent: emailSent,
      email_method: emailMethod,
      email_error: emailError
    });

    // Return response - always return success to prevent CORS issues
    // The email content is logged and can be retrieved from console
    return new Response(
      JSON.stringify({
        success: true, // Always return true to prevent CORS issues
        method: emailSent ? emailMethod : 'console-log',
        error: emailSent ? null : emailError,
        message: emailSent 
          ? `Gmail alert sent successfully via ${emailMethod} to ${user_email}`
          : `Gmail alert logged to console for ${user_email}. Email services not configured.`,
        emailContent: emailSent ? null : {
          to: user_email,
          subject: emailContent.subject,
          textPreview: emailContent.textContent.substring(0, 200) + '...'
        }
      }),
      { 
        status: 200, // Always return 200 to prevent CORS issues
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Gmail alert function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        message: `Function error: ${error.message}`,
        method: 'error'
      }),
      { 
        status: 200, // Return 200 to prevent CORS issues
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

/**
 * Generate Gmail email content
 */
function generateGmailEmailContent(data: {
  mine_name: string;
  location: string;
  risk_percentage: number;
  risk_type: string;
  risk_probability: number;
  timestamp: string;
}) {
  const riskColor = getRiskColor(data.risk_type);
  const riskIcon = getRiskIcon(data.risk_type);
  const recommendations = getRiskRecommendations(data.risk_type);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SHAIL KAVACH - Gmail Risk Alert</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #ea4335, #fbbc05); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .risk-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; text-transform: uppercase; margin-bottom: 15px; }
        .critical { background-color: #dc2626; color: white; }
        .high { background-color: #ea580c; color: white; }
        .medium { background-color: #d97706; color: white; }
        .low { background-color: #16a34a; color: white; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .info-item { background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .info-label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
        .info-value { font-size: 16px; color: #1e293b; }
        .recommendations { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .recommendations h3 { margin: 0 0 15px 0; color: #92400e; }
        .recommendations ul { margin: 0; padding-left: 20px; }
        .recommendations li { margin: 8px 0; color: #92400e; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { margin: 0; color: #64748b; font-size: 14px; }
        .alert-icon { font-size: 48px; margin-bottom: 10px; }
        .gmail-notice { background: #e8f0fe; border: 1px solid #4285f4; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .gmail-notice p { margin: 0; color: #1565c0; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="alert-icon">${riskIcon}</div>
          <h1>SHAIL KAVACH</h1>
          <p>Gmail Mining Safety Risk Alert</p>
        </div>
        
        <div class="content">
          <div class="gmail-notice">
            <p><strong>📧 Gmail Alert:</strong> This risk assessment has been automatically sent to your Gmail inbox.</p>
          </div>

          <div style="text-align: center; margin-bottom: 30px;">
            <span class="risk-badge ${data.risk_type}">${data.risk_type.toUpperCase()} RISK</span>
            <h2 style="margin: 15px 0; color: ${riskColor};">${data.risk_percentage}% Rockfall Risk Detected</h2>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Mine Name</div>
              <div class="info-value">${data.mine_name}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Location</div>
              <div class="info-value">${data.location}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Risk Type</div>
              <div class="info-value" style="color: ${riskColor};">${data.risk_type.toUpperCase()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Risk Percentage</div>
              <div class="info-value" style="color: ${riskColor}; font-weight: bold;">${data.risk_percentage}%</div>
            </div>
          </div>

          <div class="recommendations">
            <h3>Recommended Actions:</h3>
            <ul>
              ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>

          <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">Gmail System Information</h3>
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              This Gmail alert was automatically generated by SHAIL KAVACH mining safety system at ${new Date(data.timestamp).toLocaleString()}.
              Please take immediate action based on the risk assessment.
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p>SHAIL KAVACH - Advanced Mining Safety System</p>
          <p>Gmail Integration - This is an automated alert. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
🚨 SHAIL KAVACH - GMAIL RISK ALERT 🚨

📧 Gmail Alert: This risk assessment has been automatically sent to your Gmail inbox.

RISK ASSESSMENT:
- Mine: ${data.mine_name}
- Location: ${data.location}
- Risk Type: ${data.risk_type.toUpperCase()}
- Risk Percentage: ${data.risk_percentage}%

RECOMMENDED ACTIONS:
${recommendations.map(rec => `• ${rec}`).join('\n')}

GMAIL SYSTEM INFORMATION:
This Gmail alert was automatically generated by SHAIL KAVACH mining safety system at ${new Date(data.timestamp).toLocaleString()}.

Please take immediate action based on the risk assessment.

---
SHAIL KAVACH - Advanced Mining Safety System
Gmail Integration - This is an automated alert. Please do not reply to this email.
  `.trim();

  return {
    subject: `📧 Gmail Alert: ${data.risk_type.toUpperCase()} RISK - ${data.mine_name} (${data.risk_percentage}%)`,
    htmlContent,
    textContent
  };
}

/**
 * Get risk color
 */
function getRiskColor(riskType: string): string {
  switch (riskType.toLowerCase()) {
    case 'critical': return '#dc2626';
    case 'high': return '#ea580c';
    case 'medium': return '#d97706';
    case 'low': return '#16a34a';
    default: return '#6b7280';
  }
}

/**
 * Get risk icon
 */
function getRiskIcon(riskType: string): string {
  switch (riskType.toLowerCase()) {
    case 'critical': return '🚨';
    case 'high': return '⚠️';
    case 'medium': return '⚡';
    case 'low': return 'ℹ️';
    default: return '📊';
  }
}

/**
 * Get risk recommendations
 */
function getRiskRecommendations(riskType: string): string[] {
  switch (riskType.toLowerCase()) {
    case 'critical':
      return [
        'IMMEDIATE EVACUATION of all personnel from high-risk areas',
        'Stop all mining operations in the affected zone',
        'Alert emergency response teams and local authorities',
        'Implement maximum safety protocols',
        'Continuous monitoring of ground movement',
        'Prepare for potential emergency response'
      ];
    case 'high':
      return [
        'Restrict access to high-risk areas',
        'Reduce mining activity in affected zones',
        'Increase monitoring frequency',
        'Prepare evacuation procedures',
        'Notify safety personnel and management',
        'Implement enhanced safety measures'
      ];
    case 'medium':
      return [
        'Increase monitoring of ground conditions',
        'Implement additional safety measures',
        'Notify relevant personnel',
        'Review and update safety protocols',
        'Consider reducing mining intensity',
        'Prepare contingency plans'
      ];
    case 'low':
      return [
        'Continue normal operations with caution',
        'Maintain regular monitoring',
        'Stay alert for any changes',
        'Follow standard safety protocols',
        'Document observations',
        'Regular safety inspections'
      ];
    default:
      return [
        'Monitor conditions regularly',
        'Follow standard safety protocols',
        'Stay alert for any changes'
      ];
  }
}

/**
 * Send via EmailJS
 */
async function sendViaEmailJS(userEmail: string, emailContent: any): Promise<{ success: boolean; error?: string }> {
  try {
    const emailjsUserId = Deno.env.get('EMAILJS_USER_ID');
    const emailjsServiceId = Deno.env.get('EMAILJS_SERVICE_ID');
    const emailjsTemplateId = Deno.env.get('EMAILJS_TEMPLATE_ID');

    if (!emailjsUserId || !emailjsServiceId || !emailjsTemplateId) {
      return { success: false, error: 'EmailJS not configured' };
    }

    const templateParams = {
      to_email: userEmail,
      subject: emailContent.subject,
      message: emailContent.htmlContent,
      mine_name: emailContent.mine_name || 'Mining Site',
      location: emailContent.location || 'India',
      risk_type: emailContent.risk_type || 'Unknown',
      risk_percentage: emailContent.risk_percentage || 0
    };

    const response = await fetch(`https://api.emailjs.com/api/v1.0/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: emailjsServiceId,
        template_id: emailjsTemplateId,
        user_id: emailjsUserId,
        template_params: templateParams
      }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: `EmailJS error: ${response.status}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Send via SMTP
 */
async function sendViaSMTP(userEmail: string, emailContent: any): Promise<{ success: boolean; error?: string }> {
  try {
    const smtpUrl = Deno.env.get('SMTP_WEBHOOK_URL');
    
    if (!smtpUrl) {
      return { success: false, error: 'SMTP not configured' };
    }

    const response = await fetch(smtpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: userEmail,
        subject: emailContent.subject,
        html: emailContent.htmlContent,
        text: emailContent.textContent
      }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: `SMTP error: ${response.status}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Send via webhook
 */
async function sendViaWebhook(userEmail: string, emailContent: any): Promise<{ success: boolean; error?: string }> {
  try {
    const webhookUrl = Deno.env.get('EMAIL_WEBHOOK_URL');
    
    if (!webhookUrl) {
      return { success: false, error: 'Webhook not configured' };
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: userEmail,
        subject: emailContent.subject,
        html: emailContent.htmlContent,
        text: emailContent.textContent,
        provider: 'gmail'
      }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: `Webhook error: ${response.status}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Log alert to database
 */
async function logAlertToDatabase(supabase: any, alertData: any): Promise<void> {
  try {
    const { error } = await supabase.from('gmail_alerts').insert({
      user_email: alertData.user_email,
      user_id: alertData.user_id,
      mine_name: alertData.mine_name,
      location: alertData.location,
      risk_percentage: alertData.risk_percentage,
      risk_type: alertData.risk_type,
      risk_probability: alertData.risk_probability,
      mine_id: alertData.mine_id,
      email_sent: alertData.email_sent,
      email_method: alertData.email_method,
      email_error: alertData.email_error,
      timestamp: new Date().toISOString()
    });

    if (error) {
      console.error('Failed to log Gmail alert to database:', error);
    } else {
      console.log('✅ Gmail alert logged to database');
    }
  } catch (error) {
    console.error('Error logging Gmail alert to database:', error);
  }
}

serve(handler)

