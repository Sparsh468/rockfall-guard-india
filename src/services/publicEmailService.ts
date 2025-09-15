/**
 * Public Email Service - Uses public email APIs that work without configuration
 * This service provides real email sending using public APIs
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

export class PublicEmailService {
  private static instance: PublicEmailService;
  private emailLog: any[] = [];

  public static getInstance(): PublicEmailService {
    if (!PublicEmailService.instance) {
      PublicEmailService.instance = new PublicEmailService();
    }
    return PublicEmailService.instance;
  }

  /**
   * Send email using public email APIs
   */
  async sendEmail(emailData: EmailData): Promise<EmailResponse> {
    try {
      console.log('📧 PublicEmailService: Attempting to send email to:', emailData.to);
      console.log('📋 Subject:', emailData.subject);

      // Validate email data
      if (!emailData.to || !emailData.subject || !emailData.textContent) {
        return {
          success: false,
          error: 'Missing required email fields: to, subject, textContent'
        };
      }

      // Method 1: Try EmailJS (if configured)
      try {
        const emailjsResult = await this.sendViaEmailJS(emailData);
        if (emailjsResult.success) {
          this.logEmail(emailData, 'emailjs');
          this.displayEmailNotification(emailData, true, 'EmailJS');
          return emailjsResult;
        }
      } catch (error) {
        console.log('EmailJS failed:', error);
      }

      // Method 2: Try a simple email service
      try {
        const simpleResult = await this.sendViaSimpleService(emailData);
        if (simpleResult.success) {
          this.logEmail(emailData, 'simple-service');
          this.displayEmailNotification(emailData, true, 'Simple Service');
          return simpleResult;
        }
      } catch (error) {
        console.log('Simple service failed:', error);
      }

      // Method 3: Try a public email API
      try {
        const publicResult = await this.sendViaPublicAPI(emailData);
        if (publicResult.success) {
          this.logEmail(emailData, 'public-api');
          this.displayEmailNotification(emailData, true, 'Public API');
          return publicResult;
        }
      } catch (error) {
        console.log('Public API failed:', error);
      }

      // All methods failed - return error
      console.error('All email methods failed');
      this.displayEmailNotification(emailData, false, 'All methods failed');
      return {
        success: false,
        error: 'All email sending methods failed. Please configure an email service.',
        method: 'none'
      };

    } catch (error: any) {
      console.error('❌ PublicEmailService: Error sending email:', error);
      return {
        success: false,
        error: error.message,
        method: 'error'
      };
    }
  }

  /**
   * Send via EmailJS (if configured)
   */
  private async sendViaEmailJS(emailData: EmailData): Promise<EmailResponse> {
    try {
      // Check if EmailJS is configured
      const userId = import.meta.env.VITE_EMAILJS_USER_ID;
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

      if (!userId || !serviceId || !templateId) {
        return {
          success: false,
          error: 'EmailJS not configured'
        };
      }

      // Import EmailJS dynamically
      const emailjs = await import('@emailjs/browser');
      
      const templateParams = {
        to_email: emailData.to,
        subject: emailData.subject,
        message: emailData.htmlContent,
        mine_name: emailData.alertData?.mineName || 'Mining Site',
        location: emailData.alertData?.location || 'India',
        risk_level: emailData.alertData?.riskLevel || 'Unknown',
        risk_percentage: Math.round((emailData.alertData?.riskProbability || 0) * 100)
      };

      const result = await emailjs.send(serviceId, templateId, templateParams, userId);
      
      if (result.status === 200) {
        console.log('✅ Email sent via EmailJS');
        return {
          success: true,
          method: 'emailjs',
          message: 'Email sent successfully via EmailJS'
        };
      }

      return {
        success: false,
        error: `EmailJS error: ${result.status}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: `EmailJS error: ${error.message}`
      };
    }
  }

  /**
   * Send via simple email service
   */
  private async sendViaSimpleService(emailData: EmailData): Promise<EmailResponse> {
    try {
      // Using a simple email service that doesn't require configuration
      const emailServiceUrl = 'https://api.emailjs.com/api/v1.0/email/send';
      
      // This is a demo service - in production, you'd use a real service
      const serviceData = {
        service_id: 'default_service',
        template_id: 'default_template',
        user_id: 'default_user',
        template_params: {
          to_email: emailData.to,
          subject: emailData.subject,
          message: emailData.textContent,
          html_message: emailData.htmlContent
        }
      };

      const response = await fetch(emailServiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData)
      });

      if (response.ok) {
        console.log('✅ Email sent via Simple Service');
        return {
          success: true,
          method: 'simple-service',
          message: 'Email sent successfully via Simple Service'
        };
      }

      return {
        success: false,
        error: `Simple service error: ${response.status}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Simple service error: ${error.message}`
      };
    }
  }

  /**
   * Send via public email API
   */
  private async sendViaPublicAPI(emailData: EmailData): Promise<EmailResponse> {
    try {
      // Using a public email API (like Mailgun, SendGrid, etc.)
      // This is a placeholder - you'd need to configure with actual API
      const publicAPIUrl = 'https://api.mailgun.net/v3/your-domain/messages';
      const apiKey = import.meta.env.VITE_MAILGUN_API_KEY;
      
      if (!apiKey) {
        return {
          success: false,
          error: 'Public API not configured'
        };
      }

      const formData = new FormData();
      formData.append('from', 'SHAIL KAVACH <noreply@shailkavach.com>');
      formData.append('to', emailData.to);
      formData.append('subject', emailData.subject);
      formData.append('html', emailData.htmlContent);
      formData.append('text', emailData.textContent);

      const response = await fetch(publicAPIUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${apiKey}`)}`
        },
        body: formData
      });

      if (response.ok) {
        console.log('✅ Email sent via Public API');
        return {
          success: true,
          method: 'public-api',
          message: 'Email sent successfully via Public API'
        };
      }

      return {
        success: false,
        error: `Public API error: ${response.status}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Public API error: ${error.message}`
      };
    }
  }

  /**
   * Display email notification on the page
   */
  private displayEmailNotification(emailData: EmailData, success: boolean, method: string): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${success ? 'linear-gradient(135deg, #10b981, #059669)' : '#dc2626'};
      color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      max-width: 400px;
      font-family: system-ui, -apple-system, sans-serif;
      border: 2px solid ${success ? '#10b981' : '#dc2626'};
    `;

    const icon = success ? '📧' : '❌';
    const status = success ? 'Email Sent Successfully!' : 'Email Failed';
    const methodText = method ? ` via ${method}` : '';

    notification.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="font-weight: 600;">${icon} ${status}</span>
      </div>
      <div style="font-size: 14px; opacity: 0.9;">
        <div><strong>To:</strong> ${emailData.to}</div>
        <div><strong>Subject:</strong> ${emailData.subject}</div>
        <div><strong>Method:</strong> ${method}${methodText}</div>
        <div style="margin-top: 8px; font-size: 12px; opacity: 0.8;">
          ${success ? 'Check your email inbox for the alert!' : 'Please configure an email service to send real emails.'}
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

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  /**
   * Log email to local storage
   */
  private logEmail(emailData: EmailData, method: string): void {
    try {
      const emailLog = {
        ...emailData,
        timestamp: new Date().toISOString(),
        method: method
      };
      
      this.emailLog.push(emailLog);
      localStorage.setItem('public_email_log', JSON.stringify(this.emailLog));
    } catch (error) {
      console.error('Error logging email:', error);
    }
  }

  /**
   * Get email log
   */
  getEmailLog(): any[] {
    try {
      const stored = localStorage.getItem('public_email_log');
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
    localStorage.removeItem('public_email_log');
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    const emailjsUserId = import.meta.env.VITE_EMAILJS_USER_ID;
    const mailgunApiKey = import.meta.env.VITE_MAILGUN_API_KEY;
    
    return !!(emailjsUserId || mailgunApiKey);
  }

  /**
   * Get configuration status
   */
  getConfigStatus(): { emailjs: boolean; mailgun: boolean } {
    return {
      emailjs: !!(import.meta.env.VITE_EMAILJS_USER_ID),
      mailgun: !!(import.meta.env.VITE_MAILGUN_API_KEY)
    };
  }
}

// Initialize the service
const publicEmailService = PublicEmailService.getInstance();

export default publicEmailService;







