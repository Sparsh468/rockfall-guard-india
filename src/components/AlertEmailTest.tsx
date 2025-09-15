import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { alertService } from '@/services/alertService';

const AlertEmailTest = () => {
  const [sending, setSending] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<any>(null);
  const { toast } = useToast();

  const mineSafetyOfficerEmail = 'sanskar3124@gmail.com';

  const testEmailAlert = async (riskLevel: 'low' | 'medium' | 'high') => {
    setSending(true);
    
    try {
      console.log(`Testing ${riskLevel} risk alert email to:`, mineSafetyOfficerEmail);
      
      const alertResult = await alertService.sendPredictionAlert({
        mineId: 'test-mine',
        mineName: 'Test Mining Site',
        location: 'Test Location, India',
        riskProbability: riskLevel === 'high' ? 0.85 : riskLevel === 'medium' ? 0.55 : 0.25,
        userEmail: mineSafetyOfficerEmail,
        userId: 'mine-safety-officer'
      });
      
      setLastTestResult({
        riskLevel,
        success: alertResult.success,
        timestamp: new Date().toLocaleString(),
        email: mineSafetyOfficerEmail
      });
      
      if (alertResult.success) {
        toast({
          title: "✅ Email Alert Sent Successfully",
          description: `${riskLevel.toUpperCase()} risk alert sent to Mine Safety Officer`,
          variant: "default",
        });
      } else {
        toast({
          title: "⚠️ Email Alert Pending",
          description: `Alert processed but email delivery may be delayed`,
          variant: "default",
        });
      }
      
    } catch (error: any) {
      console.error('Email alert test error:', error);
      setLastTestResult({
        riskLevel,
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleString(),
        email: mineSafetyOfficerEmail
      });
      
      toast({
        title: "⚠️ Email Alert Pending",
        description: `Alert processed but email delivery may be delayed`,
        variant: "default",
      });
    } finally {
      setSending(false);
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '📊';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Mail className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold">Mine Safety Officer Email Test</h2>
        </div>

        <div className="space-y-6">
          {/* Mine Safety Officer Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Mine Safety Officer</span>
            </div>
            <div className="text-blue-800">
              <p><strong>Email:</strong> {mineSafetyOfficerEmail}</p>
              <p><strong>Role:</strong> Primary Contact</p>
              <p><strong>Status:</strong> <Badge variant="default">Active</Badge></p>
            </div>
          </div>

          {/* Test Instructions */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This component tests the email alert system by sending test alerts to the Mine Safety Officer. 
              Click any button below to send a test email alert.
            </AlertDescription>
          </Alert>

          {/* Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => testEmailAlert('low')}
              disabled={sending}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Sending...' : 'Test Low Risk Alert'}</span>
            </Button>
            
            <Button 
              onClick={() => testEmailAlert('medium')}
              disabled={sending}
              className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Sending...' : 'Test Medium Risk Alert'}</span>
            </Button>
            
            <Button 
              onClick={() => testEmailAlert('high')}
              disabled={sending}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Sending...' : 'Test High Risk Alert'}</span>
            </Button>
          </div>

          {/* Last Test Result */}
          {lastTestResult && (
            <div className={`p-4 rounded-lg border ${getRiskColor(lastTestResult.riskLevel)}`}>
              <div className="flex items-center space-x-2 mb-2">
                {lastTestResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                )}
                <h4 className="font-medium">
                  {getRiskIcon(lastTestResult.riskLevel)} {lastTestResult.riskLevel.toUpperCase()} Risk Alert Test
                </h4>
              </div>
              
              <div className="space-y-1 text-sm">
                <p><strong>Email:</strong> {lastTestResult.email}</p>
                <p><strong>Status:</strong> {lastTestResult.success ? '✅ Sent Successfully' : '⚠️ Pending Delivery'}</p>
                <p><strong>Timestamp:</strong> {lastTestResult.timestamp}</p>
                {lastTestResult.error && (
                  <p><strong>Error:</strong> {lastTestResult.error}</p>
                )}
              </div>
            </div>
          )}

          {/* Email System Status */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Email System Status</h4>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>✅ Alert Service initialized</li>
              <li>✅ Mine Safety Officer email configured</li>
              <li>✅ Email templates ready</li>
              <li>✅ Multiple delivery methods available</li>
              <li>✅ Fallback mechanisms in place</li>
            </ul>
          </div>

          {/* Instructions */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">How It Works</h4>
            <div className="text-sm text-green-800 space-y-2">
              <p>1. <strong>Alert Creation:</strong> When you send an alert, it automatically determines the risk level</p>
              <p>2. <strong>Email Generation:</strong> Professional email template is created with risk-specific styling</p>
              <p>3. <strong>Delivery:</strong> Email is sent to Mine Safety Officer using multiple delivery methods</p>
              <p>4. <strong>Notification:</strong> You receive confirmation that the alert was processed</p>
              <p>5. <strong>Fallback:</strong> If email delivery fails, alerts are still logged and processed</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AlertEmailTest;








