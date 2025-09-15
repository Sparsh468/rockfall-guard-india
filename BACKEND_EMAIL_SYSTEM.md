# 📧 SHAIL KAVACH Backend Email System

## ✅ **Complete Node.js + Express Email Backend**

A production-ready backend email system with Gmail SMTP integration for sending mining safety alerts to registered users.

## 🚀 **System Overview**

### **Core Features:**
- **Gmail SMTP Integration**: Secure email delivery using Gmail App Passwords
- **Risk-Based Alerts**: Three alert types (Low, Medium, High) with customized content
- **Professional Email Templates**: Rich HTML emails with SHAIL KAVACH branding
- **Security**: Rate limiting, CORS, Helmet security headers, input validation
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Testing Suite**: Complete test suite for all endpoints and scenarios

### **Architecture:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│   Backend API   │───▶│   Gmail SMTP    │
│   Application   │    │   (Express)     │    │   (Nodemailer)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   User Email    │
                       │   Inbox         │
                       └─────────────────┘
```

## 📋 **Requirements Met**

### ✅ **1. Authentication:**
- **Mock Authentication**: `req.user.email` for demo purposes
- **Session-Based**: Ready for JWT or session-based authentication
- **Dynamic User Email**: Fetches logged-in user's email from session

### ✅ **2. Email Sending:**
- **Nodemailer Integration**: Professional Gmail SMTP configuration
- **Environment Variables**: Secure credential management via `.env`
- **POST Route**: `/api/send-alert` with `riskLevel` parameter
- **Risk Classification**: Three alert types with specific content

### ✅ **3. Code Organization:**
- **Express Server**: Clean `server.js` structure
- **dotenv Integration**: Environment variable management
- **Helper Function**: `sendAlertEmail()` for email formatting and sending
- **Error Handling**: Try/catch with proper JSON responses

### ✅ **4. Security:**
- **No Hardcoded Credentials**: All sensitive data in environment variables
- **Gmail App Password**: Secure authentication method
- **Rate Limiting**: 100 requests per 15 minutes
- **Input Validation**: Joi schema validation
- **Security Headers**: Helmet middleware

### ✅ **5. Testing:**
- **Mock User**: `req.user = { email: "testuser@example.com" }`
- **Three Alert Types**: Low, Medium, High risk demonstrations
- **Comprehensive Test Suite**: All endpoints and error scenarios

## 🛠️ **Installation & Setup**

### **1. Install Dependencies:**
```bash
cd backend
npm install
```

### **2. Configure Environment:**
```bash
npm run setup  # Creates .env file from template
```

### **3. Edit `.env` File:**
```env
# Gmail SMTP Configuration
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-gmail-app-password

# Server Configuration
PORT=3001
NODE_ENV=development
```

### **4. Gmail App Password Setup:**
1. Enable 2-Factor Authentication on Gmail
2. Go to Google Account → Security → 2-Step Verification
3. Click "App passwords" → Select "Mail"
4. Copy the 16-character password to `.env`

### **5. Start Server:**
```bash
npm start        # Production mode
npm run dev      # Development mode with nodemon
```

## 📡 **API Endpoints**

### **1. Health Check**
```http
GET /api/health
```
**Purpose**: Verify server and email service status

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "SHAIL KAVACH Email Backend",
  "version": "1.0.0",
  "smtpStatus": "connected"
}
```

### **2. Send Alert**
```http
POST /api/send-alert
```
**Purpose**: Send risk alert email to authenticated user

