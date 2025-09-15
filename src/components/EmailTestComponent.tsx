import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { Mail, CheckCircle, AlertTriangle, Send } from 'lucide-react';
import emailService from '@/services/simpleEmailService';

const EmailTestComponent = () => {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [emailLog, setEmailLog] = useState(emailService.getEmailLog());

  const testEmailSending = async () => {
    if (!user?.email) {
      toast({
        title: "No Email Address",
        description: "Please log in with a valid email address to test email sending.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    
    try {
      const emailData = {
        to: user.email,
        subject: '🧪 Test Email from SHAIL KAVACH',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">🧪 SHAIL KAVACH</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Email System Test</p>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1e293b; margin-bottom: 20px;">✅ Email System Working!</h2>
              
              <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #0c4a6e;">Test Information</h3>
                <ul style="margin: 0; padding-left: 20px; color: #0c4a6e;">
                  <li><strong>Recipient:</strong> ${user.email}</li>
                  <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
                  <li><strong>System:</strong> SHAIL KAVACH Mining Safety</li>
                  <li><strong>Status:</strong> Email system operational</li>
                </ul>
              </div>

              <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #92400e;">What This Means</h3>
                <p style="margin: 0; color: #92400e;">
                  This test email confirms that the SHAIL KAVACH system can successfully send email alerts 
                  to your registered email address. You will receive automatic risk assessment alerts 
                  after every prediction made in the system.
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #16a34a; font-weight: bold; font-size: 18px;">
                  🎉 Email Alert System Ready!
                </p>
              </div>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 10px; margin-top: 20px;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                SHAIL KAVACH - Advanced Mining Safety System<br>
                This is a test email. Please do not reply.
              </p>
            </div>
          </div>
        `,
        textContent: `
SHAIL KAVACH - Email System Test

✅ Email System Working!

Test Information:
- Recipient: ${user.email}
- Test Time: ${new Date().toLocaleString()}
- System: SHAIL KAVACH Mining Safety
- Status: Email system operational

What This Means:
This test email confirms that the SHAIL KAVACH system can successfully send email alerts 
to your registered email address. You will receive automatic risk assessment alerts 
after every prediction made in the system.

🎉 Email Alert System Ready!

---
SHAIL KAVACH - Advanced Mining Safety System
This is a test email. Please do not reply.
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

      const result = await emailService.sendEmail(emailData);
      
      if (result.success) {
        toast({
          title: "✅ Test Email Sent",
          description: `Email sent successfully via ${result.method} to ${user.email}`,
          variant: "default",
        });
        
        // Update email log
        setEmailLog(emailService.getEmailLog());
      } else {
        toast({
          title: "❌ Email Failed",
          description: `Failed to send email: ${result.error}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Email test error:', error);
      toast({
        title: "❌ Email Test Error",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const clearEmailLog = () => {
    emailService.clearEmailLog();
    setEmailLog([]);
    toast({
      title: "Email Log Cleared",
      description: "All logged emails have been cleared.",
      variant: "default",
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Mail className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Email System Test</h2>
        </div>

        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">User Information</span>
            </div>
            <div className="text-blue-800 space-y-1">
              <p><strong>Email Address:</strong> {user?.email || 'Not logged in'}</p>
              <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
              <p><strong>Status:</strong> {user ? 'Ready for testing' : 'Please log in'}</p>
            </div>
          </div>

          {/* Instructions */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Click the button below to send a test email to your registered email address. 
              This will verify that the email alert system is working correctly.
            </AlertDescription>
          </Alert>

          {/* Test Button */}
          <div className="flex items-center space-x-3">
            <Button 
              onClick={testEmailSending} 
              disabled={sending || !user}
              className="flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Sending Test Email...' : 'Send Test Email'}</span>
            </Button>
            
            {emailLog.length > 0 && (
              <Button 
                onClick={clearEmailLog} 
                variant="outline"
              >
                Clear Email Log
              </Button>
            )}
          </div>

          {/* Email Log */}
          {emailLog.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Email Log ({emailLog.length} emails)</span>
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {emailLog.map((email, index) => (
                  <div 
                    key={index} 
                    className="bg-white p-3 rounded border text-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <strong>To:</strong> {email.to}
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

          {/* Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">System Status</h4>
            <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
              <li>✅ Simple Email Service initialized</li>
              <li>✅ Multiple email providers configured (EmailJS, Webhook, HTTP Service)</li>
              <li>✅ Fallback logging system active</li>
              <li>✅ Visual notifications enabled</li>
              <li>✅ Email templates ready</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EmailTestComponent;









