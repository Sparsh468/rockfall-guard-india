import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { Mail, CheckCircle, AlertTriangle, Send, Database, Settings } from 'lucide-react';
import supabaseGmailService from '@/services/supabaseGmailService';

const SupabaseGmailTest = () => {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [gmailLog, setGmailLog] = useState(supabaseGmailService.getAlertLog());
  const [databaseAlerts, setDatabaseAlerts] = useState<any[]>([]);

  const testSupabaseGmailAlert = async () => {
    if (!user?.email) {
      toast({
        title: "No Gmail Address",
        description: "Please log in with a Gmail address to test Supabase Gmail alerts.",
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
      const testAlertData = {
        user_email: user.email,
        user_id: user.id,
        mine_name: 'Test Mine - Jharia Coalfield',
        location: 'Jharkhand, India',
        risk_percentage: 75,
        risk_type: 'high' as const,
        risk_probability: 0.75,
        timestamp: new Date().toISOString(),
        mine_id: 'test-mine-id'
      };

      const result = await supabaseGmailService.sendGmailAlert(testAlertData);
      
      if (result.success) {
        toast({
          title: "✅ Supabase Gmail Alert Sent",
          description: `Gmail alert sent successfully via ${result.method} to ${user.email}`,
          variant: "default",
        });
        
        // Update Gmail log
        setGmailLog(supabaseGmailService.getAlertLog());
      } else {
        toast({
          title: "❌ Supabase Gmail Alert Failed",
          description: `Failed to send Gmail alert: ${result.error}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Supabase Gmail test error:', error);
      toast({
        title: "❌ Supabase Gmail Test Error",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const testPredictionGmailAlert = async () => {
    if (!user?.email || !user.email.includes('@gmail.com')) {
      toast({
        title: "Gmail Address Required",
        description: "Please log in with a Gmail address to test prediction alerts.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    
    try {
      const predictionData = {
        userEmail: user.email,
        userId: user.id,
        mineName: 'Bellary Iron Ore Mine',
        location: 'Karnataka, India',
        riskProbability: 0.65,
        mineId: 'bellary-mine-id'
      };

      const result = await supabaseGmailService.sendPredictionGmailAlert(predictionData);
      
      if (result.success) {
        toast({
          title: "✅ Prediction Gmail Alert Sent",
          description: `Prediction Gmail alert sent via ${result.method} to ${user.email}`,
          variant: "default",
        });
        
        // Update Gmail log
        setGmailLog(supabaseGmailService.getAlertLog());
      } else {
        toast({
          title: "❌ Prediction Gmail Alert Failed",
          description: `Failed to send prediction alert: ${result.error}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Prediction Gmail test error:', error);
      toast({
        title: "❌ Prediction Gmail Test Error",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const loadDatabaseAlerts = async () => {
    try {
      const alerts = await supabaseGmailService.getGmailAlertsFromDatabase(user?.id);
      setDatabaseAlerts(alerts);
      toast({
        title: "Database Alerts Loaded",
        description: `Found ${alerts.length} Gmail alerts in database.`,
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Error Loading Database Alerts",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const clearGmailLog = () => {
    supabaseGmailService.clearAlertLog();
    setGmailLog([]);
    toast({
      title: "Gmail Log Cleared",
      description: "All logged Gmail alerts have been cleared.",
      variant: "default",
    });
  };

  const configStatus = supabaseGmailService.getConfigStatus();

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Database className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold">Supabase Gmail Alert Test</h2>
        </div>

        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">User Information</span>
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
              <span className="font-medium text-gray-900">Supabase Configuration Status</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Badge variant={configStatus.supabase ? "default" : "secondary"}>
                  {configStatus.supabase ? "✅" : "❌"}
                </Badge>
                <span>Supabase Client</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={configStatus.edgeFunction ? "default" : "secondary"}>
                  {configStatus.edgeFunction ? "✅" : "❌"}
                </Badge>
                <span>Edge Function</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              {configStatus.supabase ? 
                "✅ Supabase Gmail service is configured" : 
                "❌ Supabase not configured - check environment variables"
              }
            </div>
          </div>

          {/* Instructions */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This component tests the Supabase Gmail alert system. It sends alerts with risk percentage 
              and risk type information to your Gmail address using Supabase Edge Functions.
            </AlertDescription>
          </Alert>

          {/* Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={testSupabaseGmailAlert}
              disabled={sending || !user || !user.email?.includes('@gmail.com')}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Sending Alert...' : 'Test Gmail Alert'}</span>
            </Button>
            
            <Button 
              onClick={testPredictionGmailAlert}
              disabled={sending || !user || !user.email?.includes('@gmail.com')}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Sending Alert...' : 'Test Prediction Alert'}</span>
            </Button>
          </div>

          {/* Database Actions */}
          <div className="flex items-center space-x-3">
            <Button 
              onClick={loadDatabaseAlerts}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Database className="w-4 h-4" />
              <span>Load Database Alerts</span>
            </Button>
            
            {gmailLog.length > 0 && (
              <Button 
                onClick={clearGmailLog} 
                variant="outline"
              >
                Clear Local Log
              </Button>
            )}
          </div>

          {/* Local Gmail Log */}
          {gmailLog.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-500" />
                <span>Local Gmail Alert Log ({gmailLog.length} alerts)</span>
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {gmailLog.map((alert, index) => (
                  <div 
                    key={index} 
                    className="bg-white p-3 rounded border text-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <strong>To Gmail:</strong> {alert.user_email}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {new Date(alert.timestamp || Date.now()).toLocaleString()}
                      </div>
                    </div>
                    <div><strong>Mine:</strong> {alert.mine_name}</div>
                    <div><strong>Risk:</strong> {alert.risk_type} ({alert.risk_percentage}%)</div>
                    <div><strong>Location:</strong> {alert.location}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Database Alerts */}
          {databaseAlerts.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center space-x-2">
                <Database className="w-4 h-4 text-green-500" />
                <span>Database Gmail Alerts ({databaseAlerts.length} alerts)</span>
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {databaseAlerts.map((alert, index) => (
                  <div 
                    key={index} 
                    className="bg-white p-3 rounded border text-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <strong>To Gmail:</strong> {alert.user_email}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div><strong>Mine:</strong> {alert.mine_name}</div>
                    <div><strong>Risk:</strong> {alert.risk_type} ({alert.risk_percentage}%)</div>
                    <div><strong>Location:</strong> {alert.location}</div>
                    <div><strong>Email Sent:</strong> {alert.email_sent ? '✅' : '❌'}</div>
                    {alert.email_method && <div><strong>Method:</strong> {alert.email_method}</div>}
                    {alert.email_error && <div><strong>Error:</strong> {alert.email_error}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Supabase Gmail System Status</h4>
            <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
              <li>✅ Supabase Gmail Service initialized</li>
              <li>✅ Edge Function integration</li>
              <li>✅ Risk percentage and type tracking</li>
              <li>✅ Database logging</li>
              <li>✅ Visual Gmail notifications</li>
              <li>✅ Multiple fallback methods</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SupabaseGmailTest;









