import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const InteractiveCharts = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  // Mock real-time data - would come from your sensor API
  const [sensorData, setSensorData] = useState([
    { time: '00:00', displacement: 2.3, poreRressure: 45.2, rainfall: 0, temperature: 22.5, slope: 15.2 },
    { time: '04:00', displacement: 2.5, poreRressure: 46.1, rainfall: 2.1, temperature: 21.8, slope: 15.3 },
    { time: '08:00', displacement: 2.8, poreRressure: 47.5, rainfall: 5.3, temperature: 24.2, slope: 15.5 },
    { time: '12:00', displacement: 3.2, poreRressure: 48.9, rainfall: 8.7, temperature: 26.1, slope: 15.8 },
    { time: '16:00', displacement: 3.6, poreRressure: 50.2, rainfall: 12.4, temperature: 25.3, slope: 16.1 },
    { time: '20:00', displacement: 4.1, poreRressure: 52.1, rainfall: 15.8, temperature: 23.7, slope: 16.4 },
    { time: 'Now', displacement: 4.5, poreRressure: 53.5, rainfall: 18.2, temperature: 22.9, slope: 16.7 },
  ]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update with new mock data
    setSensorData(prev => [
      ...prev.slice(1),
      {
        time: 'Now',
        displacement: prev[prev.length - 1].displacement + (Math.random() - 0.5) * 0.3,
        poreRressure: prev[prev.length - 1].poreRressure + (Math.random() - 0.5) * 2,
        rainfall: Math.max(0, prev[prev.length - 1].rainfall + (Math.random() - 0.3) * 3),
        temperature: prev[prev.length - 1].temperature + (Math.random() - 0.5) * 1.5,
        slope: prev[prev.length - 1].slope + (Math.random() - 0.5) * 0.2,
      }
    ]);
    setIsRefreshing(false);
  };

  const getTrendDirection = (data: any[], field: string) => {
    if (data.length < 2) return 'stable';
    const last = data[data.length - 1][field] as number;
    const previous = data[data.length - 2][field] as number;
    const change = ((last - previous) / previous) * 100;
    
    if (change > 2) return 'up';
    if (change < -2) return 'down';
    return 'stable';
  };

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

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Real-Time Sensor Analytics</h2>
          <p className="text-muted-foreground">Live monitoring of critical rockfall indicators</p>
        </div>
        <div className="flex items-center space-x-3">
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
            disabled={isRefreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { 
            key: 'displacement', 
            label: 'Displacement', 
            value: sensorData[sensorData.length - 1]?.displacement,
            unit: 'mm',
            color: 'text-danger',
            bgColor: 'bg-danger/10'
          },
          { 
            key: 'poreRressure', 
            label: 'Pore Pressure', 
            value: sensorData[sensorData.length - 1]?.poreRressure,
            unit: 'kPa',
            color: 'text-warning',
            bgColor: 'bg-warning/10'
          },
          { 
            key: 'rainfall', 
            label: 'Rainfall', 
            value: sensorData[sensorData.length - 1]?.rainfall,
            unit: 'mm',
            color: 'text-primary',
            bgColor: 'bg-primary/10'
          },
          { 
            key: 'temperature', 
            label: 'Temperature', 
            value: sensorData[sensorData.length - 1]?.temperature,
            unit: '°C',
            color: 'text-safe',
            bgColor: 'bg-safe/10'
          },
          { 
            key: 'slope', 
            label: 'Slope Angle', 
            value: sensorData[sensorData.length - 1]?.slope,
            unit: '°',
            color: 'text-accent',
            bgColor: 'bg-accent/10'
          },
        ].map((metric) => {
          const trend = getTrendDirection(sensorData, metric.key);
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
                  {metric.value?.toFixed(1)}
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
            <AreaChart data={sensorData}>
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
            <LineChart data={sensorData}>
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
                dataKey="poreRressure" 
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
            <BarChart data={sensorData}>
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
            <LineChart data={sensorData}>
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