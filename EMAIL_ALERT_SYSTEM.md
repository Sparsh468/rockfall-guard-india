# 📧 Email Alert System - SHAIL KAVACH

## Overview

The SHAIL KAVACH email alert system automatically sends email notifications to users when mining risk predictions exceed configured thresholds. The system is designed to provide timely, actionable alerts with detailed risk information and recommended actions.

## 🚀 Features

### ✅ Core Functionality
- **Automatic Email Alerts**: Sends emails for ALL risk predictions (Low, Medium, High, Critical)
- **Multi-Provider Support**: Resend, SendGrid, and SMTP fallback system
- **User Authentication**: Uses logged-in user's email address
- **Risk-Based Thresholds**: Configurable alert levels (Critical, High, Medium, Low)
- **Professional Email Templates**: HTML and text versions with branding
- **Database Logging**: All alerts are logged for audit trails

### ✅ Advanced Features
- **Fallback System**: Multiple email providers for reliability
- **Rich HTML Emails**: Professional design with SHAIL KAVACH branding
- **Actionable Content**: Specific recommendations based on risk level
- **User Preferences**: Configurable alert settings and thresholds
- **Test Email Function**: Send test emails to verify configuration

## 🏗️ Architecture

### Components

#### 1. **Email Service** (`src/services/emailService.ts`)
- Singleton service for email operations
- Handles email template generation
- Manages HTML and text content creation
- Provides priority-based email formatting

#### 2. **Alert Service** (`src/services/alertService.ts`)
- Main alert management service
- Handles prediction and sensor alerts
- Manages user preferences and thresholds
- Integrates with email service

#### 3. **Supabase Edge Functions**
- **`send-email-alert`**: Primary email sending function
- **`send-alert`**: Enhanced alert function with email integration

#### 4. **Email Settings Component** (`src/components/EmailAlertSettings.tsx`)
- User interface for configuring alert preferences
- Test email functionality
- Threshold configuration
- Real-time settings management

### Email Providers

#### Primary: Resend
- Modern email API with excellent deliverability
- Professional email templates
- Real-time analytics
- Easy integration

#### Fallback: SendGrid
- Enterprise-grade email service
- Advanced features and analytics
- High reliability and scalability

#### Final Fallback: SMTP
- Traditional SMTP server integration
- Maximum compatibility
- Custom server configuration

## 📧 Email Templates

### HTML Email Features
- **Responsive Design**: Works on all devices
- **SHAIL KAVACH Branding**: Professional logo and colors
- **Risk Level Indicators**: Color-coded alert levels
- **Detailed Information**: Mine name, location, risk percentage
- **Actionable Recommendations**: Specific steps based on risk level
- **Dashboard Links**: Direct access to SHAIL KAVACH dashboard

### Email Content Structure
```
Header: SHAIL KAVACH branding and alert level
Content: 
  - Alert details (mine, location, risk level, timestamp)
  - Risk percentage display
  - Recommended actions based on risk level
  - Dashboard access link
Footer: Contact information and unsubscribe options
```

## ⚙️ Configuration

### Alert Thresholds
- **Critical**: ≥ 80% risk probability
- **High**: ≥ 60% risk probability  
- **Medium**: ≥ 40% risk probability
- **Low**: ≥ 20% risk probability

### User Preferences
- **Email Alerts**: Enable/disable email notifications
- **SMS Alerts**: Enable/disable SMS (coming soon)
- **Push Notifications**: Enable/disable browser push (coming soon)
- **Email Frequency**: Immediate, hourly, or daily digest
- **Custom Thresholds**: User-configurable risk levels

## 🔧 Setup Instructions

### 1. Environment Variables
Add the following to your Supabase environment:

```bash
# Resend (Primary)
RESEND_API_KEY=your_resend_api_key

# SendGrid (Fallback)
SENDGRID_API_KEY=your_sendgrid_api_key

# SMTP (Final Fallback)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

### 2. Deploy Supabase Functions
```bash
# Deploy the email alert function
supabase functions deploy send-email-alert

