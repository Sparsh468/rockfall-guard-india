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
  user_email?: string;
  user_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('send-alert function received request:', requestBody);
    
    const { mine_name, location, risk_probability, user_email, user_id }: AlertRequest = requestBody;

    console.log('Sending alert for:', { mine_name, location, risk_probability, user_email, user_id });

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

    // Send Email Alert via email service
    console.log('Checking if user_email exists:', user_email);
    if (user_email) {
      console.log('User email found, proceeding with email sending to:', user_email);
      try {
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Determine alert level based on risk probability
        let alertLevel = 'low';
        if (risk_probability >= 0.8) alertLevel = 'critical';
        else if (risk_probability >= 0.6) alertLevel = 'high';
        else if (risk_probability >= 0.4) alertLevel = 'medium';
        else alertLevel = 'low';

        // Send email via the email service
        const emailRequest = {
          to: user_email,
          subject: `📊 ${alertLevel.toUpperCase()} RISK: ${mine_name} - ${Math.round(risk_probability * 100)}% Rockfall Risk`,
          htmlContent: generateHtmlEmail(mine_name, location, risk_probability, alertLevel),
          textContent: alertMessage,
          priority: alertLevel,
          alertData: {
            mineName: mine_name,
            location,
            riskLevel: alertLevel,
            riskProbability: risk_probability,
            alertLevel,
            timestamp: new Date().toISOString(),
            userEmail: user_email,
            userName: 'Mining Safety User'
          }
        };
        
        console.log('Calling send-email-alert function with:', emailRequest);
        
        const emailResponse = await supabase.functions.invoke('send-email-alert', {
          body: emailRequest
        });
        
        console.log('Email function response:', emailResponse);

        if (emailResponse.error) {
          console.error('Email sending failed:', emailResponse.error);
        } else {
          console.log('Email alert sent successfully to:', user_email);
        }
      } catch (emailError) {
        console.error('Email service error:', emailError);
      }
    } else {
      console.log('No user email provided, skipping email alert');
    }

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

/**
 * Generate HTML email content
 */
function generateHtmlEmail(mineName: string, location: string, riskProbability: number, alertLevel: string): string {
  const riskPercentage = Math.round(riskProbability * 100);
  const alertColor = getAlertColor(alertLevel);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SHAIL KAVACH - Mining Risk Alert</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .alert-badge {
      background: ${alertColor};
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin: 10px 0;
      display: inline-block;
    }
    .content {
      padding: 30px;
    }
    .alert-details {
      background: #f8f9fa;
      border-left: 4px solid ${alertColor};
      padding: 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #495057;
    }
    .detail-value {
      color: #212529;
    }
    .risk-percentage {
      font-size: 32px;
      font-weight: 700;
      color: ${alertColor};
      text-align: center;
      margin: 20px 0;
    }
    .actions {
      background: #e3f2fd;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .action-title {
      font-weight: 600;
      color: #1976d2;
      margin-bottom: 10px;
    }
    .action-list {
      margin: 0;
      padding-left: 20px;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      color: #6c757d;
      font-size: 14px;
    }
    .footer a {
      color: #3b82f6;
      text-decoration: none;
    }
    .logo {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🛡️ SHAIL KAVACH</div>
      <h1>Mining Risk Alert</h1>
      <div class="alert-badge">${alertLevel.toUpperCase()} RISK</div>
    </div>
    
    <div class="content">
      <p>Dear Mining Safety User,</p>
      
      <p>This is an automated alert from SHAIL KAVACH - Mining Safety Dashboard regarding a potential rockfall risk at one of the monitored mining sites.</p>
      
      <div class="alert-details">
        <div class="detail-row">
          <span class="detail-label">Mine Name:</span>
          <span class="detail-value">${mineName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Location:</span>
          <span class="detail-value">${location}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Risk Level:</span>
          <span class="detail-value">${alertLevel.toUpperCase()}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Alert Time:</span>
          <span class="detail-value">${new Date().toLocaleString()}</span>
        </div>
      </div>
      
      <div class="risk-percentage">
        ${riskPercentage}%
      </div>
      
      <div class="actions">
        <div class="action-title">Recommended Actions:</div>
        <ul class="action-list">
          ${getRecommendedActions(alertLevel).map(action => `<li>${action}</li>`).join('')}
        </ul>
      </div>
      
      <p><strong>Please log into the SHAIL KAVACH dashboard immediately to view detailed sensor data and take appropriate action.</strong></p>
      
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
    
    <div class="footer">
      <p>SHAIL KAVACH - Mining Safety Dashboard</p>
      <p>Powered by AI-driven risk assessment technology</p>
      <p><a href="https://shailkavach.lovable.app">Access Dashboard</a></p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Get alert color based on alert level
 */
function getAlertColor(alertLevel: string): string {
  switch (alertLevel.toLowerCase()) {
    case 'critical':
      return '#dc2626'; // Red
    case 'high':
      return '#ea580c'; // Orange
    case 'medium':
      return '#d97706'; // Amber
    default:
      return '#059669'; // Green
  }
}

/**
 * Get recommended actions based on alert level
 */
function getRecommendedActions(alertLevel: string): string[] {
  switch (alertLevel.toLowerCase()) {
    case 'critical':
      return [
        'Immediately evacuate all personnel from the affected area',
        'Activate emergency response protocols',
        'Contact emergency services and local authorities',
        'Implement immediate stabilization measures',
        'Monitor the situation continuously'
      ];
    case 'high':
      return [
        'Evacuate personnel from high-risk areas',
        'Implement emergency protocols',
        'Increase monitoring frequency',
        'Prepare evacuation plans',
        'Contact safety supervisors immediately'
      ];
    case 'medium':
      return [
        'Increase monitoring frequency',
        'Implement additional safety measures',
        'Review and update safety protocols',
        'Notify all personnel of increased risk',
        'Prepare for potential evacuation'
      ];
    default:
      return [
        'Continue regular monitoring',
        'Review safety procedures',
        'Maintain normal operations with increased awareness',
        'Report any unusual conditions'
      ];
  }
}

serve(handler);