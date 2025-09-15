# 📧 Email Alert System Setup Guide

This guide will help you configure the email alert system for SHAIL KAVACH to send prediction results to logged-in users.

## 🚀 Quick Setup (Recommended)

### Option 1: EmailJS (Easiest Setup)

1. **Create EmailJS Account:**
   - Go to [https://www.emailjs.com/](https://www.emailjs.com/)
   - Sign up for a free account
   - Create a new service (Gmail, Outlook, etc.)

2. **Create Email Template:**
   - Go to Email Templates in your EmailJS dashboard
   - Create a new template with these variables:
     - `{{to_email}}` - Recipient email
     - `{{subject}}` - Email subject
     - `{{message}}` - Email content
     - `{{mine_name}}` - Mine name
     - `{{location}}` - Mine location
     - `{{risk_level}}` - Risk level
     - `{{risk_percentage}}` - Risk percentage

3. **Configure Environment Variables:**
   Create a `.env` file in your project root:
   ```env
   VITE_EMAILJS_USER_ID=your_user_id_here
   VITE_EMAILJS_SERVICE_ID=your_service_id_here
   VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
   ```

### Option 2: Webhook Service

1. **Set up a webhook endpoint** that accepts POST requests with:
   ```json
   {
     "to": "user@example.com",
     "subject": "Risk Alert",
     "html": "<html>...</html>",
     "text": "Plain text content",
     "priority": "high"
   }
   ```

2. **Configure Environment Variable:**
   ```env
   VITE_EMAIL_WEBHOOK_URL=https://your-webhook-service.com/send-email
   ```

### Option 3: HTTP Email Service

1. **Use services like:**
   - Formspree
   - Netlify Forms
   - Any email API service

2. **Configure Environment Variable:**
   ```env
   VITE_EMAIL_SERVICE_URL=https://your-email-service.com/api/send
   ```

## 🔧 How It Works

### Automatic Email Sending
- ✅ **Every Prediction**: Emails are sent automatically after every prediction
- ✅ **All Risk Levels**: Sends emails for Low, Medium, High, and Critical risks
- ✅ **User Email**: Uses the email address from the logged-in user
- ✅ **Rich Content**: HTML emails with risk details and recommendations
- ✅ **Fallback System**: Multiple email providers with automatic fallback

### Email Content Includes:
- 🏭 **Mine Information**: Name and location
- 📊 **Risk Assessment**: Level and percentage
- 🎯 **Recommendations**: Specific actions based on risk level
- ⏰ **Timestamp**: When the assessment was made
- 🏷️ **System Branding**: SHAIL KAVACH branding

### Fallback Mechanism:
1. **EmailJS** (if configured)
2. **Webhook Service** (if configured)
3. **HTTP Email Service** (if configured)
4. **Visual Notification** (always works)
5. **Console Logging** (always works)

## 🧪 Testing the Email System

### Using the Test Component:
1. Navigate to the Email Test component
2. Click "Send Test Email"
3. Check your email inbox
4. Verify the email was received

### Debugging:
- Check browser console for detailed logs
- Check the Email Log section in the test component
- Look for visual notifications on the page
- Verify environment variables are set correctly

## 📋 Environment Variables Reference

```env
# Required: Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# EmailJS (Recommended)
VITE_EMAILJS_USER_ID=your_emailjs_user_id
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id

# Webhook (Alternative)
VITE_EMAIL_WEBHOOK_URL=https://your-webhook.com/endpoint

# HTTP Service (Alternative)
VITE_EMAIL_SERVICE_URL=https://your-service.com/api/send

# Optional: Additional Providers
VITE_RESEND_API_KEY=your_resend_key
VITE_SENDGRID_API_KEY=your_sendgrid_key
```

## 🚨 Troubleshooting

### Email Not Being Sent:
1. **Check User Authentication**: Ensure user is logged in with valid email
2. **Verify Environment Variables**: Make sure at least one email provider is configured
3. **Check Console Logs**: Look for error messages in browser console
4. **Test Email Component**: Use the test component to verify setup

### Common Issues:
- **"No email address"**: User not logged in or email not in profile
- **"EmailJS not configured"**: Environment variables missing
- **"Webhook error"**: Webhook URL not responding
- **"HTTP service error"**: Service endpoint not working

### Visual Notifications:
Even if email providers fail, you'll see:
- ✅ Visual notifications on the page
- 📝 Console logs with email details
- 📊 Email log in the test component

## 🎯 Production Setup

### For Production Deployment:
1. **Set up a reliable email provider** (EmailJS, SendGrid, etc.)
2. **Configure environment variables** in your deployment platform
3. **Test thoroughly** with the test component
4. **Monitor email delivery** and check logs

### Security Considerations:
- Never expose API keys in client-side code
- Use environment variables for all sensitive data
- Consider rate limiting for email sending
- Monitor for spam/abuse

## 📞 Support

If you need help setting up the email system:
1. Check the browser console for detailed error messages
2. Use the Email Test component to diagnose issues
3. Verify your email provider configuration
4. Check that all environment variables are set correctly

The system is designed to work even without external email providers by showing visual notifications and logging email details.









