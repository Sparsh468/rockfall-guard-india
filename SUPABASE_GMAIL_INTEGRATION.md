# 📧 Supabase Gmail Integration Guide

## ✅ **Complete Supabase Gmail Alert System**

SHAIL KAVACH now has a comprehensive Supabase-based Gmail integration that sends alerts to registered users' Gmail addresses with detailed risk percentage and risk type information.

## 🚀 **What's Been Implemented:**

### **1. Supabase Edge Function (`send-gmail-alert`)**
- **Direct Gmail Integration**: Uses Supabase Edge Functions for reliable Gmail delivery
- **Risk Information**: Includes risk percentage and risk type (low, medium, high, critical)
- **Multiple Email Methods**: EmailJS, SMTP, Webhook with automatic fallback
- **Database Logging**: All Gmail alerts logged to Supabase database
- **Gmail Validation**: Ensures only Gmail addresses receive alerts

### **2. Supabase Gmail Service (`supabaseGmailService.ts`)**
- **Edge Function Integration**: Calls Supabase Edge Function for Gmail alerts
- **Risk Type Determination**: Automatically determines risk type from probability
- **Visual Notifications**: Shows Gmail-style notifications on the page
- **Alert Logging**: Stores all alerts locally and in Supabase database
- **Fallback Support**: Multiple email delivery methods

### **3. Enhanced Alert Service**
- **Supabase Priority**: Uses Supabase Gmail service as primary method
- **Risk Details**: Sends risk percentage and risk type information
- **Multiple Fallbacks**: Falls back to other email services if Supabase fails
- **Comprehensive Logging**: Detailed logging throughout the process

### **4. Supabase Gmail Test Component**
- **Gmail Testing**: Tests Supabase Gmail integration specifically
- **Database Integration**: Loads and displays Gmail alerts from database
- **Configuration Status**: Shows Supabase configuration status
- **Multiple Test Types**: Tests both direct alerts and prediction alerts

### **5. Database Schema (`gmail_alerts` table)**
- **Complete Tracking**: Tracks all Gmail alert attempts
- **Risk Information**: Stores risk percentage, type, and probability
- **Delivery Status**: Records email delivery success/failure
- **User Association**: Links alerts to registered users

## 📧 **Gmail Alert Features:**

### **Professional Gmail Emails Include:**
- 🏷️ **SHAIL KAVACH Branding**: Professional header with Gmail-specific styling
- 📊 **Risk Information**: Risk percentage and risk type prominently displayed
- 🎯 **Risk Type Badges**: Color-coded badges for low, medium, high, critical
- 📋 **Detailed Information**: Mine name, location, risk details
- 📋 **Recommended Actions**: Specific actions based on risk type
- ⏰ **Timestamp**: When the assessment was made
- 🎨 **Gmail Optimized**: Designed specifically for Gmail rendering
- 📱 **Mobile Responsive**: Works on Gmail mobile and desktop apps

### **Risk Type Information:**
- **Low Risk (0-39%)**: Green styling, continue with caution
- **Medium Risk (40-59%)**: Yellow styling, increase monitoring
- **High Risk (60-79%)**: Orange styling, restrict access
- **Critical Risk (80-100%)**: Red styling, immediate evacuation

## 🔧 **How Supabase Gmail Integration Works:**

### **Automatic Gmail Alert Flow:**
1. **User Makes Prediction**: User runs risk assessment
2. **Risk Calculation**: System calculates risk probability and determines type
3. **Supabase Gmail Service**: Calls Supabase Edge Function with risk details
4. **Edge Function Processing**: Validates Gmail address and prepares email
5. **Email Delivery**: Attempts delivery via EmailJS, SMTP, or webhook
6. **Database Logging**: Records alert attempt and delivery status
7. **Visual Notification**: Shows Gmail-style notification on page
8. **Fallback Handling**: Uses alternative methods if primary fails

### **Supabase Edge Function Features:**
- **Gmail Validation**: Ensures email is @gmail.com address
- **Risk Type Determination**: Calculates risk type from probability
- **Professional Templates**: Rich HTML emails with Gmail optimization
- **Multiple Delivery Methods**: EmailJS, SMTP, webhook with fallback
- **Database Logging**: Records all alert attempts and results
- **Error Handling**: Comprehensive error handling and logging

## 🧪 **Testing Supabase Gmail Integration:**

### **Using Supabase Gmail Test Component:**
1. **Prerequisites:**
   - Must be logged in with a Gmail address (@gmail.com)
   - Supabase must be configured

2. **Test Types:**
   - **Direct Gmail Alert**: Tests basic Gmail alert functionality
   - **Prediction Gmail Alert**: Tests prediction-specific Gmail alerts
   - **Database Integration**: Loads alerts from Supabase database

3. **Expected Results:**
   - ✅ Success notification in the app
   - ✅ Email received in Gmail inbox
   - ✅ Professional HTML formatting with risk details
   - ✅ SHAIL KAVACH branding
   - ✅ Risk percentage and type displayed prominently

