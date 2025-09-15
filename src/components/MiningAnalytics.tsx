import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  Thermometer, 
  Droplets, 
  Gauge,
  MapPin,
  Clock,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { toast } from '@/hooks/use-toast';

interface SensorData {
  mine_id: number;
  mine_name: string;
  location: string;
  state: string;
  displacement: number;
  strain: number;
  pore_pressure: number;
  rainfall: number;
  temperature: number;
  dem_slope: number;
  crack_score: number;
  timestamp: string;
}

interface AnalyticsData {
  totalMines: number;
  avgDisplacement: number;
  avgStrain: number;
  avgTemperature: number;
  avgRainfall: number;
  avgSlope: number;
  avgCrackScore: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  veryLowRiskCount: number;
  data: SensorData[];
}

const MiningAnalytics = () => {
  const [csvData, setCsvData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMine, setSelectedMine] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('24h');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // Load CSV data
  const loadCsvData = async () => {
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
          return row as SensorData;
        });
      
      setCsvData(data);
      console.log('CSV sensor data loaded:', data.length, 'records');
    } catch (error) {
      console.error('Failed to load CSV sensor data:', error);
      toast({
        title: "Error",
        description: "Failed to load sensor data",
        variant: "destructive",
      });
    }
  };

  // Calculate analytics based on selected mine and time range
  const calculateAnalytics = (): AnalyticsData | null => {
    // Filter out Noamundi and Bokaro as requested
    let filteredData = csvData.filter(data => 
      data.mine_name && 
      data.mine_name.trim() !== '' &&
      !data.mine_name.toLowerCase().includes('noamundi') && 
      !data.mine_name.toLowerCase().includes('bokaro')
    );

    // Filter by selected mine
    if (selectedMine !== 'all') {
      // Find the mine by ID from the original data first
      const selectedMineData = csvData.find(d => d.mine_id.toString() === selectedMine);
      if (selectedMineData && selectedMineData.mine_name) {
        filteredData = filteredData.filter(data => 
          data.mine_id === selectedMineData.mine_id
        );
      }
    }

    if (filteredData.length === 0) return null;

    // Calculate averages
    const avgDisplacement = filteredData.reduce((sum, item) => sum + item.displacement, 0) / filteredData.length;
    const avgStrain = filteredData.reduce((sum, item) => sum + item.strain, 0) / filteredData.length;
    const avgTemperature = filteredData.reduce((sum, item) => sum + item.temperature, 0) / filteredData.length;
    const avgRainfall = filteredData.reduce((sum, item) => sum + item.rainfall, 0) / filteredData.length;
    const avgSlope = filteredData.reduce((sum, item) => sum + item.dem_slope, 0) / filteredData.length;
    const avgCrackScore = filteredData.reduce((sum, item) => sum + item.crack_score, 0) / filteredData.length;

    // Calculate risk levels
    const riskLevels = filteredData.map(item => {
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
      totalMines: selectedMine === 'all' ? filteredData.length : 1,
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
      data: filteredData
    };
  };

  // Get unique mines for dropdown (excluding Noamundi and Bokaro)
  const getAvailableMines = () => {
    const mines = csvData.filter(data => 
      data.mine_name && 
      data.mine_name.trim() !== '' &&
      !data.mine_name.toLowerCase().includes('noamundi') && 
      !data.mine_name.toLowerCase().includes('bokaro')
    );
    
    const uniqueMines = mines.reduce((acc, current) => {
      const existing = acc.find(item => item.mine_id === current.mine_id);
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, [] as SensorData[]);
    
    return uniqueMines;
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCsvData();
    setRefreshing(false);
    toast({
      title: "Data Refreshed",
      description: "Sensor data has been updated",
    });
  };

  // Export data
  const handleExport = () => {
    if (!analyticsData) return;
    
    const csvContent = [
      'Mine Name,Location,State,Displacement (mm),Strain (με),Temperature (°C),Rainfall (mm),Slope (°),Crack Score,Risk Level',
      ...analyticsData.data.map(item => {
        const riskScore = (item.displacement / 20) * 0.25 + 
                         (item.strain / 500) * 0.20 + 
                         (item.pore_pressure / 100) * 0.15 + 
                         (item.rainfall / 100) * 0.15 + 
                         (item.temperature / 50) * 0.10 + 
                         (item.dem_slope / 90) * 0.10 + 
                         (item.crack_score / 10) * 0.05;
        
        let riskLevel = 'very_low';
        if (riskScore > 0.7) riskLevel = 'high';
        else if (riskScore > 0.5) riskLevel = 'medium';
        else if (riskScore > 0.3) riskLevel = 'low';
        
        return `${item.mine_name},${item.location},${item.state},${item.displacement},${item.strain},${item.temperature},${item.rainfall},${item.dem_slope},${item.crack_score},${riskLevel}`;
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mining-analytics-${selectedMine}-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: "Analytics data has been exported",
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadCsvData();
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    const analytics = calculateAnalytics();
    setAnalyticsData(analytics);
  }, [csvData, selectedMine, selectedTimeRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-monitoring-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading mining analytics...</p>
        </div>
      </div>
    );
  }

  const availableMines = getAvailableMines();

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mining Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Real-time sensor data from all mines
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!analyticsData}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Mine:</span>
          <Select value={selectedMine} onValueChange={setSelectedMine}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a mine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Mines</SelectItem>
              {availableMines.map((mine) => (
                <SelectItem key={mine.mine_id} value={mine.mine_id.toString()}>
                  {mine.mine_name} - {mine.state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Time Range:</span>
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {analyticsData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mines Monitored</p>
                  <p className="text-2xl font-bold">{analyticsData.totalMines}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">High Risk</p>
                  <p className="text-2xl font-bold text-red-600">{analyticsData.highRiskCount}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Medium Risk</p>
                  <p className="text-2xl font-bold text-yellow-600">{analyticsData.mediumRiskCount}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Low Risk</p>
                  <p className="text-2xl font-bold text-green-600">{analyticsData.lowRiskCount}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sensor Data Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Sensor Data Summary</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Gauge className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium">Displacement</span>
                    </div>
                    <span className="text-sm font-bold text-orange-600">{analyticsData.avgDisplacement} mm</span>
                  </div>
                  <Progress value={(analyticsData.avgDisplacement / 20) * 100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Strain</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600">{analyticsData.avgStrain} μϵ</span>
                  </div>
                  <Progress value={(analyticsData.avgStrain / 500) * 100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Thermometer className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium">Temperature</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">{analyticsData.avgTemperature}°C</span>
                  </div>
                  <Progress value={(analyticsData.avgTemperature / 50) * 100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Rainfall</span>
                    </div>
                    <span className="text-sm font-bold text-blue-500">{analyticsData.avgRainfall} mm</span>
                  </div>
                  <Progress value={(analyticsData.avgRainfall / 100) * 100} className="h-2" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Risk Level Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Very Low', value: analyticsData.veryLowRiskCount, color: '#16a34a' },
                      { name: 'Low', value: analyticsData.lowRiskCount, color: '#22c55e' },
                      { name: 'Medium', value: analyticsData.mediumRiskCount, color: '#f59e0b' },
                      { name: 'High', value: analyticsData.highRiskCount, color: '#ef4444' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {[
                      { name: 'Very Low', value: analyticsData.veryLowRiskCount, color: '#16a34a' },
                      { name: 'Low', value: analyticsData.lowRiskCount, color: '#22c55e' },
                      { name: 'Medium', value: analyticsData.mediumRiskCount, color: '#f59e0b' },
                      { name: 'High', value: analyticsData.highRiskCount, color: '#ef4444' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center space-x-4 mt-4">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs">High: {analyticsData.highRiskCount}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-xs">Medium: {analyticsData.mediumRiskCount}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs">Low: {analyticsData.lowRiskCount}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Sensor Readings Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'Displacement', value: analyticsData.avgDisplacement, fill: '#f59e0b' },
                  { name: 'Strain', value: analyticsData.avgStrain / 10, fill: '#3b82f6' },
                  { name: 'Temperature', value: analyticsData.avgTemperature, fill: '#ef4444' },
                  { name: 'Rainfall', value: analyticsData.avgRainfall, fill: '#06b6d4' },
                  { name: 'Crack Score', value: analyticsData.avgCrackScore, fill: '#8b5cf6' }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Risk Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { name: 'High Risk', value: analyticsData.highRiskCount, color: '#ef4444' },
                  { name: 'Medium Risk', value: analyticsData.mediumRiskCount, color: '#f59e0b' },
                  { name: 'Low Risk', value: analyticsData.lowRiskCount, color: '#22c55e' },
                  { name: 'Very Low Risk', value: analyticsData.veryLowRiskCount, color: '#16a34a' }
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

          {/* Data Table */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {selectedMine === 'all' ? 'All Mines Data' : 'Mine Details'}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Last updated: {new Date().toLocaleString()}</span>
              </div>
            </div>
            
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
                  {analyticsData.data.map((item, index) => {
                    const riskScore = (item.displacement / 20) * 0.25 + 
                                     (item.strain / 500) * 0.20 + 
                                     (item.pore_pressure / 100) * 0.15 + 
                                     (item.rainfall / 100) * 0.15 + 
                                     (item.temperature / 50) * 0.10 + 
                                     (item.dem_slope / 90) * 0.10 + 
                                     (item.crack_score / 10) * 0.05;
                    
                    let riskLevel = 'very_low';
                    let riskVariant: any = 'secondary';
                    if (riskScore > 0.7) { riskLevel = 'high'; riskVariant = 'destructive'; }
                    else if (riskScore > 0.5) { riskLevel = 'medium'; riskVariant = 'outline'; }
                    else if (riskScore > 0.3) { riskLevel = 'low'; riskVariant = 'secondary'; }

                    return (
                      <tr key={index} className="hover:bg-muted/30">
                        <td className="border border-border p-3 text-sm font-medium">{item.mine_name}</td>
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
          </Card>
        </>
      ) : (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
            <div>
              <h3 className="text-lg font-medium">No Data Available</h3>
              <p className="text-sm text-muted-foreground">
                No sensor data found for the selected criteria
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MiningAnalytics;
