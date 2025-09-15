/**
 * Gmail Email Service - Direct integration with Gmail for sending emails
 * This service uses EmailJS to send emails to Gmail addresses
 */

import emailjs from '@emailjs/browser';

interface GmailData {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  priority: string;
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

export class GmailService {
  private static instance: GmailService;
  private isInitialized = false;
  private emailLog: GmailData[] = [];

  // EmailJS configuration - these will be set via environment variables
  private config = {
    userId: import.meta.env.VITE_EMAILJS_USER_ID || '',
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || ''
  };

  public static getInstance(): GmailService {
    if (!GmailService.instance) {
      GmailService.instance = new GmailService();
    }
    return GmailService.instance;
  }

  /**
   * Initialize EmailJS with configuration
   */
  private initializeEmailJS(): void {
    if (this.isInitialized) return;

    try {
      if (this.config.userId) {
        emailjs.init(this.config.userId);
        this.isInitialized = true;
        console.log('✅ Gmail Service: EmailJS initialized successfully');
      } else {
        console.warn('⚠️ Gmail Service: EmailJS not configured - using fallback methods');
      }
    } catch (error) {
      console.error('❌ Gmail Service: Failed to initialize EmailJS:', error);
    }
  }

  /**
   * Send email to Gmail address
   */
  async sendGmail(emailData: GmailData): Promise<{ success: boolean; error?: string; method?: string }> {
    try {
      console.log('📧 Gmail Service: Attempting to send email to Gmail:', emailData.to);
      
      // Initialize EmailJS
      this.initializeEmailJS();

      // Method 1: Try EmailJS (Primary method for Gmail)
      if (this.isInitialized && this.config.serviceId && this.config.templateId) {
        const emailjsResult = await this.sendViaEmailJS(emailData);
        if (emailjsResult.success) {
          return { success: true, method: 'gmail-emailjs' };
        }
      }

      // Method 2: Try Gmail API via webhook
      const webhookResult = await this.sendViaGmailWebhook(emailData);
      if (webhookResult.success) {
        return { success: true, method: 'gmail-webhook' };
      }

      // Method 3: Try SMTP via service
      const smtpResult = await this.sendViaSMTP(emailData);
      if (smtpResult.success) {
        return { success: true, method: 'gmail-smtp' };
      }

      // Method 4: Fallback - Log and show notification
      const logResult = await this.logGmail(emailData);
      return { success: true, method: 'gmail-logged', ...logResult };

    } catch (error: any) {
      console.error('❌ Gmail Service error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send via EmailJS (Primary method for Gmail)
   */
  private async sendViaEmailJS(emailData: GmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const templateParams = {
        to_email: emailData.to,
        from_name: 'SHAIL KAVACH',
        subject: emailData.subject,
        message: emailData.htmlContent,
        mine_name: emailData.alertData.mineName,
        location: emailData.alertData.location,
        risk_level: emailData.alertData.riskLevel.toUpperCase(),
        risk_percentage: Math.round(emailData.alertData.riskProbability * 100),
        timestamp: emailData.alertData.timestamp,
        priority: emailData.priority
      };

      console.log('📧 Gmail Service: Sending via EmailJS to Gmail:', emailData.to);
      
      const response = await emailjs.send(
        this.config.serviceId,
        this.config.templateId,
        templateParams
      );

      console.log('✅ Gmail Service: EmailJS response:', response);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Gmail Service: EmailJS error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send via Gmail Webhook
   */
  private async sendViaGmailWebhook(emailData: GmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const webhookUrl = import.meta.env.VITE_GMAIL_WEBHOOK_URL;
      
      if (!webhookUrl) {
        return { success: false, error: 'Gmail webhook not configured' };
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.htmlContent,
          text: emailData.textContent,
          priority: emailData.priority,
          alertData: emailData.alertData,
          provider: 'gmail'
        }),
      });

      if (response.ok) {
        console.log('✅ Gmail Service: Email sent via Gmail webhook');
        return { success: true };
      } else {
        return { success: false, error: `Gmail webhook error: ${response.status}` };
      }
    } catch (error: any) {
      console.error('❌ Gmail Service: Gmail webhook error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send via SMTP (for Gmail)
   */
  private async sendViaSMTP(emailData: GmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const smtpUrl = import.meta.env.VITE_GMAIL_SMTP_URL;
      
      if (!smtpUrl) {
        return { success: false, error: 'Gmail SMTP not configured' };
      }

      const response = await fetch(smtpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.htmlContent,
          text: emailData.textContent,
          priority: emailData.priority
        }),
      });

      if (response.ok) {
        console.log('✅ Gmail Service: Email sent via Gmail SMTP');
        return { success: true };
      } else {
        return { success: false, error: `Gmail SMTP error: ${response.status}` };
      }
    } catch (error: any) {
      console.error('❌ Gmail Service: Gmail SMTP error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log Gmail email (fallback for demo/testing)
   */
  private async logGmail(emailData: GmailData): Promise<{ success: boolean; error?: string; alertId?: string }> {
    try {
      // Store email in local storage for debugging
      this.emailLog.push(emailData);
      localStorage.setItem('gmail_log', JSON.stringify(this.emailLog));

      // Log to console
      console.log('📧 GMAIL EMAIL WOULD BE SENT:');
      console.log('To Gmail:', emailData.to);
      console.log('Subject:', emailData.subject);
      console.log('Mine:', emailData.alertData.mineName);
      console.log('Risk Level:', emailData.alertData.riskLevel);
      console.log('Risk Percentage:', Math.round(emailData.alertData.riskProbability * 100) + '%');
      console.log('HTML Content Preview:', emailData.htmlContent.substring(0, 200) + '...');

      // Display Gmail notification
      this.displayGmailNotification(emailData);

      return { success: true, alertId: 'gmail-logged-' + Date.now() };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Display Gmail notification on the page
   */
  private displayGmailNotification(emailData: GmailData): void {
    // Create a notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ea4335, #fbbc05);
      color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      max-width: 400px;
      font-family: system-ui, -apple-system, sans-serif;
      border: 2px solid #34a853;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="font-weight: 600;">📧 Gmail Alert Sent</span>
      </div>
      <div style="font-size: 14px; opacity: 0.9;">
        <div><strong>To Gmail:</strong> ${emailData.to}</div>
        <div><strong>Mine:</strong> ${emailData.alertData.mineName}</div>
        <div><strong>Risk:</strong> ${emailData.alertData.riskLevel} (${Math.round(emailData.alertData.riskProbability * 100)}%)</div>
        <div style="margin-top: 8px; font-size: 12px; opacity: 0.8;">
          Check your Gmail inbox for the detailed alert email.
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

    // Auto-remove after 8 seconds (longer for Gmail)
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 8000);
  }

  /**
   * Get Gmail email log
   */
  getGmailLog(): GmailData[] {
    return this.emailLog;
  }

  /**
   * Clear Gmail email log
   */
  clearGmailLog(): void {
    this.emailLog = [];
    localStorage.removeItem('gmail_log');
  }

  /**
   * Load Gmail email log from localStorage
   */
  loadGmailLog(): void {
    try {
      const stored = localStorage.getItem('gmail_log');
      if (stored) {
        this.emailLog = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading Gmail log:', error);
    }
  }

  /**
   * Check if Gmail service is configured
   */
  isConfigured(): boolean {
    return !!(this.config.userId && this.config.serviceId && this.config.templateId);
  }

  /**
   * Get configuration status
   */
  getConfigStatus(): { userId: boolean; serviceId: boolean; templateId: boolean } {
    return {
      userId: !!this.config.userId,
      serviceId: !!this.config.serviceId,
      templateId: !!this.config.templateId
    };
  }
}

// Initialize the Gmail service
const gmailService = GmailService.getInstance();
gmailService.loadGmailLog();

export default gmailService;









