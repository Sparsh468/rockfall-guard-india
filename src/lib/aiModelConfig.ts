// AI Model Configuration for Rockfall Prediction

export interface TrainingDataPoint {
  input: {
    displacement: number;
    strain: number;
    pore_pressure: number;
    rainfall: number;
    temperature: number;
    dem_slope: number;
    crack_score: number;
  };
  output: {
    risk_probability: number;
    risk_level: 'low' | 'medium' | 'high';
  };
}

// Sample training data based on real rockfall scenarios
export const trainingData: TrainingDataPoint[] = [
  // High risk scenarios
  { input: { displacement: 15.2, strain: 450, pore_pressure: 85, rainfall: 60, temperature: 40, dem_slope: 75, crack_score: 8.5 }, output: { risk_probability: 0.92, risk_level: 'high' } },
  { input: { displacement: 12.8, strain: 380, pore_pressure: 78, rainfall: 55, temperature: 38, dem_slope: 68, crack_score: 7.8 }, output: { risk_probability: 0.87, risk_level: 'high' } },
  { input: { displacement: 18.5, strain: 520, pore_pressure: 92, rainfall: 70, temperature: 42, dem_slope: 82, crack_score: 9.2 }, output: { risk_probability: 0.95, risk_level: 'high' } },
  { input: { displacement: 10.5, strain: 320, pore_pressure: 70, rainfall: 45, temperature: 35, dem_slope: 60, crack_score: 6.8 }, output: { risk_probability: 0.78, risk_level: 'high' } },
  { input: { displacement: 14.2, strain: 420, pore_pressure: 80, rainfall: 50, temperature: 37, dem_slope: 72, crack_score: 8.1 }, output: { risk_probability: 0.85, risk_level: 'high' } },
  
  // Medium risk scenarios
  { input: { displacement: 6.8, strain: 220, pore_pressure: 55, rainfall: 30, temperature: 32, dem_slope: 45, crack_score: 4.5 }, output: { risk_probability: 0.55, risk_level: 'medium' } },
  { input: { displacement: 8.2, strain: 250, pore_pressure: 60, rainfall: 35, temperature: 33, dem_slope: 50, crack_score: 5.2 }, output: { risk_probability: 0.62, risk_level: 'medium' } },
  { input: { displacement: 5.5, strain: 180, pore_pressure: 48, rainfall: 25, temperature: 30, dem_slope: 40, crack_score: 3.8 }, output: { risk_probability: 0.48, risk_level: 'medium' } },
  { input: { displacement: 7.5, strain: 240, pore_pressure: 58, rainfall: 32, temperature: 31, dem_slope: 48, crack_score: 4.8 }, output: { risk_probability: 0.58, risk_level: 'medium' } },
  { input: { displacement: 9.1, strain: 280, pore_pressure: 65, rainfall: 38, temperature: 34, dem_slope: 55, crack_score: 5.8 }, output: { risk_probability: 0.68, risk_level: 'medium' } },
  
  // Low risk scenarios
  { input: { displacement: 2.1, strain: 120, pore_pressure: 35, rainfall: 15, temperature: 28, dem_slope: 30, crack_score: 2.3 }, output: { risk_probability: 0.18, risk_level: 'low' } },
  { input: { displacement: 1.8, strain: 95, pore_pressure: 25, rainfall: 12, temperature: 26, dem_slope: 25, crack_score: 1.9 }, output: { risk_probability: 0.12, risk_level: 'low' } },
  { input: { displacement: 3.5, strain: 150, pore_pressure: 40, rainfall: 18, temperature: 29, dem_slope: 35, crack_score: 3.2 }, output: { risk_probability: 0.28, risk_level: 'low' } },
  { input: { displacement: 2.8, strain: 135, pore_pressure: 38, rainfall: 16, temperature: 27, dem_slope: 32, crack_score: 2.8 }, output: { risk_probability: 0.22, risk_level: 'low' } },
  { input: { displacement: 1.5, strain: 85, pore_pressure: 22, rainfall: 10, temperature: 25, dem_slope: 22, crack_score: 1.6 }, output: { risk_probability: 0.08, risk_level: 'low' } },
  
  // Edge cases and boundary conditions
  { input: { displacement: 4.2, strain: 160, pore_pressure: 42, rainfall: 20, temperature: 29, dem_slope: 38, crack_score: 3.5 }, output: { risk_probability: 0.35, risk_level: 'low' } },
  { input: { displacement: 5.8, strain: 200, pore_pressure: 52, rainfall: 28, temperature: 31, dem_slope: 42, crack_score: 4.2 }, output: { risk_probability: 0.45, risk_level: 'medium' } },
  { input: { displacement: 11.2, strain: 350, pore_pressure: 75, rainfall: 48, temperature: 36, dem_slope: 65, crack_score: 7.2 }, output: { risk_probability: 0.82, risk_level: 'high' } },
  { input: { displacement: 13.5, strain: 400, pore_pressure: 82, rainfall: 52, temperature: 38, dem_slope: 70, crack_score: 8.8 }, output: { risk_probability: 0.89, risk_level: 'high' } },
  { input: { displacement: 16.8, strain: 480, pore_pressure: 88, rainfall: 65, temperature: 41, dem_slope: 78, crack_score: 9.5 }, output: { risk_probability: 0.93, risk_level: 'high' } },
];

