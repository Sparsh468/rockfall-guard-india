# 📧 SHAIL KAVACH Backend Email System

A production-ready Node.js + Express backend email system with Gmail SMTP integration for sending mining safety alerts.

## 🚀 Features

- **Gmail SMTP Integration**: Secure email delivery using Gmail App Passwords
- **Risk-Based Alerts**: Three alert types (Low, Medium, High) with customized content
- **Professional Email Templates**: Rich HTML emails with SHAIL KAVACH branding
- **Security**: Rate limiting, CORS, Helmet security headers
- **Validation**: Joi schema validation for request data
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Testing Suite**: Complete test suite for all endpoints and scenarios

## 📋 Requirements

- Node.js >= 16.0.0
- npm >= 8.0.0
- Gmail account with App Password enabled

## 🛠️ Installation

1. **Clone and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```

4. **Configure your `.env` file:**
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # Gmail SMTP Configuration (REQUIRED)
   EMAIL_USER=your-gmail-address@gmail.com
   EMAIL_PASS=your-gmail-app-password

   # Gmail SMTP Settings
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false

   # Security Configuration
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   ```

## 🔐 Gmail App Password Setup

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and your device
   - Copy the generated 16-character password
3. **Use the App Password** in your `.env` file (not your regular Gmail password)

## 🚀 Running the Server

### Development Mode:
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:3001` (or your configured PORT).

## 📡 API Endpoints

### 1. Health Check
```
GET /api/health
```
Returns server health status and SMTP connection status.

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

### 2. Send Alert
```
POST /api/send-alert
```
Sends a risk alert email to the authenticated user.

**Request Body:**
```json
{
  "riskLevel": "high", // "low", "medium", or "high"
  "mineName": "Jharia Coalfield", // optional, defaults to "Unknown Mine"
  "location": "Jharkhand, India", // optional, defaults to "Unknown Location"
  "additionalInfo": "Additional context" // optional
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

### 3. Test All Alerts
```
POST /api/test-all-alerts
```
Sends test emails for all risk levels (low, medium, high).

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
  ],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🧪 Testing

### Run the test suite:
```bash
npm test
```

The test suite will:
- ✅ Check server health
- ✅ Test all three risk levels (low, medium, high)
- ✅ Test the batch alert endpoint
- ✅ Test invalid requests and error handling
- ✅ Verify email delivery

### Manual Testing with curl:

**Test Low Risk Alert:**
```bash
curl -X POST http://localhost:3001/api/send-alert \
  -H "Content-Type: application/json" \
  -d '{"riskLevel": "low", "mineName": "Goa Iron Ore", "location": "Goa, India"}'
```

**Test Medium Risk Alert:**
```bash
curl -X POST http://localhost:3001/api/send-alert \
  -H "Content-Type: application/json" \
  -d '{"riskLevel": "medium", "mineName": "Bellary Iron Ore", "location": "Karnataka, India"}'
```

**Test High Risk Alert:**
```bash
curl -X POST http://localhost:3001/api/send-alert \
  -H "Content-Type: application/json" \
  -d '{"riskLevel": "high", "mineName": "Jharia Coalfield", "location": "Jharkhand, India"}'
```

## 📧 Email Templates

### High Risk Alert (Red)
- **Subject**: 🔴 Red Alert: High Risk Detected - SHAIL KAVACH
- **Actions**: Immediate evacuation, stop operations, alert authorities
- **Styling**: Red color scheme with urgent messaging

### Medium Risk Alert (Yellow)
- **Subject**: 🟡 Yellow Alert: Medium Risk Warning - SHAIL KAVACH
- **Actions**: Increase monitoring, implement safety measures, notify personnel
- **Styling**: Yellow/orange color scheme with caution messaging

### Low Risk Alert (Green)
- **Subject**: 🟢 Green Alert: Low Risk Notification - SHAIL KAVACH
- **Actions**: Continue with caution, maintain monitoring, follow protocols
- **Styling**: Green color scheme with informational messaging

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configurable origin restrictions
- **Helmet Security**: Security headers for XSS, CSRF protection
- **Input Validation**: Joi schema validation for all inputs
- **Error Handling**: Secure error messages (no sensitive data exposure)
- **Gmail App Passwords**: Secure authentication without storing raw credentials

## 📊 Monitoring & Logging

The server provides comprehensive logging:
- ✅ Request logging with timestamps and IP addresses
- ✅ Email delivery status and message IDs
- ✅ Error logging with stack traces
- ✅ SMTP connection status monitoring
- ✅ Rate limiting notifications

## 🚨 Error Handling

The system handles various error scenarios:
- **400 Bad Request**: Invalid input data or validation errors
- **401 Unauthorized**: Missing or invalid authentication
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: SMTP failures or server errors
- **503 Service Unavailable**: Email service not configured

## 🔧 Configuration Options

### Environment Variables:
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)
- `EMAIL_USER`: Gmail address for sending emails
- `EMAIL_PASS`: Gmail App Password
- `SMTP_HOST`: SMTP server host (default: smtp.gmail.com)
- `SMTP_PORT`: SMTP server port (default: 587)
- `SMTP_SECURE`: Use SSL/TLS (default: false)
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window (default: 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: 100)
- `CORS_ORIGIN`: Allowed CORS origin (default: http://localhost:3000)

## 🚀 Production Deployment

1. **Set NODE_ENV to production:**
   ```env
   NODE_ENV=production
   ```

2. **Use a process manager like PM2:**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "shailkavach-email"
   ```

3. **Set up reverse proxy (nginx):**
   ```nginx
   location /api/ {
       proxy_pass http://localhost:3001;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
   }
   ```

4. **Enable SSL/TLS** for secure connections

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the logs for detailed error messages
- Verify Gmail App Password configuration
- Test SMTP connection with health endpoint
- Review rate limiting settings

---

**SHAIL KAVACH Backend Email System** - Reliable mining safety alert delivery via Gmail SMTP integration.









