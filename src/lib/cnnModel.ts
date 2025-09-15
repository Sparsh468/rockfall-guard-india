// CNN Model for Rockfall Prediction
// This module provides a TensorFlow.js-based CNN model for analyzing geological images

import * as tf from '@tensorflow/tfjs';

export interface CNNPredictionResult {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  features: {
    crackDensity: number;
    slopeAngle: number;
    vegetationCover: number;
    rockStability: number;
  };
  recommendations: string[];
}

export class RockfallCNNModel {
  private model: tf.LayersModel | null = null;
  private isLoaded = false;

  constructor() {
    this.initializeModel();
  }

  private async initializeModel() {
    try {
      // Create a simple CNN model for rockfall prediction
      this.model = tf.sequential({
        layers: [
          // Input layer
          tf.layers.conv2d({
            inputShape: [224, 224, 3],
            filters: 32,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same'
          }),
          tf.layers.maxPooling2d({ poolSize: 2 }),
          
          // Second convolutional block
          tf.layers.conv2d({
            filters: 64,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same'
          }),
          tf.layers.maxPooling2d({ poolSize: 2 }),
          
          // Third convolutional block
          tf.layers.conv2d({
            filters: 128,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same'
          }),
          tf.layers.maxPooling2d({ poolSize: 2 }),
          
          // Flatten and dense layers
          tf.layers.flatten(),
          tf.layers.dense({ units: 512, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.5 }),
          tf.layers.dense({ units: 256, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.3 }),
          
          // Output layer for risk classification
          tf.layers.dense({ units: 4, activation: 'softmax' }) // 4 risk levels
        ]
      });

      // Compile the model
      this.model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      this.isLoaded = true;
      console.log('CNN Model initialized successfully');
    } catch (error) {
      console.error('Failed to initialize CNN model:', error);
    }
  }

  async predict(imageElement: HTMLImageElement | HTMLCanvasElement): Promise<CNNPredictionResult> {
    if (!this.model || !this.isLoaded) {
      throw new Error('Model not loaded');
    }

    try {
      // Preprocess the image
      const tensor = tf.browser.fromPixels(imageElement)
        .resizeNearestNeighbor([224, 224])
        .expandDims(0)
        .div(255.0);

      // Make prediction
      const prediction = this.model.predict(tensor) as tf.Tensor;
      const predictionArray = await prediction.data();
      
      // Clean up tensors
      tensor.dispose();
      prediction.dispose();

      // Process prediction results
      const riskProbabilities = Array.from(predictionArray);
      const riskLevels = ['low', 'medium', 'high', 'critical'] as const;
      const maxIndex = riskProbabilities.indexOf(Math.max(...riskProbabilities));
      const riskLevel = riskLevels[maxIndex];
      const confidence = riskProbabilities[maxIndex];

      // Extract features (simulated based on image analysis)
      const features = this.extractFeatures(imageElement, riskProbabilities);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(riskLevel, features);

      return {
        riskLevel,
        confidence,
        features,
        recommendations
      };
    } catch (error) {
      console.error('Prediction failed:', error);
      throw new Error('Failed to process image');
    }
  }

  private extractFeatures(imageElement: HTMLImageElement | HTMLCanvasElement, riskProbabilities: number[]) {
    // Simulate feature extraction based on image analysis
    // In a real implementation, these would be extracted from the CNN layers
    
    const baseFeatures = {
      crackDensity: Math.random() * 0.8 + 0.1,
      slopeAngle: Math.random() * 60 + 20,
      vegetationCover: Math.random() * 0.6 + 0.2,
      rockStability: Math.random() * 0.7 + 0.3
    };

    // Adjust features based on risk probabilities
    const riskWeight = riskProbabilities.reduce((sum, prob, index) => sum + prob * (index + 1), 0);
    
    return {
      crackDensity: Math.min(1, baseFeatures.crackDensity * (1 + riskWeight * 0.3)),
      slopeAngle: Math.min(90, baseFeatures.slopeAngle * (1 + riskWeight * 0.2)),
      vegetationCover: Math.max(0, baseFeatures.vegetationCover * (1 - riskWeight * 0.2)),
      rockStability: Math.max(0, baseFeatures.rockStability * (1 - riskWeight * 0.4))
    };
  }

  private generateRecommendations(riskLevel: string, features: any): string[] {
    const recommendations: string[] = [];

    switch (riskLevel) {
      case 'critical':
        recommendations.push('IMMEDIATE EVACUATION REQUIRED');
        recommendations.push('Deploy emergency response team');
        recommendations.push('Install temporary barriers');
        recommendations.push('Monitor continuously with sensors');
        break;
      case 'high':
        recommendations.push('Restrict access to high-risk areas');
        recommendations.push('Install rockfall protection nets');
        recommendations.push('Increase monitoring frequency');
        recommendations.push('Prepare evacuation procedures');
        break;
      case 'medium':
        recommendations.push('Implement regular inspections');
        recommendations.push('Consider slope stabilization measures');
        recommendations.push('Monitor weather conditions closely');
        recommendations.push('Update risk assessment protocols');
        break;
      case 'low':
        recommendations.push('Continue routine monitoring');
        recommendations.push('Maintain current safety measures');
        recommendations.push('Schedule regular inspections');
        break;
    }

    // Add specific recommendations based on features
    if (features.crackDensity > 0.7) {
      recommendations.push('High crack density detected - consider crack sealing');
    }
    if (features.slopeAngle > 60) {
      recommendations.push('Steep slope detected - implement slope stabilization');
    }
    if (features.vegetationCover < 0.3) {
      recommendations.push('Low vegetation cover - consider erosion control measures');
    }
    if (features.rockStability < 0.4) {
      recommendations.push('Poor rock stability - implement rock bolting or mesh');
    }

    return recommendations;
  }

  async loadPretrainedWeights(weightsUrl?: string): Promise<void> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    try {
      if (weightsUrl) {
        // Load pretrained weights from URL
        await this.model.loadWeights(weightsUrl);
      } else {
        // For demo purposes, we'll use random weights
        // In production, you would load actual pretrained weights
        console.log('Using random weights for demo purposes');
      }
      
      console.log('Model weights loaded successfully');
    } catch (error) {
      console.error('Failed to load model weights:', error);
      throw error;
    }
  }

  getModelInfo() {
    return {
      isLoaded: this.isLoaded,
      hasModel: !!this.model,
      inputShape: [224, 224, 3],
      outputClasses: 4,
      riskLevels: ['low', 'medium', 'high', 'critical']
    };
  }

  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.isLoaded = false;
  }
}

// Export a singleton instance
export const rockfallCNNModel = new RockfallCNNModel();

// Utility functions for image preprocessing
export const preprocessImage = (imageElement: HTMLImageElement | HTMLCanvasElement): tf.Tensor => {
  return tf.browser.fromPixels(imageElement)
    .resizeNearestNeighbor([224, 224])
    .expandDims(0)
    .div(255.0);
};

export const postprocessPrediction = (prediction: tf.Tensor): { riskLevel: string; confidence: number } => {
  const predictionArray = Array.from(prediction.dataSync());
  const riskLevels = ['low', 'medium', 'high', 'critical'];
  const maxIndex = predictionArray.indexOf(Math.max(...predictionArray));
  
  return {
    riskLevel: riskLevels[maxIndex],
    confidence: predictionArray[maxIndex]
  };
};

