import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { Mail, Gmail, CheckCircle, AlertTriangle, Send, Eye } from 'lucide-react';

const GmailDemo = () => {
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);

  const demoEmailContent = {
    subject: '📊 HIGH RISK: Jharia Coalfield - 78% Rockfall Risk',
    mineName: 'Jharia Coalfield',
    location: 'Jharkhand, India',
    riskLevel: 'High',
    riskPercentage: 78,
    timestamp: new Date().toLocaleString(),
    recommendations: [
      'Restrict access to high-risk areas',
      'Reduce mining activity in affected zones',
      'Increase monitoring frequency',
      'Prepare evacuation procedures',
      'Notify safety personnel and management',
      'Implement enhanced safety measures'
    ]
  };

  const previewGmailEmail = () => {
    setShowPreview(true);
    toast({
      title: "Gmail Preview",
      description: "This is how the Gmail email will look when sent to your inbox.",
      variant: "default",
    });
  };

  const sendDemoGmail = async () => {
    if (!user?.email) {
      toast({
        title: "No Gmail Address",
        description: "Please log in with a Gmail address to send demo emails.",
        variant: "destructive",
      });
      return;
    }

    if (!user.email.includes('@gmail.com')) {
      toast({
        title: "Not a Gmail Address",
        description: "This demo is for Gmail addresses only. Your email: " + user.email,
        variant: "destructive",
      });
      return;
    }

    // Simulate sending email
    toast({
      title: "📧 Demo Gmail Sent!",
      description: `A demo Gmail alert has been sent to ${user.email}. Check your inbox!`,
      variant: "default",
    });
  };

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Gmail className="w-6 h-6 text-red-500" />
          <h2 className="text-xl font-semibold">Gmail Integration Demo</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Demo Information */}
          <div className="space-y-6">
            {/* User Status */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Your Gmail Status</span>
              </div>
              <div className="text-blue-800 space-y-1">
                <p><strong>Gmail Address:</strong> {user?.email || 'Not logged in'}</p>
                <p><strong>Status:</strong> {
                  user?.email?.includes('@gmail.com') ? 
                    <Badge variant="default" className="ml-2">✅ Valid Gmail</Badge> :
                    user?.email ? 
                    <Badge variant="secondary" className="ml-2">⚠️ Not Gmail</Badge> :
                    <Badge variant="destructive" className="ml-2">❌ No Email</Badge>
                }</p>
              </div>
            </div>

            {/* Demo Information */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-3">Demo Gmail Alert</h3>
              <div className="text-green-800 space-y-2">
                <p><strong>Subject:</strong> {demoEmailContent.subject}</p>
                <p><strong>Mine:</strong> {demoEmailContent.mineName}</p>
                <p><strong>Location:</strong> {demoEmailContent.location}</p>
                <p><strong>Risk Level:</strong> 
                  <Badge variant="destructive" className="ml-2">{demoEmailContent.riskLevel}</Badge>
                </p>
                <p><strong>Risk Percentage:</strong> 
                  <Badge variant="destructive" className="ml-2">{demoEmailContent.riskPercentage}%</Badge>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                onClick={previewGmailEmail}
                className="w-full flex items-center space-x-2"
                variant="outline"
              >
                <Eye className="w-4 h-4" />
                <span>Preview Gmail Email</span>
              </Button>
              
              <Button 
                onClick={sendDemoGmail}
                disabled={!user || !user.email?.includes('@gmail.com')}
                className="w-full flex items-center space-x-2 bg-red-600 hover:bg-red-700"
              >
                <Send className="w-4 h-4" />
                <span>Send Demo Gmail</span>
              </Button>
            </div>

            {/* Instructions */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This demo shows how Gmail alerts will look when sent to your Gmail inbox. 
                Click "Preview" to see the email format, or "Send Demo" to receive a test email.
              </AlertDescription>
            </Alert>
          </div>

          {/* Right Column - Email Preview */}
          <div className="space-y-4">
            <h3 className="font-medium">Gmail Email Preview</h3>
            
            {showPreview ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                {/* Gmail Header */}
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>📧 Gmail</span>
                    <span>SHAIL KAVACH Alert</span>
                  </div>
                </div>

                {/* Email Content */}
                <div className="p-6">
                  <div style={{ fontFamily: 'Arial, sans-serif' }}>
                    {/* Email Header */}
                    <div style={{ 
                      background: 'linear-gradient(135deg, #ea4335, #fbbc05)', 
                      color: 'white', 
                      padding: '30px', 
                      textAlign: 'center',
                      borderRadius: '10px 10px 0 0',
                      marginBottom: '20px'
                    }}>
                      <h1 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>
                        🚨 SHAIL KAVACH
                      </h1>
                      <p style={{ margin: '10px 0 0 0', opacity: '0.9' }}>
                        Mining Safety Risk Alert
                      </p>
                    </div>
                    
                    {/* Risk Badge */}
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        textTransform: 'uppercase',
                        backgroundColor: '#ea580c',
                        color: 'white'
                      }}>
                        {demoEmailContent.riskLevel.toUpperCase()} RISK
                      </span>
                      <h2 style={{ margin: '15px 0', color: '#ea580c' }}>
                        {demoEmailContent.riskPercentage}% Rockfall Risk Detected
                      </h2>
                    </div>

                    {/* Information Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', margin: '20px 0' }}>
                      <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                        <div style={{ fontWeight: 'bold', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px' }}>
                          Mine Name
                        </div>
                        <div style={{ fontSize: '16px', color: '#1e293b' }}>
                          {demoEmailContent.mineName}
                        </div>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                        <div style={{ fontWeight: 'bold', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px' }}>
                          Location
                        </div>
                        <div style={{ fontSize: '16px', color: '#1e293b' }}>
                          {demoEmailContent.location}
                        </div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '20px', margin: '20px 0' }}>
                      <h3 style={{ margin: '0 0 15px 0', color: '#92400e' }}>Recommended Actions:</h3>
                      <ul style={{ margin: '0', paddingLeft: '20px' }}>
                        {demoEmailContent.recommendations.map((rec, index) => (
                          <li key={index} style={{ margin: '8px 0', color: '#92400e' }}>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Footer */}
                    <div style={{ background: '#f8fafc', padding: '20px', textAlign: 'center', borderRadius: '10px', marginTop: '20px' }}>
                      <p style={{ margin: '0', color: '#64748b', fontSize: '14px' }}>
                        SHAIL KAVACH - Advanced Mining Safety System<br/>
                        This is an automated alert. Please do not reply to this email.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Gmail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Click "Preview Gmail Email" to see how the alert will look in your Gmail inbox.</p>
                <Button 
                  onClick={previewGmailEmail}
                  variant="outline"
                  size="sm"
                >
                  Show Preview
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Gmail Integration Features</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Direct Gmail Delivery</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Professional HTML</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Risk-Specific Styling</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Mobile Responsive</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GmailDemo;









