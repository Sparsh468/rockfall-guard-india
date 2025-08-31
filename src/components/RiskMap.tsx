import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MapPin, TrendingUp, Clock } from "lucide-react";

const RiskMap = () => {
  const mineLocations = [
    { id: 1, name: 'Jharia Coalfield', state: 'Jharkhand', risk: 'high', x: 68, y: 45, incidents: 12, lastUpdate: '2h ago' },
    { id: 2, name: 'Talcher Coalfield', state: 'Odisha', risk: 'medium', x: 72, y: 52, incidents: 6, lastUpdate: '4h ago' },
    { id: 3, name: 'Korba Coalfield', state: 'Chhattisgarh', risk: 'high', x: 65, y: 55, incidents: 8, lastUpdate: '1h ago' },
    { id: 4, name: 'Raniganj Coalfield', state: 'West Bengal', risk: 'low', x: 75, y: 48, incidents: 2, lastUpdate: '6h ago' },
    { id: 5, name: 'Singrauli Coalfield', state: 'Madhya Pradesh', risk: 'medium', x: 62, y: 50, incidents: 4, lastUpdate: '3h ago' },
    { id: 6, name: 'Bellary Iron Ore', state: 'Karnataka', risk: 'medium', x: 58, y: 70, incidents: 5, lastUpdate: '5h ago' },
    { id: 7, name: 'Bailadila Iron Ore', state: 'Chhattisgarh', risk: 'high', x: 64, y: 58, incidents: 9, lastUpdate: '30m ago' },
    { id: 8, name: 'Goa Iron Ore', state: 'Goa', risk: 'low', x: 54, y: 72, incidents: 1, lastUpdate: '8h ago' },
  ];

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

  return (
    <div className="space-y-6">
      {/* Live Status Banner */}
      <Card className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
            <span className="font-medium">Live Monitoring Active</span>
            <Badge variant="outline" className="border-primary/30">
              Real-time Data
            </Badge>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Last updated: 2 minutes ago</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* India Map */}
        <Card className="xl:col-span-2 p-6">
          <h3 className="text-lg font-semibold mb-4">India Mining Risk Map</h3>
          <div className="relative w-full h-[500px] bg-monitoring-bg rounded-lg overflow-hidden">
            {/* Simplified India Map SVG */}
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full"
              style={{ background: 'linear-gradient(45deg, hsl(var(--monitoring-bg)), hsl(var(--card)))' }}
            >
              {/* India outline - simplified */}
              <path
                d="M 20 20 Q 30 15 40 20 Q 50 18 60 22 Q 70 25 75 30 Q 80 35 82 45 Q 85 55 82 65 Q 80 75 75 80 Q 65 85 55 82 Q 45 80 35 78 Q 25 75 20 70 Q 15 60 18 50 Q 16 40 20 30 Z"
                fill="hsl(var(--secondary))"
                stroke="hsl(var(--border))"
                strokeWidth="0.5"
                opacity="0.8"
              />
              
              {/* State boundaries */}
              <g stroke="hsl(var(--border))" strokeWidth="0.2" fill="none" opacity="0.3">
                <path d="M 25 25 Q 35 20 45 25 Q 55 30 65 35" />
                <path d="M 30 40 Q 40 35 50 40 Q 60 45 70 50" />
                <path d="M 25 55 Q 35 50 45 55 Q 55 60 65 65" />
              </g>

              {/* Mine locations */}
              {mineLocations.map((mine) => (
                <g key={mine.id}>
                  <circle
                    cx={mine.x}
                    cy={mine.y}
                    r="2"
                    className={`${getRiskColor(mine.risk)} transition-all duration-300 hover:r-3`}
                    style={{ 
                      filter: `drop-shadow(0 0 8px hsl(var(--${mine.risk === 'high' ? 'danger' : mine.risk === 'medium' ? 'warning' : 'safe'})))`
                    }}
                  />
                  <circle
                    cx={mine.x}
                    cy={mine.y}
                    r="4"
                    fill="none"
                    stroke={mine.risk === 'high' ? 'hsl(var(--danger))' : mine.risk === 'medium' ? 'hsl(var(--warning))' : 'hsl(var(--safe))'}
                    strokeWidth="0.5"
                    opacity="0.6"
                    className="animate-pulse"
                  />
                </g>
              ))}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 space-y-2">
              <h4 className="text-sm font-medium">Risk Levels</h4>
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
            </div>
          </div>
        </Card>

        {/* Mine Details */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Active Mines</h3>
          <div className="space-y-3 max-h-[460px] overflow-y-auto">
            {mineLocations.map((mine) => (
              <div key={mine.id} className="p-3 bg-secondary/30 rounded-lg border border-border/50 hover:bg-secondary/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h4 className="font-medium text-sm">{mine.name}</h4>
                  </div>
                  <Badge variant={getRiskBadgeVariant(mine.risk)} className="text-xs">
                    {mine.risk.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>{mine.state}</p>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{mine.incidents} incidents</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{mine.lastUpdate}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RiskMap;