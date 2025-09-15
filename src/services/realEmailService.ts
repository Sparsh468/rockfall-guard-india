/**
 * Real Email Service - Actually sends emails using multiple methods
 * This service provides real email sending capabilities
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

export class RealEmailService {
  private static instance: RealEmailService;
  private emailLog: any[] = [];

  public static getInstance(): RealEmailService {
    if (!RealEmailService.instance) {
      RealEmailService.instance = new RealEmailService();
    }
    return RealEmailService.instance;
  }

  /**
   * Send email using multiple methods
   */
  async sendEmail(emailData: EmailData): Promise<EmailResponse> {
    try {
      console.log('📧 RealEmailService: Attempting to send real email to:', emailData.to);
      console.log('📋 Subject:', emailData.subject);

      // Validate email data
      if (!emailData.to || !emailData.subject || !emailData.textContent) {
        return {
          success: false,
          error: 'Missing required email fields: to, subject, textContent'
        };
      }

      // Method 1: Try Web3Forms (free, reliable)
      try {
        const web3formsResult = await this.sendViaWeb3Forms(emailData);
        if (web3formsResult.success) {
          this.logEmail(emailData, 'web3forms');
          this.displayEmailNotification(emailData, true, 'Web3Forms');
          return web3formsResult;
        }
      } catch (error) {
        console.log('Web3Forms failed:', error);
      }

      // Method 2: Try Formspree (free, reliable)
      try {
        const formspreeResult = await this.sendViaFormspree(emailData);
        if (formspreeResult.success) {
          this.logEmail(emailData, 'formspree');
          this.displayEmailNotification(emailData, true, 'Formspree');
          return formspreeResult;
        }
      } catch (error) {
        console.log('Formspree failed:', error);
      }

      // Method 3: Try EmailJS (if configured)
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

      // Method 4: Try SMTP via webhook
      try {
        const smtpResult = await this.sendViaSMTP(emailData);
        if (smtpResult.success) {
          this.logEmail(emailData, 'smtp');
          this.displayEmailNotification(emailData, true, 'SMTP');
          return smtpResult;
        }
      } catch (error) {
        console.log('SMTP failed:', error);
      }

      // All methods failed - return error
      console.error('All email methods failed');
      this.displayEmailNotification(emailData, false, 'All methods failed');
      return {
        success: false,
        error: 'All email sending methods failed',
        method: 'none'
      };

    } catch (error: any) {
      console.error('❌ RealEmailService: Error sending email:', error);
      return {
        success: false,
        error: error.message,
        method: 'error'
      };
    }
  }

  /**
   * Send via Web3Forms (free service)
   */
  private async sendViaWeb3Forms(emailData: EmailData): Promise<EmailResponse> {
    try {
      // Web3Forms endpoint (you can get a free endpoint at web3forms.com)
      const web3formsEndpoint = 'https://api.web3forms.com/submit';
      const accessKey = 'YOUR_WEB3FORMS_ACCESS_KEY'; // Replace with your actual key

      // Check if access key is configured
      if (accessKey === 'YOUR_WEB3FORMS_ACCESS_KEY') {
        return {
          success: false,
          error: 'Web3Forms not configured - please set your access key'
        };
      }

      // Use JSON format instead of FormData for better compatibility
      const requestBody = {
        access_key: accessKey,
        to: emailData.to,
        subject: emailData.subject,
        message: emailData.textContent,
        from_name: 'SHAIL KAVACH Mining Safety System',
        reply_to: 'noreply@shailkavach.com',
        html: emailData.htmlContent
      };

      const response = await fetch(web3formsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ Email sent via Web3Forms');
          return {
            success: true,
            method: 'web3forms',
            message: 'Email sent successfully via Web3Forms'
          };
        } else {
          return {
            success: false,
            error: `Web3Forms error: ${result.message || 'Unknown error'}`
          };
        }
      } else {
        const errorText = await response.text();
        return {
          success: false,
          error: `Web3Forms error: ${response.status} - ${errorText}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Web3Forms error: ${error.message}`
      };
    }
  }

  /**
   * Send via Formspree (free service)
   */
  private async sendViaFormspree(emailData: EmailData): Promise<EmailResponse> {
    try {
      // Formspree endpoint (you can get a free endpoint at formspree.io)
      const formspreeEndpoint = 'https://formspree.io/f/YOUR_FORM_ID'; // Replace with your actual form ID

      // Check if form ID is configured
      if (formspreeEndpoint === 'https://formspree.io/f/YOUR_FORM_ID') {
        return {
          success: false,
          error: 'Formspree not configured - please set your form ID'
        };
      }

      const formData = new FormData();
      formData.append('email', emailData.to);
      formData.append('subject', emailData.subject);
      formData.append('message', emailData.textContent);
      formData.append('_replyto', emailData.to);
      formData.append('_subject', emailData.subject);

      const response = await fetch(formspreeEndpoint, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        console.log('✅ Email sent via Formspree');
        return {
          success: true,
          method: 'formspree',
          message: 'Email sent successfully via Formspree'
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          error: `Formspree error: ${response.status} - ${errorText}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Formspree error: ${error.message}`
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
   * Send via SMTP webhook
   */
  private async sendViaSMTP(emailData: EmailData): Promise<EmailResponse> {
    try {
      const smtpWebhookUrl = import.meta.env.VITE_SMTP_WEBHOOK_URL;
      
      if (!smtpWebhookUrl) {
        return {
          success: false,
          error: 'SMTP webhook not configured'
        };
      }

      const response = await fetch(smtpWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.htmlContent,
          text: emailData.textContent,
          from: 'noreply@shailkavach.com'
        }),
      });

      if (response.ok) {
        console.log('✅ Email sent via SMTP');
        return {
          success: true,
          method: 'smtp',
          message: 'Email sent successfully via SMTP'
        };
      }

      return {
        success: false,
        error: `SMTP error: ${response.status}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: `SMTP error: ${error.message}`
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
          ${success ? 'Check your email inbox for the alert!' : 'Please check the console for error details.'}
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
      localStorage.setItem('real_email_log', JSON.stringify(this.emailLog));
    } catch (error) {
      console.error('Error logging email:', error);
    }
  }

  /**
   * Get email log
   */
  getEmailLog(): any[] {
    try {
      const stored = localStorage.getItem('real_email_log');
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
    localStorage.removeItem('real_email_log');
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    const web3formsKey = 'YOUR_WEB3FORMS_ACCESS_KEY';
    const formspreeId = 'YOUR_FORM_ID';
    const emailjsUserId = import.meta.env.VITE_EMAILJS_USER_ID;
    const smtpWebhook = import.meta.env.VITE_SMTP_WEBHOOK_URL;
    
    return !!(web3formsKey !== 'YOUR_WEB3FORMS_ACCESS_KEY' || 
              formspreeId !== 'YOUR_FORM_ID' || 
              emailjsUserId || 
              smtpWebhook);
  }

  /**
   * Get configuration status
   */
  getConfigStatus(): { web3forms: boolean; formspree: boolean; emailjs: boolean; smtp: boolean } {
    return {
      web3forms: 'YOUR_WEB3FORMS_ACCESS_KEY' !== 'YOUR_WEB3FORMS_ACCESS_KEY',
      formspree: 'YOUR_FORM_ID' !== 'YOUR_FORM_ID',
      emailjs: !!(import.meta.env.VITE_EMAILJS_USER_ID),
      smtp: !!(import.meta.env.VITE_SMTP_WEBHOOK_URL)
    };
  }
}

// Initialize the service
const realEmailService = RealEmailService.getInstance();

export default realEmailService;
