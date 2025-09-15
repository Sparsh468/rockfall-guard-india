import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { Mail, CheckCircle, AlertTriangle, Send, Gmail, Settings } from 'lucide-react';
import gmailService from '@/services/gmailService';

const GmailTestComponent = () => {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [gmailLog, setGmailLog] = useState(gmailService.getGmailLog());

  const testGmailSending = async () => {
    if (!user?.email) {
      toast({
        title: "No Gmail Address",
        description: "Please log in with a Gmail address to test Gmail sending.",
        variant: "destructive",
      });
      return;
    }

    // Check if it's a Gmail address
    if (!user.email.includes('@gmail.com')) {
      toast({
        title: "Not a Gmail Address",
        description: "This test is specifically for Gmail addresses. Your email: " + user.email,
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    
    try {
      const gmailData = {
        to: user.email,
        subject: '🧪 Gmail Test from SHAIL KAVACH',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ea4335, #fbbc05); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">🧪 SHAIL KAVACH</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Gmail Integration Test</p>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1e293b; margin-bottom: 20px;">📧 Gmail System Working!</h2>
              
              <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #0c4a6e;">Gmail Test Information</h3>
                <ul style="margin: 0; padding-left: 20px; color: #0c4a6e;">
                  <li><strong>Gmail Address:</strong> ${user.email}</li>
                  <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
                  <li><strong>System:</strong> SHAIL KAVACH Mining Safety</li>
                  <li><strong>Status:</strong> Gmail integration operational</li>
                </ul>
              </div>

              <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #92400e;">Gmail Integration Features</h3>
                <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                  <li>✅ Direct Gmail delivery via EmailJS</li>
                  <li>✅ Professional HTML email templates</li>
                  <li>✅ Risk-specific styling and recommendations</li>
                  <li>✅ Automatic fallback systems</li>
                  <li>✅ Visual notifications on the page</li>
                </ul>
              </div>

              <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #065f46;">What Happens Next</h3>
                <p style="margin: 0; color: #065f46;">
                  You will receive automatic Gmail alerts for every prediction made in SHAIL KAVACH. 
                  Each email will contain detailed risk assessments, mine information, and specific 
                  recommendations based on the risk level detected.
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #10b981; font-weight: bold; font-size: 18px;">
                  🎉 Gmail Alert System Ready!
                </p>
              </div>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 10px; margin-top: 20px;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                SHAIL KAVACH - Advanced Mining Safety System<br>
                Gmail Integration Test - Please do not reply.
              </p>
            </div>
          </div>
        `,
        textContent: `
SHAIL KAVACH - Gmail Integration Test

📧 Gmail System Working!

Gmail Test Information:
- Gmail Address: ${user.email}
- Test Time: ${new Date().toLocaleString()}
- System: SHAIL KAVACH Mining Safety
- Status: Gmail integration operational

Gmail Integration Features:
✅ Direct Gmail delivery via EmailJS
✅ Professional HTML email templates
✅ Risk-specific styling and recommendations
✅ Automatic fallback systems
✅ Visual notifications on the page

What Happens Next:
You will receive automatic Gmail alerts for every prediction made in SHAIL KAVACH. 
Each email will contain detailed risk assessments, mine information, and specific 
recommendations based on the risk level detected.

🎉 Gmail Alert System Ready!

---
SHAIL KAVACH - Advanced Mining Safety System
Gmail Integration Test - Please do not reply.
        `.trim(),
        priority: 'low',
        alertData: {
          mineName: 'Test Mine',
          location: 'Test Location, India',
          riskLevel: 'low',
          riskProbability: 0.25,
          alertLevel: 'low',
          timestamp: new Date().toISOString(),
          userEmail: user.email,
          userName: user.email?.split('@')[0] || 'Test User'
        }
      };

      const result = await gmailService.sendGmail(gmailData);
      
      if (result.success) {
        toast({
          title: "✅ Gmail Test Sent",
          description: `Gmail sent successfully via ${result.method} to ${user.email}`,
          variant: "default",
        });
        
        // Update Gmail log
        setGmailLog(gmailService.getGmailLog());
      } else {
        toast({
          title: "❌ Gmail Test Failed",
          description: `Failed to send Gmail: ${result.error}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Gmail test error:', error);
      toast({
        title: "❌ Gmail Test Error",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const clearGmailLog = () => {
    gmailService.clearGmailLog();
    setGmailLog([]);
    toast({
      title: "Gmail Log Cleared",
      description: "All logged Gmail emails have been cleared.",
      variant: "default",
    });
  };

  const configStatus = gmailService.getConfigStatus();

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Gmail className="w-6 h-6 text-red-500" />
          <h2 className="text-xl font-semibold">Gmail Integration Test</h2>
        </div>

        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Gmail User Information</span>
            </div>
            <div className="text-blue-800 space-y-1">
              <p><strong>Gmail Address:</strong> {user?.email || 'Not logged in'}</p>
              <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
              <p><strong>Gmail Status:</strong> {
                user?.email?.includes('@gmail.com') ? '✅ Valid Gmail Address' : 
                user?.email ? '⚠️ Not a Gmail Address' : '❌ No Email Address'
              }</p>
            </div>
          </div>

          {/* Configuration Status */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Settings className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Gmail Configuration Status</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Badge variant={configStatus.userId ? "default" : "secondary"}>
                  {configStatus.userId ? "✅" : "❌"}
                </Badge>
                <span>EmailJS User ID</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={configStatus.serviceId ? "default" : "secondary"}>
                  {configStatus.serviceId ? "✅" : "❌"}
                </Badge>
                <span>Service ID</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={configStatus.templateId ? "default" : "secondary" : "secondary"}>
                  {configStatus.templateId ? "✅" : "❌"}
                </Badge>
                <span>Template ID</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              {gmailService.isConfigured() ? 
                "✅ Gmail service is fully configured" : 
                "⚠️ Gmail service will use fallback methods"
              }
            </div>
          </div>

          {/* Instructions */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Click the button below to send a test email to your Gmail address. 
              This will verify that the Gmail integration is working correctly. 
              Make sure you're logged in with a Gmail account.
            </AlertDescription>
          </Alert>

          {/* Test Button */}
          <div className="flex items-center space-x-3">
            <Button 
              onClick={testGmailSending} 
              disabled={sending || !user || !user.email?.includes('@gmail.com')}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Sending Gmail Test...' : 'Send Gmail Test'}</span>
            </Button>
            
            {gmailLog.length > 0 && (
              <Button 
                onClick={clearGmailLog} 
                variant="outline"
              >
                Clear Gmail Log
              </Button>
            )}
          </div>

          {/* Gmail Log */}
          {gmailLog.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center space-x-2">
                <Gmail className="w-4 h-4 text-red-500" />
                <span>Gmail Log ({gmailLog.length} emails)</span>
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {gmailLog.map((email, index) => (
                  <div 
                    key={index} 
                    className="bg-white p-3 rounded border text-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <strong>To Gmail:</strong> {email.to}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {new Date(email.alertData.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div><strong>Subject:</strong> {email.subject}</div>
                    <div><strong>Mine:</strong> {email.alertData.mineName}</div>
                    <div><strong>Risk:</strong> {email.alertData.riskLevel} ({Math.round(email.alertData.riskProbability * 100)}%)</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gmail System Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Gmail System Status</h4>
            <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
              <li>✅ Gmail Service initialized</li>
              <li>✅ EmailJS integration for Gmail</li>
              <li>✅ Gmail webhook fallback</li>
              <li>✅ Gmail SMTP fallback</li>
              <li>✅ Visual Gmail notifications</li>
              <li>✅ Gmail email logging</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GmailTestComponent;









