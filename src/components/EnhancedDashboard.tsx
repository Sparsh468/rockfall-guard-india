import { useState, useEffect } from 'react';
import MineSelector from './MineSelector';
import AutoDataLoader from './AutoDataLoader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Upload, TrendingUp, AlertTriangle, Users, Activity, MapPin, Clock, 
  RefreshCw, LogOut, Image as ImageIcon, Zap, BarChart3, Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import indiaMapImage from "@/assets/india-map.jpg";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import EmergencyAlertModal from './EmergencyAlertModal';
import InteractiveCharts from "./InteractiveCharts";
import PredictionResultsPanel from "./PredictionResultsPanel";
import RecentUploadsPanel from "./RecentUploadsPanel";
import RiskEngine from "./RiskEngine";
import { useSensorData } from "@/hooks/useSensorData";

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
  const [selectedMine, setSelectedMine] = useState<Mine | null>(null);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [highRiskAlerts, setHighRiskAlerts] = useState<Mine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'charts' | 'predictions'>('overview');
  const [mapError, setMapError] = useState(false);
  const [alertModalData, setAlertModalData] = useState<{
    mineName: string;
    riskProbability: number;
    location: string;
    timestamp: string;
    affectedPersonnel: number;
  } | null>(null);

  // Real-time sensor monitoring for risk assessment
  const { riskScore: currentRiskScore, currentReading, sensorData: realTimeSensorData } = useSensorData({ 
    mode: 'simulated', 
    mineId: selectedMine?.id 
  });

  const fetchData = async () => {
    try {
      // Fetch mines data
      const { data: minesData, error: minesError } = await supabase
        .from('mines')
        .select('*')
        .order('last_updated', { ascending: false });

      if (minesError) throw minesError;
      setMines(minesData || []);

      // Auto-select first mine if none selected
      if (!selectedMine && minesData && minesData.length > 0) {
        setSelectedMine(minesData[0]);
      }

      // Fetch sensor data for selected mine or all mines
      let sensorQuery = supabase
        .from('sensor_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);
      
      if (selectedMine) {
        sensorQuery = sensorQuery.eq('mine_id', selectedMine.id);
      }

      const { data: sensorDataResult, error: sensorError } = await sensorQuery;
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
                <h1 className="text-xl font-bold">RockFall Guard India</h1>
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
              { id: 'predictions', label: 'AI Predictions', icon: Target },
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
        {/* Auto Data Loader */}
        <AutoDataLoader />
        
        {/* Mine Selector */}
        <div className="mt-6">
          <MineSelector 
            onMineSelect={setSelectedMine} 
            selectedMineId={selectedMine?.id}
            autoLoadData={true}
          />
        </div>

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
          <Card className="xl:col-span-2 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Live India Mining Risk Map</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">Live Updates</span>
              </div>
            </div>
            
            {mapError ? (
              <div className="relative w-full h-[400px] bg-secondary/30 rounded-lg flex flex-col items-center justify-center space-y-4 border border-border">
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
            <div className="relative w-full h-[400px] bg-gradient-to-br from-monitoring-bg to-secondary/20 rounded-lg overflow-hidden border border-border/50">
              <img 
                src={indiaMapImage} 
                alt="India Map" 
                className="absolute inset-0 w-full h-full object-contain opacity-60"
              />
              
              {/* Mine Locations */}
              <div className="absolute inset-0">
                {mines.map((mine) => {
                  // Convert lat/lng to approximate % positions (simplified)
                  const x = ((mine.longitude - 68) / (97 - 68)) * 100;
                  const y = ((28 - mine.latitude) / (28 - 8)) * 100;
                  
                  return (
                    <div
                      key={mine.id}
                      className="absolute group/mine cursor-pointer"
                      style={{ left: `${Math.max(0, Math.min(100, x))}%`, top: `${Math.max(0, Math.min(100, y))}%` }}
                    >
                      <div className={`w-4 h-4 rounded-full ${getRiskColor(mine.current_risk_level)} 
                        animate-pulse shadow-lg transform group-hover/mine:scale-125 transition-transform duration-300`}
                      />
                      
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

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2">Risk Levels</h4>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-danger rounded-full animate-pulse" />
                    <span className="text-xs">High Risk</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-warning rounded-full animate-pulse" />
                    <span className="text-xs">Medium Risk</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-safe rounded-full animate-pulse" />
                    <span className="text-xs">Low Risk</span>
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

          {/* Sensor Trends */}
          <Card className="xl:col-span-2 p-6">
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
          </Card>
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
                  className="w-full justify-start"
                  onClick={() => {
                    onTabChange?.('prediction');
                    toast({
                      title: "Navigating to Prediction",
                      description: "Opening AI prediction interface",
                    });
                  }}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Run Prediction
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
      <div className="space-y-8">
        <InteractiveCharts selectedMine={selectedMine} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentUploadsPanel />
        </div>
      </div>
    )}

    {/* AI Predictions Section */}
        {activeSection === 'predictions' && (
          <div className="space-y-8">
            <PredictionResultsPanel />
            <RiskEngine mineId={mines[0]?.id} onAlertTriggered={(level, message) => {
              if (level === 'high') {
                setAlertModalData({
                  mineName: mines[0]?.name || 'Unknown Mine',
                  riskProbability: currentRiskScore,
                  location: mines[0]?.location || 'Unknown Location',
                  timestamp: new Date().toLocaleString(),
                  affectedPersonnel: Math.floor(Math.random() * 25) + 5
                });
              }
            }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedDashboard;