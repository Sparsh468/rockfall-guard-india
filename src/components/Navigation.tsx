import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Map, 
  Upload, 
  TrendingUp, 
  AlertTriangle,
  Home
} from "lucide-react";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'prediction', label: 'Prediction', icon: TrendingUp },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  ];

  return (
    <nav className="bg-card border-b border-border">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              Rockfall Guard India
            </h1>
          </div>
          
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2",
                    activeTab === tab.id && "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;