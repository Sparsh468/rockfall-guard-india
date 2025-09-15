/**
 * Simple Email Service - Fallback email service that works without external dependencies
 * This service provides a simple way to send email alerts without requiring external services
 */

interface EmailData {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  priority?: string;
  alertData?: any;
}

interface EmailResponse {
  success: boolean;
  error?: string;
  method?: string;
  message?: string;
}

export class SimpleEmailService {
  private static instance: SimpleEmailService;
  private emailLog: any[] = [];

  public static getInstance(): SimpleEmailService {
    if (!SimpleEmailService.instance) {
      SimpleEmailService.instance = new SimpleEmailService();
    }
    return SimpleEmailService.instance;
  }

  /**
   * Send email using simple method (displays email content in console and shows notification)
   */
  async sendEmail(emailData: EmailData): Promise<EmailResponse> {
    try {
      console.log('📧 SimpleEmailService: Sending email to:', emailData.to);
      console.log('📋 Email Subject:', emailData.subject);
      console.log('📄 Email Content Preview:', emailData.textContent.substring(0, 200) + '...');

      // Validate email data
      if (!emailData.to || !emailData.subject || !emailData.textContent) {
        return {
          success: false,
          error: 'Missing required email fields: to, subject, textContent'
        };
      }

      // Log the email
      this.logEmail(emailData);

      // Display email notification
      this.displayEmailNotification(emailData);

      // Simulate email sending (in a real app, this would integrate with an email service)
      console.log('✅ SimpleEmailService: Email would be sent successfully');
      console.log('📧 TO:', emailData.to);
      console.log('📧 SUBJECT:', emailData.subject);
      console.log('📧 CONTENT:', emailData.textContent);

      return {
        success: true,
        method: 'simple-email',
        message: `Email alert prepared for ${emailData.to}`
      };

    } catch (error: any) {
      console.error('❌ SimpleEmailService: Error sending email:', error);
      return {
        success: false,
        error: error.message,
        message: `Failed to send email: ${error.message}`
      };
    }
  }

  /**
   * Send prediction alert email
   */
  async sendPredictionAlert(predictionData: {
    userEmail: string;
    mineName: string;
    location: string;
    riskProbability: number;
    riskLevel: string;
  }): Promise<EmailResponse> {
    try {
      const riskPercentage = Math.round(predictionData.riskProbability * 100);
      
      const emailData: EmailData = {
        to: predictionData.userEmail,
        subject: `🚨 ${predictionData.riskLevel.toUpperCase()} RISK: ${predictionData.mineName} - ${riskPercentage}% Rockfall Risk`,
        htmlContent: this.generateHtmlEmail(predictionData.mineName, predictionData.location, predictionData.riskProbability, predictionData.riskLevel),
        textContent: this.generateTextEmail(predictionData.mineName, predictionData.location, predictionData.riskProbability, predictionData.riskLevel),
        priority: predictionData.riskLevel,
        alertData: {
          mineName: predictionData.mineName,
          location: predictionData.location,
          riskLevel: predictionData.riskLevel,
          riskProbability: predictionData.riskProbability,
          timestamp: new Date().toISOString(),
          userEmail: predictionData.userEmail
        }
      };

      return await this.sendEmail(emailData);
    } catch (error: any) {
      console.error('❌ SimpleEmailService: Prediction alert error:', error);
      return {
        success: false,
        error: error.message,
        message: `Failed to send prediction alert: ${error.message}`
      };
    }
  }

