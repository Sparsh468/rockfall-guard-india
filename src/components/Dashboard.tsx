import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, TrendingUp, AlertTriangle, Users, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rockfall Timeline Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Rockfall Incidents Timeline</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={rockfallData}>
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
              <Line 
                type="monotone" 
                dataKey="incidents" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="injuries" 
                stroke="hsl(var(--warning))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--warning))', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* State Risk Overview */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">State Risk Overview</h3>
          <div className="space-y-4">
            {stateData.map((state, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getRiskColor(state.risk)}`} />
                  <div>
                    <p className="font-medium">{state.state}</p>
                    <p className="text-sm text-muted-foreground">{state.mines} active mines</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${getRiskTextColor(state.risk)}`}>
                    {state.risk.toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">{state.lastIncident}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          size="lg" 
          className="h-16 bg-primary hover:bg-primary/90"
          onClick={() => onNavigate('upload')}
        >
          <Upload className="w-5 h-5 mr-2" />
          Upload Drone Images
        </Button>
        
        <Button 
          size="lg" 
          variant="outline" 
          className="h-16 border-primary/20 hover:bg-primary/10"
          onClick={() => onNavigate('prediction')}
        >
          <TrendingUp className="w-5 h-5 mr-2" />
          Predict Rockfall
        </Button>
        
        <Button 
          size="lg" 
          variant="outline" 
          className="h-16 border-danger/20 hover:bg-danger/10 text-danger hover:text-danger"
          onClick={() => onNavigate('alerts')}
        >
          <AlertTriangle className="w-5 h-5 mr-2" />
          Manage Alerts
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;