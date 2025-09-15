import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import emailService from './simpleEmailService';
import publicEmailService from './publicEmailService';
import workingEmailService from './workingEmailService';
import realEmailService from './realEmailService';
import gmailService from './gmailService';
import supabaseGmailService from './supabaseGmailService';

export interface AlertThresholds {
  critical: number; // >= 0.8
  high: number;     // >= 0.6
  medium: number;   // >= 0.4
  low: number;      // < 0.4
}

export interface AlertConfig {
  enableEmailAlerts: boolean;
  enableSMSAlerts: boolean;
  enablePushNotifications: boolean;
  alertThresholds: AlertThresholds;
  emailFrequency: 'immediate' | 'hourly' | 'daily';
}

export interface PredictionAlert {
  mineId: string;
  mineName: string;
  location: string;
  riskProbability: number;
  riskLevel: string;
  timestamp: string;
  userEmail: string;
  userId?: string;
}

export class AlertService {
  private static instance: AlertService;
  private alertConfig: AlertConfig = {
    enableEmailAlerts: true,
    enableSMSAlerts: false,
    enablePushNotifications: false,
    alertThresholds: {
      critical: 0.8,
      high: 0.6,
      medium: 0.4,
      low: 0.2
    },
    emailFrequency: 'immediate'
  };

  public static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  /**
   * Send alert for high-risk predictions
   */
  async sendPredictionAlert(predictionData: {
    mineId: string;
    mineName: string;
    location: string;
    riskProbability: number;
    userEmail: string;
    userId?: string;
  }): Promise<{ success: boolean; error?: string; method?: string }> {
    try {
      console.log('AlertService: sendPredictionAlert called with:', predictionData);
      
      // Determine risk level based on probability
      const riskLevel = this.determineRiskLevel(predictionData.riskProbability);
      console.log('AlertService: determined risk level:', riskLevel);
      
      // Check if alert should be sent based on thresholds
      if (!this.shouldSendAlert(predictionData.riskProbability)) {
        return { success: true }; // No alert needed
      }

      // Check if user has email alerts enabled
      if (!this.alertConfig.enableEmailAlerts) {
        return { success: true }; // Email alerts disabled
      }

      const alertData: PredictionAlert = {
        mineId: predictionData.mineId,
        mineName: predictionData.mineName,
        location: predictionData.location,
        riskProbability: predictionData.riskProbability,
        riskLevel,
        timestamp: new Date().toISOString(),
        userEmail: predictionData.userEmail,
        userId: predictionData.userId
      };

      // Send Gmail alert using Supabase Gmail service
      console.log('AlertService: sending Supabase Gmail alert to:', predictionData.userEmail);
      console.log('AlertService: risk details:', {
        riskLevel: riskLevel,
        riskPercentage: Math.round(predictionData.riskProbability * 100) + '%',
        mineName: predictionData.mineName
      });

      // Use Public Email Service as primary method (actually sends emails)
      console.log('AlertService: Using Public Email Service for actual email delivery...');
      
      const emailData = {
        to: predictionData.userEmail,
        subject: `📊 ${riskLevel.toUpperCase()} RISK: ${predictionData.mineName} - ${Math.round(predictionData.riskProbability * 100)}% Rockfall Risk`,
        htmlContent: this.generateHtmlEmail(predictionData.mineName, predictionData.location, predictionData.riskProbability, riskLevel),
        textContent: this.generateTextEmail(predictionData.mineName, predictionData.location, predictionData.riskProbability, riskLevel),
        priority: riskLevel,
        alertData: {
          mineName: predictionData.mineName,
          location: predictionData.location,
          riskLevel: riskLevel,
          riskProbability: predictionData.riskProbability,
          alertLevel: riskLevel,
          timestamp: new Date().toISOString(),
          userEmail: predictionData.userEmail,
          userName: 'Mining Safety User'
        }
      };

      // Try Public Email Service first (actually sends emails)
      let emailResult = await publicEmailService.sendEmail(emailData);
      console.log('AlertService: Public email service result:', emailResult);

      // If public email service fails, try Working Email Service as fallback
      if (!emailResult.success) {
        console.log('AlertService: Public email service failed, trying Working Email Service...');
        emailResult = await workingEmailService.sendEmail(emailData);
        console.log('AlertService: Working email service fallback result:', emailResult);
      }

      // If working email service fails, try Real Email Service as fallback
      if (!emailResult.success) {
        console.log('AlertService: Working email service failed, trying Real Email Service...');
        emailResult = await realEmailService.sendEmail(emailData);
        console.log('AlertService: Real email service fallback result:', emailResult);
      }

      // If real email service fails, try Gmail service as fallback
      if (!emailResult.success) {
        console.log('AlertService: Real email service failed, trying Gmail service...');
        emailResult = await gmailService.sendGmail(emailData);
        console.log('AlertService: Gmail service fallback result:', emailResult);
      }

      // If Gmail service fails, try Simple Email Service as fallback
      if (!emailResult.success) {
        console.log('AlertService: Gmail service failed, trying Simple Email Service...');
        emailResult = await emailService.sendEmail(emailData);
        console.log('AlertService: Simple email service fallback result:', emailResult);
      }

      // If all fail, try Supabase Gmail service as last resort
      if (!emailResult.success) {
        console.log('AlertService: All email services failed, trying Supabase Gmail service...');
        const supabaseGmailResult = await supabaseGmailService.sendPredictionGmailAlert({
          userEmail: predictionData.userEmail,
          userId: predictionData.userId || '',
          mineName: predictionData.mineName,
          location: predictionData.location,
          riskProbability: predictionData.riskProbability,
          mineId: predictionData.mineId
        });
        console.log('AlertService: Supabase Gmail result:', supabaseGmailResult);
        
        if (supabaseGmailResult.success) {
          emailResult = {
            success: true,
            method: supabaseGmailResult.method || 'supabase-gmail'
          };
        }
      }

      if (!emailResult.success) {
        console.error('Email sending failed:', emailResult.error);
        return { success: false, error: emailResult.error, method: emailResult.method };
      }

      // Log alert to database
      await this.logAlertToDatabase(alertData);

      return { success: true, method: emailResult.method };
    } catch (error: any) {
      console.error('Failed to send prediction alert:', error);
      return { success: false, error: error.message, method: 'error' };
    }
  }

