import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, TrendingUp, AlertTriangle, Users, Activity, MapPin, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import indiaMapImage from "@/assets/india-map.jpg";

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

const rockfallData = [
  { month: 'Jan', incidents: 15, injuries: 3, deaths: 0 },
  { month: 'Feb', incidents: 22, injuries: 5, deaths: 1 },
  { month: 'Mar', incidents: 18, injuries: 2, deaths: 0 },
  { month: 'Apr', incidents: 31, injuries: 8, deaths: 2 },
  { month: 'May', incidents: 25, injuries: 4, deaths: 1 },
  { month: 'Jun', incidents: 28, injuries: 6, deaths: 0 },
];

const stateData = [
  { state: 'Jharkhand', risk: 'high', mines: 45, lastIncident: '2 days ago' },
  { state: 'Odisha', risk: 'medium', mines: 38, lastIncident: '1 week ago' },
  { state: 'Chhattisgarh', risk: 'high', mines: 32, lastIncident: '1 day ago' },
  { state: 'West Bengal', risk: 'low', mines: 28, lastIncident: '2 weeks ago' },
  { state: 'Karnataka', risk: 'medium', mines: 24, lastIncident: '4 days ago' },
];

const riskDistribution = [
  { name: 'High Risk', value: 35, color: 'hsl(var(--danger))' },
  { name: 'Medium Risk', value: 45, color: 'hsl(var(--warning))' },
  { name: 'Low Risk', value: 20, color: 'hsl(var(--safe))' }
];

const mineLocations = [
  { id: 1, name: 'Jharia Coalfield', state: 'Jharkhand', risk: 'high', x: 52, y: 35, incidents: 12 },
  { id: 2, name: 'Talcher Coalfield', state: 'Odisha', risk: 'medium', x: 58, y: 42, incidents: 6 },
  { id: 3, name: 'Korba Coalfield', state: 'Chhattisgarh', risk: 'high', x: 48, y: 45, incidents: 8 },
  { id: 4, name: 'Raniganj Coalfield', state: 'West Bengal', risk: 'low', x: 62, y: 38, incidents: 2 },
  { id: 5, name: 'Singrauli Coalfield', state: 'Madhya Pradesh', risk: 'medium', x: 45, y: 40, incidents: 4 },
];

const Dashboard = ({ onNavigate }: DashboardProps) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-danger';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-safe';
      default: return 'bg-muted';
    }
  };

  const getRiskTextColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-danger-foreground';
      case 'medium': return 'text-warning-foreground';
      case 'low': return 'text-safe-foreground';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-danger/20 to-danger/10 border-danger/20">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-danger/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-danger" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">High Risk Mines</p>
              <p className="text-2xl font-bold text-danger">24</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-warning/20 to-warning/10 border-warning/20">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-warning/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Incidents</p>
              <p className="text-2xl font-bold text-warning">139</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-primary/20 to-primary/10 border-primary/20">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary/20 rounded-lg">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Injuries (6M)</p>
              <p className="text-2xl font-bold text-primary">28</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-safe/20 to-safe/10 border-safe/20">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-safe/20 rounded-lg">
              <Activity className="w-6 h-6 text-safe" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Mines</p>
              <p className="text-2xl font-bold text-safe">167</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Interactive India Map */}
        <Card className="xl:col-span-2 p-6 overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Live India Mining Risk Map</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">Live Updates</span>
            </div>
          </div>
          <div className="relative w-full h-[400px] bg-gradient-to-br from-monitoring-bg to-secondary/20 rounded-lg overflow-hidden border border-border/50">
            <img 
              src={indiaMapImage} 
              alt="India Map" 
              className="absolute inset-0 w-full h-full object-contain opacity-60 group-hover:opacity-80 transition-opacity duration-500"
            />
            
            {/* Interactive Mine Locations */}
            <div className="absolute inset-0">
              {mineLocations.map((mine) => (
                <div
                  key={mine.id}
                  className="absolute group/mine cursor-pointer"
                  style={{ left: `${mine.x}%`, top: `${mine.y}%` }}
                >
                  <div className={`w-4 h-4 rounded-full ${getRiskColor(mine.risk)} 
                    animate-pulse shadow-lg transform group-hover/mine:scale-125 transition-transform duration-300
                    ${mine.risk === 'high' ? 'shadow-danger/50' : mine.risk === 'medium' ? 'shadow-warning/50' : 'shadow-safe/50'}`}
                  />
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 
                    bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 
                    opacity-0 group-hover/mine:opacity-100 transition-opacity duration-300 pointer-events-none
                    min-w-[180px] z-10 shadow-lg">
                    <p className="font-medium text-sm">{mine.name}</p>
                    <p className="text-xs text-muted-foreground">{mine.state}</p>
                    <p className={`text-xs mt-1 ${getRiskTextColor(mine.risk)}`}>
                      {mine.risk.toUpperCase()} RISK • {mine.incidents} incidents
                    </p>
                  </div>
                </div>
              ))}
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
        </Card>

        {/* Risk Distribution Pie Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={riskDistribution}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {riskDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {riskDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
                <span className="text-sm font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Enhanced Timeline Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Rockfall Incidents & Casualties Timeline</h3>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Last 6 months</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={rockfallData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="incidentsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="injuriesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="deathsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--danger))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--danger))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
            <XAxis dataKey="month" stroke="hsl(var(--chart-text))" />
            <YAxis stroke="hsl(var(--chart-text))" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }} 
            />
            <Area
              type="monotone"
              dataKey="incidents"
              stroke="hsl(var(--primary))"
              fillOpacity={1}
              fill="url(#incidentsGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="injuries"
              stroke="hsl(var(--warning))"
              fillOpacity={1}
              fill="url(#injuriesGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="deaths"
              stroke="hsl(var(--danger))"
              fillOpacity={1}
              fill="url(#deathsGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Enhanced Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          size="lg" 
          className="h-20 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 
            shadow-lg hover:shadow-primary/25 transition-all duration-300 group"
          onClick={() => onNavigate('upload')}
        >
          <div className="flex flex-col items-center space-y-1">
            <Upload className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-sm font-medium">Upload Drone Images</span>
          </div>
        </Button>
        
        <Button 
          size="lg" 
          variant="outline" 
          className="h-20 border-primary/30 hover:bg-primary/10 hover:border-primary/50 
            shadow-lg hover:shadow-primary/20 transition-all duration-300 group"
          onClick={() => onNavigate('prediction')}
        >
          <div className="flex flex-col items-center space-y-1">
            <TrendingUp className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-sm font-medium">Predict Rockfall</span>
          </div>
        </Button>
        
        <Button 
          size="lg" 
          variant="outline" 
          className="h-20 border-danger/30 hover:bg-danger/10 hover:border-danger/50 text-danger hover:text-danger
            shadow-lg hover:shadow-danger/20 transition-all duration-300 group"
          onClick={() => onNavigate('alerts')}
        >
          <div className="flex flex-col items-center space-y-1">
            <AlertTriangle className="w-6 h-6 group-hover:scale-110 transition-transform duration-300 animate-pulse" />
            <span className="text-sm font-medium">Manage Alerts</span>
          </div>
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;