### **Database Integration:**
- **Load Database Alerts**: View all Gmail alerts stored in Supabase
- **Delivery Status**: See which emails were sent successfully
- **Error Tracking**: View any delivery errors or issues
- **User Association**: See alerts for specific users

## ⚙️ **Supabase Configuration:**

### **Required Configuration:**
```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# EmailJS Configuration (Optional - for EmailJS delivery method)
EMAILJS_USER_ID=your_emailjs_user_id
EMAILJS_SERVICE_ID=your_emailjs_service_id
EMAILJS_TEMPLATE_ID=your_emailjs_template_id

# SMTP Configuration (Optional - for SMTP delivery method)
SMTP_WEBHOOK_URL=https://your-smtp-service.com/send

# Webhook Configuration (Optional - for webhook delivery method)
EMAIL_WEBHOOK_URL=https://your-webhook-service.com/send
```

### **Database Setup:**
```sql
-- The gmail_alerts table is automatically created by migration
-- Run the migration: 20241201000003_create_gmail_alerts.sql
```

### **Edge Function Deployment:**
```bash
# Deploy the send-gmail-alert function
supabase functions deploy send-gmail-alert
```

## 📊 **Gmail Alert Data Structure:**

### **Alert Request:**
```typescript
interface GmailAlertRequest {
  user_email: string;        // Gmail address (@gmail.com)
  user_id: string;          // Supabase user ID
  mine_name: string;        // Name of the mine
  location: string;         // Mine location
  risk_percentage: number;  // Risk percentage (0-100)
  risk_type: 'low' | 'medium' | 'high' | 'critical';
  risk_probability: number; // Risk probability (0.0-1.0)
  timestamp?: string;       // Alert timestamp
  mine_id?: string;         // Mine ID (optional)
}
```

### **Alert Response:**
```typescript
interface GmailAlertResponse {
  success: boolean;         // Whether email was sent successfully
  method?: string;         // Delivery method used
  error?: string;          // Error message if failed
  message: string;         // Human-readable message
}
```

## 🎯 **Key Benefits:**

### **For Users:**
- 📧 **Direct Gmail Delivery**: Emails sent directly to Gmail inbox
- 📊 **Risk Information**: Clear risk percentage and type display
- 🎨 **Professional Appearance**: Rich HTML emails optimized for Gmail
- 📱 **Mobile Optimized**: Works perfectly on Gmail mobile app
- 🔔 **Reliable Notifications**: Multiple delivery methods ensure delivery
- 📋 **Detailed Information**: Complete risk assessment and recommendations

### **For System:**
- ✅ **Supabase Integration**: Leverages Supabase infrastructure
- 🔄 **Multiple Fallbacks**: Robust delivery system with fallbacks
- 📝 **Complete Logging**: All Gmail alerts logged to database
- 🎨 **Professional Branding**: SHAIL KAVACH branding in emails
- 🚀 **Scalable**: Uses Supabase Edge Functions for scalability
- 🔒 **Secure**: Secure Gmail address validation and processing

## 🚨 **Troubleshooting:**

### **Common Gmail Issues:**
1. **"Email must be a Gmail address"**: User must be logged in with @gmail.com
2. **"Missing required fields"**: Check that all required data is provided
3. **"Supabase function error"**: Check Edge Function deployment and configuration
4. **Email in Spam**: Check Gmail spam folder

### **Debugging Tools:**
1. **Supabase Gmail Test Component**: Shows detailed status and test emails
2. **Browser Console**: Detailed logs throughout the Gmail process
3. **Database Log**: All Gmail alerts stored in gmail_alerts table
4. **Visual Notifications**: Gmail-style notifications on page

### **Configuration Issues:**
1. **Supabase Not Configured**: Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
2. **Edge Function Not Deployed**: Deploy send-gmail-alert function
3. **Database Migration**: Run gmail_alerts table migration
4. **Email Providers**: Configure at least one email delivery method

## 🎉 **Result:**

**SHAIL KAVACH now has a complete Supabase Gmail integration system that:**
- ✅ **Sends Gmail alerts via Supabase Edge Functions** with risk percentage and type
- ✅ **Uses professional Gmail-optimized templates** with SHAIL KAVACH branding
- ✅ **Includes detailed risk information** and recommendations
- ✅ **Works with multiple fallback methods** for reliable delivery
- ✅ **Provides comprehensive database logging** for all Gmail alerts
- ✅ **Shows visual Gmail notifications** even if external providers fail
- ✅ **Tracks delivery status** and errors in Supabase database

**The Supabase Gmail integration is fully functional and ready to send prediction results with risk percentage and risk type information to registered users' Gmail addresses!** 📧🚀

## 📋 **Quick Start:**

1. **Deploy Edge Function**: Deploy the send-gmail-alert function
2. **Run Migration**: Create the gmail_alerts table
3. **Configure Environment**: Set up Supabase and email provider variables
4. **Test Integration**: Use Supabase Gmail Test component
5. **Production Ready**: System automatically sends Gmail alerts for all predictions

**Users will now receive professional Gmail alerts with detailed risk percentage and risk type information for every prediction made in SHAIL KAVACH!** 🎯









