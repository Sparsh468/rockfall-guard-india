/**
 * Supabase Gmail Service - Uses Supabase Edge Functions to send Gmail alerts
 * This service sends Gmail alerts with risk percentage and risk type information
 */

import { supabase } from '@/integrations/supabase/client';

interface SupabaseGmailAlert {
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

interface GmailAlertResponse {
  success: boolean;
  method?: string;
  error?: string;
  message: string;
}

export class SupabaseGmailService {
  private static instance: SupabaseGmailService;
  private alertLog: SupabaseGmailAlert[] = [];

  public static getInstance(): SupabaseGmailService {
    if (!SupabaseGmailService.instance) {
      SupabaseGmailService.instance = new SupabaseGmailService();
    }
    return SupabaseGmailService.instance;
  }

  /**
   * Send Gmail alert via Supabase Edge Function
   */
  async sendGmailAlert(alertData: SupabaseGmailAlert): Promise<GmailAlertResponse> {
    try {
      console.log('📧 SupabaseGmailService: Sending Gmail alert to:', alertData.user_email);
      console.log('📊 Risk Details:', {
        mine: alertData.mine_name,
        risk_type: alertData.risk_type,
        risk_percentage: alertData.risk_percentage + '%',
        location: alertData.location
      });

      // Validate Gmail address
      if (!alertData.user_email.includes('@gmail.com')) {
        const errorMsg = 'Email must be a Gmail address (@gmail.com)';
        console.error('❌ SupabaseGmailService:', errorMsg);
        return {
          success: false,
          error: errorMsg,
          message: errorMsg
        };
      }

      // Validate required fields
      if (!alertData.mine_name || !alertData.risk_type || alertData.risk_percentage === undefined) {
        const errorMsg = 'Missing required fields: mine_name, risk_type, risk_percentage';
        console.error('❌ SupabaseGmailService:', errorMsg);
        return {
          success: false,
          error: errorMsg,
          message: errorMsg
        };
      }

      // Prepare request body
      const requestBody = {
        user_email: alertData.user_email,
        user_id: alertData.user_id,
        mine_name: alertData.mine_name,
        location: alertData.location,
        risk_percentage: alertData.risk_percentage,
        risk_type: alertData.risk_type,
        risk_probability: alertData.risk_probability,
        timestamp: alertData.timestamp || new Date().toISOString(),
        mine_id: alertData.mine_id
      };

      console.log('📤 SupabaseGmailService: Calling Supabase Edge Function with:', requestBody);

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-gmail-alert', {
        body: requestBody
      });

      console.log('📥 SupabaseGmailService: Supabase function response:', { data, error });

      if (error) {
        console.error('❌ SupabaseGmailService: Supabase function error:', error);
        return {
          success: false,
          error: error.message,
          message: `Supabase function error: ${error.message}`
        };
      }

