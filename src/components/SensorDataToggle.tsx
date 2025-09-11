import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Zap, 
  Activity, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Settings,
  Clock,
  Signal
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SensorDataToggleProps {
  mode: 'simulated' | 'live';
  onModeChange: (mode: 'simulated' | 'live') => void;
  isConnected: boolean;
  lastUpdate: Date | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  mineId?: string;
}

const SensorDataToggle = ({
  mode,
  onModeChange,
  isConnected,
  lastUpdate,
  onRefresh,
  isRefreshing,
  mineId
}: SensorDataToggleProps) => {
  const [isToggling, setIsToggling] = useState(false);

  const handleModeToggle = async (checked: boolean) => {
    setIsToggling(true);
    const newMode = checked ? 'live' : 'simulated';
    
    // Simulate connection attempt for live mode
    if (newMode === 'live') {
      toast({
        title: "Connecting to IoT Network",
        description: "Attempting to establish connection with sensor network...",
      });
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, randomly fail sometimes to show fallback
      const connectionSuccess = Math.random() > 0.3;
      
      if (connectionSuccess) {
        toast({
          title: "Live Mode Activated",
          description: "Successfully connected to IoT sensor network",
        });
        onModeChange('live');
      } else {
        toast({
          title: "Connection Failed",
          description: "Unable to connect to IoT network. Using simulated data.",
          variant: "destructive",
        });
        onModeChange('simulated');
      }
    } else {
      toast({
        title: "Simulation Mode Activated",
        description: "Using generated sensor data for demonstration",
      });
      onModeChange('simulated');
    }
    
    setIsToggling(false);
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-card to-secondary/20 border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {mode === 'live' ? (
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <Signal className="w-5 h-5 text-safe animate-pulse" />
                ) : (
                  <WifiOff className="w-5 h-5 text-danger" />
                )}
                <span className="font-medium">IoT Network</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-primary animate-pulse" />
                <span className="font-medium">Simulated Data</span>
              </div>
            )}
          </div>

          <Badge 
            variant={mode === 'live' && isConnected ? 'default' : 'secondary'}
            className={mode === 'live' && isConnected ? 'bg-safe text-safe-foreground animate-pulse' : ''}
          >
            {mode === 'live' ? (isConnected ? 'LIVE' : 'OFFLINE') : 'DEMO'}
          </Badge>
        </div>

        <div className="flex items-center space-x-4">
          {lastUpdate && (
            <div className="text-sm text-muted-foreground flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <Switch
                checked={mode === 'live'}
                onCheckedChange={handleModeToggle}
                disabled={isToggling}
              />
              <Wifi className="w-4 h-4 text-muted-foreground" />
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-3 text-sm text-muted-foreground">
        {mode === 'live' ? (
          isConnected ? (
            mineId ? 
              `Receiving real-time data from IoT sensors at mine ${mineId.slice(0, 8)}...` :
              "Receiving real-time data from IoT sensors deployed at mining sites"
          ) : (
            "IoT connection unavailable. Check network connectivity or sensor status."
          )
        ) : (
          mineId ?
            `Using simulated sensor data for mine ${mineId.slice(0, 8)}... with unique characteristics` :
            "Using simulated sensor data with realistic fluctuations for demonstration"
        )}
      </div>
    </Card>
  );
};

export default SensorDataToggle;