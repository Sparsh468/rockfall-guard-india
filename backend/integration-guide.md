# 🔗 Frontend Integration Guide

## **Connecting SHAIL KAVACH Frontend to Backend Email System**

This guide shows how to integrate the Node.js backend email system with your React frontend application.

## 🚀 **Quick Integration**

### **1. Update Frontend Alert Service**

Replace your existing email service calls with backend API calls:

```typescript
// src/services/backendEmailService.ts
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3001/api';

export const sendBackendAlert = async (riskLevel: 'low' | 'medium' | 'high', mineData: any) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/send-alert`, {
      riskLevel,
      mineName: mineData.name,
      location: mineData.location,
      additionalInfo: mineData.notes || ''
    });

    if (response.data.success) {
      console.log('✅ Backend alert sent successfully:', response.data);
      return { success: true, data: response.data };
    } else {
      throw new Error(response.data.error || 'Failed to send alert');
    }
  } catch (error: any) {
    console.error('❌ Backend alert failed:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message 
    };
  }
};

export const checkBackendHealth = async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/health`);
    return response.data.smtpStatus === 'connected';
  } catch (error) {
    return false;
  }
};
```

### **2. Update UnifiedUploadPrediction Component**

```typescript
// In src/components/UnifiedUploadPrediction.tsx

// Add import
import { sendBackendAlert } from '@/services/backendEmailService';

// In your prediction handler, replace the email service call:
const handlePrediction = async () => {
  // ... existing prediction logic ...
  
  // Send backend email alert
  if (selectedMineData && user?.email) {
    const riskLevel = riskProbability >= 0.8 ? 'high' : 
                     riskProbability >= 0.6 ? 'medium' : 'low';
    
    const backendResult = await sendBackendAlert(riskLevel, {
      name: selectedMineData.name,
      location: selectedMineData.location,
      notes: `Risk probability: ${Math.round(riskProbability * 100)}%`
    });
    
    if (backendResult.success) {
      toast({
        title: "✅ Backend Alert Sent",
        description: `${riskLevel} risk alert sent via backend to ${user.email}`,
        variant: "default",
      });
    } else {
      toast({
        title: "❌ Backend Alert Failed", 
        description: backendResult.error,
        variant: "destructive",
      });
    }
  }
};
```

### **3. Add Backend Health Check**

```typescript
// Add to your dashboard or settings component
import { checkBackendHealth } from '@/services/backendEmailService';

const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

useEffect(() => {
  const checkStatus = async () => {
    const isConnected = await checkBackendHealth();
    setBackendStatus(isConnected ? 'connected' : 'disconnected');
  };
  
  checkStatus();
  const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
  
  return () => clearInterval(interval);
}, []);

// Display status in UI
<div className="flex items-center space-x-2">
  <Badge variant={backendStatus === 'connected' ? 'default' : 'secondary'}>
    {backendStatus === 'connected' ? '✅' : '❌'}
  </Badge>
  <span>Backend Email Service</span>
</div>
```

## 🔧 **Environment Configuration**

### **Frontend Environment Variables**

Add to your `.env` file:

```env
# Backend Email Service
VITE_BACKEND_URL=http://localhost:3001/api
VITE_BACKEND_TIMEOUT=10000
```

### **Update Backend Service**

```typescript
// src/services/backendEmailService.ts
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api';
const TIMEOUT = parseInt(import.meta.env.VITE_BACKEND_TIMEOUT) || 10000;

export const sendBackendAlert = async (riskLevel: 'low' | 'medium' | 'high', mineData: any) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/send-alert`, {
      riskLevel,
      mineName: mineData.name,
      location: mineData.location,
      additionalInfo: mineData.notes || ''
    }, {
      timeout: TIMEOUT
    });
    // ... rest of the code
  } catch (error) {
    // ... error handling
  }
};
```

## 🔄 **Migration Strategy**

### **Phase 1: Parallel Implementation**
- Keep existing email services running
- Add backend email service alongside
- Use feature flag to switch between services

```typescript
const USE_BACKEND_EMAIL = import.meta.env.VITE_USE_BACKEND_EMAIL === 'true';