  /**
   * Generate HTML email content
   */
  private generateHtmlEmail(mineName: string, location: string, riskProbability: number, riskLevel: string): string {
    const riskPercentage = Math.round(riskProbability * 100);
    const riskColor = this.getRiskColor(riskLevel);
    const recommendations = this.getRecommendedActions(riskLevel);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SHAIL KAVACH - Mining Risk Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; }
          .content { padding: 30px; }
          .risk-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; text-transform: uppercase; }
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
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="alert-icon">${this.getAlertIcon(riskLevel)}</div>
            <h1>SHAIL KAVACH</h1>
            <p>Mining Safety Risk Alert</p>
          </div>
          
          <div class="content">
            <div style="text-align: center; margin-bottom: 30px;">
              <span class="risk-badge ${riskLevel}">${riskLevel.toUpperCase()} RISK</span>
              <h2 style="margin: 15px 0; color: ${riskColor};">${riskPercentage}% Rockfall Risk Detected</h2>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Mine Name</div>
                <div class="info-value">${mineName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Location</div>
                <div class="info-value">${location}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Risk Level</div>
                <div class="info-value" style="color: ${riskColor};">${riskLevel.toUpperCase()}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Risk Percentage</div>
                <div class="info-value" style="color: ${riskColor}; font-weight: bold;">${riskPercentage}%</div>
              </div>
            </div>

            <div class="recommendations">
              <h3>Recommended Actions:</h3>
              <ul>
                ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
              </ul>
            </div>

            <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1e40af;">System Information</h3>
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                This alert was automatically generated by SHAIL KAVACH mining safety system at ${new Date().toLocaleString()}.
                Please take immediate action based on the risk assessment.
              </p>
            </div>
          </div>
          
          <div class="footer">
            <p>SHAIL KAVACH - Advanced Mining Safety System</p>
            <p>This is an automated alert. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate text email content
   */
  private generateTextEmail(mineName: string, location: string, riskProbability: number, riskLevel: string): string {
    const riskPercentage = Math.round(riskProbability * 100);
    const recommendations = this.getRecommendedActions(riskLevel);

    return `
🚨 SHAIL KAVACH - MINING RISK ALERT 🚨

RISK ASSESSMENT:
- Mine: ${mineName}
- Location: ${location}
- Risk Level: ${riskLevel.toUpperCase()}
- Risk Percentage: ${riskPercentage}%

RECOMMENDED ACTIONS:
${recommendations.map(rec => `• ${rec}`).join('\n')}

SYSTEM INFORMATION:
This alert was automatically generated by SHAIL KAVACH mining safety system at ${new Date().toLocaleString()}.

Please take immediate action based on the risk assessment.

---
SHAIL KAVACH - Advanced Mining Safety System
This is an automated alert. Please do not reply to this email.
    `.trim();
  }

  /**
   * Get risk color for UI
   */
  private getRiskColor(riskLevel: string): string {
    switch (riskLevel.toLowerCase()) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  }

  /**
   * Get alert icon
   */
  private getAlertIcon(riskLevel: string): string {
    switch (riskLevel.toLowerCase()) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '📊';
    }
  }

  /**
   * Get recommended actions based on risk level
   */
  private getRecommendedActions(riskLevel: string): string[] {
    switch (riskLevel.toLowerCase()) {
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
   * Display email notification on the page
   */
  private displayEmailNotification(emailData: EmailData): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #3b82f6, #1e40af);
      color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      max-width: 400px;
      font-family: system-ui, -apple-system, sans-serif;
      border: 2px solid #1e40af;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="font-weight: 600;">📧 Email Alert Prepared</span>
      </div>
      <div style="font-size: 14px; opacity: 0.9;">
        <div><strong>To:</strong> ${emailData.to}</div>
        <div><strong>Subject:</strong> ${emailData.subject}</div>
        <div><strong>Method:</strong> Simple Email Service</div>
        <div style="margin-top: 8px; font-size: 12px; opacity: 0.8;">
          Email content has been logged to console. In a production environment, this would be sent via email service.
        </div>
      </div>
      <button onclick="this.parentElement.remove()" style="
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        opacity: 0.7;
      ">×</button>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 8000);
  }

  /**
   * Log email to local storage
   */
  private logEmail(emailData: EmailData): void {
    try {
      const emailLog = {
        ...emailData,
        timestamp: new Date().toISOString(),
        method: 'simple-email'
      };
      
      this.emailLog.push(emailLog);
      localStorage.setItem('simple_email_log', JSON.stringify(this.emailLog));
    } catch (error) {
      console.error('Error logging email:', error);
    }
  }

  /**
   * Get email log
   */
  getEmailLog(): any[] {
    try {
      const stored = localStorage.getItem('simple_email_log');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading email log:', error);
      return [];
    }
  }

  /**
   * Clear email log
   */
  clearEmailLog(): void {
    this.emailLog = [];
    localStorage.removeItem('simple_email_log');
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return true; // Simple email service is always available
  }
}

// Initialize the service
const simpleEmailService = SimpleEmailService.getInstance();

export default simpleEmailService;