      if (data) {
        // Log the alert locally
        this.alertLog.push(alertData);
        this.saveAlertLog();

        // Display visual notification
        this.displayGmailNotification(alertData, data.success, data.method);

        console.log('✅ SupabaseGmailService: Gmail alert result:', data);
        return {
          success: data.success,
          method: data.method,
          error: data.error,
          message: data.message
        };
      } else {
        const errorMsg = 'No response from Supabase function';
        console.error('❌ SupabaseGmailService:', errorMsg);
        return {
          success: false,
          error: errorMsg,
          message: errorMsg
        };
      }

    } catch (error: any) {
      console.error('❌ SupabaseGmailService: Unexpected error:', error);
      return {
        success: false,
        error: error.message,
        message: `Unexpected error: ${error.message}`
      };
    }
  }

  /**
   * Send Gmail alert for prediction result
   */
  async sendPredictionGmailAlert(predictionData: {
    userEmail: string;
    userId: string;
    mineName: string;
    location: string;
    riskProbability: number;
    mineId?: string;
  }): Promise<GmailAlertResponse> {
    try {
      // Calculate risk percentage and type
      const riskPercentage = Math.round(predictionData.riskProbability * 100);
      const riskType = this.determineRiskType(predictionData.riskProbability);

      const alertData: SupabaseGmailAlert = {
        user_email: predictionData.userEmail,
        user_id: predictionData.userId,
        mine_name: predictionData.mineName,
        location: predictionData.location,
        risk_percentage: riskPercentage,
        risk_type: riskType,
        risk_probability: predictionData.riskProbability,
        timestamp: new Date().toISOString(),
        mine_id: predictionData.mineId
      };

      return await this.sendGmailAlert(alertData);
    } catch (error: any) {
      console.error('❌ SupabaseGmailService: Prediction alert error:', error);
      return {
        success: false,
        error: error.message,
        message: `Prediction alert error: ${error.message}`
      };
    }
  }

  /**
   * Determine risk type based on probability
   */
  private determineRiskType(probability: number): 'low' | 'medium' | 'high' | 'critical' {
    if (probability >= 0.8) return 'critical';
    if (probability >= 0.6) return 'high';
    if (probability >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * Display Gmail notification on the page
   */
  private displayGmailNotification(alertData: SupabaseGmailAlert, success: boolean, method?: string): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${success ? 'linear-gradient(135deg, #ea4335, #fbbc05)' : '#dc2626'};
      color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      max-width: 400px;
      font-family: system-ui, -apple-system, sans-serif;
      border: 2px solid ${success ? '#34a853' : '#dc2626'};
    `;

    const icon = success ? '📧' : '❌';
    const status = success ? 'Gmail Alert Sent' : 'Gmail Alert Failed';
    const methodText = method ? ` via ${method}` : '';

    notification.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="font-weight: 600;">${icon} ${status}</span>
      </div>
      <div style="font-size: 14px; opacity: 0.9;">
        <div><strong>To Gmail:</strong> ${alertData.user_email}</div>
        <div><strong>Mine:</strong> ${alertData.mine_name}</div>
        <div><strong>Risk:</strong> ${alertData.risk_type} (${alertData.risk_percentage}%)</div>
        <div><strong>Method:</strong> Supabase${methodText}</div>
        <div style="margin-top: 8px; font-size: 12px; opacity: 0.8;">
          ${success ? 'Check your Gmail inbox for the detailed alert email.' : 'Please check the console for error details.'}
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
   * Save alert log to localStorage
   */
  private saveAlertLog(): void {
    try {
      localStorage.setItem('supabase_gmail_log', JSON.stringify(this.alertLog));
    } catch (error) {
      console.error('Error saving Gmail alert log:', error);
    }
  }

  /**
   * Load alert log from localStorage
   */
  loadAlertLog(): void {
    try {
      const stored = localStorage.getItem('supabase_gmail_log');
      if (stored) {
        this.alertLog = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading Gmail alert log:', error);
    }
  }

  /**
   * Get alert log
   */
  getAlertLog(): SupabaseGmailAlert[] {
    return this.alertLog;
  }

  /**
   * Clear alert log
   */
  clearAlertLog(): void {
    this.alertLog = [];
    localStorage.removeItem('supabase_gmail_log');
  }

  /**
   * Get Gmail alerts from Supabase database
   */
  async getGmailAlertsFromDatabase(userId?: string): Promise<SupabaseGmailAlert[]> {
    try {
      let query = supabase.from('gmail_alerts').select('*').order('timestamp', { ascending: false });
      
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching Gmail alerts from database:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching Gmail alerts from database:', error);
      return [];
    }
  }

  /**
   * Check if Gmail service is configured
   */
  isConfigured(): boolean {
    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    return !!(supabaseUrl && supabaseAnonKey);
  }

  /**
   * Get configuration status
   */
  getConfigStatus(): { supabase: boolean; edgeFunction: boolean } {
    return {
      supabase: this.isConfigured(),
      edgeFunction: true // Assume edge function exists if Supabase is configured
    };
  }
}

// Initialize the service
const supabaseGmailService = SupabaseGmailService.getInstance();
supabaseGmailService.loadAlertLog();

export default supabaseGmailService;