**Request Body:**
```json
{
  "riskLevel": "high",           // "low", "medium", or "high"
  "mineName": "Jharia Coalfield", // optional
  "location": "Jharkhand, India", // optional
  "additionalInfo": "..."        // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "high risk alert sent successfully",
  "data": {
    "userEmail": "testuser@gmail.com",
    "riskLevel": "high",
    "mineName": "Jharia Coalfield",
    "location": "Jharkhand, India",
    "messageId": "<message-id>",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### **3. Test All Alerts**
```http
POST /api/test-all-alerts
```
**Purpose**: Send test emails for all risk levels

**Response:**
```json
{
  "success": true,
  "message": "Test alerts completed",
  "userEmail": "testuser@gmail.com",
  "results": [
    {
      "riskLevel": "low",
      "success": true,
      "messageId": "<message-id>"
    },
    {
      "riskLevel": "medium", 
      "success": true,
      "messageId": "<message-id>"
    },
    {
      "riskLevel": "high",
      "success": true,
      "messageId": "<message-id>"
    }
  ]
}
```

## 📧 **Email Templates**

### **High Risk Alert (Red)**
- **Subject**: 🔴 Red Alert: High Risk Detected - SHAIL KAVACH
- **Color Scheme**: Red gradient header, red styling
- **Actions**: Immediate evacuation, stop operations, alert authorities
- **Priority**: X-Priority: 1 (High)

### **Medium Risk Alert (Yellow)**
- **Subject**: 🟡 Yellow Alert: Medium Risk Warning - SHAIL KAVACH
- **Color Scheme**: Orange gradient header, yellow styling
- **Actions**: Increase monitoring, implement safety measures
- **Priority**: X-Priority: 2 (Normal)

### **Low Risk Alert (Green)**
- **Subject**: 🟢 Green Alert: Low Risk Notification - SHAIL KAVACH
- **Color Scheme**: Green gradient header, green styling
- **Actions**: Continue with caution, maintain monitoring
- **Priority**: X-Priority: 3 (Low)

## 🧪 **Testing**

### **Run Test Suite:**
```bash
npm test
```

### **Run Demo:**
```bash
npm run demo
```

### **Manual Testing with curl:**

**Health Check:**
```bash
curl http://localhost:3001/api/health
```

**Low Risk Alert:**
```bash
curl -X POST http://localhost:3001/api/send-alert \
  -H "Content-Type: application/json" \
  -d '{"riskLevel": "low", "mineName": "Goa Iron Ore", "location": "Goa, India"}'
```

**Medium Risk Alert:**
```bash
curl -X POST http://localhost:3001/api/send-alert \
  -H "Content-Type: application/json" \
  -d '{"riskLevel": "medium", "mineName": "Bellary Iron Ore", "location": "Karnataka, India"}'
```

**High Risk Alert:**
```bash
curl -X POST http://localhost:3001/api/send-alert \
  -H "Content-Type: application/json" \
  -d '{"riskLevel": "high", "mineName": "Jharia Coalfield", "location": "Jharkhand, India"}'
```

**Test All Alerts:**
```bash
curl -X POST http://localhost:3001/api/test-all-alerts
```

## 🔒 **Security Features**

### **Rate Limiting:**
- **Window**: 15 minutes (configurable)
- **Limit**: 100 requests per IP (configurable)
- **Headers**: Standard rate limit headers

### **CORS Protection:**
- **Origin**: Configurable allowed origins
- **Credentials**: Support for authenticated requests

### **Input Validation:**
- **Joi Schemas**: Comprehensive request validation
- **Risk Level**: Must be "low", "medium", or "high"
- **Optional Fields**: Mine name, location, additional info

### **Security Headers (Helmet):**
- **XSS Protection**: Cross-site scripting prevention
- **CSRF Protection**: Cross-site request forgery prevention
- **Content Security Policy**: Content security headers

### **Error Handling:**
- **Secure Messages**: No sensitive data in error responses
- **HTTP Status Codes**: Proper status codes for different scenarios
- **Logging**: Comprehensive error logging without exposure

## 📊 **Monitoring & Logging**

### **Request Logging:**
```
2024-01-01T12:00:00.000Z - POST /api/send-alert - IP: ::1
```

### **Email Logging:**
```
📧 Sending high risk alert to: testuser@gmail.com
✅ Email sent successfully: <message-id>
```

### **Error Logging:**
```
❌ Failed to send email: Invalid credentials
❌ Validation error: riskLevel must be one of [low, medium, high]
```

### **SMTP Status Monitoring:**
- **Connection Status**: Real-time SMTP connection monitoring
- **Health Endpoint**: Server and email service status
- **Graceful Degradation**: Proper error handling for SMTP failures

## 🚀 **Production Deployment**

### **Environment Configuration:**
```env
NODE_ENV=production
PORT=3001
EMAIL_USER=production-gmail@gmail.com
EMAIL_PASS=production-app-password
```

### **Process Management (PM2):**
```bash
npm install -g pm2
pm2 start server.js --name "shailkavach-email"
pm2 startup
pm2 save
```

### **Reverse Proxy (nginx):**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **SSL/TLS Configuration:**
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location /api/ {
        proxy_pass http://localhost:3001;
        # ... proxy headers
    }
}
```