# Deploy the enhanced send-alert function
supabase functions deploy send-alert
```

### 3. Database Setup
The system automatically uses existing tables:
- `mines`: For mine information
- `alerts`: For logging alert history
- `auth.users`: For user email addresses

## 📱 Usage

### Automatic Alerts
Email alerts are automatically triggered for:
1. **ALL predictions** - regardless of risk level (Low, Medium, High, Critical)
2. **ALL sensor data** - for any risk assessment
3. **Complete coverage** - every prediction generates an email alert with risk percentage and type

### Manual Configuration
Users can configure alerts through:
1. **Email Settings Component**: Access via user profile or settings
2. **Test Email**: Send test emails to verify configuration
3. **Threshold Adjustment**: Customize risk level thresholds

### Integration Points
The email system integrates with:
- **Prediction System**: Automatic alerts after predictions
- **Sensor Monitoring**: Real-time anomaly detection
- **User Authentication**: Uses logged-in user's email
- **Dashboard**: Links back to detailed information

## 🎯 Alert Levels & Actions

### Critical (≥80% Risk)
**Actions:**
- Immediately evacuate all personnel
- Activate emergency response protocols
- Contact emergency services
- Implement stabilization measures
- Continuous monitoring

### High (≥60% Risk)
**Actions:**
- Evacuate high-risk areas
- Implement emergency protocols
- Increase monitoring frequency
- Prepare evacuation plans
- Contact safety supervisors

### Medium (≥40% Risk)
**Actions:**
- Increase monitoring frequency
- Implement additional safety measures
- Review safety protocols
- Notify all personnel
- Prepare for potential evacuation

### Low (≥20% Risk)
**Actions:**
- Continue regular monitoring
- Review safety procedures
- Maintain awareness
- Report unusual conditions

## 🔒 Security & Privacy

### Data Protection
- **User Emails**: Only used for legitimate alerts
- **Mine Data**: Anonymized in email templates
- **Alert History**: Logged securely in database
- **Access Control**: Only authenticated users receive alerts

### Compliance
- **GDPR Ready**: Unsubscribe mechanisms included
- **Data Minimization**: Only necessary data in emails
- **Audit Trail**: Complete logging of all alerts
- **User Control**: Full preference management

## 🚀 Future Enhancements

### Planned Features
- **SMS Integration**: Text message alerts for critical situations
- **Push Notifications**: Browser-based real-time alerts
- **Digest Emails**: Hourly/daily summary reports
- **Multi-language Support**: Localized email templates
- **Advanced Analytics**: Email delivery and engagement tracking

### Integration Opportunities
- **Slack/Teams**: Corporate communication platforms
- **WhatsApp Business**: International messaging
- **Voice Calls**: Emergency phone alerts
- **IoT Devices**: Smart alert systems

## 📊 Monitoring & Analytics

### Email Delivery Tracking
- **Delivery Status**: Real-time delivery confirmation
- **Open Rates**: User engagement metrics
- **Click Tracking**: Dashboard access analytics
- **Bounce Handling**: Automatic retry mechanisms

### Alert Analytics
- **Alert Frequency**: How often alerts are triggered
- **Risk Distribution**: Alert level breakdown
- **Response Times**: User action tracking
- **System Performance**: Email delivery metrics

## 🛠️ Troubleshooting

### Common Issues

#### Emails Not Sending
1. Check environment variables are set
2. Verify email provider API keys
3. Check Supabase function logs
4. Test with test email function

#### Poor Email Deliverability
1. Configure SPF/DKIM records
2. Use professional sender domain
3. Monitor bounce rates
4. Implement proper unsubscribe handling

#### User Not Receiving Emails
1. Check spam/junk folders
2. Verify email address in user profile
3. Check alert threshold configuration
4. Test with manual test email

### Support
For technical support:
- Check Supabase function logs
- Review browser console errors
- Test email functionality
- Verify user authentication

## 📝 API Reference

### Alert Service Methods
```typescript
// Send prediction alert
alertService.sendPredictionAlert({
  mineId: string,
  mineName: string,
  location: string,
  riskProbability: number,
  userEmail: string,
  userId?: string
});

// Send sensor alert
alertService.sendSensorAlert({
  mineId: string,
  mineName: string,
  location: string,
  sensorType: string,
  currentValue: number,
  threshold: number,
  userEmail: string,
  userId?: string
});

// Update configuration
alertService.updateAlertConfig({
  enableEmailAlerts: boolean,
  alertThresholds: AlertThresholds,
  emailFrequency: string
});
```

### Email Service Methods
```typescript
// Send email alert
emailService.sendAlert({
  mineName: string,
  location: string,
  riskLevel: string,
  riskProbability: number,
  alertLevel: string,
  timestamp: string,
  userEmail: string,
  userName?: string
});
```

---

## 🎉 Conclusion

The SHAIL KAVACH email alert system provides a robust, scalable solution for mining risk notifications. With professional email templates, multi-provider reliability, and comprehensive user controls, it ensures that critical safety information reaches users promptly and effectively.

The system is designed to grow with your needs, supporting additional communication channels and advanced features as they become available.
