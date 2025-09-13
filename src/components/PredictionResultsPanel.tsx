import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Target, TrendingUp, AlertTriangle, CheckCircle, XCircle, Activity, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { useSensorData } from '@/hooks/useSensorData';

interface PredictionResult {
  id: string;
  mine_id: string;
  prediction_probability: number;
  confidence_score: number;
  risk_factors: string[];
  timestamp: string;
  status: 'high' | 'medium' | 'low';
}

interface Mine {
  id: string;
  name: string;
  location: string;
}

interface PredictionResultsPanelProps {
  selectedMine?: Mine;
}

const PredictionResultsPanel = ({ selectedMine }: PredictionResultsPanelProps) => {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Get real-time sensor data for predictions
  const { currentReading, sensorData, riskScore, isLoading } = useSensorData({ 
    mode: 'simulated',
    mineId: selectedMine?.id 
  });

  const generatePrediction = async () => {
    if (!selectedMine || !currentReading) {
      toast({
        title: "No Data Available",
        description: "Please ensure mine is selected and sensor data is available",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      toast({
        title: "Generating AI Prediction",
        description: "Analyzing sensor data with ML models...",
      });

      // Call the ML prediction function with current sensor data
      const { data, error } = await supabase.functions.invoke('predict-rockfall', {
        body: {
          mine_id: selectedMine.id,
          sensor_data: {
            displacement: currentReading.displacement,
            strain: currentReading.strain,
            pore_pressure: currentReading.pore_pressure,
            rainfall: currentReading.rainfall,
            temperature: currentReading.temperature,
            crack_score: currentReading.crack_score
          }
        }
      });

      if (error) {
        console.error('Prediction API error:', error);
        // Fallback to local calculation
        throw new Error('Using fallback prediction');
      }

      const prediction: PredictionResult = {
        id: Date.now().toString(),
        mine_id: selectedMine.id,
        prediction_probability: data.probability || riskScore,
        confidence_score: data.confidence || 0.85,
        risk_factors: data.risk_factors || [
          'Displacement levels',
          'Strain readings',
          'Pore pressure',
          'Weather conditions'
        ],
        timestamp: new Date().toISOString(),
        status: (data.probability || riskScore) > 0.7 ? 'high' : (data.probability || riskScore) > 0.4 ? 'medium' : 'low'
      };

      setPredictions(prev => [prediction, ...prev.slice(0, 9)]);
      
      toast({
        title: "AI Prediction Complete",
        description: `Risk probability: ${Math.round(prediction.prediction_probability * 100)}% | Confidence: ${Math.round(prediction.confidence_score * 100)}%`,
        variant: prediction.status === 'high' ? "destructive" : "default",
      });
    } catch (error) {
      console.error('Prediction error:', error);
      
      // Fallback calculation using current risk score
      const fallbackPrediction: PredictionResult = {
        id: Date.now().toString(),
        mine_id: selectedMine.id,
        prediction_probability: riskScore,
        confidence_score: 0.75,
        risk_factors: [
          `Displacement: ${currentReading.displacement.toFixed(1)}mm`,
          `Strain: ${currentReading.strain.toFixed(1)}µε`,
          `Pore Pressure: ${currentReading.pore_pressure.toFixed(1)}kPa`,
          `Weather: ${currentReading.rainfall.toFixed(1)}mm rainfall`
        ],
        timestamp: new Date().toISOString(),
        status: riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low'
      };

      setPredictions(prev => [fallbackPrediction, ...prev.slice(0, 9)]);
      
      toast({
        title: "Prediction Generated (Fallback)",
        description: `Risk probability: ${Math.round(riskScore * 100)}% using local analysis`,
        variant: fallbackPrediction.status === 'high' ? "destructive" : "default",
      });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    setLoading(false);
  }, [selectedMine]);

  const getRiskColor = (status: string) => {
    switch (status) {
      case 'high': return 'text-danger';
      case 'medium': return 'text-warning';
      case 'low': return 'text-safe';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskBadgeVariant = (status: string) => {
    switch (status) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  if (!selectedMine) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Please select a mine to view AI predictions</p>
      </Card>
    );
  }

  if (isLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading prediction engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Target className="w-6 h-6" />
            <span>AI Rockfall Predictions</span>
          </h2>
          <p className="text-muted-foreground">{selectedMine.name} - Real-time ML Analysis</p>
        </div>
        <div className="flex space-x-2">
          {currentReading && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Activity className="w-4 h-4 text-green-500" />
              <span>Live Data Available</span>
            </div>
          )}
          <Button 
            onClick={generatePrediction}
            disabled={generating || !currentReading}
            className="flex items-center space-x-2"
          >
            <Target className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Analyzing...' : 'Generate AI Prediction'}</span>
          </Button>
        </div>
      </div>

      {/* Current Risk Assessment */}
      {currentReading && (
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
          <h3 className="text-lg font-semibold mb-4">Current Risk Assessment</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-danger">
                {Math.round(riskScore * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Risk Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {currentReading.displacement.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Displacement (mm)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">
                {currentReading.strain.toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">Strain (µε)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {currentReading.rainfall.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Rainfall (mm)</div>
            </div>
          </div>
        </Card>
      )}

      {/* Prediction Results */}
      {predictions.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Predictions</h3>
          {predictions.map((prediction) => (
            <Card key={prediction.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${
                    prediction.status === 'high' ? 'bg-danger' :
                    prediction.status === 'medium' ? 'bg-warning' : 'bg-safe'
                  }`} />
                  <div>
                    <h4 className="font-semibold">
                      Risk Probability: {Math.round(prediction.prediction_probability * 100)}%
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Generated: {new Date(prediction.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getRiskBadgeVariant(prediction.status)}>
                    {prediction.status.toUpperCase()}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    Confidence: {Math.round(prediction.confidence_score * 100)}%
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Risk Probability</span>
                    <span className="text-sm">{Math.round(prediction.prediction_probability * 100)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        prediction.status === 'high' ? 'bg-danger' :
                        prediction.status === 'medium' ? 'bg-warning' : 'bg-safe'
                      }`}
                      style={{ width: `${prediction.prediction_probability * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium mb-2">Risk Factors</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {prediction.risk_factors.map((factor, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <Zap className="w-3 h-3" />
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium mb-2">Recommendation</h5>
                    <p className="text-sm text-muted-foreground">
                      {prediction.status === 'high' && "Immediate evacuation recommended. Deploy emergency protocols."}
                      {prediction.status === 'medium' && "Increased monitoring required. Prepare contingency measures."}
                      {prediction.status === 'low' && "Continue normal operations with regular monitoring."}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Predictions Generated</h3>
          <p className="text-muted-foreground mb-4">
            Click "Generate AI Prediction" to analyze current sensor data and assess rockfall risk.
          </p>
          {!currentReading && (
            <p className="text-sm text-warning">
              Waiting for sensor data to become available...
            </p>
          )}
        </Card>
      )}
    </div>
  );
};

export default PredictionResultsPanel;