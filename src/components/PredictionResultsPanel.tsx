import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Target,
  Download,
  RefreshCw,
  Shield,
  Zap
} from "lucide-react";
import { useState } from "react";

interface PredictionResult {
  riskProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  timeWindow: string;
  recommendation: string;
  factors: {
    displacement: { value: number; impact: 'high' | 'medium' | 'low' };
    rainfall: { value: number; impact: 'high' | 'medium' | 'low' };
    slope: { value: number; impact: 'high' | 'medium' | 'low' };
    pressure: { value: number; impact: 'high' | 'medium' | 'low' };
  };
  predictions: {
    time: string;
    probability: number;
  }[];
}

const PredictionResultsPanel = () => {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock prediction data - would come from your ML API
  const predictionResult: PredictionResult = {
    riskProbability: 0.73,
    riskLevel: 'high',
    confidence: 0.89,
    timeWindow: '6 hours',
    recommendation: 'Immediate evacuation recommended. Implement emergency protocols.',
    factors: {
      displacement: { value: 4.5, impact: 'high' },
      rainfall: { value: 18.2, impact: 'high' },
      slope: { value: 16.7, impact: 'medium' },
      pressure: { value: 53.5, impact: 'medium' },
    },
    predictions: [
      { time: '+1h', probability: 0.45 },
      { time: '+2h', probability: 0.52 },
      { time: '+3h', probability: 0.61 },
      { time: '+4h', probability: 0.68 },
      { time: '+5h', probability: 0.73 },
      { time: '+6h', probability: 0.76 },
    ]
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-danger';
      case 'medium': return 'text-warning';
      case 'low': return 'text-safe';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-danger/10 border-danger/20';
      case 'medium': return 'bg-warning/10 border-warning/20';
      case 'low': return 'bg-safe/10 border-safe/20';
      default: return 'bg-muted/10';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-danger';
      case 'medium': return 'text-warning';
      case 'low': return 'text-safe';
      default: return 'text-muted-foreground';
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In production, this would call your PDF generation API
    const reportData = {
      timestamp: new Date().toISOString(),
      riskLevel: predictionResult.riskLevel,
      probability: predictionResult.riskProbability,
      confidence: predictionResult.confidence,
      factors: predictionResult.factors
    };
    
    // Create blob and download (mock)
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rockfall-risk-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setIsGeneratingReport(false);
  };

  const handleRefreshPrediction = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Prediction Results</h2>
          <p className="text-muted-foreground">Machine learning-powered rockfall risk assessment</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={handleRefreshPrediction}
            disabled={isRefreshing}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button 
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="flex items-center space-x-2"
          >
            <Download className={`w-4 h-4 ${isGeneratingReport ? 'animate-bounce' : ''}`} />
            <span>{isGeneratingReport ? 'Generating...' : 'Export Report'}</span>
          </Button>
        </div>
      </div>

      {/* Main Risk Assessment */}
      <Card className={`p-6 ${getRiskBgColor(predictionResult.riskLevel)}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className={`w-8 h-8 ${getRiskColor(predictionResult.riskLevel)}`} />
            <div>
              <h3 className="text-2xl font-bold">
                {(predictionResult.riskProbability * 100).toFixed(0)}% Risk Probability
              </h3>
              <p className="text-muted-foreground">Next {predictionResult.timeWindow}</p>
            </div>
          </div>
          <Badge 
            variant={predictionResult.riskLevel === 'high' ? 'destructive' : 
                    predictionResult.riskLevel === 'medium' ? 'secondary' : 'outline'}
            className="text-lg px-4 py-2"
          >
            {predictionResult.riskLevel.toUpperCase()} RISK
          </Badge>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Risk Probability</span>
              <span className="text-sm text-muted-foreground">
                {(predictionResult.riskProbability * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={predictionResult.riskProbability * 100} className="h-3" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Confidence Level</span>
              </span>
              <span className="text-sm text-muted-foreground">
                {(predictionResult.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={predictionResult.confidence * 100} className="h-3" />
          </div>

          <div className="p-4 bg-card/50 rounded-lg border border-border/50">
            <h4 className="font-medium mb-2 flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>AI Recommendation</span>
            </h4>
            <p className="text-sm">{predictionResult.recommendation}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contributing Factors */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Contributing Factors</span>
          </h3>
          <div className="space-y-4">
            {Object.entries(predictionResult.factors).map(([key, factor]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div>
                  <h4 className="font-medium capitalize">{key}</h4>
                  <p className="text-sm text-muted-foreground">
                    Current: {factor.value}{key === 'displacement' ? 'mm' : 
                               key === 'rainfall' ? 'mm' : 
                               key === 'pressure' ? 'kPa' : '°'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={factor.impact === 'high' ? 'destructive' : 
                            factor.impact === 'medium' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {factor.impact} impact
                  </Badge>
                  <div className={`w-3 h-3 rounded-full ${
                    factor.impact === 'high' ? 'bg-danger' :
                    factor.impact === 'medium' ? 'bg-warning' : 'bg-safe'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Time-Series Predictions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Hourly Risk Progression</span>
          </h3>
          <div className="space-y-3">
            {predictionResult.predictions.map((pred, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-12 text-sm text-muted-foreground font-mono">
                  {pred.time}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{(pred.probability * 100).toFixed(0)}%</span>
                    <Zap className={`w-3 h-3 ${
                      pred.probability > 0.7 ? 'text-danger' :
                      pred.probability > 0.4 ? 'text-warning' : 'text-safe'
                    }`} />
                  </div>
                  <Progress 
                    value={pred.probability * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              * Predictions based on current sensor readings and environmental conditions. 
              Accuracy decreases with longer time horizons.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PredictionResultsPanel;