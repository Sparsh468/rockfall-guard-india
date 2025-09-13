import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from "recharts";
import { TrendingUp, TrendingDown, Activity, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useSensorData } from "@/hooks/useSensorData";
import SensorDataToggle from "./SensorDataToggle";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InteractiveChartsProps {
  mineId?: string;
}

const InteractiveCharts = ({ mineId: propMineId }: InteractiveChartsProps) => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [dataMode, setDataMode] = useState<'simulated' | 'live'>('simulated');
  const [mines, setMines] = useState<any[]>([]);
  const [selectedMine, setSelectedMine] = useState<string>(propMineId || '');
  const [selectedMineName, setSelectedMineName] = useState<string>('');
  
  const { 
    sensorData, 
    currentReading, 
    isLoading, 
    lastUpdate, 
    riskScore,
    updateSensorData 
  } = useSensorData({ 
    mode: dataMode, 
    updateInterval: 5, 
    mineId: selectedMine 
  });

  // Fetch mines on component mount
  useEffect(() => {
    const fetchMines = async () => {
      const { data } = await supabase
        .from('mines')
        .select('id, name, location, state')
        .order('name');
      setMines(data || []);
      
      // Set initial mine name if mineId is provided
      if (propMineId && data) {
        const mine = data.find(m => m.id === propMineId);
        if (mine) {
          setSelectedMineName(mine.name);
        }
      }
    };
    fetchMines();
  }, [propMineId]);

  // Handle mine selection
  const handleMineSelection = (mineId: string) => {
    setSelectedMine(mineId);
    const mine = mines.find(m => m.id === mineId);
    if (mine) {
      setSelectedMineName(mine.name);
      toast({
        title: "Mine Selected",
        description: `Now showing data for ${mine.name}`,
      });
    }
  };

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    await updateSensorData();
    setIsManualRefreshing(false);
    toast({
      title: "Data Refreshed",
      description: "Sensor data has been updated",
    });
  };

  const getTrendDirection = (data: any[], field: string) => {
    if (data.length < 2) return 'stable';
    const last = data[data.length - 1][field] as number;
    const previous = data[data.length - 2][field] as number;
    if (!last || !previous) return 'stable';
    const change = ((last - previous) / previous) * 100;
    
    if (change > 2) return 'up';
    if (change < -2) return 'down';
    return 'stable';
  };

  // Transform sensor data for charts
  const chartData = sensorData.map((reading, index) => ({
    time: new Date(reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    displacement: reading.displacement,
    pore_pressure: reading.pore_pressure, // Fixed typo
    rainfall: reading.rainfall,
    temperature: reading.temperature,
    slope: reading.dem_slope,
    strain: reading.strain,
    crack_score: reading.crack_score
  }));

  const formatTooltipValue = (value: number, name: string) => {
    const units = {
      displacement: 'mm',
      poreRressure: 'kPa',
      rainfall: 'mm',
      temperature: '°C',
      slope: '°'
    };
    return [`${value.toFixed(1)} ${units[name as keyof typeof units] || ''}`, name];
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading sensor data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Source Toggle */}
      <SensorDataToggle
        mode={dataMode}
        onModeChange={setDataMode}
        isConnected={dataMode === 'live' && sensorData.length > 0}
        lastUpdate={lastUpdate}
        onRefresh={handleRefresh}
        isRefreshing={isManualRefreshing}
        mineId={selectedMine}
      />

      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Real-Time Sensor Analytics</h2>
          <p className="text-muted-foreground">
            {dataMode === 'live' ? 'Live IoT monitoring' : 'Simulated monitoring'} of critical rockfall indicators
            {selectedMineName && <span className="ml-2 text-primary">• {selectedMineName}</span>}
          </p>
          {riskScore > 0.7 && (
            <Badge variant="destructive" className="mt-2 animate-pulse">
              HIGH RISK: {Math.round(riskScore * 100)}% - Immediate Action Required
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {/* Mine Selection Dropdown */}
          <div className="min-w-[200px]">
            <Select value={selectedMine} onValueChange={handleMineSelection}>
              <SelectTrigger>
                <SelectValue placeholder="Select mine..." />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                {mines.map((mine) => (
                  <SelectItem key={mine.id} value={mine.id}>
                    {mine.name} - {mine.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-1">
            {(['24h', '7d', '30d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={isManualRefreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isManualRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {[
          { 
            key: 'displacement', 
            label: 'Displacement', 
            value: currentReading?.displacement,
            unit: 'mm',
            color: 'text-danger',
            bgColor: 'bg-danger/10'
          },
          { 
            key: 'pore_pressure', 
            label: 'Pore Pressure', 
            value: currentReading?.pore_pressure,
            unit: 'kPa',
            color: 'text-warning',
            bgColor: 'bg-warning/10'
          },
          { 
            key: 'rainfall', 
            label: 'Rainfall', 
            value: currentReading?.rainfall,
            unit: 'mm',
            color: 'text-primary',
            bgColor: 'bg-primary/10'
          },
          { 
            key: 'temperature', 
            label: 'Temperature', 
            value: currentReading?.temperature,
            unit: '°C',
            color: 'text-safe',
            bgColor: 'bg-safe/10'
          },
          { 
            key: 'slope', 
            label: 'Slope Angle', 
            value: currentReading?.dem_slope,
            unit: '°',
            color: 'text-accent',
            bgColor: 'bg-accent/10'
          },
          { 
            key: 'strain', 
            label: 'Strain', 
            value: currentReading?.strain,
            unit: 'µε',
            color: 'text-chart-2',
            bgColor: 'bg-chart-2/10'
          },
          { 
            key: 'crack_score', 
            label: 'Crack Score', 
            value: currentReading?.crack_score,
            unit: '/10',
            color: 'text-chart-3',
            bgColor: 'bg-chart-3/10'
          },
        ].map((metric) => {
          const trend = getTrendDirection(chartData, metric.key);
          return (
            <Card key={metric.key} className={`p-4 ${metric.bgColor} border-border/50`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">{metric.label}</h3>
                {trend === 'up' && <TrendingUp className="w-4 h-4 text-danger" />}
                {trend === 'down' && <TrendingDown className="w-4 h-4 text-safe" />}
                {trend === 'stable' && <Activity className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div className="flex items-baseline space-x-1">
                <span className={`text-2xl font-bold ${metric.color}`}>
                  {metric.value?.toFixed(1) || '0.0'}
                </span>
                <span className="text-sm text-muted-foreground">{metric.unit}</span>
              </div>
              <Badge 
                variant={trend === 'up' ? 'destructive' : trend === 'down' ? 'outline' : 'secondary'}
                className="mt-2 text-xs"
              >
                {trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}
              </Badge>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Displacement Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <div className="w-3 h-3 bg-danger rounded-full" />
            <span>Ground Displacement Trend</span>
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--chart-text))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--chart-text))"
                fontSize={12}
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value, name) => formatTooltipValue(value as number, name as string)}
              />
              <Area 
                type="monotone" 
                dataKey="displacement" 
                stroke="hsl(var(--danger))" 
                fill="hsl(var(--danger))"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Pore Pressure */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <div className="w-3 h-3 bg-warning rounded-full" />
            <span>Pore Pressure Analysis</span>
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--chart-text))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--chart-text))"
                fontSize={12}
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value, name) => formatTooltipValue(value as number, name as string)}
              />
              <Line 
                type="monotone" 
                dataKey="pore_pressure" 
                stroke="hsl(var(--warning))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--warning))', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Environmental Factors */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary rounded-full" />
            <span>Environmental Conditions</span>
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--chart-text))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--chart-text))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value, name) => formatTooltipValue(value as number, name as string)}
              />
              <Bar 
                dataKey="rainfall" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Multi-Parameter Overview */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <div className="w-3 h-3 bg-accent rounded-full" />
            <span>Multi-Parameter Overview</span>
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--chart-text))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--chart-text))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value, name) => formatTooltipValue(value as number, name as string)}
              />
              <Line 
                type="monotone" 
                dataKey="temperature" 
                stroke="hsl(var(--safe))" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="slope" 
                stroke="hsl(var(--accent))" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default InteractiveCharts;