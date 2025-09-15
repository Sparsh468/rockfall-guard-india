import { useState, useEffect, useCallback } from 'react';
import { weatherService, WeatherData } from '@/services/weatherService';
import { toast } from '@/hooks/use-toast';

interface UseWeatherDataOptions {
  mineId?: string;
  latitude?: number;
  longitude?: number;
  updateInterval?: number; // minutes
  enabled?: boolean;
}

export const useWeatherData = (options: UseWeatherDataOptions) => {
  const { 
    mineId, 
    latitude, 
    longitude, 
    updateInterval = 15, // 15 minutes default
    enabled = true 
  } = options;

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = useCallback(async () => {
    if (!enabled || !latitude || !longitude) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await weatherService.getWeatherDataForMine(
        mineId || 'unknown',
        latitude,
        longitude
      );
      
      setWeatherData(data);
      setLastUpdate(new Date());
      
      toast({
        title: "Weather Data Updated",
        description: `Temperature: ${data.temperature}°C, Rainfall: ${data.rainfall}mm`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data';
      setError(errorMessage);
      
      toast({
        title: "Weather Update Failed",
        description: "Using cached or default weather data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [mineId, latitude, longitude, enabled]);

  // Initial fetch
  useEffect(() => {
    if (enabled && latitude && longitude) {
      fetchWeatherData();
    }
  }, [fetchWeatherData, enabled, latitude, longitude]);

  // Set up interval for regular updates
  useEffect(() => {
    if (!enabled || !latitude || !longitude) return;

    const interval = setInterval(() => {
      fetchWeatherData();
    }, updateInterval * 60 * 1000); // Convert minutes to milliseconds

    return () => clearInterval(interval);
  }, [fetchWeatherData, updateInterval, enabled, latitude, longitude]);

  return {
    weatherData,
    isLoading,
    lastUpdate,
    error,
    fetchWeatherData,
    refreshWeatherData: fetchWeatherData,
  };
};