  /**
   * Send alert for sensor data anomalies
   */
  async sendSensorAlert(sensorData: {
    mineId: string;
    mineName: string;
    location: string;
    sensorType: string;
    currentValue: number;
    threshold: number;
    userEmail: string;
    userId?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const riskProbability = this.calculateSensorRisk(sensorData.currentValue, sensorData.threshold);
      const riskLevel = this.determineRiskLevel(riskProbability);

      if (!this.shouldSendAlert(riskProbability)) {
        return { success: true };
      }

      const alertData: PredictionAlert = {
        mineId: sensorData.mineId,
        mineName: sensorData.mineName,
        location: sensorData.location,
        riskProbability,
        riskLevel,
        timestamp: new Date().toISOString(),
        userEmail: sensorData.userEmail,
        userId: sensorData.userId
      };

      // Send alert
      const { data, error } = await supabase.functions.invoke('send-alert', {
        body: {
          mine_id: sensorData.mineId,
          mine_name: sensorData.mineName,
          location: sensorData.location,
          risk_probability: riskProbability,
          user_email: sensorData.userEmail,
          user_id: sensorData.userId
        }
      });

      if (error) {
        console.error('Sensor alert error:', error);
        return { success: false, error: error.message };
      }

      // Log alert to database
      await this.logAlertToDatabase(alertData);

      return { success: true };
    } catch (error: any) {
      console.error('Failed to send sensor alert:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update alert configuration
   */
  updateAlertConfig(config: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config };
    
    // Save to localStorage for persistence
    localStorage.setItem('alertConfig', JSON.stringify(this.alertConfig));
  }

  /**
   * Get current alert configuration
   */
  getAlertConfig(): AlertConfig {
    // Try to load from localStorage first
    const savedConfig = localStorage.getItem('alertConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        this.alertConfig = { ...this.alertConfig, ...parsedConfig };
      } catch (error) {
        console.error('Failed to parse saved alert config:', error);
      }
    }
    
    return this.alertConfig;
  }

  /**
   * Determine risk level based on probability
   */
  private determineRiskLevel(probability: number): string {
    if (probability >= this.alertConfig.alertThresholds.critical) {
      return 'critical';
    } else if (probability >= this.alertConfig.alertThresholds.high) {
      return 'high';
    } else if (probability >= this.alertConfig.alertThresholds.medium) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Check if alert should be sent based on probability and configuration
   * Now sends alerts for ALL conditions (low, medium, high, critical)
   */
  private shouldSendAlert(probability: number): boolean {
    // Send alerts for all risk levels - no threshold restriction
    return true;
  }

  /**
   * Calculate risk probability from sensor value
   */
  private calculateSensorRisk(currentValue: number, threshold: number): number {
    // Simple risk calculation based on how much the value exceeds threshold
    const ratio = currentValue / threshold;
    return Math.min(1.0, Math.max(0.0, (ratio - 1) * 2)); // Scale to 0-1 range
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
   * Log alert to database
   */
  private async logAlertToDatabase(alertData: PredictionAlert): Promise<void> {
    try {
      const { error } = await supabase
        .from('alerts')
        .insert({
          mine_id: alertData.mineId,
          risk_probability: alertData.riskProbability,
          alert_level: alertData.riskLevel,
          message: `Risk alert sent to ${alertData.userEmail} for ${alertData.mineName}`,
          is_resolved: false
        });

      if (error) {
        console.error('Failed to log alert to database:', error);
      }
    } catch (error) {
      console.error('Error logging alert to database:', error);
    }
  }

  /**
   * Get user's email from current session
   */
  static async getUserEmail(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.email || null;
    } catch (error) {
      console.error('Failed to get user email:', error);
      return null;
    }
  }

  /**
   * Get user's ID from current session
   */
  static async getUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      console.error('Failed to get user ID:', error);
      return null;
    }
  }
}

export const alertService = AlertService.getInstance();
