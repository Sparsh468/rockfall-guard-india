import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { RefreshCw, MapPin, Activity, Thermometer, CloudRain } from 'lucide-react';

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

interface MineSelectorProps {
  onMineSelect: (mine: Mine) => void;
  selectedMineId?: string;
  autoLoadData?: boolean;
}

const MineSelector = ({ onMineSelect, selectedMineId, autoLoadData = true }: MineSelectorProps) => {
  const [mines, setMines] = useState<Mine[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchMines = async () => {
    try {
      const { data, error } = await supabase
        .from('mines')
        .select('*')
        .order('name');

      if (error) throw error;
      setMines(data || []);
      
      // Auto-select first mine if autoLoadData is true and no mine is selected
      if (autoLoadData && data && data.length > 0 && !selectedMineId) {
        onMineSelect(data[0]);
      }
    } catch (error) {
      console.error('Error fetching mines:', error);
      toast({
        title: "Error",
        description: "Failed to fetch mines",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMineData = async () => {
    setGenerating(true);
    try {
      toast({
        title: "Generating Data",
        description: "Creating synthetic sensor data for all mines...",
      });

      const { data, error } = await supabase.functions.invoke('generate-mine-data');
      
      if (error) throw error;

      toast({
        title: "Data Generated Successfully",
        description: `Generated sensor data for ${data.mines?.length || 8} mines`,
      });

      // Refresh mines after generation
      await fetchMines();
    } catch (error) {
      console.error('Error generating mine data:', error);
      toast({
        title: "Error",
        description: "Failed to generate mine data",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchMines();
  }, []);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  const getRiskBgColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-danger/10 border-danger/20';
      case 'medium': return 'bg-warning/10 border-warning/20';
      case 'low': return 'bg-safe/10 border-safe/20';
      default: return 'bg-muted/10 border-border';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading mines...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <MapPin className="w-5 h-5" />
          <span>Select Mine for Analysis</span>
        </h3>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMines}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
          {mines.length === 0 && (
            <Button
              onClick={generateMineData}
              disabled={generating}
              className="flex items-center space-x-2"
            >
              <Activity className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              <span>Generate Data</span>
            </Button>
          )}
        </div>
      </div>

      {mines.length === 0 ? (
        <div className="text-center py-8 space-y-4">
          <div className="text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No mine data available</p>
            <p className="text-sm">Click "Generate Data" to create synthetic sensor data for analysis</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mines.map((mine) => (
            <Card
              key={mine.id}
              className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedMineId === mine.id 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:bg-accent/50'
              } ${getRiskBgColor(mine.current_risk_level)}`}
              onClick={() => onMineSelect(mine)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm leading-tight">{mine.name}</h4>
                    <p className="text-xs text-muted-foreground">{mine.location}, {mine.state}</p>
                  </div>
                  <Badge variant={getRiskColor(mine.current_risk_level)} className="text-xs">
                    {mine.current_risk_level.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Risk Probability:</span>
                    <span className="font-medium">
                      {Math.round(mine.current_risk_probability * 100)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Activity className="w-3 h-3 mr-1" />
                    <span>Updated: {new Date(mine.last_updated).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
};

export default MineSelector;