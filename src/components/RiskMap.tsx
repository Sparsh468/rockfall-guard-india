import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Activity, 
  RefreshCw, 
  MapPin, 
  Clock, 
  TrendingUp, 
  Zap,
  Wifi,
  WifiOff,
  Globe,
  Satellite,
  Target,
  Layers,
  Filter,
  Plus,
  Minus,
  Eye,
  EyeOff,
  BarChart3,
  PieChart
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useSensorData } from '@/hooks/useSensorData';
import { useWeatherData } from '@/hooks/useWeatherData';
import { supabase } from '@/integrations/supabase/client';

interface Mine {
  id: string;
  name: string;
  location: string;
  state: string;
  latitude: number;
  longitude: number;
  mine_type: string;
  current_risk_level: string;
  current_risk_probability: number;
  last_updated: string;
  x: number; // Normalized position for map display
  y: number;
  incidents?: number;
  isActive?: boolean;
  realTimeData?: {
    displacement: number;
    strain: number;
    pore_pressure: number;
    rainfall: number;
    temperature: number;
    crack_score: number;
  };
}

interface RiskMapProps {
  onMineClick?: (mine: Mine) => void;
  showRealTimeUpdates?: boolean;
  updateInterval?: number;
  showWeatherData?: boolean;
  showSensorData?: boolean;
  showFilters?: boolean;
}

