import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { TrendingUp, Activity, Droplets, Thermometer, Gauge, Download, RefreshCw } from 'lucide-react';
import { useSensorData } from '@/hooks/useSensorData';

interface SensorData {
  id: string;
  timestamp: string;
  displacement: number;
  strain: number;
  pore_pressure: number;
  rainfall: number;
  temperature: number;
  crack_score: number;
  mine_id: string;
}

interface Mine {
  id: string;
  name: string;
  location: string;
}

interface InteractiveChartsProps {
  selectedMine?: Mine;
}

const InteractiveCharts = ({ selectedMine }: InteractiveChartsProps) => {
  const [historicalData, setHistoricalData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(false);

  // Get real-time sensor data
  const { sensorData, currentReading, isLoading, lastUpdate, riskScore } = useSensorData({ 
    mode: 'simulated',
    mineId: selectedMine?.id 
  });

  const fetchHistoricalData = async () => {
    if (!selectedMine) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sensor_data')
        .select('*')
        .eq('mine_id', selectedMine.id)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistoricalData(data || []);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch historical sensor data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoricalData();
  }, [selectedMine]);

  // Combine historical and real-time data
  const combinedData = [...(historicalData || []), ...(sensorData || [])]
    .filter((item, index, self) => 
      index === self.findIndex(t => t.timestamp === item.timestamp)
    )
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-24); // Last 24 readings

  const chartData = combinedData.map(reading => ({
    time: new Date(reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    displacement: reading.displacement,
    strain: reading.strain,
    pore_pressure: reading.pore_pressure,
    rainfall: reading.rainfall,
    temperature: reading.temperature,
    crack_score: reading.crack_score
  }));

  if (!selectedMine) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Please select a mine to view analytics</p>
      </Card>
    );
  }

  if (isLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading sensor analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Sensor Analytics</h2>
          <p className="text-muted-foreground">{selectedMine.name} - {selectedMine.location}</p>
          {riskScore > 0.7 && (
            <div className="mt-2 text-danger font-semibold">
              ⚠️ HIGH RISK DETECTED: {Math.round(riskScore * 100)}%
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHistoricalData}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          {lastUpdate && (
            <span className="text-sm text-muted-foreground">
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Current Readings Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { key: 'displacement', label: 'Displacement', value: currentReading?.displacement, unit: 'mm', color: 'text-danger' },
          { key: 'strain', label: 'Strain', value: currentReading?.strain, unit: 'µε', color: 'text-warning' },
          { key: 'pore_pressure', label: 'Pore Pressure', value: currentReading?.pore_pressure, unit: 'kPa', color: 'text-primary' },
          { key: 'rainfall', label: 'Rainfall', value: currentReading?.rainfall, unit: 'mm', color: 'text-blue-500' },
          { key: 'temperature', label: 'Temperature', value: currentReading?.temperature, unit: '°C', color: 'text-green-500' },
          { key: 'crack_score', label: 'Crack Score', value: currentReading?.crack_score, unit: '/10', color: 'text-orange-500' },
        ].map((metric) => (
          <Card key={metric.key} className="p-4 bg-gradient-to-br from-background to-secondary/20">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{metric.label}</h3>
              <div className="flex items-baseline space-x-1">
                <span className={`text-2xl font-bold ${metric.color}`}>
                  {metric.value?.toFixed(1) || '0.0'}
                </span>
                <span className="text-sm text-muted-foreground">{metric.unit}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ground Displacement */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <div className="w-3 h-3 bg-danger rounded-full" />
            <span>Ground Displacement Trend</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" stroke="hsl(var(--foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
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

        {/* Strain Analysis */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <div className="w-3 h-3 bg-warning rounded-full" />
            <span>Strain Analysis</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" stroke="hsl(var(--foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="strain" 
                stroke="hsl(var(--warning))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--warning))', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Environmental Conditions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Droplets className="w-5 h-5 text-primary" />
            <span>Weather Conditions</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" stroke="hsl(var(--foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="rainfall" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Temperature & Pressure */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Thermometer className="w-5 h-5 text-green-500" />
            <span>Temperature & Pressure</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" stroke="hsl(var(--foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
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
                dataKey="pore_pressure" 
                stroke="hsl(var(--primary))" 
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