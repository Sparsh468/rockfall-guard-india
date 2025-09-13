import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Zap, TrendingUp, AlertTriangle, CheckCircle, Info, 
  Gauge, Thermometer, Droplets, Mountain, Zap as CracksIcon 
} from 'lucide-react';

interface PredictionParams {
  mine_id: string;
  displacement: number;
  strain: number;
  pore_pressure: number;
  rainfall: number;
  temperature: number;
  dem_slope: number;
  crack_score: number;
}

interface PredictionResult {
  risk_probability: number;
  risk_level: string;
  recommendation: string;
}

const EnhancedPredictionInterface = () => {
  const { user } = useAuth();
  const [mines, setMines] = useState<any[]>([]);
  const [selectedMine, setSelectedMine] = useState('');
  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [predictionParams, setPredictionParams] = useState<PredictionParams>({
    mine_id: '',
    displacement: 0,
    strain: 0,
    pore_pressure: 0,
    rainfall: 0,
    temperature: 0,
    dem_slope: 0,
    crack_score: 0,
  });

  // Fetch mines on component mount
  useEffect(() => {
    const fetchMines = async () => {
      const { data } = await supabase
        .from('mines')
        .select('id, name, location, state')
        .order('name');
      setMines(data || []);
    };
    fetchMines();
  }, []);

  // Fetch latest sensor data for selected mine
  const fetchSensorDataForMine = async (mineId: string) => {
    if (!mineId) return;
    
    try {
      const { data: sensorData } = await supabase
        .from('sensor_data')
        .select('*')
        .eq('mine_id', mineId)
        .order('timestamp', { ascending: false })
        .limit(1);

      if (sensorData && sensorData.length > 0) {
        const latestData = sensorData[0];
        setPredictionParams(prev => ({
          ...prev,
          mine_id: mineId,
          displacement: latestData.displacement || 0,
          strain: latestData.strain || 0,
          pore_pressure: latestData.pore_pressure || 0,
          rainfall: latestData.rainfall || 0,
          temperature: latestData.temperature || 0,
          crack_score: latestData.crack_score || 0,
        }));
        
        // Get mine name for better user feedback
        const selectedMine = mines.find(m => m.id === mineId);
        const mineName = selectedMine?.name || 'Selected mine';
        
        toast({
          title: "Real-time data loaded",
          description: `Latest sensor readings auto-populated for ${mineName}`,
        });
      } else {
        toast({
          title: "No sensor data available",
          description: "Using default values. Manual input required.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      toast({
        title: "Failed to load sensor data",
        description: "Using default values. Please update manually if needed.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof PredictionParams, value: string) => {
    setPredictionParams(prev => ({
      ...prev,
      [field]: field === 'mine_id' ? value : parseFloat(value) || 0,
    }));
  };

  const runPrediction = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to run predictions.",
        variant: "destructive",
      });
      return;
    }

    if (!predictionParams.mine_id) {
      toast({
        title: "Mine selection required",
        description: "Please select a mine to analyze.",
        variant: "destructive",
      });
      return;
    }

    setPredicting(true);
    setPredictionResult(null);

    try {
      const response = await fetch(`https://xrfreauhawplgphgdjvp.supabase.co/functions/v1/predict-rockfall`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyZnJlYXVoYXdwbGdwaGdkanZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMDMwMjgsImV4cCI6MjA3MjY3OTAyOH0.hF9ra8R2Oj1pMNGqkXDNpDAmd6eRYYiT6uz8tVk8chI`,
        },
        body: JSON.stringify(predictionParams),
      });

      if (!response.ok) {
        throw new Error('Prediction failed');
      }

      const result = await response.json();
      setPredictionResult(result);

      toast({
        title: "Prediction completed",
        description: `Risk assessment: ${result.risk_level.toUpperCase()} (${Math.round(result.risk_probability * 100)}%)`,
        variant: result.risk_level === 'high' ? 'destructive' : 'default',
      });

    } catch (error: any) {
      console.error('Prediction error:', error);
      toast({
        title: "Prediction failed",
        description: error.message || "Failed to run prediction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPredicting(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-danger';
      case 'medium': return 'text-warning';
      case 'low': return 'text-safe';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="w-5 h-5 text-danger" />;
      case 'medium': return <TrendingUp className="w-5 h-5 text-warning" />;
      case 'low': return <CheckCircle className="w-5 h-5 text-safe" />;
      default: return <Info className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Rockfall Risk Prediction</h1>
        <p className="text-muted-foreground">
          Advanced AI-powered risk assessment using sensor data and environmental parameters
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Input Parameters */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Sensor Data Input</h3>
          
          <div className="space-y-4">
            {/* Mine Selection */}
            <div>
              <Label htmlFor="mine">Select Mine</Label>
              <Select 
                value={predictionParams.mine_id} 
                onValueChange={(value) => {
                  handleInputChange('mine_id', value);
                  fetchSensorDataForMine(value);
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose a mine..." />
                </SelectTrigger>
                <SelectContent>
                  {mines.map((mine) => (
                    <SelectItem key={mine.id} value={mine.id}>
                      {mine.name} - {mine.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sensor Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="displacement" className="flex items-center space-x-2">
                  <Gauge className="w-4 h-4" />
                  <span>Displacement (mm)</span>
                </Label>
                <Input
                  id="displacement"
                  type="number"
                  step="0.1"
                  value={predictionParams.displacement}
                  onChange={(e) => handleInputChange('displacement', e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="strain" className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Strain (με)</span>
                </Label>
                <Input
                  id="strain"
                  type="number"
                  step="0.1"
                  value={predictionParams.strain}
                  onChange={(e) => handleInputChange('strain', e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="pore_pressure" className="flex items-center space-x-2">
                  <Droplets className="w-4 h-4" />
                  <span>Pore Pressure (kPa)</span>
                </Label>
                <Input
                  id="pore_pressure"
                  type="number"
                  step="0.1"
                  value={predictionParams.pore_pressure}
                  onChange={(e) => handleInputChange('pore_pressure', e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="rainfall" className="flex items-center space-x-2">
                  <Droplets className="w-4 h-4" />
                  <span>Rainfall (mm)</span>
                </Label>
                <Input
                  id="rainfall"
                  type="number"
                  step="0.1"
                  value={predictionParams.rainfall}
                  onChange={(e) => handleInputChange('rainfall', e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="temperature" className="flex items-center space-x-2">
                  <Thermometer className="w-4 h-4" />
                  <span>Temperature (°C)</span>
                </Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  value={predictionParams.temperature}
                  onChange={(e) => handleInputChange('temperature', e.target.value)}
                  className="mt-2"
                />
              </div>


              <div className="md:col-span-2">
                <Label htmlFor="crack_score" className="flex items-center space-x-2">
                  <CracksIcon className="w-4 h-4" />
                  <span>Crack Score (0-10)</span>
                </Label>
                <Input
                  id="crack_score"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={predictionParams.crack_score}
                  onChange={(e) => handleInputChange('crack_score', e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            {predicting && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Running AI prediction...</p>
                <Progress value={33} className="w-full animate-pulse" />
              </div>
            )}

            <Button
              onClick={runPrediction}
              disabled={predicting || !predictionParams.mine_id}
              className="w-full"
              size="lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              {predicting ? 'Analyzing...' : 'Run Prediction'}
            </Button>
          </div>
        </Card>

        {/* Results */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Prediction Results</h3>
          
          {predictionResult ? (
            <div className="space-y-6">
              {/* Risk Level Display */}
              <div className="text-center p-6 bg-gradient-to-br from-accent/20 to-accent/5 rounded-lg border border-border/50">
                <div className="flex items-center justify-center space-x-3 mb-3">
                  {getRiskIcon(predictionResult.risk_level)}
                  <h4 className="text-xl font-bold">Risk Assessment</h4>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold">
                    {Math.round(predictionResult.risk_probability * 100)}%
                  </div>
                  <Badge 
                    variant={predictionResult.risk_level === 'high' ? 'destructive' : 
                             predictionResult.risk_level === 'medium' ? 'secondary' : 'default'}
                    className="text-lg px-4 py-1"
                  >
                    {predictionResult.risk_level.toUpperCase()} RISK
                  </Badge>
                </div>
              </div>

              {/* Risk Alert */}
              {predictionResult.risk_probability > 0.7 && (
                <Alert className="border-danger/50 bg-danger/10">
                  <AlertTriangle className="h-4 w-4 text-danger" />
                  <AlertDescription className="text-danger">
                    <strong>High Risk Alert!</strong> Immediate action required. Emergency protocols should be activated.
                  </AlertDescription>
                </Alert>
              )}

              {/* Recommendations */}
              <div className="space-y-3">
                <h4 className="font-semibold">Recommendations</h4>
                <div className="p-4 bg-accent/30 rounded-lg">
                  <p className="text-sm leading-relaxed">
                    {predictionResult.recommendation}
                  </p>
                </div>
              </div>

              {/* Additional Actions */}
              <div className="space-y-2">
                <h4 className="font-semibold">Next Steps</h4>
                <div className="space-y-2">
                  {predictionResult.risk_level === 'high' && (
                    <>
                      <div className="flex items-center space-x-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-danger" />
                        <span>Evacuate personnel from danger zone</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-danger" />
                        <span>Implement emergency response protocols</span>
                      </div>
                    </>
                  )}
                  {predictionResult.risk_level === 'medium' && (
                    <>
                      <div className="flex items-center space-x-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-warning" />
                        <span>Increase monitoring frequency</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-warning" />
                        <span>Review safety protocols</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-safe" />
                    <span>Continue regular monitoring schedule</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No prediction results yet</p>
              <p className="text-sm">Enter sensor data and run prediction to see results</p>
            </div>
          )}
        </Card>
      </div>

      {/* Parameter Guidelines */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Parameter Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
          <div>
            <h4 className="font-medium mb-2">Displacement</h4>
            <ul className="text-muted-foreground space-y-1">
              <li>• Normal: 0-5 mm</li>
              <li>• Caution: 5-15 mm</li>
              <li>• Danger: &gt;15 mm</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Strain</h4>
            <ul className="text-muted-foreground space-y-1">
              <li>• Normal: 0-500 με</li>
              <li>• Caution: 500-1500 με</li>
              <li>• Danger: &gt;1500 με</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Pore Pressure</h4>
            <ul className="text-muted-foreground space-y-1">
              <li>• Normal: 0-50 kPa</li>
              <li>• Caution: 50-100 kPa</li>
              <li>• Danger: &gt;100 kPa</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Crack Score</h4>
            <ul className="text-muted-foreground space-y-1">
              <li>• Minimal: 0-3</li>
              <li>• Moderate: 4-6</li>
              <li>• Extensive: 7-10</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EnhancedPredictionInterface;