const RiskMap: React.FC<RiskMapProps> = ({ 
  onMineClick,
  showRealTimeUpdates = true,
  updateInterval = 30000, // 30 seconds
  showWeatherData = true,
  showSensorData = true,
  showFilters = true
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedMine, setSelectedMine] = useState<Mine | null>(null);
  const [mines, setMines] = useState<Mine[]>([]);
  const [realTimeStatus, setRealTimeStatus] = useState<'active' | 'warning' | 'critical' | 'offline'>('active');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);
  const [selectedFilters, setSelectedFilters] = useState({
    riskLevels: ['high', 'medium', 'low'],
    mineTypes: ['coal', 'iron', 'bauxite', 'limestone'],
    states: ['all']
  });
  const [mapView, setMapView] = useState<'satellite' | 'terrain' | 'hybrid'>('terrain');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showRiskHeatmap, setShowRiskHeatmap] = useState(false);
  const [showStatistics, setShowStatistics] = useState(true);
  const [showSensorDataPanel, setShowSensorDataPanel] = useState(true);
  const [selectedSensorType, setSelectedSensorType] = useState<string>('all');
  const [sensorDataHistory, setSensorDataHistory] = useState<{[mineId: string]: any[]}>({});

  // Convert lat/lng to normalized map coordinates (0-100)
  const latLngToMapCoords = useCallback((lat: number, lng: number) => {
    // India bounds: approximately 6.5°N to 37.5°N, 68.1°E to 97.4°E
    const minLat = 6.5;
    const maxLat = 37.5;
    const minLng = 68.1;
    const maxLng = 97.4;
    
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100; // Invert Y for SVG coordinates
    
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  }, []);

  // Fetch mines from database
  const fetchMines = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('mines')
        .select('*')
        .order('name');

      if (error) throw error;

      const minesWithCoords = (data || []).map(mine => {
        const coords = latLngToMapCoords(mine.latitude, mine.longitude);
        return {
          ...mine,
          x: coords.x,
          y: coords.y,
          incidents: Math.floor(Math.random() * 15) + 1, // Mock incident count
          isActive: Math.random() > 0.2, // 80% chance of being active
        };
      });

      setMines(minesWithCoords);
    } catch (error) {
      console.error('Error fetching mines:', error);
    toast({
        title: "Failed to load mines",
        description: "Using cached data",
        variant: "destructive",
      });
    }
  }, [latLngToMapCoords]);

  // Fetch real-time sensor data for all mines
  const updateSensorData = useCallback(async () => {
    if (!showSensorData) return;

    try {
      const { data, error } = await supabase
        .from('sensor_data')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Update mines with latest sensor data
      setMines(prevMines => 
        prevMines.map(mine => {
          const mineSensorData = data?.find(sd => sd.mine_id === mine.id);
          if (mineSensorData) {
            return {
              ...mine,
              realTimeData: {
                displacement: mineSensorData.displacement || 0,
                strain: mineSensorData.strain || 0,
                pore_pressure: mineSensorData.pore_pressure || 0,
                rainfall: mineSensorData.rainfall || 0,
                temperature: mineSensorData.temperature || 0,
                crack_score: mineSensorData.crack_score || 0,
              },
              last_updated: mineSensorData.timestamp,
              isActive: true,
            };
          }
          return mine;
        })
      );
    } catch (error) {
      console.error('Error fetching sensor data:', error);
    }
  }, [showSensorData]);

  // Simulate real-time updates for demo purposes
  const simulateRealTimeUpdates = useCallback(() => {
    setMines(prevMines => 
      prevMines.map(mine => {
        const riskChange = (Math.random() - 0.5) * 0.05;
        const newRiskProbability = Math.max(0.1, Math.min(0.95, 
          mine.current_risk_probability + riskChange
        ));
        
        // Determine risk level based on probability
        let newRiskLevel = 'low';
        if (newRiskProbability > 0.7) newRiskLevel = 'high';
        else if (newRiskProbability > 0.4) newRiskLevel = 'medium';

        return {
          ...mine,
          current_risk_probability: newRiskProbability,
          current_risk_level: newRiskLevel,
          last_updated: new Date().toISOString(),
          isActive: Math.random() > 0.1, // 90% chance of being active
          incidents: Math.max(0, mine.incidents! + (Math.random() > 0.98 ? 1 : 0)), // Rare incident increase
        };
      })
    );
  }, []);

  // Check for critical alerts
  const checkCriticalAlerts = useCallback(() => {
    const highRiskMines = mines.filter(mine => 
      mine.current_risk_level === 'high' && mine.current_risk_probability > 0.8
    );
    
    const criticalMines = mines.filter(mine => 
      mine.current_risk_level === 'high' && mine.current_risk_probability > 0.9
    );

    if (criticalMines.length > 0) {
      setRealTimeStatus('critical');
      setSystemAlerts(prev => [...prev, {
        id: Date.now(),
        type: 'critical',
        message: `${criticalMines.length} mine(s) in critical condition`,
        timestamp: new Date(),
      }]);
    } else if (highRiskMines.length > 2) {
      setRealTimeStatus('warning');
    } else {
      setRealTimeStatus('active');
    }
  }, [mines]);

  // Initialize component
  useEffect(() => {
    const initializeMap = async () => {
      setIsLoading(true);
      await fetchMines();
      setTimeout(() => setIsLoading(false), 1000);
    };
    
    initializeMap();
  }, [fetchMines]);

  // Set up real-time updates
  useEffect(() => {
    if (!showRealTimeUpdates) return;

    const interval = setInterval(async () => {
      setConnectionStatus('connecting');
      
      try {
        await Promise.all([
          updateSensorData(),
          simulateRealTimeUpdates(),
        ]);
        
        setConnectionStatus('connected');
        setLastUpdate(new Date());
        checkCriticalAlerts();
      } catch (error) {
        setConnectionStatus('disconnected');
        console.error('Real-time update failed:', error);
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [showRealTimeUpdates, updateInterval, updateSensorData, simulateRealTimeUpdates, checkCriticalAlerts]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]';
      case 'medium': return 'bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)]';
      case 'low': return 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]';
      default: return 'bg-gray-500';
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

  // Sensor data visualization helpers
  const getSensorStatus = (value: number, thresholds: {low: number, medium: number, high: number}) => {
    if (value >= thresholds.high) return 'high';
    if (value >= thresholds.medium) return 'medium';
    return 'low';
  };

  const getSensorColor = (status: string) => {
    switch (status) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const sensorThresholds = {
    displacement: { low: 3, medium: 6, high: 10 },
    strain: { low: 150, medium: 250, high: 350 },
    pore_pressure: { low: 50, medium: 70, high: 90 },
    rainfall: { low: 20, medium: 40, high: 60 },
    temperature: { low: 25, medium: 35, high: 45 },
    crack_score: { low: 3, medium: 6, high: 8 }
  };

  const handleMineClick = (mine: Mine) => {
    setSelectedMine(mine);
    onMineClick?.(mine);
    toast({
      title: "Mine Selected",
      description: `${mine.name} - ${mine.current_risk_level.toUpperCase()} Risk (${Math.round(mine.current_risk_probability * 100)}%)`,
    });
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    setConnectionStatus('connecting');
    
    try {
      await fetchMines();
      await updateSensorData();
      setConnectionStatus('connected');
      setLastUpdate(new Date());
      
      toast({
        title: "Risk Map Refreshed",
        description: "Real-time data updated successfully",
      });
    } catch (error) {
      setConnectionStatus('disconnected');
      toast({
        title: "Refresh Failed",
        description: "Could not update data",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const filteredMines = mines.filter(mine => 
    selectedFilters.riskLevels.includes(mine.current_risk_level) &&
    selectedFilters.mineTypes.includes(mine.mine_type.toLowerCase()) &&
    (selectedFilters.states.includes('all') || selectedFilters.states.includes(mine.state))
  );

  // Calculate risk statistics
  const riskStats = {
    total: filteredMines.length,
    high: filteredMines.filter(m => m.current_risk_level === 'high').length,
    medium: filteredMines.filter(m => m.current_risk_level === 'medium').length,
    low: filteredMines.filter(m => m.current_risk_level === 'low').length,
    active: filteredMines.filter(m => m.isActive).length,
    critical: filteredMines.filter(m => m.current_risk_level === 'high' && m.current_risk_probability > 0.9).length,
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-[600px] bg-gradient-to-br from-red-50 to-orange-50 rounded-lg flex flex-col items-center justify-center space-y-4 border-2 border-gray-200">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 font-medium">Loading Risk Assessment Map...</p>
        <p className="text-gray-500 text-sm">Analyzing mine safety data and risk factors</p>
      </div>
    );
  }


  return (
    <div className="relative w-full h-[600px] bg-gradient-to-br from-red-50 to-orange-50 rounded-lg overflow-hidden border-2 border-gray-200">
      {/* Risk Status Banner */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-4 shadow-lg z-20">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full animate-pulse ${
            realTimeStatus === 'critical' ? 'bg-red-500' : 
            realTimeStatus === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
          }`} />
          <div>
            <h4 className="text-sm font-bold">
              {realTimeStatus === 'critical' ? 'CRITICAL RISK ALERT' : 
               realTimeStatus === 'warning' ? 'HIGH RISK WARNING' : 'RISK MONITORING'}
            </h4>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              {connectionStatus === 'connected' ? (
                <Globe className="w-3 h-3 text-green-500" />
              ) : (
                <WifiOff className="w-3 h-3 text-red-500" />
              )}
              <span>
                {connectionStatus === 'connected' ? 'Live Risk Assessment' : 'Offline Mode'}
              </span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Last update: {lastUpdate.toLocaleTimeString()}
        </p>
        {systemAlerts.length > 0 && (
          <div className="mt-2">
            <Badge variant="destructive" className="text-xs">
              {systemAlerts.length} Critical Alert{systemAlerts.length > 1 ? 's' : ''}
            </Badge>
          </div>
        )}
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg z-20">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <select 
            value={mapView} 
            onChange={(e) => setMapView(e.target.value as any)}
            className="text-xs border rounded px-2 py-1"
          >
            <option value="terrain">Terrain</option>
            <option value="satellite">Satellite</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRiskHeatmap(!showRiskHeatmap)}
            className={`h-8 px-2 ${showRiskHeatmap ? 'bg-red-100 text-red-600' : ''}`}
          >
            <Layers className="w-4 h-4" />
          </Button>
              <Button
            variant="outline"
                size="sm"
            onClick={() => setShowSensorDataPanel(!showSensorDataPanel)}
            className={`h-8 px-2 ${showSensorDataPanel ? 'bg-blue-100 text-blue-600' : ''}`}
              >
            <Activity className="w-4 h-4" />
              </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {systemAlerts.length > 0 && (
        <div className="absolute top-20 right-4 z-20 max-w-md">
          {systemAlerts.slice(-3).map((alert) => (
            <Alert key={alert.id} className="mb-2 border-red-500 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-800">
                {alert.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Risk Assessment Map SVG */}
      <svg
        viewBox="0 0 800 1000"
        className="w-full h-full"
        style={{ 
          background: mapView === 'satellite' 
            ? 'linear-gradient(135deg, #1a1a2e 0%, #2d1b69 50%, #0f3460 100%)'
            : mapView === 'hybrid'
            ? 'linear-gradient(135deg, #2d3748 0%, #4a5568 50%, #718096 100%)'
            : 'linear-gradient(135deg, #fef2f2 0%, #fed7d7 100%)'
        }}
      >
        {/* India Outline - Accurate geographical shape */}
        <path
          d="M 200 150 
             Q 250 140 300 150 
             Q 350 145 400 155 
             Q 450 150 500 160 
             Q 550 155 600 165 
             Q 650 160 700 170 
             Q 720 180 730 200 
             Q 740 220 745 250 
             Q 750 280 745 310 
             Q 740 340 730 370 
             Q 720 400 700 420 
             Q 680 440 650 450 
             Q 620 460 580 470 
             Q 540 480 500 485 
             Q 460 490 420 485 
             Q 380 480 340 470 
             Q 300 460 260 440 
             Q 220 420 200 390 
             Q 180 360 170 330 
             Q 160 300 165 270 
             Q 170 240 180 210 
             Q 190 180 200 150 Z"
          fill={mapView === 'satellite' ? '#1a365d' : mapView === 'hybrid' ? '#2d3748' : '#fef2f2'}
          stroke="#dc2626"
          strokeWidth="3"
          opacity="0.9"
        />

        {/* Risk Heatmap Overlay */}
        {showRiskHeatmap && (
          <defs>
            <radialGradient id="riskGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(239, 68, 68, 0.3)" />
              <stop offset="70%" stopColor="rgba(234, 179, 8, 0.2)" />
              <stop offset="100%" stopColor="rgba(34, 197, 94, 0.1)" />
            </radialGradient>
          </defs>
        )}

        {/* Major State Boundaries */}
        <g stroke="#dc2626" strokeWidth="1" fill="none" opacity="0.4">
          <path d="M 300 200 Q 400 190 500 200 Q 600 210 700 220" />
          <path d="M 250 250 Q 350 240 450 250 Q 550 260 650 270" />
          <path d="M 200 350 Q 300 340 400 350 Q 500 360 600 370" />
          <path d="M 250 400 Q 350 390 450 400 Q 550 410 650 420" />
          <path d="M 200 500 Q 300 490 400 500 Q 500 510 600 520" />
          <path d="M 250 550 Q 350 540 450 550 Q 550 560 650 570" />
          <path d="M 600 250 Q 650 300 680 350 Q 700 400 720 450" />
          <path d="M 200 300 Q 150 350 120 400 Q 100 450 90 500" />
        </g>

        {/* Major Cities */}
        <g>
          <circle cx="350" cy="250" r="3" fill="#dc2626" opacity="0.8" />
          <text x="355" y="255" fontSize="8" fill="#991b1b" className="font-medium">Delhi</text>
          
          <circle cx="250" cy="400" r="3" fill="#dc2626" opacity="0.8" />
          <text x="255" y="405" fontSize="8" fill="#991b1b" className="font-medium">Mumbai</text>
          
          <circle cx="600" cy="350" r="3" fill="#dc2626" opacity="0.8" />
          <text x="605" y="355" fontSize="8" fill="#991b1b" className="font-medium">Kolkata</text>
          
          <circle cx="450" cy="550" r="3" fill="#dc2626" opacity="0.8" />
          <text x="455" y="555" fontSize="8" fill="#991b1b" className="font-medium">Chennai</text>
          
          <circle cx="400" cy="520" r="3" fill="#dc2626" opacity="0.8" />
          <text x="405" y="525" fontSize="8" fill="#991b1b" className="font-medium">Bangalore</text>
        </g>

        {/* Risk Heatmap Zones */}
        {showRiskHeatmap && filteredMines.map((mine) => (
          <circle
            key={`heatmap-${mine.id}`}
            cx={mine.x * 8}
            cy={mine.y * 10}
            r={mine.current_risk_level === 'high' ? '25' : mine.current_risk_level === 'medium' ? '20' : '15'}
            fill="url(#riskGradient)"
            opacity="0.6"
          />
        ))}

        {/* Dynamic Mine Risk Markers */}
        {filteredMines.map((mine) => {
          const isHighRisk = mine.current_risk_level === 'high' && mine.current_risk_probability > 0.7;
          const isCritical = mine.current_risk_level === 'high' && mine.current_risk_probability > 0.9;
          const isActive = mine.isActive;
          
          return (
            <g key={mine.id}>
              {/* Critical risk pulse ring */}
              {isCritical && (
                <circle
                  cx={mine.x * 8}
                  cy={mine.y * 10}
                  r="20"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="3"
                  opacity="0.8"
                  className="animate-ping"
                />
              )}
              
              {/* High risk pulse ring */}
              {isHighRisk && !isCritical && (
                <circle
                  cx={mine.x * 8}
                  cy={mine.y * 10}
                  r="15"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  opacity="0.6"
                  className="animate-pulse"
                />
              )}
              
              {/* Activity indicator */}
              {isActive && (
                <circle
                  cx={mine.x * 8 + 8}
                  cy={mine.y * 10 - 8}
                  r="3"
                  fill="#3b82f6"
                  className="animate-pulse"
                />
              )}

              {/* Sensor data indicators */}
              {mine.realTimeData && showSensorData && (
                <g transform={`translate(${mine.x * 8 - 15}, ${mine.y * 10 - 15})`}>
                  {/* Displacement sensor */}
                  <circle
                    cx="0"
                    cy="0"
                    r="2"
                    fill={getSensorColor(getSensorStatus(mine.realTimeData.displacement, sensorThresholds.displacement))}
                    opacity="0.8"
                  />
                  {/* Strain sensor */}
                  <circle
                    cx="6"
                    cy="0"
                    r="2"
                    fill={getSensorColor(getSensorStatus(mine.realTimeData.strain, sensorThresholds.strain))}
                    opacity="0.8"
                  />
                  {/* Temperature sensor */}
                  <circle
                    cx="0"
                    cy="6"
                    r="2"
                    fill={getSensorColor(getSensorStatus(mine.realTimeData.temperature, sensorThresholds.temperature))}
                    opacity="0.8"
                  />
                  {/* Rainfall sensor */}
                  <circle
                    cx="6"
                    cy="6"
                    r="2"
                    fill={getSensorColor(getSensorStatus(mine.realTimeData.rainfall, sensorThresholds.rainfall))}
                    opacity="0.8"
                  />
                  {/* Crack score sensor */}
                  <circle
                    cx="3"
                    cy="3"
                    r="2"
                    fill={getSensorColor(getSensorStatus(mine.realTimeData.crack_score, sensorThresholds.crack_score))}
                    opacity="0.8"
                  />
                </g>
              )}
              
              {/* Main mine risk marker */}
              <circle
                cx={mine.x * 8}
                cy={mine.y * 10}
                r="8"
                className={`${getRiskColor(mine.current_risk_level)} transition-all duration-300 hover:r-10 cursor-pointer`}
                style={{ 
                  filter: `drop-shadow(0 0 12px ${mine.current_risk_level === 'high' ? 'rgba(239,68,68,0.9)' : mine.current_risk_level === 'medium' ? 'rgba(234,179,8,0.8)' : 'rgba(34,197,94,0.8)'})`
                }}
                onClick={() => handleMineClick(mine)}
              />
              
              {/* Mine name label */}
              <text
                x={mine.x * 8 + 12}
                y={mine.y * 10 + 3}
                fontSize="10"
                fill={mapView === 'satellite' ? '#ffffff' : '#374151'}
                className="font-bold"
              >
                {mine.name.split(' ')[0]}
              </text>
              
              {/* Critical risk indicator */}
              {isCritical && (
                <text
                  x={mine.x * 8 + 8}
                  y={mine.y * 10 - 8}
                  fontSize="10"
                  fill="#ffffff"
                  className="font-bold"
                >
                  !
                </text>
              )}
              
              {/* Risk percentage */}
              <text
                x={mine.x * 8 + 12}
                y={mine.y * 10 - 12}
                fontSize="8"
                fill={mapView === 'satellite' ? '#ffffff' : '#374151'}
                className="font-medium"
              >
                {Math.round(mine.current_risk_probability * 100)}%
              </text>
            </g>
          );
        })}

        {/* Map Title */}
        <text x="400" y="50" fontSize="24" fill={mapView === 'satellite' ? '#ffffff' : '#991b1b'} textAnchor="middle" className="font-bold">
          Risk Assessment Map - India Mining Operations
        </text>
        
        {/* Scale Indicator */}
        <g transform="translate(50, 900)">
          <line x1="0" y1="0" x2="100" y2="0" stroke={mapView === 'satellite' ? '#ffffff' : '#374151'} strokeWidth="2" />
          <text x="50" y="-5" fontSize="10" fill={mapView === 'satellite' ? '#ffffff' : '#374151'} textAnchor="middle">Risk Scale: 1:50M</text>
        </g>
      </svg>

      {/* Sensor Data Panel */}
      {showSensorDataPanel && (
        <div className="absolute top-20 right-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-4 shadow-lg z-10 max-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Sensor Data</span>
            </h4>
            <div className="flex space-x-1">
              <select 
                value={selectedSensorType} 
                onChange={(e) => setSelectedSensorType(e.target.value)}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="all">All Sensors</option>
                <option value="displacement">Displacement</option>
                <option value="strain">Strain</option>
                <option value="temperature">Temperature</option>
                <option value="rainfall">Rainfall</option>
                <option value="crack_score">Crack Score</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSensorDataPanel(false)}
                className="h-6 w-6 p-0"
              >
                <EyeOff className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {filteredMines.slice(0, 5).map((mine) => (
              mine.realTimeData && (
                <div key={mine.id} className="p-2 bg-gray-50 rounded text-xs">
                  <div className="font-medium mb-1">{mine.name.split(' ')[0]}</div>
                  <div className="grid grid-cols-2 gap-1">
                    {(selectedSensorType === 'all' || selectedSensorType === 'displacement') && (
                      <div className="flex items-center space-x-1">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{backgroundColor: getSensorColor(getSensorStatus(mine.realTimeData.displacement, sensorThresholds.displacement))}}
                        />
                        <span>Disp: {mine.realTimeData.displacement.toFixed(1)}mm</span>
                      </div>
                    )}
                    {(selectedSensorType === 'all' || selectedSensorType === 'strain') && (
                      <div className="flex items-center space-x-1">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{backgroundColor: getSensorColor(getSensorStatus(mine.realTimeData.strain, sensorThresholds.strain))}}
                        />
                        <span>Strain: {mine.realTimeData.strain.toFixed(0)}με</span>
                      </div>
                    )}
                    {(selectedSensorType === 'all' || selectedSensorType === 'temperature') && (
                      <div className="flex items-center space-x-1">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{backgroundColor: getSensorColor(getSensorStatus(mine.realTimeData.temperature, sensorThresholds.temperature))}}
                        />
                        <span>Temp: {mine.realTimeData.temperature.toFixed(1)}°C</span>
                      </div>
                    )}
                    {(selectedSensorType === 'all' || selectedSensorType === 'rainfall') && (
                      <div className="flex items-center space-x-1">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{backgroundColor: getSensorColor(getSensorStatus(mine.realTimeData.rainfall, sensorThresholds.rainfall))}}
                        />
                        <span>Rain: {mine.realTimeData.rainfall.toFixed(1)}mm</span>
                      </div>
                    )}
                    {(selectedSensorType === 'all' || selectedSensorType === 'crack_score') && (
                      <div className="flex items-center space-x-1">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{backgroundColor: getSensorColor(getSensorStatus(mine.realTimeData.crack_score, sensorThresholds.crack_score))}}
                        />
                        <span>Crack: {mine.realTimeData.crack_score.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Normal</span>
                </span>
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span>Warning</span>
                </span>
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span>Critical</span>
                </span>
              </div>
                  </div>
                </div>
              </div>
            )}
            
      {/* Risk Statistics Panel */}
      {showStatistics && (
        <div className="absolute top-20 left-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-4 shadow-lg z-10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Risk Statistics</span>
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStatistics(false)}
              className="h-6 w-6 p-0"
            >
              <EyeOff className="w-3 h-3" />
            </Button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Mines:</span>
              <span className="font-bold">{riskStats.total}</span>
                    </div>
            <div className="flex items-center justify-between">
              <span className="text-red-600">High Risk:</span>
              <span className="font-bold text-red-600">{riskStats.high}</span>
                    </div>
            <div className="flex items-center justify-between">
              <span className="text-yellow-600">Medium Risk:</span>
              <span className="font-bold text-yellow-600">{riskStats.medium}</span>
                    </div>
            <div className="flex items-center justify-between">
              <span className="text-green-600">Low Risk:</span>
              <span className="font-bold text-green-600">{riskStats.low}</span>
                  </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-600">Active:</span>
              <span className="font-bold text-blue-600">{riskStats.active}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-red-800">Critical:</span>
              <span className="font-bold text-red-800">{riskStats.critical}</span>
                </div>
                </div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs">
              <div className="flex items-center justify-between mb-1">
                <span>Risk Distribution</span>
                </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{width: `${(riskStats.high / riskStats.total) * 100}%`}}></div>
                </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-red-600">High</span>
                <span className="text-yellow-600">Medium</span>
                <span className="text-green-600">Low</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Risk Legend */}
      <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-4 shadow-lg z-10 max-w-xs">
        <h4 className="text-base font-bold mb-3 text-gray-800">Risk Legend</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0" />
            <span className="text-gray-700">High Risk (&gt;70%)</span>
                  </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-yellow-500 rounded-full flex-shrink-0" />
            <span className="text-gray-700">Medium Risk (40-70%)</span>
                </div>
                  <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0" />
            <span className="text-gray-700">Low Risk (&lt;40%)</span>
          </div>
          <div className="flex items-center space-x-3 mt-3">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse flex-shrink-0" />
            <span className="text-gray-700">Active Mine</span>
                    </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 border-2 border-red-500 rounded-full animate-ping flex-shrink-0" />
            <span className="text-gray-700">Critical Alert</span>
                    </div>
                  </div>
        {showSensorDataPanel && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <h5 className="text-sm font-medium mb-2 text-gray-800">Sensor Status:</h5>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0" />
                <span className="text-sm text-gray-700">Normal</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0" />
                <span className="text-sm text-gray-700">Warning</span>
                </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0" />
                <span className="text-sm text-gray-700">Critical</span>
              </div>
            </div>
          </div>
        )}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Active Mines:</span>
            <span className="font-bold text-blue-600">
              {filteredMines.filter(m => m.isActive).length}/{filteredMines.length}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Critical Risk:</span>
            <span className="font-bold text-red-600">
              {filteredMines.filter(m => m.current_risk_level === 'high' && m.current_risk_probability > 0.9).length}
            </span>
          </div>
          {showSensorDataPanel && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Sensor Data:</span>
              <span className="font-bold text-green-600">
                {filteredMines.filter(m => m.realTimeData).length} Live
              </span>
      </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskMap;

