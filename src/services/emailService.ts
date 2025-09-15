interface EmailAlert {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface AlertData {
  mineName: string;
  location: string;
  riskLevel: string;
  riskProbability: number;
  alertLevel: string;
  timestamp: string;
  userEmail: string;
  userName?: string;
}

export class EmailService {
  private static instance: EmailService;

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Send email alert via Supabase Edge Function
   */
  async sendAlert(alertData: AlertData): Promise<{ success: boolean; error?: string }> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const emailAlert = this.createEmailAlert(alertData);
      
      const { data, error } = await supabase.functions.invoke('send-email-alert', {
        body: {
          to: emailAlert.to,
          subject: emailAlert.subject,
          htmlContent: emailAlert.htmlContent,
          textContent: emailAlert.textContent,
          priority: emailAlert.priority,
          alertData: alertData
        }
      });

      if (error) {
        console.error('Email service error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Failed to send email alert:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create formatted email alert
   */
  private createEmailAlert(alertData: AlertData): EmailAlert {
    const priority = this.getPriorityFromRiskLevel(alertData.riskLevel);
    const subject = this.generateSubject(alertData);
    const htmlContent = this.generateHtmlContent(alertData);
    const textContent = this.generateTextContent(alertData);

    return {
      to: alertData.userEmail,
      subject,
      htmlContent,
      textContent,
      priority
    };
  }

  /**
   * Generate email subject based on alert level
   * Always includes risk percentage and type for all conditions
   */
  private generateSubject(alertData: AlertData): string {
    const riskPercentage = Math.round(alertData.riskProbability * 100);
    const riskType = alertData.alertLevel.toUpperCase();
    
    // Always include risk percentage and type in subject
    return `📊 ${riskType} RISK: ${alertData.mineName} - ${riskPercentage}% Rockfall Risk`;
  }

  /**
   * Generate HTML email content
   */
  private generateHtmlContent(alertData: AlertData): string {
    const riskPercentage = Math.round(alertData.riskProbability * 100);
    const alertColor = this.getAlertColor(alertData.alertLevel);
    const userName = alertData.userName || 'Valued User';

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
      <div class="alert-badge">${alertData.alertLevel.toUpperCase()} RISK</div>
    </div>
    
    <div class="content">
      <p>Dear ${userName},</p>
      
      <p>This is an automated alert from SHAIL KAVACH - Mining Safety Dashboard regarding the latest risk assessment for one of the monitored mining sites.</p>
      
      <div class="alert-details">
        <div class="detail-row">
          <span class="detail-label">Mine Name:</span>
          <span class="detail-value">${alertData.mineName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Location:</span>
          <span class="detail-value">${alertData.location}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Risk Level:</span>
          <span class="detail-value">${alertData.riskLevel.toUpperCase()}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Alert Time:</span>
          <span class="detail-value">${new Date(alertData.timestamp).toLocaleString()}</span>
        </div>
      </div>
      
      <div class="risk-percentage">
        ${riskPercentage}%
      </div>
      
      <div class="actions">
        <div class="action-title">Recommended Actions:</div>
        <ul class="action-list">
          ${this.getRecommendedActions(alertData.alertLevel).map(action => `<li>${action}</li>`).join('')}
        </ul>
      </div>
      
      <p><strong>Please log into the SHAIL KAVACH dashboard immediately to view detailed sensor data and take appropriate action.</strong></p>
      
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
    
    <div class="footer">
      <p>SHAIL KAVACH - Mining Safety Dashboard</p>
      <p>Powered by AI-driven risk assessment technology</p>
      <p><a href="https://shailkavach.lovable.app">Access Dashboard</a> | <a href="#">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generate plain text email content
   */
  private generateTextContent(alertData: AlertData): string {
    const riskPercentage = Math.round(alertData.riskProbability * 100);
    const userName = alertData.userName || 'Valued User';

    return `
SHAIL KAVACH - Mining Risk Alert

Dear ${userName},

This is an automated alert from SHAIL KAVACH regarding the latest risk assessment for one of the monitored mining sites.

ALERT DETAILS:
- Mine Name: ${alertData.mineName}
- Location: ${alertData.location}
- Risk Level: ${alertData.riskLevel.toUpperCase()}
- Risk Probability: ${riskPercentage}%
- Alert Time: ${new Date(alertData.timestamp).toLocaleString()}

RECOMMENDED ACTIONS:
${this.getRecommendedActions(alertData.alertLevel).map(action => `• ${action}`).join('\n')}

Please log into the SHAIL KAVACH dashboard immediately to view detailed sensor data and take appropriate action.

This is an automated message. Please do not reply to this email.

---
SHAIL KAVACH - Mining Safety Dashboard
Powered by AI-driven risk assessment technology
Access Dashboard: https://shailkavach.lovable.app
`;
  }

  /**
   * Get alert color based on alert level
   */
  private getAlertColor(alertLevel: string): string {
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
   * Get priority level from risk level
   */
  private getPriorityFromRiskLevel(riskLevel: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (riskLevel.toLowerCase()) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      default:
        return 'low';
    }
  }

  /**
   * Get recommended actions based on alert level
   */
  private getRecommendedActions(alertLevel: string): string[] {
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
}

export const emailService = EmailService.getInstance();