const sendEmailAlert = async (data: any) => {
  if (USE_BACKEND_EMAIL) {
    return await sendBackendAlert(data.riskLevel, data);
  } else {
    return await sendSupabaseGmailAlert(data);
  }
};
```

### **Phase 2: Gradual Migration**
- Test backend service with subset of users
- Monitor email delivery rates
- Gradually increase backend usage

### **Phase 3: Full Migration**
- Switch all email sending to backend
- Remove old email services
- Update documentation

## 🧪 **Testing Integration**

### **1. Test Backend Connection**

```typescript
// Add to your test suite or debug component
const testBackendConnection = async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/health`);
    console.log('Backend health:', response.data);
    return response.data.smtpStatus === 'connected';
  } catch (error) {
    console.error('Backend connection failed:', error);
    return false;
  }
};
```

### **2. Test Email Sending**

```typescript
const testBackendEmail = async () => {
  try {
    const result = await sendBackendAlert('low', {
      name: 'Test Mine',
      location: 'Test Location',
      notes: 'Integration test'
    });
    
    if (result.success) {
      console.log('✅ Backend email test successful');
    } else {
      console.error('❌ Backend email test failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Backend email test error:', error);
  }
};
```

## 🚀 **Production Deployment**

### **1. Update Backend URL**

```env
# Production
VITE_BACKEND_URL=https://your-domain.com/api
```

### **2. Add CORS Configuration**

In your backend, update CORS settings:

```javascript
// backend/server.js
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend-domain.com'
  ],
  credentials: true
}));
```

### **3. SSL/HTTPS Configuration**

Ensure both frontend and backend use HTTPS in production:

```nginx
# nginx configuration for backend
server {
    listen 443 ssl;
    server_name api.your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📊 **Monitoring & Analytics**

### **1. Add Backend Metrics**

```typescript
// Track backend email success/failure rates
const trackBackendEmail = (success: boolean, riskLevel: string) => {
  // Send to your analytics service
  analytics.track('backend_email_sent', {
    success,
    riskLevel,
    timestamp: new Date().toISOString()
  });
};
```

### **2. Error Monitoring**

```typescript
// Enhanced error handling with monitoring
const sendBackendAlert = async (riskLevel: 'low' | 'medium' | 'high', mineData: any) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/send-alert`, {
      riskLevel,
      mineName: mineData.name,
      location: mineData.location,
      additionalInfo: mineData.notes || ''
    });

    if (response.data.success) {
      trackBackendEmail(true, riskLevel);
      return { success: true, data: response.data };
    } else {
      trackBackendEmail(false, riskLevel);
      throw new Error(response.data.error || 'Failed to send alert');
    }
  } catch (error: any) {
    trackBackendEmail(false, riskLevel);
    console.error('❌ Backend alert failed:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message 
    };
  }
};
```

## 🎯 **Benefits of Backend Integration**

### **Reliability:**
- ✅ **Server-side email delivery** with proper error handling
- ✅ **Gmail SMTP integration** for reliable delivery
- ✅ **Rate limiting** to prevent abuse
- ✅ **Professional email templates** with consistent branding

### **Security:**
- ✅ **Server-side credential management** (Gmail App Passwords)
- ✅ **Input validation** and sanitization
- ✅ **Rate limiting** and abuse prevention
- ✅ **Secure authentication** ready for JWT/session integration

### **Maintainability:**
- ✅ **Centralized email logic** in backend
- ✅ **Consistent email templates** across all alerts
- ✅ **Easy configuration** through environment variables
- ✅ **Comprehensive logging** and monitoring

### **Scalability:**
- ✅ **Horizontal scaling** capability
- ✅ **Load balancing** support
- ✅ **Database integration** ready for user management
- ✅ **Microservice architecture** for future expansion

## 🎉 **Result**

**SHAIL KAVACH now has a complete backend email system that:**

- ✅ **Sends professional Gmail alerts** with risk percentage and type
- ✅ **Integrates seamlessly** with the React frontend
- ✅ **Provides reliable email delivery** through Gmail SMTP
- ✅ **Includes comprehensive security** and monitoring
- ✅ **Supports all risk levels** with appropriate styling and actions
- ✅ **Ready for production deployment** with proper configuration

**The backend email system is fully integrated and ready to send mining safety alerts to registered users!** 📧🚀









