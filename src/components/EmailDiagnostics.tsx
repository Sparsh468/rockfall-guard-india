import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Mail, CheckCircle, AlertTriangle, Bug, Settings } from 'lucide-react';

const EmailDiagnostics = () => {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setDiagnosticResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runDiagnostics = async () => {
    setTesting(true);
    setDiagnosticResults([]);

    try {
      // Step 1: Check user authentication
      addResult('Step 1: Checking user authentication...');
      if (!user) {
        addResult('❌ User not authenticated');
        return;
      }
      addResult(`✅ User authenticated: ${user.email}`);

      // Step 2: Check user email
      addResult('Step 2: Checking user email...');
      if (!user.email) {
        addResult('❌ No email address found for user');
        return;
      }
      addResult(`✅ User email: ${user.email}`);

      // Step 3: Test Supabase connection
      addResult('Step 3: Testing Supabase connection...');
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          addResult(`❌ Supabase auth error: ${error.message}`);
          return;
        }
        addResult(`✅ Supabase connection successful: ${data.user?.email}`);
      } catch (error) {
        addResult(`❌ Supabase connection failed: ${error}`);
        return;
      }

      // Step 4: Test send-alert function directly
      addResult('Step 4: Testing send-alert function...');
      try {
        const { data, error } = await supabase.functions.invoke('send-alert', {
          body: {
            mine_id: 'test-mine-id',
            mine_name: 'Test Mine',
            location: 'Test Location, India',
            risk_probability: 0.75,
            user_email: user.email,
            user_id: user.id
          }
        });

        if (error) {
          addResult(`❌ send-alert function error: ${error.message}`);
        } else {
          addResult(`✅ send-alert function successful: ${JSON.stringify(data)}`);
        }
      } catch (error) {
        addResult(`❌ send-alert function failed: ${error}`);
      }

      // Step 5: Test send-email-alert function directly
      addResult('Step 5: Testing send-email-alert function...');
      try {
        const { data, error } = await supabase.functions.invoke('send-email-alert', {
          body: {
            to: user.email,
            subject: 'Test Email from SHAIL KAVACH',
            htmlContent: '<h1>Test Email</h1><p>This is a test email from SHAIL KAVACH diagnostics.</p>',
            textContent: 'Test Email\n\nThis is a test email from SHAIL KAVACH diagnostics.',
            priority: 'low',
            alertData: {
              mineName: 'Test Mine',
              location: 'Test Location',
              riskLevel: 'low',
              riskProbability: 0.25,
              alertLevel: 'low',
              timestamp: new Date().toISOString(),
              userEmail: user.email,
              userName: 'Test User'
            }
          }
        });

        if (error) {
          addResult(`❌ send-email-alert function error: ${error.message}`);
        } else {
          addResult(`✅ send-email-alert function successful: ${JSON.stringify(data)}`);
        }
      } catch (error) {
        addResult(`❌ send-email-alert function failed: ${error}`);
      }

      addResult('🎉 Diagnostics completed!');

    } catch (error) {
      addResult(`❌ Diagnostic error: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  const clearResults = () => {
    setDiagnosticResults([]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Bug className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Email Alert Diagnostics</h2>
        </div>

        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">System Information</span>
            </div>
            <div className="text-blue-800 space-y-1">
              <p><strong>User Email:</strong> {user?.email || 'Not logged in'}</p>
              <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
              <p><strong>Authentication:</strong> {user ? 'Authenticated' : 'Not authenticated'}</p>
              <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL ? 'Configured' : 'Not configured'}</p>
            </div>
          </div>

          {/* Instructions */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This diagnostic tool will test each step of the email alert process to identify where the issue might be occurring. 
              Run the diagnostics and check the results below.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button 
              onClick={runDiagnostics} 
              disabled={testing || !user}
              className="flex items-center space-x-2"
            >
              <Bug className="w-4 h-4" />
              <span>{testing ? 'Running Diagnostics...' : 'Run Diagnostics'}</span>
            </Button>
            
            <Button 
              onClick={clearResults} 
              variant="outline"
              disabled={testing || diagnosticResults.length === 0}
            >
              Clear Results
            </Button>
          </div>

          {/* Results */}
          {diagnosticResults.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Diagnostic Results</span>
              </h4>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {diagnosticResults.map((result, index) => (
                  <div 
                    key={index} 
                    className={`text-sm font-mono p-2 rounded ${
                      result.includes('✅') ? 'bg-green-100 text-green-800' :
                      result.includes('❌') ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Troubleshooting Tips */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">Troubleshooting Tips</h4>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>Make sure you're logged in with a valid email address</li>
              <li>Check that Supabase environment variables are configured</li>
              <li>Verify that Supabase Edge Functions are deployed</li>
              <li>Check browser console for additional error details</li>
              <li>Ensure email providers (Resend, SendGrid) are configured</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EmailDiagnostics;









