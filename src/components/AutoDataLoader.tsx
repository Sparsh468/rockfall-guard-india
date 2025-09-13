import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Database, RefreshCw, CheckCircle, Zap } from 'lucide-react';

const AutoDataLoader = () => {
  const [loading, setLoading] = useState(false);
  const [dataExists, setDataExists] = useState(false);
  const [mineCount, setMineCount] = useState(0);
  const [sensorCount, setSensorCount] = useState(0);

  const checkDataStatus = async () => {
    try {
      // Check mines
      const { data: mines, error: minesError } = await supabase
        .from('mines')
        .select('id', { count: 'exact', head: true });
      
      // Check sensor data
      const { data: sensorData, error: sensorError } = await supabase
        .from('sensor_data')
        .select('id', { count: 'exact', head: true });

      if (!minesError && !sensorError) {
        setMineCount(mines?.length || 0);
        setSensorCount(sensorData?.length || 0);
        setDataExists((mines?.length || 0) > 0 && (sensorData?.length || 0) > 0);
      }
    } catch (error) {
      console.error('Error checking data status:', error);
    }
  };

  useEffect(() => {
    checkDataStatus();
  }, []);

  const generateInitialData = async () => {
    setLoading(true);
    try {
      toast({
        title: "Initializing System",
        description: "Generating mine data and sensor readings...",
      });

      // Generate mine data and sensor readings
      const { data, error } = await supabase.functions.invoke('generate-mine-data');
      
      if (error) throw error;

      // Start weather sync
      await supabase.functions.invoke('sync-weather-data');

      await checkDataStatus();
      
      toast({
        title: "System Initialized Successfully",
        description: `Generated data for ${data.mines?.length || 8} mines with ${data.total_records || 2400} sensor readings`,
      });

    } catch (error) {
      console.error('Error generating initial data:', error);
      toast({
        title: "Initialization Error",
        description: "Failed to generate initial data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const syncWeatherData = async () => {
    try {
      toast({
        title: "Syncing Weather Data",
        description: "Fetching real-time weather for all mine locations...",
      });

      const { data, error } = await supabase.functions.invoke('sync-weather-data');
      
      if (error) throw error;

      toast({
        title: "Weather Data Synchronized",
        description: `Updated weather data for all active mines`,
      });

    } catch (error) {
      console.error('Error syncing weather:', error);
      toast({
        title: "Weather Sync Error",
        description: "Failed to sync weather data",
        variant: "destructive",
      });
    }
  };

  if (!dataExists) {
    return (
      <Card className="p-8 text-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <Database className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Initialize Rockfall Guard System</h2>
        <p className="text-muted-foreground mb-6">
          Generate synthetic sensor data for all 8 Indian mines to begin monitoring and prediction.
        </p>
        <Button 
          onClick={generateInitialData}
          disabled={loading}
          size="lg"
          className="flex items-center space-x-2"
        >
          <Zap className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Generating Data...' : 'Initialize System'}</span>
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          This will create 300 sensor readings for each mine (2,400 total records)
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-safe/5 to-primary/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-8 h-8 text-safe" />
          <div>
            <h3 className="text-lg font-semibold">System Operational</h3>
            <p className="text-sm text-muted-foreground">
              {mineCount} mines active • {sensorCount} sensor readings available
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={syncWeatherData}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync Weather</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={checkDataStatus}
            className="flex items-center space-x-2"
          >
            <Database className="w-4 h-4" />
            <span>Refresh Status</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AutoDataLoader;