import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Upload, TrendingUp, AlertTriangle, Users, Activity, MapPin, Clock, 
  RefreshCw, LogOut, Image as ImageIcon, Zap, BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import indiaMapImage from "@/assets/india-map.jpg";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import EmergencyAlertModal from './EmergencyAlertModal';
import InteractiveCharts from "./InteractiveCharts";
import RecentUploadsPanel from "./RecentUploadsPanel";
import { useSensorData } from "@/hooks/useSensorData";
import { useWeatherData } from "@/hooks/useWeatherData";

interface Mine {
  id: string;
  name: string;
  location: string;
  state: string;
  latitude: number;
  longitude: number;
  current_risk_level: string;
  current_risk_probability: number;
  last_updated: string;
  mine_type: string;
}

interface SensorData {
  timestamp: string;
  displacement: number;
  strain: number;
  pore_pressure: number;
  rainfall: number;
  temperature: number;
}

interface UploadedImage {
  id: string;
  file_name: string;
  file_url: string;
  location: string;
  timestamp: string;
}

interface EnhancedDashboardProps {
  onTabChange?: (tab: string) => void;
}

const EnhancedDashboard = ({ onTabChange }: EnhancedDashboardProps) => {
  const { user, signOut } = useAuth();
  const [mines, setMines] = useState<Mine[]>([]);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [highRiskAlerts, setHighRiskAlerts] = useState<Mine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'charts'>('overview');
  const [mapError, setMapError] = useState(false);
  const [showDebugGrid, setShowDebugGrid] = useState(process.env.NODE_ENV === 'development');
  const [selectedMineForAnalytics, setSelectedMineForAnalytics] = useState<string>('all');
  const [csvSensorData, setCsvSensorData] = useState<any[]>([]);
  const [isEditingMap, setIsEditingMap] = useState(false);
  const [draggedMine, setDraggedMine] = useState<string | null>(null);
  const [customMinePositions, setCustomMinePositions] = useState<{[key: string]: {x: number, y: number}}>({});
  const [alertModalData, setAlertModalData] = useState<{
    mineName: string;
    riskProbability: number;
    location: string;
    timestamp: string;
    affectedPersonnel: number;
  } | null>(null);

  // Weather data for the first mine
  const { weatherData } = useWeatherData({
    mineId: mines[0]?.id,
    latitude: mines[0]?.latitude,
    longitude: mines[0]?.longitude,
    updateInterval: 15, // 15 minutes
    enabled: !!mines[0]?.latitude && !!mines[0]?.longitude
  });

  // Real-time sensor monitoring for risk assessment
  const { riskScore: currentRiskScore, currentReading } = useSensorData({ 
    mode: 'simulated', 
    mineId: mines[0]?.id
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
            const key = header.trim();
            const value = values[index]?.trim();
            
            if (key === 'mine_id' || key === 'displacement' || key === 'strain' || 
                key === 'pore_pressure' || key === 'rainfall' || key === 'temperature' || 
                key === 'dem_slope' || key === 'crack_score') {
              row[key] = parseFloat(value) || 0;
            } else {
              row[key] = value || '';
            }
          });
          return row;
        });
      
      setCsvSensorData(data);
      console.log('CSV sensor data loaded:', data.length, 'records');
    } catch (error) {
      console.error('Failed to load CSV sensor data:', error);
    }
  };

  // Helper functions for analytics calculations
  const getAnalyticsData = () => {
    // Filter out Noamundi and Bokaro from all data
    const filteredCsvData = csvSensorData.filter(data => 
      data.mine_name && 
      !data.mine_name.toLowerCase().includes('noamundi') && 
      !data.mine_name.toLowerCase().includes('bokaro')
    );

    if (selectedMineForAnalytics === 'all') {
      return filteredCsvData;
    } else {
      const selectedMine = mines.find(m => m.id === selectedMineForAnalytics);
      if (selectedMine) {
        return filteredCsvData.filter(data => 
          data.mine_name && selectedMine.name && 
          data.mine_name.toLowerCase().includes(selectedMine.name.toLowerCase())
        );
      }
      return [];
    }
  };

  const calculateAnalytics = () => {
    const data = getAnalyticsData();
    if (data.length === 0) return null;

    const totalMines = selectedMineForAnalytics === 'all' ? data.length : 1;
    
    // Calculate averages
    const avgDisplacement = data.reduce((sum, item) => sum + item.displacement, 0) / data.length;
    const avgStrain = data.reduce((sum, item) => sum + item.strain, 0) / data.length;
    const avgTemperature = data.reduce((sum, item) => sum + item.temperature, 0) / data.length;
    const avgRainfall = data.reduce((sum, item) => sum + item.rainfall, 0) / data.length;
    const avgSlope = data.reduce((sum, item) => sum + item.dem_slope, 0) / data.length;
    const avgCrackScore = data.reduce((sum, item) => sum + item.crack_score, 0) / data.length;

    // Calculate risk levels
    const riskLevels = data.map(item => {
      const riskScore = (item.displacement / 20) * 0.25 + 
                       (item.strain / 500) * 0.20 + 
                       (item.pore_pressure / 100) * 0.15 + 
                       (item.rainfall / 100) * 0.15 + 
                       (item.temperature / 50) * 0.10 + 
                       (item.dem_slope / 90) * 0.10 + 
                       (item.crack_score / 10) * 0.05;
      
      if (riskScore > 0.7) return 'high';
      if (riskScore > 0.5) return 'medium';
      if (riskScore > 0.3) return 'low';
      return 'very_low';
    });

    const highRiskCount = riskLevels.filter(level => level === 'high').length;
    const mediumRiskCount = riskLevels.filter(level => level === 'medium').length;
    const lowRiskCount = riskLevels.filter(level => level === 'low').length;
    const veryLowRiskCount = riskLevels.filter(level => level === 'very_low').length;

    return {
      totalMines,
      avgDisplacement: Math.round(avgDisplacement * 10) / 10,
      avgStrain: Math.round(avgStrain),
      avgTemperature: Math.round(avgTemperature * 10) / 10,
      avgRainfall: Math.round(avgRainfall * 10) / 10,
      avgSlope: Math.round(avgSlope * 10) / 10,
      avgCrackScore: Math.round(avgCrackScore * 10) / 10,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      veryLowRiskCount,
      data
    };
  };

  // Map editing functions
  const handleMineDrag = (mineId: string, newX: number, newY: number) => {
    if (!isEditingMap) return;
    
    const mine = mines.find(m => m.id === mineId);
    if (mine) {
      setCustomMinePositions(prev => ({
        ...prev,
        [mine.name]: { x: newX, y: newY }
      }));
    }
  };

  const handleMouseDown = (mineId: string, e: React.MouseEvent) => {
    if (!isEditingMap) return;
    e.preventDefault();
    e.stopPropagation();
    setDraggedMine(mineId);
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!isEditingMap || !draggedMine) return;
    
    // Get the map container
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;
    
    const rect = mapContainer.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    handleMineDrag(draggedMine, Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y)));
  };

  const handleGlobalMouseUp = () => {
    setDraggedMine(null);
  };

  const saveCustomPositions = () => {
    // Save positions to localStorage for persistence
    localStorage.setItem('customMinePositions', JSON.stringify(customMinePositions));
    toast({
      title: "Positions Saved",
      description: "Mine positions have been saved successfully.",
    });
  };

  const resetPositions = () => {
    setCustomMinePositions({});
    localStorage.removeItem('customMinePositions');
    toast({
      title: "Positions Reset",
      description: "Mine positions have been reset to defaults.",
    });
  };

  // Load saved positions on component mount
  useEffect(() => {
    const savedPositions = localStorage.getItem('customMinePositions');
    if (savedPositions) {
      try {
        setCustomMinePositions(JSON.parse(savedPositions));
      } catch (error) {
        console.error('Error loading saved positions:', error);
      }
    }
  }, []);

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isEditingMap && draggedMine) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [isEditingMap, draggedMine]);

  const fetchData = async () => {
    try {
      // Fetch mines data
      const { data: minesData, error: minesError } = await supabase
        .from('mines')
        .select('*')
        .order('last_updated', { ascending: false });

      if (minesError) throw minesError;
      setMines(minesData || []);

      // Fetch recent sensor data
      const { data: sensorDataResult, error: sensorError } = await supabase
        .from('sensor_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);

      if (sensorError) throw sensorError;
      setSensorData(sensorDataResult || []);

      // Fetch uploaded images
      const { data: imagesData, error: imagesError } = await supabase
        .from('uploads')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (imagesError) throw imagesError;
      setUploadedImages(imagesData || []);

      // Filter high risk mines and combine with real-time sensor risk
      const highRisk = (minesData || []).filter(mine => 
        mine.current_risk_probability > 0.7 || (currentRiskScore && currentRiskScore > 0.7)
      );
      setHighRiskAlerts(highRisk);
      
      // Load CSV sensor data
      await loadCsvSensorData();
      
      // Trigger alert if risk score is critical
      if (currentRiskScore > 0.8) {
        toast({
          title: "Critical Risk Detected!",
          description: `Risk probability: ${Math.round(currentRiskScore * 100)}% - Immediate action required`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const handleLogout = async () => {
    await signOut();
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-danger';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-safe';
      default: return 'bg-muted';
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-monitoring-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-monitoring-bg text-foreground">
      {/* Emergency Alert Modal */}
      <EmergencyAlertModal
        isOpen={!!alertModalData}
        onClose={() => setAlertModalData(null)}
        alertData={alertModalData}
      />

      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                 <h1 className="text-xl font-bold">SHAIL KAVACH</h1>
                <p className="text-sm text-muted-foreground">Production-Ready Mining Safety Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Risk Data</span>
              </Button>
              <div className="text-sm text-muted-foreground">
                Welcome, {user?.email}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
          
          {/* Section Navigation */}
          <div className="flex items-center space-x-1 mt-4">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'charts', label: 'Analytics', icon: BarChart3 },
            ].map((section) => {
              const Icon = section.icon;
              return (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveSection(section.id as any)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="w-4 h-4" />
                  <span>{section.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Render content based on active section */}
        {activeSection === 'overview' && (
          <div className="space-y-8">
            {/* High Risk Alerts with Emergency Modal Trigger */}
            {highRiskAlerts.length > 0 && (
              <Alert className="border-danger/50 bg-danger/10 cursor-pointer hover:bg-danger/20 transition-colors"
                onClick={() => {
                  if (highRiskAlerts[0]) {
                    setAlertModalData({
                      mineName: highRiskAlerts[0].name,
                      riskProbability: highRiskAlerts[0].current_risk_probability,
                      location: highRiskAlerts[0].location,
                      timestamp: new Date(highRiskAlerts[0].last_updated).toLocaleString(),
                      affectedPersonnel: Math.floor(Math.random() * 25) + 5
                    });
                  }
                }}
              >
                <AlertTriangle className="h-4 w-4 text-danger" />
                <AlertDescription className="text-danger">
                  <strong>High Rockfall Risk Detected!</strong> {highRiskAlerts.length} mine{highRiskAlerts.length > 1 ? 's' : ''} require immediate attention. Click to view emergency actions.
                  {highRiskAlerts.map(mine => (
                    <span key={mine.id} className="block mt-1">
                      • {mine.name} - Risk: {Math.round(mine.current_risk_probability * 100)}% - Take Precautionary Measures
                    </span>
                  ))}
                </AlertDescription>
              </Alert>
            )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Interactive India Map */}
          <Card className="xl:col-span-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Live India Mining Risk Map</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">Live Updates</span>
                
                {/* Map Editing Controls - Hidden per user request */}
                {/* <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant={isEditingMap ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsEditingMap(!isEditingMap)}
                    className="text-xs"
                  >
                    {isEditingMap ? 'Exit Edit' : 'Edit Map'}
                  </Button>
                  
                  {isEditingMap && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={saveCustomPositions}
                        className="text-xs text-green-600 border-green-600 hover:bg-green-50"
                      >
                        Save Positions
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetPositions}
                        className="text-xs text-red-600 border-red-600 hover:bg-red-50"
                      >
                        Reset
                      </Button>
                    </>
                  )}
                </div> */}

                {process.env.NODE_ENV === 'development' && (
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDebugGrid(!showDebugGrid)}
                      className="text-xs"
                    >
                      {showDebugGrid ? 'Hide Grid' : 'Show Grid'}
                    </Button>
                    <div className="text-xs text-muted-foreground">
                      Grid: {showDebugGrid ? 'ON' : 'OFF'}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            
            {mapError ? (
              <div className="relative w-full h-[500px] bg-secondary/30 rounded-lg flex flex-col items-center justify-center space-y-4 border border-border">
                <AlertTriangle className="w-12 h-12 text-warning" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">Map Failed to Load</p>
                  <p className="text-sm text-muted-foreground">Unable to display the India mining risk map</p>
                </div>
                <Button 
                  onClick={() => {
                    setMapError(false);
                    toast({
                      title: "Retrying Map Load",
                      description: "Attempting to reload the mining risk map",
                    });
                  }}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Map Load
                </Button>
              </div>
            ) : (
            <div id="map-container" className="relative w-full h-[500px] bg-gradient-to-br from-monitoring-bg to-secondary/20 rounded-lg overflow-hidden border border-border/50">
              <img 
                src={indiaMapImage} 
                alt="India Map" 
                className="absolute inset-0 w-full h-full object-contain opacity-70"
                style={{ objectPosition: 'center center' }}
              />
              
              {/* Debug Grid Overlay - can be enabled for positioning calibration */}
              {showDebugGrid && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Vertical grid lines */}
                  {Array.from({ length: 10 }, (_, i) => (
                    <div
                      key={`v-${i}`}
                      className="absolute top-0 bottom-0 w-px bg-red-500/30"
                      style={{ left: `${i * 10}%` }}
                    />
                  ))}
                  {/* Horizontal grid lines */}
                  {Array.from({ length: 10 }, (_, i) => (
                    <div
                      key={`h-${i}`}
                      className="absolute left-0 right-0 h-px bg-red-500/30"
                      style={{ top: `${i * 10}%` }}
                    />
                  ))}
                  {/* Grid labels */}
                  {Array.from({ length: 11 }, (_, i) => (
                    <div
                      key={`label-x-${i}`}
                      className="absolute top-2 text-xs text-red-600 font-mono"
                      style={{ left: `${i * 10}%` }}
                    >
                      {i * 10}
                    </div>
                  ))}
                  {Array.from({ length: 11 }, (_, i) => (
                    <div
                      key={`label-y-${i}`}
                      className="absolute left-2 text-xs text-red-600 font-mono"
                      style={{ top: `${i * 10}%` }}
                    >
                      {i * 10}
                    </div>
                  ))}
                </div>
              )}
              

              {/* Mine Locations */}
              <div className="absolute inset-0">
                {mines.map((mine) => {
                  // Fallback positions - manually calibrated to match the India map image
                  const getMinePosition = (mineName: string) => {
                    const positions: { [key: string]: { x: number; y: number } } = {
                      // Manually calibrated positions for the India map image
                      'Jharia Coalfield': { x: 68.5, y: 42.0 }, // Eastern India - Jharkhand
                      'Talcher Coalfield': { x: 65.0, y: 48.5 }, // Eastern India - Odisha
                      'Korba Coalfield': { x: 58.0, y: 45.5 }, // Central India - Chhattisgarh
                      'Raniganj Coalfield': { x: 70.0, y: 41.5 }, // Eastern India - West Bengal
                      'Singrauli Coalfield': { x: 56.5, y: 43.0 }, // Central India - Madhya Pradesh
                      'Bellary Iron Ore': { x: 45.0, y: 68.0 }, // Southern India - Karnataka
                      'Bailadila Iron Ore': { x: 52.0, y: 52.0 }, // Central India - Chhattisgarh
                      'Goa Iron Ore': { x: 38.0, y: 68.5 }, // Western India - Goa
                    };
                    return positions[mineName] || { x: 50, y: 50 };
                  };
                  
                  // Use direct positioning based on known locations on the India map image
                  // This bypasses coordinate conversion issues and uses visual positioning
                  let position;
                  if (mine.latitude && mine.longitude) {
                    // Use a more accurate positioning system based on known reference points
                    // These positions are manually calibrated to match the actual India map image
                    const mapReferencePoints = {
                      // Known locations on the India map for calibration
                      'Jharia Coalfield': { x: 68.5, y: 42.0 }, // Eastern India - Jharkhand
                      'Talcher Coalfield': { x: 65.0, y: 48.5 }, // Eastern India - Odisha
                      'Korba Coalfield': { x: 58.0, y: 45.5 }, // Central India - Chhattisgarh
                      'Raniganj Coalfield': { x: 70.0, y: 41.5 }, // Eastern India - West Bengal
                      'Singrauli Coalfield': { x: 56.5, y: 43.0 }, // Central India - Madhya Pradesh
                      'Bellary Iron Ore': { x: 45.0, y: 68.0 }, // Southern India - Karnataka
                      'Bailadila Iron Ore': { x: 52.0, y: 52.0 }, // Central India - Chhattisgarh
                      'Goa Iron Ore': { x: 38.0, y: 68.5 }, // Western India - Goa
                    };
                    
                    // Use custom position if available (highest priority)
                    if (customMinePositions[mine.name]) {
                      position = customMinePositions[mine.name];
                    }
                    // Use the calibrated position if available
                    else if (mapReferencePoints[mine.name]) {
                      position = mapReferencePoints[mine.name];
                    } else {
                      // Fallback to coordinate-based positioning with different formula
                      const rawX = ((mine.longitude - 68.0) / (97.0 - 68.0)) * 100;
                      const rawY = ((35.0 - mine.latitude) / (35.0 - 8.0)) * 100;
                      position = { 
                        x: Math.max(5, Math.min(95, rawX + 5)), 
                        y: Math.max(5, Math.min(95, rawY + 8)) 
                      };
                    }
                  } else {
                    // Use custom position if available (highest priority)
                    if (customMinePositions[mine.name]) {
                      position = customMinePositions[mine.name];
                    } else {
                      position = getMinePosition(mine.name);
                    }
                  }
                  
                  // Debug logging for positioning (remove in production)
                  if (mine.latitude && mine.longitude) {
                    const rawX = ((mine.longitude - 68.2) / (97.4 - 68.2)) * 100;
                    const rawY = ((37.1 - mine.latitude) / (37.1 - 6.7)) * 100;
                    console.log(`Mine: ${mine.name}`);
                    console.log(`  Coordinates: ${mine.latitude}°N, ${mine.longitude}°E`);
                    console.log(`  Raw Position: ${rawX.toFixed(1)}%, ${rawY.toFixed(1)}%`);
                    console.log(`  Final Position: ${position.x.toFixed(1)}%, ${position.y.toFixed(1)}%`);
                    console.log(`  Expected (fallback): ${getMinePosition(mine.name).x}, ${getMinePosition(mine.name).y}`);
                  }
                  
                  return (
                    <div
                      key={mine.id}
                      className={`absolute group/mine cursor-pointer`}
                      style={{ 
                        left: `${Math.max(0, Math.min(100, position.x))}%`, 
                        top: `${Math.max(0, Math.min(100, position.y))}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: draggedMine === mine.id ? 1000 : 10
                      }}
                      onMouseDown={(e) => handleMouseDown(mine.id, e)}
                    >
                      {/* Risk pulse ring for high risk mines */}
                      {mine.current_risk_level === 'high' && (
                        <div className="absolute inset-0 w-8 h-8 rounded-full bg-red-500/30 animate-ping" />
                      )}
                      
                      {/* Editing mode indicator - Hidden per user request */}
                      {/* {isEditingMap && (
                        <div className={`absolute -top-2 -right-2 w-4 h-4 ${draggedMine === mine.id ? 'bg-green-500' : 'bg-blue-500'} rounded-full border-2 border-white shadow-lg flex items-center justify-center`}>
                          <span className="text-xs text-white font-bold">{draggedMine === mine.id ? '🎯' : '✏️'}</span>
                        </div>
                      )} */}
                      
                      {/* Main mine marker */}
                      <div className={`relative w-6 h-6 rounded-full ${
                        draggedMine === mine.id ? 'bg-green-200 border-green-500' :
                        getRiskColor(mine.current_risk_level)
                      } 
                        shadow-lg transform group-hover/mine:scale-125 transition-all duration-300
                        border-2 ${draggedMine === mine.id ? 'border-green-500' : 'border-white'}`}
                      >
                        {/* Inner dot */}
                        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                        
                        {/* Risk indicator for high risk */}
                        {mine.current_risk_level === 'high' && (
                          <AlertTriangle className="absolute -top-1 -right-1 w-3 h-3 text-white fill-current" />
                        )}
                      </div>
                      
                      {/* Mine type indicator */}
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                        <div className={`w-2 h-2 rounded-full ${mine.mine_type === 'Iron Ore' ? 'bg-blue-500' : 'bg-gray-600'}`} />
                      </div>
                      
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 
                        bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 
                        opacity-0 group-hover/mine:opacity-100 transition-opacity duration-300 pointer-events-none
                        min-w-[200px] z-10 shadow-lg">
                        <p className="font-medium text-sm">{mine.name}</p>
                        <p className="text-xs text-muted-foreground">{mine.location}</p>
                        <p className="text-xs mt-1">
                          Risk: {Math.round(mine.current_risk_probability * 100)}% - {mine.current_risk_level.toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Updated: {new Date(mine.last_updated).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Editing Instructions Panel - Hidden per user request */}
              {/* {isEditingMap && (
                <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm border border-blue-500/50 rounded-lg p-4 max-w-xs z-20">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <h4 className="text-sm font-medium text-blue-600">Map Editing Mode</h4>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>• Click and drag mine markers to new positions</p>
                    <p>• Use "Save Positions" to persist changes</p>
                    <p>• Use "Reset" to restore original positions</p>
                    <p>• Click "Exit Edit" when finished</p>
                  </div>
                </div>
              )} */}

              {/* Enhanced Legend */}
              <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium">Map Legend</h4>
                
                {process.env.NODE_ENV === 'development' && showDebugGrid && (
                  <div className="pt-2 border-t border-border/50">
                    <h5 className="text-xs font-medium mb-1">Debug Info:</h5>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <span>Reference Points</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full" />
                        <span>Major Cities</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Risk Levels */}
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-2">Risk Levels</h5>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="relative w-4 h-4 rounded-full bg-danger border-2 border-white shadow-lg">
                        <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <span className="text-xs">High Risk</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="relative w-4 h-4 rounded-full bg-warning border-2 border-white shadow-lg">
                        <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <span className="text-xs">Medium Risk</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="relative w-4 h-4 rounded-full bg-safe border-2 border-white shadow-lg">
                        <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <span className="text-xs">Low Risk</span>
                    </div>
                  </div>
                </div>
                
                {/* Mine Types */}
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-2">Mine Types</h5>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-xs">Iron Ore</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-600" />
                      <span className="text-xs">Coal</span>
                    </div>
                  </div>
                </div>
                
                {/* Mine Count */}
                <div className="pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Total Mines:</span>
                    <span className="font-medium">{mines.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">High Risk:</span>
                    <span className="font-medium text-red-600">
                      {mines.filter(m => m.current_risk_level === 'high').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            )}
            
            {/* Add error handling and image load events */}
            {!mapError && (
              <img 
                src={indiaMapImage} 
                alt="" 
                className="hidden"
                onError={() => setMapError(true)}
                onLoad={() => setMapError(false)}
              />
            )}
          </Card>

          {/* Sensor Trends - Hidden per user request */}
          {/* <Card className="xl:col-span-2 p-6">
            <h3 className="text-lg font-semibold mb-4">Real-time Sensor Trends</h3>
            {sensorData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={sensorData.slice(0, 10).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="hsl(var(--chart-text))"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis stroke="hsl(var(--chart-text))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                  />
                  <Line
                    type="monotone"
                    dataKey="displacement"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Displacement"
                  />
                  <Line
                    type="monotone"
                    dataKey="strain"
                    stroke="hsl(var(--warning))"
                    strokeWidth={2}
                    name="Strain"
                  />
                  <Line
                    type="monotone"
                    dataKey="pore_pressure"
                    stroke="hsl(var(--danger))"
                    strokeWidth={2}
                    name="Pore Pressure"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                No sensor data available
              </div>
            )}
          </Card> */}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 bg-gradient-to-br from-danger/20 to-danger/10 border-danger/20">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-danger" />
                <div>
                  <p className="text-xs text-muted-foreground">High Risk</p>
                  <p className="text-xl font-bold text-danger">
                    {mines.filter(m => m.current_risk_level === 'high').length}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-to-br from-warning/20 to-warning/10 border-warning/20">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-warning" />
                <div>
                  <p className="text-xs text-muted-foreground">Medium Risk</p>
                  <p className="text-xl font-bold text-warning">
                    {mines.filter(m => m.current_risk_level === 'medium').length}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-to-br from-safe/20 to-safe/10 border-safe/20">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-safe" />
                <div>
                  <p className="text-xs text-muted-foreground">Low Risk</p>
                  <p className="text-xl font-bold text-safe">
                    {mines.filter(m => m.current_risk_level === 'low').length}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-to-br from-primary/20 to-primary/10 border-primary/20">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Mines</p>
                  <p className="text-xl font-bold text-primary">{mines.length}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Uploaded Images */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Uploads</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {uploadedImages.length > 0 ? (
                uploadedImages.map((image) => (
                  <div key={image.id} className="flex items-center space-x-3 p-2 hover:bg-accent/50 rounded-lg cursor-pointer">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <ImageIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{image.file_name}</p>
                      <p className="text-xs text-muted-foreground">{image.location}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(image.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No images uploaded yet
                </p>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => {
                    onTabChange?.('upload');
                    toast({
                      title: "Navigating to Upload",
                      description: "Opening drone image upload interface",
                    });
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Drone Images
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full justify-start text-danger border-danger/30"
                  onClick={() => {
                    onTabChange?.('alerts');
                    toast({
                      title: "Navigating to Alerts",
                      description: "Opening emergency alerts management",
                    });
                  }}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Manage Alerts
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )}

    {/* Analytics Section */}
    {activeSection === 'charts' && (
      <div className="space-y-6">
        {/* CSV Data Analytics */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Mining Analytics</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedMineForAnalytics === 'all' 
                    ? 'Real-time sensor data from all mines' 
                    : `Analytics for ${mines.find(m => m.id === selectedMineForAnalytics)?.name || 'Selected Mine'}`
                  }
                </p>
              </div>
            </div>
            
            {/* Mine Selection Dropdown */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium">Select Mine:</span>
              <Select value={selectedMineForAnalytics} onValueChange={setSelectedMineForAnalytics}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a mine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Mines</SelectItem>
                  {mines.filter(mine => 
                    mine.name && 
                    !mine.name.toLowerCase().includes('noamundi') && 
                    !mine.name.toLowerCase().includes('bokaro')
                  ).map((mine) => (
                    <SelectItem key={mine.id} value={mine.id}>
                      {mine.name} - {mine.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dynamic Analytics Content */}
          {(() => {
            const analytics = calculateAnalytics();
            if (!analytics) {
              return (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No data available for selected mine</p>
                </div>
              );
            }

            return (
              <>
                {/* Analytics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Mine Performance Metrics */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Mine Performance</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">Mines Monitored</span>
                        <Badge variant="secondary">{analytics.totalMines}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">High Risk Mines</span>
                        <Badge variant="destructive">{analytics.highRiskCount}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">Medium Risk Mines</span>
                        <Badge variant="outline">{analytics.mediumRiskCount}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">Low Risk Mines</span>
                        <Badge variant="secondary">{analytics.lowRiskCount}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Sensor Data Summary */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Sensor Data Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">Avg Displacement</span>
                        <span className="text-sm font-bold text-orange-600">{analytics.avgDisplacement} mm</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">Avg Strain</span>
                        <span className="text-sm font-bold text-blue-600">{analytics.avgStrain} μϵ</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">Avg Temperature</span>
                        <span className="text-sm font-bold text-red-600">{analytics.avgTemperature}°C</span>
                      </div>
                    </div>
                  </div>

                  {/* Environmental Conditions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Environmental</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">Avg Rainfall</span>
                        <span className="text-sm font-bold text-blue-500">{analytics.avgRainfall} mm</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">Avg Slope Angle</span>
                        <span className="text-sm font-bold text-green-600">{analytics.avgSlope}°</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">Avg Crack Score</span>
                        <span className="text-sm font-bold text-purple-600">{analytics.avgCrackScore}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Data Table */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">
                    {selectedMineForAnalytics === 'all' ? 'All Mines Data' : 'Mine Details'}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-border rounded-lg">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="border border-border p-3 text-left text-sm font-medium">Mine Name</th>
                          <th className="border border-border p-3 text-left text-sm font-medium">Location</th>
                          <th className="border border-border p-3 text-left text-sm font-medium">State</th>
                          <th className="border border-border p-3 text-left text-sm font-medium">Displacement</th>
                          <th className="border border-border p-3 text-left text-sm font-medium">Strain</th>
                          <th className="border border-border p-3 text-left text-sm font-medium">Temperature</th>
                          <th className="border border-border p-3 text-left text-sm font-medium">Risk Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.data.map((item, index) => {
                          const riskScore = (item.displacement / 20) * 0.25 + 
                                           (item.strain / 500) * 0.20 + 
                                           (item.pore_pressure / 100) * 0.15 + 
                                           (item.rainfall / 100) * 0.15 + 
                                           (item.temperature / 50) * 0.10 + 
                                           (item.dem_slope / 90) * 0.10 + 
                                           (item.crack_score / 10) * 0.05;
                          
                          let riskLevel = 'low';
                          let riskVariant: any = 'secondary';
                          if (riskScore > 0.7) { riskLevel = 'high'; riskVariant = 'destructive'; }
                          else if (riskScore > 0.5) { riskLevel = 'medium'; riskVariant = 'outline'; }
                          else if (riskScore > 0.3) { riskLevel = 'low'; riskVariant = 'secondary'; }

                          return (
                            <tr key={index} className="hover:bg-muted/30">
                              <td className="border border-border p-3 text-sm">{item.mine_name}</td>
                              <td className="border border-border p-3 text-sm">{item.location}</td>
                              <td className="border border-border p-3 text-sm">{item.state}</td>
                              <td className="border border-border p-3 text-sm font-medium" 
                                  style={{ color: item.displacement > 7 ? '#ef4444' : item.displacement > 4 ? '#f59e0b' : '#22c55e' }}>
                                {item.displacement} mm
                              </td>
                              <td className="border border-border p-3 text-sm font-medium" 
                                  style={{ color: item.strain > 250 ? '#ef4444' : item.strain > 150 ? '#f59e0b' : '#22c55e' }}>
                                {item.strain} μϵ
                              </td>
                              <td className="border border-border p-3 text-sm font-medium" 
                                  style={{ color: item.temperature > 35 ? '#ef4444' : item.temperature > 30 ? '#f59e0b' : '#22c55e' }}>
                                {item.temperature}°C
                              </td>
                              <td className="border border-border p-3 text-sm">
                                <Badge variant={riskVariant} className="capitalize">{riskLevel}</Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Dynamic Charts Section */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Risk Distribution Chart */}
                  <Card className="p-4">
                    <h4 className="text-lg font-semibold mb-4">Risk Level Distribution</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={[
                        { name: 'Very Low', value: analytics.veryLowRiskCount, fill: '#16a34a' },
                        { name: 'Low', value: analytics.lowRiskCount, fill: '#22c55e' },
                        { name: 'Medium', value: analytics.mediumRiskCount, fill: '#f59e0b' },
                        { name: 'High', value: analytics.highRiskCount, fill: '#ef4444' }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Sensor Data Trends */}
                  <Card className="p-4">
                    <h4 className="text-lg font-semibold mb-4">Average Sensor Readings</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={[
                        { name: 'Displacement', value: analytics.avgDisplacement, color: '#f59e0b' },
                        { name: 'Strain', value: analytics.avgStrain, color: '#3b82f6' },
                        { name: 'Temperature', value: analytics.avgTemperature, color: '#ef4444' },
                        { name: 'Rainfall', value: analytics.avgRainfall, color: '#06b6d4' },
                        { name: 'Crack Score', value: analytics.avgCrackScore, color: '#8b5cf6' }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              </>
            );
          })()}
        </Card>

        {/* Recent Uploads Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentUploadsPanel />
        </div>
      </div>
    )}

      </div>
    </div>
  );
};

export default EnhancedDashboard;