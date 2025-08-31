import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Thermometer, 
  Gauge, 
  Clock, 
  Droplets, 
  Mountain,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

const PredictionInterface = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const mineData = {
    name: "Jharia Coalfield - Section A",
    location: "Jharkhand, India",
    coordinates: "23.7644° N, 86.4131° E",
    lastInspection: "3 days ago"
  };

  const currentMetrics = {
    strain: { value: 78, unit: "με", status: "high", threshold: 75 },
    temperature: { value: 32, unit: "°C", status: "normal", threshold: 40 },
    rainfall: { value: 125, unit: "mm", status: "high", threshold: 100 },
    porePressure: { value: 45, unit: "kPa", status: "medium", threshold: 50 },
    slope: { value: 67, unit: "°", status: "high", threshold: 60 },
    vibration: { value: 0.8, unit: "mm/s", status: "normal", threshold: 1.0 }
  };

  const riskFactors = [
    { factor: "Recent heavy rainfall", impact: "High", weight: 0.8 },
    { factor: "Slope angle exceeds safety limit", impact: "High", weight: 0.9 },
    { factor: "Increased strain measurements", impact: "Medium", weight: 0.6 },
    { factor: "Temperature within normal range", impact: "Low", weight: 0.2 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'high': return 'text-danger';
      case 'medium': return 'text-warning';
      case 'normal': return 'text-safe';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'high': return <XCircle className="w-4 h-4 text-danger" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'normal': return <CheckCircle className="w-4 h-4 text-safe" />;
      default: return null;
    }
  };

  const getImpactBadge = (impact: string): "default" | "secondary" | "destructive" => {
    switch (impact) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'default';
      default: return 'default';
    }
  };

  const runAnalysis = () => {
    setAnalyzing(true);
    setAnalysisComplete(false);
    
    setTimeout(() => {
      setAnalyzing(false);
      setAnalysisComplete(true);
    }, 3000);
  };

  const overallRisk = 85; // Calculated based on various factors

  return (
    <div className="space-y-6">
      {/* Mine Information */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{mineData.name}</h3>
            <p className="text-muted-foreground">{mineData.location}</p>
            <p className="text-sm text-muted-foreground">{mineData.coordinates}</p>
          </div>
          <div className="text-right">
            <Badge variant="outline">Active Mine</Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Last inspection: {mineData.lastInspection}
            </p>
          </div>
        </div>
      </Card>

      {/* Current Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Gauge className="w-5 h-5 text-primary" />
              <span className="font-medium">Strain</span>
            </div>
            {getStatusIcon(currentMetrics.strain.status)}
          </div>
          <div className="mt-2">
            <p className={`text-2xl font-bold ${getStatusColor(currentMetrics.strain.status)}`}>
              {currentMetrics.strain.value}{currentMetrics.strain.unit}
            </p>
            <p className="text-xs text-muted-foreground">
              Threshold: {currentMetrics.strain.threshold}{currentMetrics.strain.unit}
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Thermometer className="w-5 h-5 text-primary" />
              <span className="font-medium">Temperature</span>
            </div>
            {getStatusIcon(currentMetrics.temperature.status)}
          </div>
          <div className="mt-2">
            <p className={`text-2xl font-bold ${getStatusColor(currentMetrics.temperature.status)}`}>
              {currentMetrics.temperature.value}{currentMetrics.temperature.unit}
            </p>
            <p className="text-xs text-muted-foreground">
              Threshold: {currentMetrics.temperature.threshold}{currentMetrics.temperature.unit}
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Droplets className="w-5 h-5 text-primary" />
              <span className="font-medium">Rainfall</span>
            </div>
            {getStatusIcon(currentMetrics.rainfall.status)}
          </div>
          <div className="mt-2">
            <p className={`text-2xl font-bold ${getStatusColor(currentMetrics.rainfall.status)}`}>
              {currentMetrics.rainfall.value}{currentMetrics.rainfall.unit}
            </p>
            <p className="text-xs text-muted-foreground">
              Threshold: {currentMetrics.rainfall.threshold}{currentMetrics.rainfall.unit}
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="font-medium">Pore Pressure</span>
            </div>
            {getStatusIcon(currentMetrics.porePressure.status)}
          </div>
          <div className="mt-2">
            <p className={`text-2xl font-bold ${getStatusColor(currentMetrics.porePressure.status)}`}>
              {currentMetrics.porePressure.value}{currentMetrics.porePressure.unit}
            </p>
            <p className="text-xs text-muted-foreground">
              Threshold: {currentMetrics.porePressure.threshold}{currentMetrics.porePressure.unit}
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mountain className="w-5 h-5 text-primary" />
              <span className="font-medium">Slope Angle</span>
            </div>
            {getStatusIcon(currentMetrics.slope.status)}
          </div>
          <div className="mt-2">
            <p className={`text-2xl font-bold ${getStatusColor(currentMetrics.slope.status)}`}>
              {currentMetrics.slope.value}{currentMetrics.slope.unit}
            </p>
            <p className="text-xs text-muted-foreground">
              Threshold: {currentMetrics.slope.threshold}{currentMetrics.slope.unit}
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-medium">Vibration</span>
            </div>
            {getStatusIcon(currentMetrics.vibration.status)}
          </div>
          <div className="mt-2">
            <p className={`text-2xl font-bold ${getStatusColor(currentMetrics.vibration.status)}`}>
              {currentMetrics.vibration.value}{currentMetrics.vibration.unit}
            </p>
            <p className="text-xs text-muted-foreground">
              Threshold: {currentMetrics.vibration.threshold}{currentMetrics.vibration.unit}
            </p>
          </div>
        </Card>
      </div>

      {/* Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Risk Analysis</h4>
          
          <Button 
            onClick={runAnalysis} 
            disabled={analyzing}
            className="w-full mb-4"
          >
            {analyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Run Rockfall Prediction
              </>
            )}
          </Button>

          {analyzing && (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Processing sensor data...</span>
                  <span>90%</span>
                </div>
                <Progress value={90} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Analyzing geological patterns...</span>
                  <span>75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Calculating risk factors...</span>
                  <span>60%</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
            </div>
          )}

          {analysisComplete && (
            <div className="space-y-4">
              <div className="p-4 bg-danger/10 border border-danger/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-danger" />
                  <span className="font-medium text-danger">HIGH RISK</span>
                </div>
                <p className="text-sm">
                  Risk Score: <span className="font-bold text-danger">{overallRisk}%</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Immediate attention required
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-medium">Key Risk Factors:</h5>
                {riskFactors.map((factor, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                    <span className="text-sm">{factor.factor}</span>
                    <Badge variant={getImpactBadge(factor.impact)}>
                      {factor.impact}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h4 className="font-semibold mb-4">Recommendations</h4>
          
          {analysisComplete ? (
            <div className="space-y-4">
              <div className="p-4 bg-danger/10 border border-danger/20 rounded-lg">
                <h5 className="font-medium text-danger mb-2">Immediate Actions</h5>
                <ul className="text-sm space-y-1">
                  <li>• Evacuate personnel from high-risk areas</li>
                  <li>• Install additional monitoring equipment</li>
                  <li>• Implement emergency protocols</li>
                </ul>
              </div>

              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <h5 className="font-medium text-warning mb-2">Short-term (24-48 hours)</h5>
                <ul className="text-sm space-y-1">
                  <li>• Conduct detailed site inspection</li>
                  <li>• Review slope stability measures</li>
                  <li>• Monitor weather conditions closely</li>
                </ul>
              </div>

              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <h5 className="font-medium text-primary mb-2">Long-term Planning</h5>
                <ul className="text-sm space-y-1">
                  <li>• Redesign slope angles for safety</li>
                  <li>• Implement drainage systems</li>
                  <li>• Regular geological assessments</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Run analysis to see recommendations</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PredictionInterface;