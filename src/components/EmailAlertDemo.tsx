import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/components/AuthProvider';
import { alertService } from '@/services/alertService';
import { toast } from '@/hooks/use-toast';
import { Mail, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const EmailAlertDemo = () => {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);

  const testEmailAlert = async (riskLevel: 'low' | 'medium' | 'high' | 'critical') => {
    if (!user?.email) {
      toast({
        title: "No Email Address",
        description: "Please log in with an email address to test email alerts.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);

    try {
      // Generate test data based on risk level
      const testData = {
        low: { probability: 0.25, mine: 'Goa Iron Ore', location: 'South Goa, Goa' },
        medium: { probability: 0.52, mine: 'Bellary Iron Ore', location: 'Bellary, Karnataka' },
        high: { probability: 0.78, mine: 'Korba Coalfield', location: 'Korba, Chhattisgarh' },
        critical: { probability: 0.85, mine: 'Bailadila Iron Ore', location: 'Dantewada, Chhattisgarh' }
      };

      const data = testData[riskLevel];

      const result = await alertService.sendPredictionAlert({
        mineId: `test-${riskLevel}-mine`,
        mineName: data.mine,
        location: data.location,
        riskProbability: data.probability,
        userEmail: user.email,
        userId: user.id
      });

      if (result.success) {
        toast({
          title: "Test Email Sent!",
          description: `${riskLevel.toUpperCase()} risk email sent to ${user.email}`,
          variant: "default",
        });
      } else {
        toast({
          title: "Test Email Failed",
          description: `Failed to send test email: ${result.error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "An error occurred while sending test email.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Info className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Mail className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Email Alert Demo</h2>
        </div>

        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Current User</span>
            </div>
            <p className="text-blue-800">
              <strong>Email:</strong> {user?.email || 'Not logged in'}
            </p>
            <p className="text-blue-800">
              <strong>User ID:</strong> {user?.id || 'N/A'}
            </p>
          </div>

          {/* Alert Status */}
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              <strong>Automatic Email Alerts:</strong> Enabled<br/>
              <strong>Coverage:</strong> ALL risk levels (Low, Medium, High, Critical)<br/>
              <strong>Trigger:</strong> After every prediction<br/>
              <strong>Content:</strong> Risk percentage, risk type, mine details, recommendations
            </AlertDescription>
          </Alert>

          {/* Debug Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">Debug Information</h4>
            <div className="text-sm text-yellow-800 space-y-1">
              <p><strong>User Object:</strong> {user ? 'Present' : 'Not logged in'}</p>
              <p><strong>User Email:</strong> {user?.email || 'Not available'}</p>
              <p><strong>User ID:</strong> {user?.id || 'Not available'}</p>
              <p><strong>Auth Status:</strong> {user ? 'Authenticated' : 'Not authenticated'}</p>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="space-y-4">
            <h3 className="font-medium">Test Email Alerts</h3>
            <p className="text-sm text-muted-foreground">
              Click any button below to send a test email alert to your registered email address.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {(['low', 'medium', 'high', 'critical'] as const).map((level) => {
                const testData = {
                  low: { probability: 25, mine: 'Goa Iron Ore' },
                  medium: { probability: 52, mine: 'Bellary Iron Ore' },
                  high: { probability: 78, mine: 'Korba Coalfield' },
                  critical: { probability: 85, mine: 'Bailadila Iron Ore' }
                };

                const data = testData[level];

                return (
                  <Button
                    key={level}
                    onClick={() => testEmailAlert(level)}
                    disabled={testing || !user?.email}
                    variant="outline"
                    className={`h-auto p-4 flex flex-col items-center space-y-2 border-2 ${
                      level === 'critical' ? 'border-red-300 hover:border-red-400' :
                      level === 'high' ? 'border-orange-300 hover:border-orange-400' :
                      level === 'medium' ? 'border-yellow-300 hover:border-yellow-400' :
                      'border-green-300 hover:border-green-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getRiskColor(level)}`} />
                      {getRiskIcon(level)}
                    </div>
                    <div className="text-center">
                      <div className="font-semibold capitalize">{level} Risk</div>
                      <div className="text-xs text-muted-foreground">
                        {data.probability}% - {data.mine}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-2">How It Works:</h4>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Run any prediction in the Analysis & Prediction tab</li>
              <li>Email is automatically sent to your login email address</li>
              <li>Email includes risk percentage, risk type, and recommendations</li>
              <li>You'll see a confirmation toast when email is sent</li>
              <li>Check your email inbox for the detailed alert</li>
            </ol>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-center space-x-2">
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="w-3 h-3 mr-1" />
              Email Alerts Active
            </Badge>
            <Badge variant="outline">
              All Risk Levels
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EmailAlertDemo;
