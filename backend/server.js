const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Gmail SMTP Transporter Configuration
let transporter = null;

const initializeTransporter = () => {
  try {
    // Validate required environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('EMAIL_USER and EMAIL_PASS environment variables are required');
    }

    // Validate Gmail format
    if (!process.env.EMAIL_USER.includes('@gmail.com')) {
      throw new Error('EMAIL_USER must be a Gmail address');
    }

    transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('✅ Gmail SMTP Transporter initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Gmail SMTP Transporter:', error.message);
    return false;
  }
};

// Initialize transporter on startup
const isTransporterReady = initializeTransporter();

// Authentication middleware (mock implementation)
const authenticateUser = (req, res, next) => {
  // In a real application, this would validate JWT tokens or session data
  // For this demo, we'll mock the user data
  req.user = {
    id: 'mock-user-id',
    email: 'testuser@gmail.com', // This would come from your auth system
    name: 'Test User'
  };
  
  console.log('🔐 Mock authentication - User:', req.user.email);
  next();
};

// Validation schemas
const alertSchema = Joi.object({
  riskLevel: Joi.string().valid('high', 'medium', 'low').required(),
  mineName: Joi.string().optional().default('Unknown Mine'),
  location: Joi.string().optional().default('Unknown Location'),
  additionalInfo: Joi.string().optional().default('')
});

