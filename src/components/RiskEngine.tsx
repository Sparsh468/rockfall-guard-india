import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useSensorData } from '@/hooks/useSensorData';
import { 
  AlertTriangle, 
  Shield, 
  Activity, 
  TrendingUp,
  Phone,
  Bell,
  Zap
} from 'lucide-react';

interface RiskEngineProps {
  mineId?: string;
  onAlertTriggered?: (alertLevel: string, message: string) => void;
}

interface RiskThresholds {
  displacement: { low: number; medium: number; high: number };
  strain: { low: number; medium: number; high: number };
  pore_pressure: { low: number; medium: number; high: number };
  rainfall: { low: number; medium: number; high: number };
  crack_score: { low: number; medium: number; high: number };
}

const RiskEngine = ({ mineId, onAlertTriggered }: RiskEngineProps) => {
  const { currentReading, riskScore } = useSensorData({ 
    mode: 'simulated', 
    mineId: mineId || 'default-mine' 
  });

  const [lastAlertLevel, setLastAlertLevel] = useState<string>('');
  const [alertHistory, setAlertHistory] = useState<any[]>([]);

  // Risk thresholds for different parameters
  const thresholds: RiskThresholds = {
    displacement: { low: 3, medium: 6, high: 10 },
    strain: { low: 150, medium: 250, high: 350 },
    pore_pressure: { low: 50, medium: 70, high: 90 },
    rainfall: { low: 20, medium: 40, high: 60 },
    crack_score: { low: 3, medium: 6, high: 8 }
  };

  const getRiskLevel = (score: number): string => {
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-danger text-danger-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-safe text-safe-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const checkRiskParameters = () => {
    if (!currentReading) return [];

    const alerts = [];
    
    // Check displacement
    if (currentReading.displacement > thresholds.displacement.high) {
      alerts.push({
        parameter: 'Displacement',
        value: currentReading.displacement,
        unit: 'mm',
        threshold: thresholds.displacement.high,
        severity: 'high',
        message: 'Critical ground displacement detected - Immediate evacuation required'
      });
    } else if (currentReading.displacement > thresholds.displacement.medium) {
      alerts.push({
        parameter: 'Displacement',
        value: currentReading.displacement,
        unit: 'mm',
        threshold: thresholds.displacement.medium,
        severity: 'medium',
        message: 'Elevated ground displacement - Monitor closely'
      });
    }

    // Check strain
    if (currentReading.strain > thresholds.strain.high) {
      alerts.push({
        parameter: 'Strain',
        value: currentReading.strain,
        unit: 'µε',
        threshold: thresholds.strain.high,
        severity: 'high',
        message: 'Critical strain levels detected - Structural failure risk'
      });
    }

    // Check pore pressure
    if (currentReading.pore_pressure > thresholds.pore_pressure.high) {
      alerts.push({
        parameter: 'Pore Pressure',
        value: currentReading.pore_pressure,
        unit: 'kPa',
        threshold: thresholds.pore_pressure.high,
        severity: 'high',
        message: 'Dangerous pore pressure levels - Rock stability compromised'
      });
    }

    // Check rainfall
    if (currentReading.rainfall > thresholds.rainfall.high) {
      alerts.push({
        parameter: 'Rainfall',
        value: currentReading.rainfall,
        unit: 'mm',
        threshold: thresholds.rainfall.high,
        severity: 'medium',
        message: 'Heavy rainfall detected - Increased landslide risk'
      });
    }

    // Check crack score
    if (currentReading.crack_score > thresholds.crack_score.high) {
      alerts.push({
        parameter: 'Crack Score',
        value: currentReading.crack_score,
        unit: '/10',
        threshold: thresholds.crack_score.high,
        severity: 'high',
        message: 'Severe cracking detected - Imminent failure risk'
      });
    }

    return alerts;
  };

  const triggerAlert = async (level: string, message: string, parameters: any[]) => {
    try {
      // Store alert in database
      const { error } = await supabase
        .from('alerts')
        .insert({
          mine_id: mineId || 'default-mine',
          alert_level: level,
          risk_probability: riskScore,
          message: message,
          is_resolved: false
        });

      if (error) throw error;

      // Update mine risk level
      if (mineId) {
        await supabase
          .from('mines')
          .update({
            current_risk_level: level,
            current_risk_probability: riskScore,
            last_updated: new Date().toISOString()
          })
          .eq('id', mineId);
      }

      // Notify parent component
      onAlertTriggered?.(level, message);

      // Show toast notification
      toast({
        title: `${level.toUpperCase()} RISK ALERT`,
        description: message,
        variant: level === 'high' ? 'destructive' : 'default',
      });

      setLastAlertLevel(level);
    } catch (error) {
      console.error('Error triggering alert:', error);
    }
  };

  // Monitor risk levels and trigger alerts
  useEffect(() => {
    if (!currentReading) return;

    const currentRiskLevel = getRiskLevel(riskScore);
    const parameterAlerts = checkRiskParameters();

    // Trigger alert if risk level changed or if there are critical parameters
    const highSeverityAlerts = parameterAlerts.filter(alert => alert.severity === 'high');
    
    if (highSeverityAlerts.length > 0 && lastAlertLevel !== 'high') {
      const message = `Critical conditions detected: ${highSeverityAlerts.map(a => a.parameter).join(', ')}`;
      triggerAlert('high', message, highSeverityAlerts);
    } else if (currentRiskLevel === 'medium' && lastAlertLevel !== 'medium' && lastAlertLevel !== 'high') {
      triggerAlert('medium', 'Elevated risk conditions detected - Monitor closely', parameterAlerts);
    }

    setAlertHistory(parameterAlerts);
  }, [currentReading, riskScore, lastAlertLevel]);

  if (!currentReading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Risk Assessment Engine</h3>
        </div>
        <p className="text-muted-foreground">Waiting for sensor data...</p>
      </Card>
    );
  }

  const currentRiskLevel = getRiskLevel(riskScore);

  return (
    <div className="space-y-4">
      <Card className={`p-6 ${getRiskColor(currentRiskLevel)} border-2`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {currentRiskLevel === 'high' && <AlertTriangle className="w-6 h-6 animate-pulse" />}
            {currentRiskLevel === 'medium' && <TrendingUp className="w-6 h-6" />}
            {currentRiskLevel === 'low' && <Shield className="w-6 h-6" />}
            <h3 className="text-xl font-bold">Risk Assessment: {currentRiskLevel.toUpperCase()}</h3>
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {Math.round(riskScore * 100)}% Risk
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Current Conditions</h4>
            <div className="space-y-1 text-sm">
              <div>Displacement: {currentReading.displacement.toFixed(1)} mm</div>
              <div>Strain: {currentReading.strain.toFixed(0)} µε</div>
              <div>Pore Pressure: {currentReading.pore_pressure.toFixed(1)} kPa</div>
              <div>Rainfall: {currentReading.rainfall.toFixed(1)} mm</div>
              <div>Crack Score: {currentReading.crack_score.toFixed(1)}/10</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Recommended Actions</h4>
            <div className="space-y-1 text-sm">
              {currentRiskLevel === 'high' && (
                <>
                  <div>• Immediate evacuation of personnel</div>
                  <div>• Alert emergency services</div>
                  <div>• Halt all mining operations</div>
                  <div>• Activate emergency protocols</div>
                </>
              )}
              {currentRiskLevel === 'medium' && (
                <>
                  <div>• Increase monitoring frequency</div>
                  <div>• Prepare evacuation routes</div>
                  <div>• Alert safety personnel</div>
                  <div>• Review safety procedures</div>
                </>
              )}
              {currentRiskLevel === 'low' && (
                <>
                  <div>• Continue normal operations</div>
                  <div>• Maintain regular monitoring</div>
                  <div>• Update safety logs</div>
                  <div>• Conduct routine inspections</div>
                </>
              )}
            </div>
          </div>
        </div>

        {currentRiskLevel === 'high' && (
          <div className="mt-4 flex items-center space-x-3">
            <Button variant="destructive" size="sm" className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>Emergency Call</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>Alert Personnel</span>
            </Button>
          </div>
        )}
      </Card>

      {/* Parameter Alerts */}
      {alertHistory.length > 0 && (
        <Card className="p-6">
          <h4 className="font-medium mb-3 flex items-center space-x-2">
            <Zap className="w-4 h-4 text-warning" />
            <span>Active Parameter Alerts</span>
          </h4>
          <div className="space-y-2">
            {alertHistory.map((alert, index) => (
              <Alert 
                key={index} 
                className={`${alert.severity === 'high' ? 'border-danger/50 bg-danger/10' : 'border-warning/50 bg-warning/10'}`}
              >
                <AlertTriangle className={`h-4 w-4 ${alert.severity === 'high' ? 'text-danger' : 'text-warning'}`} />
                <AlertDescription>
                  <strong>{alert.parameter}</strong>: {alert.value.toFixed(1)} {alert.unit} 
                  (Threshold: {alert.threshold} {alert.unit}) - {alert.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default RiskEngine;