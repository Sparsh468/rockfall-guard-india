import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Activity, RefreshCw, MapPin, Clock, TrendingUp, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Mine {
  id: number;
  name: string;
  state: string;
  risk: string;
  x: number;
  y: number;
  incidents: number;
  lastUpdate: string;
  riskProbability?: number;
  isActive?: boolean;
}

interface InteractiveIndiaMapProps {
  mineLocations: Mine[];
  onMineClick?: (mine: Mine) => void;
  showRealTimeUpdates?: boolean;
}

const InteractiveIndiaMap: React.FC<InteractiveIndiaMapProps> = ({ 
  mineLocations, 
  onMineClick,
  showRealTimeUpdates = true 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedMine, setSelectedMine] = useState<Mine | null>(null);
  const [mapData, setMapData] = useState<Mine[]>([]);
  const [realTimeStatus, setRealTimeStatus] = useState<'active' | 'warning' | 'critical'>('active');

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-danger shadow-[0_0_20px_hsl(var(--danger)/0.5)]';
      case 'medium': return 'bg-warning shadow-[0_0_20px_hsl(var(--warning)/0.5)]';
      case 'low': return 'bg-safe shadow-[0_0_20px_hsl(var(--safe)/0.5)]';
      default: return 'bg-muted';
    }
  };

  const getRiskBadgeVariant = (risk: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  // Simulate real-time updates
  const updateMineData = useCallback(() => {
    setMapData(prevMines => 
      prevMines.map(mine => {
        const riskChange = (Math.random() - 0.5) * 0.1;
        const newRiskProbability = Math.max(0.1, Math.min(0.95, 
          (mine.riskProbability || (mine.risk === 'high' ? 0.8 : mine.risk === 'medium' ? 0.6 : 0.3)) + riskChange
        ));
        
        const newIncidents = Math.max(0, mine.incidents + (Math.random() > 0.95 ? 1 : 0));
        
        return {
          ...mine,
          riskProbability: newRiskProbability,
          incidents: newIncidents,
          lastUpdate: new Date().toLocaleTimeString(),
          isActive: Math.random() > 0.1 // 90% chance of being active
        };
      })
    );
    setLastUpdate(new Date());
    
    // Update real-time status based on high-risk mines
    const highRiskMines = mapData.filter(mine => mine.risk === 'high' && (mine.riskProbability || 0.8) > 0.8);
    if (highRiskMines.length > 2) {
      setRealTimeStatus('critical');
    } else if (highRiskMines.length > 0) {
      setRealTimeStatus('warning');
    } else {
      setRealTimeStatus('active');
    }
  }, [mapData]);

  // Initialize data
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapData(mineLocations.map(mine => ({
        ...mine,
        riskProbability: mine.risk === 'high' ? 0.8 : mine.risk === 'medium' ? 0.6 : 0.3,
        isActive: true
      })));
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [mineLocations]);

  // Set up real-time updates
  useEffect(() => {
    if (!showRealTimeUpdates) return;

    const interval = setInterval(() => {
      updateMineData();
    }, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, [showRealTimeUpdates, updateMineData]);

  const handleMineClick = (mine: Mine) => {
    setSelectedMine(mine);
    onMineClick?.(mine);
    toast({
      title: "Mine Selected",
      description: `${mine.name} - ${mine.risk.toUpperCase()} Risk (${Math.round((mine.riskProbability || 0.6) * 100)}%)`,
    });
  };

  const handleRefresh = () => {
    setIsLoading(true);
    updateMineData();
    toast({
      title: "Map Refreshed",
      description: "Real-time data updated",
    });
    setTimeout(() => setIsLoading(false), 1000);
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-[500px] bg-secondary/30 rounded-lg flex flex-col items-center justify-center space-y-4 border border-border">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Loading real-time interactive map...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] bg-monitoring-bg rounded-lg overflow-hidden">
      {/* Real-time Status Banner */}
      <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg z-10">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            realTimeStatus === 'critical' ? 'bg-danger' : 
            realTimeStatus === 'warning' ? 'bg-warning' : 'bg-primary'
          }`} />
          <span className="text-sm font-medium">
            {realTimeStatus === 'critical' ? 'Critical Alert' : 
             realTimeStatus === 'warning' ? 'Warning Active' : 'Live Monitoring'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Last update: {lastUpdate.toLocaleTimeString()}
        </p>
      </div>

      {/* Interactive India Map SVG */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ background: 'linear-gradient(45deg, hsl(var(--monitoring-bg)), hsl(var(--card)))' }}
      >
        {/* India outline - more detailed */}
        <path
          d="M 15 25 Q 25 20 35 25 Q 45 22 55 26 Q 65 28 70 32 Q 75 36 78 42 Q 82 48 85 55 Q 87 62 85 68 Q 82 74 78 78 Q 72 82 65 84 Q 55 86 45 84 Q 35 82 25 80 Q 18 75 15 68 Q 12 60 15 52 Q 13 44 15 36 Z"
          fill="hsl(var(--secondary))"
          stroke="hsl(var(--border))"
          strokeWidth="0.3"
          opacity="0.8"
        />
        
        {/* State boundaries */}
        <g stroke="hsl(var(--border))" strokeWidth="0.15" fill="none" opacity="0.2">
          <path d="M 20 30 Q 30 25 40 30 Q 50 35 60 40" />
          <path d="M 25 45 Q 35 40 45 45 Q 55 50 65 55" />
          <path d="M 20 60 Q 30 55 40 60 Q 50 65 60 70" />
          <path d="M 30 20 Q 40 15 50 20" />
          <path d="M 35 75 Q 45 70 55 75" />
        </g>

        {/* Mine locations with real-time updates */}
        {mapData.map((mine) => {
          const isHighRisk = mine.risk === 'high' && (mine.riskProbability || 0.8) > 0.7;
          const isActive = mine.isActive;
          
          return (
            <g key={mine.id}>
              {/* Risk pulse ring for high risk mines */}
              {isHighRisk && (
                <circle
                  cx={mine.x}
                  cy={mine.y}
                  r="6"
                  fill="none"
                  stroke="hsl(var(--danger))"
                  strokeWidth="0.3"
                  opacity="0.6"
                  className="animate-ping"
                />
              )}
              
              {/* Activity indicator */}
              {isActive && (
                <circle
                  cx={mine.x + 3}
                  cy={mine.y - 3}
                  r="1"
                  fill="hsl(var(--primary))"
                  className="animate-pulse"
                />
              )}
              
              {/* Main mine marker */}
              <circle
                cx={mine.x}
                cy={mine.y}
                r="2"
                className={`${getRiskColor(mine.risk)} transition-all duration-300 hover:r-3 cursor-pointer`}
                style={{ 
                  filter: `drop-shadow(0 0 8px hsl(var(--${mine.risk === 'high' ? 'danger' : mine.risk === 'medium' ? 'warning' : 'safe'})))`
                }}
                onClick={() => handleMineClick(mine)}
              />
              
              {/* Risk indicator for high risk */}
              {isHighRisk && (
                <text
                  x={mine.x + 3}
                  y={mine.y - 3}
                  fontSize="1.5"
                  fill="hsl(var(--danger))"
                  className="font-bold"
                >
                  !
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Real-time Mine Information Panel */}
      <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg z-10 max-w-[280px]">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">Live Mine Status</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
        <div className="space-y-1 max-h-[200px] overflow-y-auto">
          {mapData.slice(0, 5).map((mine) => (
            <div 
              key={mine.id} 
              className="p-2 bg-secondary/30 rounded cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => handleMineClick(mine)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getRiskColor(mine.risk)} ${mine.isActive ? 'animate-pulse' : ''}`} />
                  <span className="text-xs font-medium truncate">{mine.name}</span>
                </div>
                <Badge variant={getRiskBadgeVariant(mine.risk)} className="text-xs">
                  {Math.round((mine.riskProbability || 0.6) * 100)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">{mine.state}</p>
                <div className="flex items-center space-x-1">
                  <div className={`w-1 h-1 rounded-full ${mine.isActive ? 'bg-primary' : 'bg-muted'}`} />
                  <span className="text-xs text-muted-foreground">
                    {mine.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Mine Details */}
      {selectedMine && (
        <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg z-10 max-w-[300px]">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">{selectedMine.name}</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMine(null)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-muted-foreground">{selectedMine.state}</p>
            <div className="flex items-center justify-between">
              <span>Risk Level:</span>
              <Badge variant={getRiskBadgeVariant(selectedMine.risk)} className="text-xs">
                {selectedMine.risk.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Risk Probability:</span>
              <span className="font-medium">{Math.round((selectedMine.riskProbability || 0.6) * 100)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Incidents:</span>
              <span className="font-medium">{selectedMine.incidents}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status:</span>
              <div className="flex items-center space-x-1">
                <div className={`w-1 h-1 rounded-full ${selectedMine.isActive ? 'bg-primary' : 'bg-muted'}`} />
                <span className="text-xs">{selectedMine.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
            <p className="text-muted-foreground mt-2">
              Updated: {selectedMine.lastUpdate}
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Map Legend */}
      <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg z-10">
        <h4 className="text-sm font-medium mb-2">Live Status</h4>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-danger rounded-full" />
            <span className="text-xs">High Risk</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-warning rounded-full" />
            <span className="text-xs">Medium Risk</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-safe rounded-full" />
            <span className="text-xs">Low Risk</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Active Mines:</span>
            <span className="font-medium text-primary">
              {mapData.filter(m => m.isActive).length}/{mapData.length}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">High Risk:</span>
            <span className="font-medium text-red-600">
              {mapData.filter(m => m.risk === 'high' && (m.riskProbability || 0.8) > 0.7).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveIndiaMap;
