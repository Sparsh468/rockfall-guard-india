import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SensorReading {
  id?: string;
  mine_id: string;
  displacement: number;
  strain: number;
  pore_pressure: number;
  rainfall: number;
  temperature: number;
  dem_slope: number;
  crack_score: number;
  timestamp: string;
}

interface UseSensorDataOptions {
  mode: 'simulated' | 'live';
  updateInterval?: number; // seconds
  mineId?: string;
}

export const useSensorData = (options: UseSensorDataOptions) => {
  const { mode, updateInterval = 5, mineId } = options;
  const [sensorData, setSensorData] = useState<SensorReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [currentReading, setCurrentReading] = useState<SensorReading | null>(null);

  // Generate realistic sensor data
  const generateSensorReading = useCallback((baseValues?: Partial<SensorReading>): SensorReading => {
    const now = new Date().toISOString();
    
    // Mine-specific base values to create unique patterns per mine
    const mineSpecificFactors = mineId ? {
      displacement: (parseInt(mineId.slice(-4), 16) % 10) / 5, // 0-2 range
      strain: (parseInt(mineId.slice(-6, -2), 16) % 100) + 100, // 100-200 range
      porePressure: (parseInt(mineId.slice(-8, -4), 16) % 40) + 30, // 30-70 range
      rainfall: (parseInt(mineId.slice(-10, -6), 16) % 20) + 2, // 2-22 range
      temperature: (parseInt(mineId.slice(-12, -8), 16) % 15) + 18, // 18-33 range
      slope: (parseInt(mineId.slice(-14, -10), 16) % 20) + 10, // 10-30 range
      crackScore: (parseInt(mineId.slice(-16, -12), 16) % 5) + 2 // 2-7 range
    } : {
      displacement: 2.5, strain: 150, porePressure: 45, rainfall: 5, 
      temperature: 24, slope: 15.5, crackScore: 3
    };
    
    // Base realistic values with mine-specific variation
    const baseDisplacement = baseValues?.displacement || mineSpecificFactors.displacement;
    const baseStrain = baseValues?.strain || mineSpecificFactors.strain;
    const basePorePressure = baseValues?.pore_pressure || mineSpecificFactors.porePressure;
    const baseRainfall = baseValues?.rainfall || mineSpecificFactors.rainfall;
    const baseTemperature = baseValues?.temperature || mineSpecificFactors.temperature;
    const baseSlope = baseValues?.dem_slope || mineSpecificFactors.slope;
    const baseCrackScore = baseValues?.crack_score || mineSpecificFactors.crackScore;

    return {
      mine_id: mineId || 'default-mine',
      displacement: Math.max(0, baseDisplacement + (Math.random() - 0.5) * 0.8),
      strain: Math.max(0, baseStrain + (Math.random() - 0.5) * 30),
      pore_pressure: Math.max(0, basePorePressure + (Math.random() - 0.5) * 8),
      rainfall: Math.max(0, baseRainfall + (Math.random() - 0.3) * 15),
      temperature: baseTemperature + (Math.random() - 0.5) * 4,
      dem_slope: Math.max(0, baseSlope + (Math.random() - 0.5) * 0.5),
      crack_score: Math.max(0, Math.min(10, baseCrackScore + (Math.random() - 0.5) * 2)),
      timestamp: now,
    };
  }, [mineId]);

  // Calculate risk score based on sensor data
  const calculateRiskScore = useCallback((reading: SensorReading): number => {
    let riskScore = 0;
    
    // Displacement risk (0-30 points)
    if (reading.displacement > 8) riskScore += 30;
    else if (reading.displacement > 5) riskScore += 20;
    else if (reading.displacement > 3) riskScore += 10;
    
    // Strain risk (0-25 points)
    if (reading.strain > 300) riskScore += 25;
    else if (reading.strain > 200) riskScore += 15;
    else if (reading.strain > 150) riskScore += 8;
    
    // Pore pressure risk (0-20 points)
    if (reading.pore_pressure > 80) riskScore += 20;
    else if (reading.pore_pressure > 60) riskScore += 12;
    else if (reading.pore_pressure > 45) riskScore += 6;
    
    // Rainfall risk (0-15 points)
    if (reading.rainfall > 50) riskScore += 15;
    else if (reading.rainfall > 25) riskScore += 10;
    else if (reading.rainfall > 10) riskScore += 5;
    
    // Crack score risk (0-10 points)
    riskScore += reading.crack_score;
    
    return Math.min(100, riskScore) / 100; // Convert to 0-1 scale
  }, []);

  // Fetch live sensor data from Supabase
  const fetchLiveSensorData = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('sensor_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);
      
      // Filter by mine if specified
      if (mineId) {
        query = query.eq('mine_id', mineId);
      }
      
      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        setSensorData(data);
        setCurrentReading(data[0]);
        setLastUpdate(new Date());
      } else {
        // No live data available, generate initial simulated data
        generateSimulatedData();
        toast({
          title: "No Live Data Available",
          description: `No sensor data found for ${mineId ? 'selected mine' : 'any mine'}. Generated simulated data.`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error fetching live sensor data:', error);
      toast({
        title: "Live Data Error",
        description: "Unable to fetch live sensor data. Using simulated data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [mineId]);

  // Generate simulated data
  const generateSimulatedData = useCallback(() => {
    setIsLoading(true);
    
    // Generate historical data (last 24 hours)
    const historicalData: SensorReading[] = [];
    const now = new Date();
    
    for (let i = 24; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      const reading = generateSensorReading();
      reading.timestamp = timestamp.toISOString();
      historicalData.push(reading);
    }
    
    setSensorData(historicalData);
    setCurrentReading(historicalData[historicalData.length - 1]);
    setLastUpdate(new Date());
    setIsLoading(false);
  }, [generateSensorReading]);

  // Update sensor data
  const updateSensorData = useCallback(async () => {
    if (mode === 'live') {
      await fetchLiveSensorData();
    } else {
      // Generate new simulated reading
      const lastReading = sensorData[sensorData.length - 1];
      const newReading = generateSensorReading(lastReading);
      
      setSensorData(prev => {
        const updated = [...prev.slice(-49), newReading]; // Keep last 50 readings
        return updated;
      });
      setCurrentReading(newReading);
      setLastUpdate(new Date());
      
      // Store simulated data in database for consistency
      try {
        const { error } = await supabase
          .from('sensor_data')
          .insert(newReading);
        
        if (error && !error.message.includes('duplicate')) {
          console.error('Error storing sensor data:', error);
        }
      } catch (error) {
        // Silent fail for simulated data storage
      }
    }
  }, [mode, sensorData, generateSensorReading, fetchLiveSensorData]);

  // Initialize data
  useEffect(() => {
    if (mode === 'live') {
      fetchLiveSensorData();
    } else {
      generateSimulatedData();
    }
  }, [mode, fetchLiveSensorData, generateSimulatedData]);

  // Set up real-time updates
  useEffect(() => {
    if (mode === 'simulated') {
      const interval = setInterval(() => {
        updateSensorData();
        toast({
          title: "Sensor Update",
          description: "New sensor readings available",
        });
      }, updateInterval * 1000);

      return () => clearInterval(interval);
    } else {
      // Set up Supabase real-time subscription for live mode
      const channel = supabase
        .channel('sensor_data_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'sensor_data',
            filter: mineId ? `mine_id=eq.${mineId}` : undefined
          },
          (payload) => {
            const newReading = payload.new as SensorReading;
            // Only update if it's for the correct mine (when mineId is specified)
            if (!mineId || newReading.mine_id === mineId) {
              setSensorData(prev => [...prev.slice(-49), newReading]);
              setCurrentReading(newReading);
              setLastUpdate(new Date());
              toast({
                title: "Live IoT Data Update",
                description: `New readings from ${mineId ? 'selected mine' : 'network'}`,
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [mode, updateInterval, updateSensorData]);

  return {
    sensorData,
    currentReading,
    isLoading,
    lastUpdate,
    riskScore: currentReading ? calculateRiskScore(currentReading) : 0,
    updateSensorData,
    generateSensorReading,
  };
};