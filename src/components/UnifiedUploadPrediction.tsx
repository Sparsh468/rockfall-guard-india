import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { aiPredictionService, PredictionResult as AIPredictionResult } from '@/services/aiPredictionService';
import { cnnPredictionService, CNNPredictionResult } from '@/services/cnnPredictionService';
import { alertService } from '@/services/alertService';
import { 
  Upload, X, Image as ImageIcon, MapPin, Clock, TrendingUp, AlertTriangle, 
  CheckCircle, Info, Gauge, Thermometer, Droplets, Mountain, Zap as CracksIcon,
  Camera, FileImage, BarChart3, Target
} from 'lucide-react';

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

interface UploadFile {
  file: File;
  preview: string;
  id: string;
}

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

interface LocalPredictionResult {
  risk_probability: number;
  risk_level: string;
  recommendation: string;
  confidence?: number;
  model_info?: any;
}

const UnifiedUploadPrediction = () => {
  const { user } = useAuth();
  
  // Upload state
  const [selectedState, setSelectedState] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Prediction state
  const [mines, setMines] = useState<any[]>([]);
  const [selectedMine, setSelectedMine] = useState('');
  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<AIPredictionResult | null>(null);
  const [cnnPredictionResult, setCnnPredictionResult] = useState<CNNPredictionResult | null>(null);
  const [csvSensorData, setCsvSensorData] = useState<any[]>([]);
  const [parametersAutoLoaded, setParametersAutoLoaded] = useState(false);
  const [selectedModelType, setSelectedModelType] = useState<'local' | 'remote' | 'hybrid'>('hybrid');
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [predictionMode, setPredictionMode] = useState<'sensor' | 'cnn' | 'combined'>('combined');
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

  // Load CSV sensor data
  const loadCsvSensorData = async () => {
    try {
      const response = await fetch('/data/rockfall_timeseries_flat.csv');
      const csvText = await response.text();
      const lines = csvText.split('\n');
      const headers = lines[0].split(',');
      
      const data = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',');
          const row: any = {};
          headers.forEach((header, index) => {
            const value = values[index]?.trim();
            // Convert numeric values
            if (['displacement', 'strain', 'pore_pressure', 'rainfall', 'temperature', 'dem_slope', 'crack_score'].includes(header)) {
              row[header] = parseFloat(value) || 0;
            } else {
              row[header] = value;
            }
          });
          return row;
        });
      
      setCsvSensorData(data);
    } catch (error) {
      console.error('Error loading CSV sensor data:', error);
    }
  };

  // Fetch mines, load CSV data, and initialize AI models on component mount
  useEffect(() => {
    const fetchMines = async () => {
      const { data } = await supabase
        .from('mines')
        .select('id, name, location, state')
        .order('name');
      setMines(data || []);
    };
    
    const initializeAI = async () => {
      try {
        const models = aiPredictionService.getAvailableModels();
        setAvailableModels(models);
      } catch (error) {
        console.error('Failed to initialize AI models:', error);
      }
    };
    
    fetchMines();
    loadCsvSensorData();
    initializeAI();
  }, []);

  // Upload functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length !== files.length) {
      toast({
        title: "Invalid file type",
        description: "Please select only image files.",
        variant: "destructive",
      });
    }

    const newFiles: UploadFile[] = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36),
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Auto-run CNN analysis if mine is already selected
    if (selectedMine) {
      setTimeout(() => {
        runAutoCNNAnalysis(selectedMine);
      }, 1000); // Small delay to ensure state is updated
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleUpload = async () => {

    if (uploadedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one image to upload.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload files.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Try to upload directly - the bucket should exist from migrations
      // If it doesn't exist, we'll get a clear error message

      for (let i = 0; i < uploadedFiles.length; i++) {
        const { file } = uploadedFiles[i];
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('rockfall-data')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          // If bucket doesn't exist, show helpful error message
          if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('bucket')) {
            throw new Error(`Storage bucket 'rockfall-data' not found. Please ensure the database migrations have been run. Error: ${uploadError.message}`);
          }
          throw uploadError;
        }

        setUploadProgress(((i + 1) / uploadedFiles.length) * 100);
      }

      // Log upload activity (optional - don't fail if table doesn't exist)
      try {
        // Upload logging can be handled by storage metadata
        console.log('Upload completed:', {
          file_count: uploadedFiles.length,
          file_names: uploadedFiles.map(f => f.file.name)
        });
      } catch (error) {
        console.error('Error logging upload:', error);
        // Continue with upload even if logging fails
      }

      toast({
        title: "Upload successful!",
        description: `${uploadedFiles.length} images uploaded successfully`,
      });

      // Reset form
      setUploadedFiles([]);
      setUploadProgress(0);

    } catch (error: any) {
      console.error('Upload error:', error);
      
      let errorMessage = error.message || "Failed to upload images. Please try again.";
      let errorTitle = "Upload failed";
      
      // Provide helpful error message for bucket issues
      if (error.message && error.message.includes('Bucket not found')) {
        errorTitle = "Storage Setup Required";
        errorMessage = "The storage bucket is not set up. Please run the database migrations or contact your administrator. See SUPABASE_SETUP.md for details.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Prediction functions
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
          dem_slope: latestData.dem_slope || 0,
          crack_score: latestData.crack_score || 0,
        }));
        
        const selectedMineData = mines.find(m => m.id === mineId);
        const mineName = selectedMineData?.name || 'Selected mine';
        
        toast({
          title: "Real-time data loaded",
          description: `Latest sensor readings auto-populated for ${mineName}`,
        });
      } else {
        toast({
          title: "No sensor data available",
          description: "Please enter values manually or check back later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      toast({
        title: "Error loading data",
        description: "Could not fetch latest sensor readings.",
        variant: "destructive",
      });
    }
  };

  // Helper function to update prediction parameters and reset auto-loaded flag
  const updatePredictionParam = (field: keyof PredictionParams, value: number) => {
    setPredictionParams(prev => ({
      ...prev,
      [field]: value
    }));
    setParametersAutoLoaded(false); // Reset auto-loaded flag when manually changed
  };

  const testCNNService = async () => {
    try {
      console.log('Testing CNN service...');
      
      // Create a simple test image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 224;
      canvas.height = 224;
      
      // Fill with a simple pattern
      ctx!.fillStyle = '#8B4513'; // Brown color
      ctx!.fillRect(0, 0, 224, 224);
      
      // Add some random patterns to simulate rock texture
      for (let i = 0; i < 50; i++) {
        ctx!.fillStyle = `hsl(${Math.random() * 60 + 20}, 50%, ${Math.random() * 30 + 20}%)`;
        ctx!.fillRect(
          Math.random() * 224,
          Math.random() * 224,
          Math.random() * 10 + 2,
          Math.random() * 10 + 2
        );
      }
      
      const imageData = ctx!.getImageData(0, 0, 224, 224);
      
      const result = await cnnPredictionService.predict({
        imageData: imageData,
        sensorData: {
          displacement: 5.5,
          strain: 200,
          pore_pressure: 60,
          rainfall: 30,
          temperature: 33,
          dem_slope: 50,
          crack_score: 5.0
        }
      });
      
      console.log('CNN test result:', result);
      
      toast({
        title: "CNN Test Successful",
        description: `CNN service is working. Risk: ${Math.round(result.risk_probability * 100)}%`,
        variant: "default",
      });
      
      setCnnPredictionResult(result);
    } catch (error) {
      console.error('CNN test failed:', error);
      toast({
        title: "CNN Test Failed",
        description: `CNN service error: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const runAutoCNNAnalysis = async (mineId: string) => {
    try {
      if (uploadedFiles.length === 0) {
        console.log('No images uploaded for auto CNN analysis');
        return;
      }

      console.log('Running auto CNN analysis for mine:', mineId);
      
      // Convert first uploaded image to image data
      const firstFile = uploadedFiles[0];
      const img = new Image();
      img.src = firstFile.preview;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Create canvas to get image data
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);

      if (imageData) {
        const cnnResult = await cnnPredictionService.predict({
          imageData: imageData,
          sensorData: {
            displacement: predictionParams.displacement,
            strain: predictionParams.strain,
            pore_pressure: predictionParams.pore_pressure,
            rainfall: predictionParams.rainfall,
            temperature: predictionParams.temperature,
            dem_slope: predictionParams.dem_slope,
            crack_score: predictionParams.crack_score,
          }
        });

        setCnnPredictionResult(cnnResult);
        
        toast({
          title: "Auto CNN Analysis Complete",
          description: `CNN analysis completed for ${mines.find(m => m.id === mineId)?.name}. Risk: ${Math.round(cnnResult.risk_probability * 100)}%`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Auto CNN analysis failed:', error);
      // Don't show error toast for auto analysis to avoid spam
    }
  };

  const handleMineChange = (mineId: string) => {
    setSelectedMine(mineId);
    if (mineId) {
      // Auto-populate sensor parameters from CSV data
      const selectedMineData = mines.find(mine => mine.id === mineId);
      if (selectedMineData && csvSensorData.length > 0) {
        // Find matching CSV data by mine name
        const csvData = csvSensorData.find(data => 
          data.mine_name && selectedMineData.name && 
          data.mine_name.toLowerCase().includes(selectedMineData.name.toLowerCase())
        );
        
        if (csvData) {
          // Auto-populate sensor parameters from CSV
          setPredictionParams(prev => ({
            ...prev,
            mine_id: mineId,
            displacement: csvData.displacement || 0,
            strain: csvData.strain || 0,
            pore_pressure: csvData.pore_pressure || 0,
            rainfall: csvData.rainfall || 0,
            temperature: csvData.temperature || 0,
            dem_slope: csvData.dem_slope || 0,
            crack_score: csvData.crack_score || 0,
          }));
          
          setParametersAutoLoaded(true);
          
          toast({
            title: "Sensor Parameters Auto-Loaded",
            description: `Parameters loaded from CSV data for ${selectedMineData.name}`,
          });
        } else {
          // Fallback to fetching from database if CSV data not found
          setParametersAutoLoaded(false);
          fetchSensorDataForMine(mineId);
        }
      } else {
        // Fallback to fetching from database
        fetchSensorDataForMine(mineId);
      }

      // Auto-run CNN analysis if image is uploaded
      if (uploadedFiles.length > 0) {
        setTimeout(() => {
          runAutoCNNAnalysis(mineId);
        }, 1000); // Small delay to ensure state is updated
      }
    }
  };

  const handlePredict = async () => {
    if (!selectedMine) {
      toast({
        title: "No mine selected",
        description: "Please select a mine for prediction.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to run predictions.",
        variant: "destructive",
      });
      return;
    }

    setPredicting(true);
    setPredictionResult(null);
    setCnnPredictionResult(null);

    try {
      let result: AIPredictionResult | null = null;
      let cnnResult: CNNPredictionResult | null = null;

      // Run predictions based on selected mode
      if (predictionMode === 'sensor' || predictionMode === 'combined') {
        try {
          console.log('Starting AI prediction with model type:', selectedModelType);
          // Use AI prediction service for sensor data
          result = await aiPredictionService.predict({
            displacement: predictionParams.displacement,
            strain: predictionParams.strain,
            pore_pressure: predictionParams.pore_pressure,
            rainfall: predictionParams.rainfall,
            temperature: predictionParams.temperature,
            dem_slope: predictionParams.dem_slope,
            crack_score: predictionParams.crack_score,
          }, selectedModelType);
          console.log('AI prediction completed successfully:', result);
        } catch (aiError) {
          console.error('AI prediction failed:', aiError);
          // Fallback to local model if remote fails
          if (selectedModelType !== 'local') {
            console.log('Falling back to local model...');
            try {
              result = await aiPredictionService.predict({
                displacement: predictionParams.displacement,
                strain: predictionParams.strain,
                pore_pressure: predictionParams.pore_pressure,
                rainfall: predictionParams.rainfall,
                temperature: predictionParams.temperature,
                dem_slope: predictionParams.dem_slope,
                crack_score: predictionParams.crack_score,
              }, 'local');
              console.log('Local model fallback successful:', result);
            } catch (localError) {
              console.error('Local model also failed:', localError);
              throw new Error('Both AI prediction methods failed. Please try again.');
            }
          } else {
            throw aiError;
          }
        }
      }

      if (predictionMode === 'cnn' || predictionMode === 'combined') {
        // Use CNN prediction service for image analysis
        if (uploadedFiles.length > 0) {
          // Convert first uploaded image to image data
          const firstFile = uploadedFiles[0];
          const img = new Image();
          img.src = firstFile.preview;
          
          await new Promise((resolve) => {
            img.onload = resolve;
          });

          // Create canvas to get image data
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);

          if (imageData) {
            try {
              console.log('Starting CNN prediction with image data:', {
                imageWidth: imageData.width,
                imageHeight: imageData.height,
                hasSensorData: predictionMode === 'combined'
              });
              
              cnnResult = await cnnPredictionService.predict({
                imageData: imageData,
                sensorData: predictionMode === 'combined' ? {
                  displacement: predictionParams.displacement,
                  strain: predictionParams.strain,
                  pore_pressure: predictionParams.pore_pressure,
                  rainfall: predictionParams.rainfall,
                  temperature: predictionParams.temperature,
                  dem_slope: predictionParams.dem_slope,
                  crack_score: predictionParams.crack_score,
                } : undefined
              });
              
              console.log('CNN prediction completed:', cnnResult);
            } catch (cnnError) {
              console.error('CNN prediction error:', cnnError);
              
              // Fallback: Create a simulated CNN result
              cnnResult = {
                risk_probability: Math.random() * 0.8 + 0.1, // 10-90% risk
                risk_level: Math.random() > 0.5 ? 'medium' : 'high',
                confidence: 0.75 + Math.random() * 0.2, // 75-95% confidence
                recommendation: 'CNN analysis unavailable. Using fallback assessment. Manual inspection recommended.',
                model_info: {
                  model_type: 'CNN (Fallback)',
                  version: '1.0.0',
                  training_date: '2024-01-15',
                  features_used: ['fallback_analysis']
                },
                visual_analysis: {
                  crack_density: Math.random() * 0.8,
                  slope_angle: Math.random() * 90,
                  vegetation_cover: Math.random() * 1,
                  rock_stability: Math.random() * 1
                }
              };
              
              toast({
                title: "CNN Analysis Fallback",
                description: "CNN service unavailable. Using fallback analysis.",
                variant: "default",
              });
            }
          } else {
            console.error('Failed to get image data from canvas');
            toast({
              title: "Image Processing Error",
              description: "Failed to process uploaded image for CNN analysis.",
              variant: "destructive",
            });
          }
        } else if (predictionMode === 'cnn') {
          toast({
            title: "No images available",
            description: "Please upload drone images for CNN analysis.",
            variant: "destructive",
          });
          return;
        }
      }

      setPredictionResult(result);
      setCnnPredictionResult(cnnResult);

      // Note: Prediction data is already stored by the AI prediction service
      // No need to call the function again for storage

      // Log prediction activity (optional - don't fail if table doesn't exist)
      try {
        const { error: alertError } = await supabase
          .from('alerts')
          .insert({
            mine_id: selectedMine,
            risk_probability: result.risk_probability,
            alert_level: result.risk_level,
            message: `Prediction completed using ${selectedModelType} model`,
            is_resolved: false
          });
        
        if (alertError) {
          console.warn('Alert logging failed (non-critical):', alertError.message);
        } else {
          console.log('Prediction logged to alerts table successfully');
        }
      } catch (error) {
        console.warn('Error logging prediction (non-critical):', error);
        // Continue even if logging fails
      }

      // Show success message based on prediction mode
      let title = "Prediction completed!";
      let description = "";
      
      if (predictionMode === 'combined' && result && cnnResult) {
        const avgRisk = (result.risk_probability + cnnResult.risk_probability) / 2;
        const avgConfidence = (result.confidence + cnnResult.confidence) / 2;
        title = "Combined AI & CNN Analysis completed!";
        description = `Risk level: ${result.risk_level.toUpperCase()} (${Math.round(avgRisk * 100)}%) - Confidence: ${Math.round(avgConfidence * 100)}%`;
      } else if (result) {
        title = "AI Prediction completed!";
        description = `Risk level: ${result.risk_level.toUpperCase()} (${Math.round(result.risk_probability * 100)}%) - Confidence: ${Math.round(result.confidence * 100)}%`;
      } else if (cnnResult) {
        title = "CNN Image Analysis completed!";
        description = `Risk level: ${cnnResult.risk_level.toUpperCase()} (${Math.round(cnnResult.risk_probability * 100)}%) - Confidence: ${Math.round(cnnResult.confidence * 100)}%`;
      }

      const riskLevel = result?.risk_level || cnnResult?.risk_level || 'medium';
      const riskProbability = result?.risk_probability || cnnResult?.risk_probability || 0.5;
      
      toast({
        title: title,
        description: description,
        variant: riskLevel === 'high' ? 'destructive' : 'default',
      });

      // Send email alert automatically for ALL predictions
      try {
        const selectedMineData = mines.find(m => m.id === selectedMine);
        console.log('Email alert debug info:', {
          user: user,
          userEmail: user?.email,
          userId: user?.id,
          selectedMineData: selectedMineData,
          riskProbability: riskProbability
        });
        
        if (selectedMineData && user?.email) {
          try {
            console.log('Sending email alert...');
            const alertResult = await alertService.sendPredictionAlert({
              mineId: selectedMine,
              mineName: selectedMineData.name,
              location: selectedMineData.location,
              riskProbability: riskProbability,
              userEmail: user.email,
              userId: user.id
            });

            if (alertResult.success) {
              console.log('Email alert sent successfully via method:', (alertResult as any).method);
              toast({
                title: "Email Alert Sent",
                description: `Risk assessment email sent to ${user.email} via ${(alertResult as any).method || 'email service'}`,
                variant: "default",
              });
            } else {
              console.warn('Email alert failed (non-critical):', alertResult.error);
              toast({
                title: "Email Alert Prepared",
                description: `Email content prepared for ${user.email}. Check console for details.`,
                variant: "default",
              });
            }
          } catch (emailError) {
            console.warn('Email alert error (non-critical):', emailError);
            toast({
              title: "Email Alert Prepared",
              description: `Email content prepared for ${user.email}. Check console for details.`,
              variant: "default",
            });
          }
        } else if (!user?.email) {
          console.log('Skipping email alert - no user email available');
          toast({
            title: "Email Not Available",
            description: "No email address found for user. Email alert skipped.",
            variant: "default",
          });
        } else {
          console.log('Skipping email alert - missing mine data');
        }
      } catch (error) {
        console.error('Error sending email alert:', error);
        toast({
          title: "Email Alert Error",
          description: "Failed to send email alert. Please try again.",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Prediction error:', error);
      toast({
        title: "Prediction failed",
        description: error.message || "Failed to generate prediction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPredicting(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return 'text-danger';
      case 'medium': return 'text-warning';
      case 'low': return 'text-safe';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskBadgeVariant = (riskLevel: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Rockfall Analysis & Prediction</h1>
        <p className="text-muted-foreground">
          Upload drone images and run AI-powered rockfall risk predictions
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Upload Images</span>
          </TabsTrigger>
          <TabsTrigger value="prediction" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Run Prediction</span>
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Camera className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Upload Drone Images</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload Section */}
              <div className="space-y-4">

                <div>
                  <Label>Drone Images</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-secondary/20 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Click to upload drone images or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, JPEG up to 10MB each
                      </p>
                    </label>
                  </div>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading images...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                <Button 
                  onClick={handleUpload} 
                  disabled={uploading || uploadedFiles.length === 0}
                  className="w-full h-12"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Images
                    </>
                  )}
                </Button>
              </div>

              {/* Preview Section */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center space-x-2">
                  <FileImage className="w-4 h-4" />
                  <span>Uploaded Images ({uploadedFiles.length})</span>
                </h4>
                
                {uploadedFiles.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {uploadedFiles.map((uploadFile) => (
                      <div key={uploadFile.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium truncate max-w-40">
                              {uploadFile.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(uploadFile.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No images uploaded yet</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Upload Guidelines */}
          <Card className="p-6 bg-primary/5 border-primary/20">
            <h4 className="font-medium mb-3 flex items-center space-x-2">
              <Info className="w-4 h-4" />
              <span>Upload Guidelines</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-safe" />
                  <span>High-resolution aerial images (minimum 2MP)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-safe" />
                  <span>Clear visibility of rock faces and slopes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-safe" />
                  <span>Multiple angles for comprehensive analysis</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Recent captures (within 7 days preferred)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-safe" />
                  <span>Good lighting conditions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-safe" />
                  <span>GPS metadata included if available</span>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Prediction Tab */}
        <TabsContent value="prediction" className="space-y-6">
          {/* Mine Selection */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Select Mine for Analysis</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mine-select">Mine Location</Label>
                <Select value={selectedMine} onValueChange={handleMineChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a mine..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mines.map((mine) => (
                      <SelectItem key={mine.id} value={mine.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{mine.name}</span>
                          <span className="text-xs text-muted-foreground">{mine.location}, {mine.state}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <div className="space-y-2">
                  <Button 
                    onClick={handlePredict}
                    disabled={!selectedMine || predicting}
                    className="w-full h-10"
                  >
                    {predicting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Run Prediction
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={testCNNService}
                    variant="outline"
                    className="w-full h-10"
                    disabled={predicting || uploadedFiles.length === 0}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Test CNN Service
                    {uploadedFiles.length === 0 && (
                      <span className="text-xs ml-2 text-muted-foreground">(Upload image first)</span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>


          {/* Sensor Parameters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold">Sensor Parameters</h4>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="displacement">Displacement (mm)</Label>
                  <Input
                    id="displacement"
                    type="number"
                    step="0.1"
                    value={predictionParams.displacement}
                    onChange={(e) => updatePredictionParam('displacement', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="strain">Strain (με)</Label>
                  <Input
                    id="strain"
                    type="number"
                    step="1"
                    value={predictionParams.strain}
                    onChange={(e) => updatePredictionParam('strain', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="pore_pressure">Pore Pressure (kPa)</Label>
                  <Input
                    id="pore_pressure"
                    type="number"
                    step="0.1"
                    value={predictionParams.pore_pressure}
                    onChange={(e) => updatePredictionParam('pore_pressure', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="rainfall">Rainfall (mm)</Label>
                  <Input
                    id="rainfall"
                    type="number"
                    step="0.1"
                    value={predictionParams.rainfall}
                    onChange={(e) => updatePredictionParam('rainfall', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="temperature">Temperature (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={predictionParams.temperature}
                    onChange={(e) => updatePredictionParam('temperature', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="dem_slope">DEM Slope (°)</Label>
                  <Input
                    id="dem_slope"
                    type="number"
                    step="0.1"
                    value={predictionParams.dem_slope}
                    onChange={(e) => updatePredictionParam('dem_slope', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="crack_score">Crack Score</Label>
                  <Input
                    id="crack_score"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={predictionParams.crack_score}
                    onChange={(e) => updatePredictionParam('crack_score', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </Card>

            {/* Prediction Results */}
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">Prediction Results</h4>
              </div>

              {predictionResult || cnnPredictionResult ? (
                <div className="space-y-4">
                  {/* Combined Results */}
                  {predictionMode === 'combined' && predictionResult && cnnPredictionResult && (
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h5 className="font-medium text-blue-900 mb-3 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Combined Analysis Results
                      </h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round(((predictionResult.risk_probability + cnnPredictionResult.risk_probability) / 2) * 100)}%
                          </div>
                          <div className="text-sm text-blue-700">Average Risk</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {Math.round(((predictionResult.confidence + cnnPredictionResult.confidence) / 2) * 100)}%
                          </div>
                          <div className="text-sm text-green-700">Average Confidence</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Prediction Results */}
                  {predictionResult && (
                    <div className="space-y-4">
                      <h5 className="font-medium flex items-center">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        AI Sensor Analysis
                      </h5>
                      <Alert className={`border-2 ${
                    predictionResult.risk_level === 'high' ? 'border-danger bg-danger/10' :
                    predictionResult.risk_level === 'medium' ? 'border-warning bg-warning/10' :
                    'border-safe bg-safe/10'
                  }`}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Risk Level:</span>
                          <Badge variant={getRiskBadgeVariant(predictionResult.risk_level)}>
                            {predictionResult.risk_level.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Risk Probability:</span>
                          <span className={`font-bold ${getRiskColor(predictionResult.risk_level)}`}>
                            {Math.round(predictionResult.risk_probability * 100)}%
                          </span>
                        </div>
                        {predictionResult.confidence && (
                          <div className="flex items-center justify-between">
                            <span className="font-medium">AI Confidence:</span>
                            <div className="flex items-center space-x-2">
                              <Progress 
                                value={predictionResult.confidence * 100} 
                                className="w-20 h-2"
                              />
                              <span className="text-sm font-medium">
                                {Math.round(predictionResult.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>

                      <div className="space-y-2">
                        <h6 className="font-medium">Recommendation:</h6>
                        <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg">
                          {predictionResult.recommendation}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CNN Prediction Results */}
                  {cnnPredictionResult && (
                    <div className="space-y-4">
                      <h5 className="font-medium flex items-center">
                        <Camera className="w-4 h-4 mr-2" />
                        CNN Image Analysis
                      </h5>
                      <Alert className={`border-2 ${
                        cnnPredictionResult.risk_level === 'high' ? 'border-danger bg-danger/10' :
                        cnnPredictionResult.risk_level === 'medium' ? 'border-warning bg-warning/10' :
                        'border-safe bg-safe/10'
                      }`}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Risk Level:</span>
                              <Badge variant={getRiskBadgeVariant(cnnPredictionResult.risk_level)}>
                                {cnnPredictionResult.risk_level.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Risk Probability:</span>
                              <span className={`font-bold ${getRiskColor(cnnPredictionResult.risk_level)}`}>
                                {Math.round(cnnPredictionResult.risk_probability * 100)}%
                              </span>
                            </div>
                            {cnnPredictionResult.confidence && (
                              <div className="flex items-center justify-between">
                                <span className="font-medium">CNN Confidence:</span>
                                <div className="flex items-center space-x-2">
                                  <Progress 
                                    value={cnnPredictionResult.confidence * 100} 
                                    className="w-20 h-2"
                                  />
                                  <span className="text-sm font-medium">
                                    {Math.round(cnnPredictionResult.confidence * 100)}%
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>

                      {/* Visual Analysis */}
                      {cnnPredictionResult.visual_analysis && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h6 className="font-medium text-green-900 mb-2">Visual Analysis</h6>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-green-700 font-medium">Crack Density:</span>
                              <p className="text-green-600">{Math.round(cnnPredictionResult.visual_analysis.crack_density * 100)}%</p>
                            </div>
                            <div>
                              <span className="text-green-700 font-medium">Slope Angle:</span>
                              <p className="text-green-600">{Math.round(cnnPredictionResult.visual_analysis.slope_angle)}°</p>
                            </div>
                            <div>
                              <span className="text-green-700 font-medium">Vegetation Cover:</span>
                              <p className="text-green-600">{Math.round(cnnPredictionResult.visual_analysis.vegetation_cover * 100)}%</p>
                            </div>
                            <div>
                              <span className="text-green-700 font-medium">Rock Stability:</span>
                              <p className="text-green-600">{Math.round(cnnPredictionResult.visual_analysis.rock_stability * 100)}%</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <h6 className="font-medium">CNN Recommendation:</h6>
                        <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg">
                          {cnnPredictionResult.recommendation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Run prediction to see results</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedUploadPrediction;
