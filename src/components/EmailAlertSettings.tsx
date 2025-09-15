import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { alertService, AlertConfig } from '@/services/alertService';
import { Mail, Bell, Settings, Save, TestTube } from 'lucide-react';

interface EmailAlertSettingsProps {
  onClose?: () => void;
}

const EmailAlertSettings = ({ onClose }: EmailAlertSettingsProps) => {
  const [config, setConfig] = useState<AlertConfig>({
    enableEmailAlerts: true,
    enableSMSAlerts: false,
    enablePushNotifications: false,
    alertThresholds: {
      critical: 0.8,
      high: 0.6,
      medium: 0.4,
      low: 0.2
    },
    emailFrequency: 'immediate'
  });

  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    // Load current configuration
    const currentConfig = alertService.getAlertConfig();
    setConfig(currentConfig);
  }, []);

  const handleSave = () => {
    setLoading(true);
    
    try {
      alertService.updateAlertConfig(config);
      toast({
        title: "Settings Saved",
        description: "Email alert preferences have been updated successfully.",
      });
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save alert preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to test.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Send test email via the alert service
      const result = await alertService.sendPredictionAlert({
        mineId: 'test-mine-id',
        mineName: 'Test Mine - Email Alert',
        location: 'Test Location, India',
        riskProbability: 0.75, // High risk for testing
        userEmail: testEmail,
        userId: 'test-user-id'
      });

      if (result.success) {
        toast({
          title: "Test Email Sent",
          description: `Test email sent successfully to ${testEmail}. Please check your inbox.`,
        });
      } else {
        toast({
          title: "Test Failed",
          description: `Failed to send test email: ${result.error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "An error occurred while sending the test email.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateThreshold = (level: keyof typeof config.alertThresholds, value: number) => {
    setConfig(prev => ({
      ...prev,
      alertThresholds: {
        ...prev.alertThresholds,
        [level]: value
      }
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Mail className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Email Alert Settings</h2>
        </div>

        <div className="space-y-6">
          {/* Email Alerts Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="email-alerts" className="text-base font-medium">
                Email Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications for mining risk alerts
              </p>
            </div>
            <Switch
              id="email-alerts"
              checked={config.enableEmailAlerts}
              onCheckedChange={(checked) =>
                setConfig(prev => ({ ...prev, enableEmailAlerts: checked }))
              }
            />
          </div>

          {/* SMS Alerts Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="sms-alerts" className="text-base font-medium">
                SMS Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive SMS notifications for critical alerts (Coming Soon)
              </p>
            </div>
            <Switch
              id="sms-alerts"
              checked={config.enableSMSAlerts}
              onCheckedChange={(checked) =>
                setConfig(prev => ({ ...prev, enableSMSAlerts: checked }))
              }
              disabled
            />
          </div>

          {/* Push Notifications Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="push-alerts" className="text-base font-medium">
                Push Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive browser push notifications (Coming Soon)
              </p>
            </div>
            <Switch
              id="push-alerts"
              checked={config.enablePushNotifications}
              onCheckedChange={(checked) =>
                setConfig(prev => ({ ...prev, enablePushNotifications: checked }))
              }
              disabled
            />
          </div>

          {/* Email Frequency */}
          {config.enableEmailAlerts && (
            <div className="space-y-2">
              <Label htmlFor="email-frequency" className="text-base font-medium">
                Email Frequency
              </Label>
              <Select
                value={config.emailFrequency}
                onValueChange={(value: 'immediate' | 'hourly' | 'daily') =>
                  setConfig(prev => ({ ...prev, emailFrequency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="hourly">Hourly Digest</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Alert Thresholds */}
          {config.enableEmailAlerts && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-medium">Alert Thresholds</Label>
                <p className="text-sm text-muted-foreground">
                  Risk probability thresholds for different alert levels. Emails are sent for ALL levels (Low, Medium, High, Critical).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="critical-threshold" className="text-sm font-medium text-red-600">
                    Critical Alert
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="critical-threshold"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.alertThresholds.critical}
                      onChange={(e) => updateThreshold('critical', parseFloat(e.target.value) || 0.8)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">≥ 80%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="high-threshold" className="text-sm font-medium text-orange-600">
                    High Alert
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="high-threshold"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.alertThresholds.high}
                      onChange={(e) => updateThreshold('high', parseFloat(e.target.value) || 0.6)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">≥ 60%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medium-threshold" className="text-sm font-medium text-yellow-600">
                    Medium Alert
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="medium-threshold"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.alertThresholds.medium}
                      onChange={(e) => updateThreshold('medium', parseFloat(e.target.value) || 0.4)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">≥ 40%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="low-threshold" className="text-sm font-medium text-green-600">
                    Low Alert
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="low-threshold"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.alertThresholds.low}
                      onChange={(e) => updateThreshold('low', parseFloat(e.target.value) || 0.2)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">≥ 20%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Test Email */}
          {config.enableEmailAlerts && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-medium">Test Email</Label>
                <p className="text-sm text-muted-foreground">
                  Send a test email to verify your alert configuration
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Input
                  type="email"
                  placeholder="Enter email address for test"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleTestEmail}
                  disabled={loading || !testEmail}
                  variant="outline"
                  size="sm"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Send Test
                </Button>
              </div>
            </div>
          )}

          {/* Info Alert */}
          <Alert>
            <Bell className="h-4 w-4" />
            <AlertDescription>
              Email alerts are automatically sent for ALL mining risk predictions (Low, Medium, High, Critical). 
              Alerts include detailed risk information, risk percentage, risk type, recommended actions, and direct links to the dashboard.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button onClick={handleSave} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EmailAlertSettings;
