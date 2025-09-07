import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  X, 
  Phone, 
  Mail,
  MapPin,
  Clock,
  Users
} from "lucide-react";
import { useState } from "react";

interface AlertBannerProps {
  isVisible: boolean;
  onDismiss: () => void;
  alertData: {
    mineName: string;
    riskProbability: number;
    location: string;
    timestamp: string;
    affectedPersonnel: number;
  };
}

const EmergencyAlertBanner = ({ isVisible, onDismiss, alertData }: AlertBannerProps) => {
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  if (!isVisible) return null;

  const handleAcknowledge = () => {
    setIsAcknowledged(true);
    // In production, this would update the alert status in the database
  };

  const handleEmergencyCall = () => {
    // In production, this would trigger emergency protocols
    window.open('tel:+91-112', '_self');
  };

  return (
    <div className="fixed top-20 left-0 right-0 z-50 px-4">
      <Card className="max-w-4xl mx-auto bg-danger/10 border-danger/30 shadow-lg backdrop-blur-sm animate-pulse">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-danger/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-danger animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h2 className="text-xl font-bold text-danger">EMERGENCY ALERT</h2>
                  <Badge variant="destructive" className="animate-pulse">
                    HIGH RISK
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Immediate action required • Alert triggered at {alertData.timestamp}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Alert Details */}
          <div className="bg-card/50 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-lg mb-2">
              High Rockfall Risk Detected at {alertData.mineName}
            </h3>
            <p className="text-danger font-medium mb-3">
              Risk Probability: {Math.round(alertData.riskProbability * 100)}% — Take Precautionary Measures Immediately
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{alertData.location}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{alertData.affectedPersonnel} personnel in area</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>Immediate evacuation required</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleEmergencyCall}
                variant="destructive"
                className="flex items-center space-x-2 bg-danger hover:bg-danger/90"
              >
                <Phone className="w-4 h-4" />
                <span>Emergency Call</span>
              </Button>
              
              <Button
                onClick={() => {/* Send SMS notifications */}}
                variant="outline"
                className="flex items-center space-x-2 border-danger/30 text-danger hover:bg-danger/10"
              >
                <Mail className="w-4 h-4" />
                <span>Notify Personnel</span>
              </Button>
            </div>

            <div className="flex items-center space-x-3">
              {!isAcknowledged && (
                <Button
                  onClick={handleAcknowledge}
                  variant="outline"
                  className="border-warning/30 text-warning hover:bg-warning/10"
                >
                  Acknowledge Alert
                </Button>
              )}
              
              {isAcknowledged && (
                <Badge variant="outline" className="border-safe/30 text-safe">
                  ✓ Acknowledged
                </Badge>
              )}
            </div>
          </div>

          {/* Emergency Instructions */}
          <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <h4 className="font-medium text-warning mb-2">Emergency Protocol:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>1. Immediately evacuate all personnel from the affected area</li>
              <li>2. Establish a safety perimeter of at least 500 meters</li>
              <li>3. Contact emergency services and site safety coordinator</li>
              <li>4. Monitor real-time sensor data for changes</li>
              <li>5. Do not re-enter area until risk level decreases below 40%</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EmergencyAlertBanner;