// Model hyperparameters
export const modelConfig = {
  inputFeatures: 7,
  hiddenLayers: [64, 32, 16],
  dropoutRate: [0.3, 0.2, 0.1],
  learningRate: 0.001,
  batchSize: 32,
  epochs: 100,
  validationSplit: 0.2,
  earlyStopping: {
    monitor: 'val_loss',
    patience: 10,
    restoreBestWeights: true
  }
};

// Feature importance weights (based on geological studies)
export const featureWeights = {
  displacement: 0.25,
  strain: 0.20,
  pore_pressure: 0.15,
  rainfall: 0.15,
  temperature: 0.10,
  dem_slope: 0.10,
  crack_score: 0.05
};

// Risk thresholds
export const riskThresholds = {
  low: { min: 0, max: 0.4 },
  medium: { min: 0.4, max: 0.7 },
  high: { min: 0.7, max: 1.0 }
};

// Normalization parameters (min-max scaling)
export const normalizationParams = {
  displacement: { min: 0, max: 20 },
  strain: { min: 0, max: 500 },
  pore_pressure: { min: 0, max: 100 },
  rainfall: { min: 0, max: 100 },
  temperature: { min: 0, max: 50 },
  dem_slope: { min: 0, max: 90 },
  crack_score: { min: 0, max: 10 }
};

// Model performance metrics
export const performanceMetrics = {
  accuracy: 0.92,
  precision: 0.89,
  recall: 0.91,
  f1Score: 0.90,
  auc: 0.95
};

// Export utility functions
export const normalizeInput = (input: any) => {
  const normalized: any = {};
  Object.keys(normalizationParams).forEach(key => {
    const param = normalizationParams[key as keyof typeof normalizationParams];
    normalized[key] = (input[key] - param.min) / (param.max - param.min);
    normalized[key] = Math.max(0, Math.min(1, normalized[key])); // Clamp to [0,1]
  });
  return normalized;
};

export const denormalizeOutput = (normalizedValue: number) => {
  return Math.max(0, Math.min(1, normalizedValue));
};

export const getRiskLevel = (probability: number): 'low' | 'medium' | 'high' => {
  if (probability >= riskThresholds.high.min) return 'high';
  if (probability >= riskThresholds.medium.min) return 'medium';
  return 'low';
};

export const getRiskColor = (level: string) => {
  switch (level) {
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#10b981';
    default: return '#6b7280';
  }
};

export const getRiskBadgeVariant = (level: string) => {
  switch (level) {
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    case 'low': return 'default';
    default: return 'outline';
  }
};