// Email templates
const getEmailTemplate = (riskLevel, userEmail, mineName, location, additionalInfo) => {
  const timestamp = new Date().toLocaleString();
  
  const templates = {
    high: {
      subject: '🔴 Red Alert: High Risk Detected - SHAIL KAVACH',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>High Risk Alert - SHAIL KAVACH</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
            .header p { margin: 10px 0 0 0; opacity: 0.9; }
            .content { padding: 30px; }
            .alert-badge { background-color: #dc2626; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; text-transform: uppercase; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .info-item { background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626; }
            .info-label { font-weight: bold; color: #991b1b; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
            .info-value { font-size: 16px; color: #1f2937; }
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
              <div class="alert-icon">🚨</div>
              <h1>SHAIL KAVACH</h1>
              <p>High Risk Alert - Immediate Action Required</p>
            </div>
            
            <div class="content">
              <div style="text-align: center; margin-bottom: 30px;">
                <span class="alert-badge">HIGH RISK</span>
                <h2 style="margin: 15px 0; color: #dc2626;">IMMEDIATE ACTION REQUIRED!</h2>
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
                  <div class="info-value" style="color: #dc2626;">HIGH</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Alert Time</div>
                  <div class="info-value">${timestamp}</div>
                </div>
              </div>

              <div class="recommendations">
                <h3>IMMEDIATE ACTIONS REQUIRED:</h3>
                <ul>
                  <li><strong>EVACUATE</strong> all personnel from high-risk areas immediately</li>
                  <li>Stop all mining operations in the affected zone</li>
                  <li>Alert emergency response teams and local authorities</li>
                  <li>Implement maximum safety protocols</li>
                  <li>Continuous monitoring of ground movement</li>
                  <li>Prepare for potential emergency response</li>
                </ul>
              </div>

              ${additionalInfo ? `
                <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="margin: 0 0 10px 0; color: #1e40af;">Additional Information</h3>
                  <p style="margin: 0; color: #1e40af;">${additionalInfo}</p>
                </div>
              ` : ''}

              <div style="background: #fef2f2; border: 1px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #991b1b;">System Information</h3>
                <p style="margin: 0; color: #991b1b; font-size: 14px;">
                  This high-risk alert was automatically generated by SHAIL KAVACH mining safety system at ${timestamp}.
                  <strong>IMMEDIATE ACTION IS REQUIRED</strong> based on the risk assessment.
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p>SHAIL KAVACH - Advanced Mining Safety System</p>
              <p>This is an automated high-risk alert. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
🚨 SHAIL KAVACH - HIGH RISK ALERT 🚨

IMMEDIATE ACTION REQUIRED!

MINE INFORMATION:
- Mine: ${mineName}
- Location: ${location}
- Risk Level: HIGH
- Alert Time: ${timestamp}

IMMEDIATE ACTIONS REQUIRED:
• EVACUATE all personnel from high-risk areas immediately
• Stop all mining operations in the affected zone
• Alert emergency response teams and local authorities
• Implement maximum safety protocols
• Continuous monitoring of ground movement
• Prepare for potential emergency response

${additionalInfo ? `ADDITIONAL INFORMATION:\n${additionalInfo}\n` : ''}

SYSTEM INFORMATION:
This high-risk alert was automatically generated by SHAIL KAVACH mining safety system at ${timestamp}.
IMMEDIATE ACTION IS REQUIRED based on the risk assessment.

---
SHAIL KAVACH - Advanced Mining Safety System
This is an automated high-risk alert. Please do not reply to this email.
      `.trim()
    },
    
    medium: {
      subject: '🟡 Yellow Alert: Medium Risk Warning - SHAIL KAVACH',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Medium Risk Alert - SHAIL KAVACH</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #d97706, #f59e0b); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
            .header p { margin: 10px 0 0 0; opacity: 0.9; }
            .content { padding: 30px; }
            .alert-badge { background-color: #d97706; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; text-transform: uppercase; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .info-item { background: #fffbeb; padding: 15px; border-radius: 8px; border-left: 4px solid #d97706; }
            .info-label { font-weight: bold; color: #92400e; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
            .info-value { font-size: 16px; color: #1f2937; }
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
              <div class="alert-icon">⚠️</div>
              <h1>SHAIL KAVACH</h1>
              <p>Medium Risk Warning - Caution Advised</p>
            </div>
            
            <div class="content">
              <div style="text-align: center; margin-bottom: 30px;">
                <span class="alert-badge">MEDIUM RISK</span>
                <h2 style="margin: 15px 0; color: #d97706;">CAUTION ADVISED</h2>
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
                  <div class="info-value" style="color: #d97706;">MEDIUM</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Alert Time</div>
                  <div class="info-value">${timestamp}</div>
                </div>
              </div>

              <div class="recommendations">
                <h3>Recommended Actions:</h3>
                <ul>
                  <li>Increase monitoring of ground conditions</li>
                  <li>Implement additional safety measures</li>
                  <li>Notify relevant personnel</li>
                  <li>Review and update safety protocols</li>
                  <li>Consider reducing mining intensity</li>
                  <li>Prepare contingency plans</li>
                </ul>
              </div>

              ${additionalInfo ? `
                <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="margin: 0 0 10px 0; color: #1e40af;">Additional Information</h3>
                  <p style="margin: 0; color: #1e40af;">${additionalInfo}</p>
                </div>
              ` : ''}

              <div style="background: #fffbeb; border: 1px solid #d97706; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #92400e;">System Information</h3>
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  This medium-risk alert was automatically generated by SHAIL KAVACH mining safety system at ${timestamp}.
                  Please take appropriate action based on the risk assessment.
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p>SHAIL KAVACH - Advanced Mining Safety System</p>
              <p>This is an automated medium-risk alert. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
⚠️ SHAIL KAVACH - MEDIUM RISK WARNING ⚠️

CAUTION ADVISED

MINE INFORMATION:
- Mine: ${mineName}
- Location: ${location}
- Risk Level: MEDIUM
- Alert Time: ${timestamp}

RECOMMENDED ACTIONS:
• Increase monitoring of ground conditions
• Implement additional safety measures
• Notify relevant personnel
• Review and update safety protocols
• Consider reducing mining intensity
• Prepare contingency plans

${additionalInfo ? `ADDITIONAL INFORMATION:\n${additionalInfo}\n` : ''}

SYSTEM INFORMATION:
This medium-risk alert was automatically generated by SHAIL KAVACH mining safety system at ${timestamp}.
Please take appropriate action based on the risk assessment.

---
SHAIL KAVACH - Advanced Mining Safety System
This is an automated medium-risk alert. Please do not reply to this email.
      `.trim()
    },
    
    low: {
      subject: '🟢 Green Alert: Low Risk Notification - SHAIL KAVACH',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Low Risk Alert - SHAIL KAVACH</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #16a34a, #22c55e); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
            .header p { margin: 10px 0 0 0; opacity: 0.9; }
            .content { padding: 30px; }
            .alert-badge { background-color: #16a34a; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; text-transform: uppercase; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .info-item { background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #16a34a; }
            .info-label { font-weight: bold; color: #166534; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
            .info-value { font-size: 16px; color: #1f2937; }
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
              <div class="alert-icon">ℹ️</div>
              <h1>SHAIL KAVACH</h1>
              <p>Low Risk Notification - All Clear</p>
            </div>
            
            <div class="content">
              <div style="text-align: center; margin-bottom: 30px;">
                <span class="alert-badge">LOW RISK</span>
                <h2 style="margin: 15px 0; color: #16a34a;">NO IMMEDIATE THREAT</h2>
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
                  <div class="info-value" style="color: #16a34a;">LOW</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Alert Time</div>
                  <div class="info-value">${timestamp}</div>
                </div>
              </div>

              <div class="recommendations">
                <h3>Standard Procedures:</h3>
                <ul>
                  <li>Continue normal operations with caution</li>
                  <li>Maintain regular monitoring</li>
                  <li>Stay alert for any changes</li>
                  <li>Follow standard safety protocols</li>
                  <li>Document observations</li>
                  <li>Regular safety inspections</li>
                </ul>
              </div>

              ${additionalInfo ? `
                <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="margin: 0 0 10px 0; color: #1e40af;">Additional Information</h3>
                  <p style="margin: 0; color: #1e40af;">${additionalInfo}</p>
                </div>
              ` : ''}

              <div style="background: #f0fdf4; border: 1px solid #16a34a; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #166534;">System Information</h3>
                <p style="margin: 0; color: #166534; font-size: 14px;">
                  This low-risk notification was automatically generated by SHAIL KAVACH mining safety system at ${timestamp}.
                  Continue with standard operations and monitoring.
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p>SHAIL KAVACH - Advanced Mining Safety System</p>
              <p>This is an automated low-risk notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
ℹ️ SHAIL KAVACH - LOW RISK NOTIFICATION ℹ️

NO IMMEDIATE THREAT

MINE INFORMATION:
- Mine: ${mineName}
- Location: ${location}
- Risk Level: LOW
- Alert Time: ${timestamp}

STANDARD PROCEDURES:
• Continue normal operations with caution
• Maintain regular monitoring
• Stay alert for any changes
• Follow standard safety protocols
• Document observations
• Regular safety inspections

${additionalInfo ? `ADDITIONAL INFORMATION:\n${additionalInfo}\n` : ''}

SYSTEM INFORMATION:
This low-risk notification was automatically generated by SHAIL KAVACH mining safety system at ${timestamp}.
Continue with standard operations and monitoring.

---
SHAIL KAVACH - Advanced Mining Safety System
This is an automated low-risk notification. Please do not reply to this email.
      `.trim()
    }
  };

  return templates[riskLevel] || templates.low;
};

// Email sending helper function
const sendAlertEmail = async (userEmail, riskLevel, mineName, location, additionalInfo) => {
  try {
    // Validate transporter
    if (!transporter) {
      throw new Error('Email transporter not initialized');
    }

    // Get email template based on risk level
    const template = getEmailTemplate(riskLevel, userEmail, mineName, location, additionalInfo);

    // Email options
    const mailOptions = {
      from: {
        name: 'SHAIL KAVACH Mining Safety',
        address: process.env.EMAIL_USER
      },
      to: userEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
      // Add headers for better deliverability
      headers: {
        'X-Mailer': 'SHAIL KAVACH Email System',
        'X-Priority': riskLevel === 'high' ? '1' : riskLevel === 'medium' ? '2' : '3'
      }
    };

    console.log(`📧 Sending ${riskLevel} risk alert to: ${userEmail}`);

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      riskLevel,
      userEmail
    };

  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    throw error;
  }
};

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SHAIL KAVACH Email Backend',
    version: '1.0.0',
    smtpStatus: isTransporterReady ? 'connected' : 'disconnected'
  });
});

// Send alert endpoint
app.post('/api/send-alert', authenticateUser, async (req, res) => {
  try {
    // Validate request body
    const { error, value } = alertSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    const { riskLevel, mineName, location, additionalInfo } = value;
    const userEmail = req.user.email;

    // Validate user email
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: 'User email not found in session'
      });
    }

    // Check if transporter is ready
    if (!isTransporterReady) {
      return res.status(503).json({
        success: false,
        error: 'Email service unavailable',
        message: 'Gmail SMTP transporter not initialized'
      });
    }

    // Send email
    const result = await sendAlertEmail(userEmail, riskLevel, mineName, location, additionalInfo);

    // Log successful email
    console.log(`✅ Alert email sent successfully to ${userEmail} for ${riskLevel} risk`);

    res.json({
      success: true,
      message: `${riskLevel} risk alert sent successfully`,
      data: {
        userEmail,
        riskLevel,
        mineName,
        location,
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error sending alert email:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to send alert email',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint for sending all alert types
app.post('/api/test-all-alerts', authenticateUser, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const testResults = [];

    // Test all risk levels
    const riskLevels = ['low', 'medium', 'high'];
    
    for (const riskLevel of riskLevels) {
      try {
        const result = await sendAlertEmail(
          userEmail, 
          riskLevel, 
          'Test Mine', 
          'Test Location', 
          `This is a test ${riskLevel} risk alert from SHAIL KAVACH backend system.`
        );
        
        testResults.push({
          riskLevel,
          success: true,
          messageId: result.messageId
        });
        
        // Add delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        testResults.push({
          riskLevel,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Test alerts completed',
      userEmail,
      results: testResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in test endpoint:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to send test alerts',
      message: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 SHAIL KAVACH Email Backend Server Started');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📧 SMTP Status: ${isTransporterReady ? '✅ Ready' : '❌ Not Ready'}`);
  console.log(`📧 Gmail User: ${process.env.EMAIL_USER || 'Not configured'}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📤 Send Alert: POST http://localhost:${PORT}/api/send-alert`);
  console.log(`🧪 Test All Alerts: POST http://localhost:${PORT}/api/test-all-alerts`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;