## 🔧 **Configuration Options**

### **Environment Variables:**
```env
# Server
PORT=3001
NODE_ENV=development

# Gmail SMTP
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

## 🚨 **Error Handling**

### **HTTP Status Codes:**
- **200 OK**: Successful email delivery
- **400 Bad Request**: Invalid input or validation errors
- **401 Unauthorized**: Missing or invalid authentication
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: SMTP failures or server errors
- **503 Service Unavailable**: Email service not configured

### **Error Response Format:**
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 📈 **Performance & Scalability**

### **Rate Limiting:**
- **Per-IP Limits**: Prevents abuse and spam
- **Configurable**: Adjustable limits for different environments
- **Graceful**: Returns proper error messages

### **Email Delivery:**
- **Gmail SMTP**: Reliable delivery through Gmail infrastructure
- **Connection Pooling**: Efficient SMTP connection management
- **Error Recovery**: Automatic retry and fallback mechanisms

### **Monitoring:**
- **Health Checks**: Real-time service status monitoring
- **Metrics**: Request counts, response times, error rates
- **Logging**: Comprehensive logging for debugging and monitoring

## 🎯 **Integration Examples**

### **Frontend Integration (JavaScript):**
```javascript
// Send high risk alert
const response = await fetch('http://localhost:3001/api/send-alert', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token' // When implementing real auth
  },
  body: JSON.stringify({
    riskLevel: 'high',
    mineName: 'Jharia Coalfield',
    location: 'Jharkhand, India',
    additionalInfo: 'Immediate evacuation required'
  })
});

const result = await response.json();
console.log('Alert sent:', result);
```

### **Frontend Integration (React):**
```jsx
const sendAlert = async (riskLevel, mineData) => {
  try {
    const response = await axios.post('/api/send-alert', {
      riskLevel,
      mineName: mineData.name,
      location: mineData.location,
      additionalInfo: mineData.notes
    });
    
    if (response.data.success) {
      toast.success(`${riskLevel} risk alert sent successfully!`);
    }
  } catch (error) {
    toast.error(`Failed to send alert: ${error.response.data.error}`);
  }
};
```

## 🎉 **Result**

**SHAIL KAVACH now has a complete, production-ready backend email system that:**

- ✅ **Sends Gmail alerts** with risk percentage and risk type information
- ✅ **Uses professional email templates** with SHAIL KAVACH branding
- ✅ **Implements comprehensive security** with rate limiting and validation
- ✅ **Provides robust error handling** with proper HTTP status codes
- ✅ **Includes complete testing suite** for all endpoints and scenarios
- ✅ **Follows best practices** for production deployment and monitoring
- ✅ **Supports all risk levels** (Low, Medium, High) with appropriate styling
- ✅ **Handles authentication** with mock implementation ready for real auth

**The backend email system is fully functional and ready for integration with the frontend application!** 📧🚀

## 📋 **Quick Start Commands**

```bash
# Setup
cd backend
npm install
npm run setup

# Configure
# Edit .env file with your Gmail credentials

# Start
npm start

# Test
npm test

# Demo
npm run demo
```

**The system is now ready to send professional Gmail alerts to registered users with detailed risk information!** 🎯









