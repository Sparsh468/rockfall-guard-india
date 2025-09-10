import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  AlertTriangle, 
  Phone, 
  Users, 
  MapPin, 
  Clock, 
  ChevronDown,
  CheckCircle,
  X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface EmergencyAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alertData?: {
    mineName: string;
    riskProbability: number;
    location: string;
    timestamp: string;
    affectedPersonnel: number;
  };
}

const EmergencyAlertModal = ({ isOpen, onClose, alertData }: EmergencyAlertModalProps) => {
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [showProtocol, setShowProtocol] = useState(false);

  if (!alertData) return null;

  const handleEmergencyCall = () => {
    toast({
      title: "Emergency Call Initiated",
      description: "Connecting to emergency response team...",
      variant: "destructive",
    });
  };

  const handleNotifyPersonnel = () => {
    toast({
      title: "Personnel Notified",
      description: `Alert sent to ${alertData.affectedPersonnel} personnel in the area`,
    });
  };

  const handleAcknowledge = () => {
    setIsAcknowledged(true);
    toast({
      title: "Alert Acknowledged",
      description: "High-risk alert has been acknowledged by operator",
    });
    setTimeout(() => onClose(), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-danger/20 bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-danger">
            <AlertTriangle className="w-5 h-5" />
            <span>HIGH ROCKFALL RISK DETECTED</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Critical Info */}
          <div className="p-4 bg-danger/10 border border-danger/20 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Risk Level</span>
                <Badge variant="destructive" className="font-bold">
                  {(alertData.riskProbability * 100).toFixed(0)}% HIGH RISK
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{alertData.mineName}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{alertData.location}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{alertData.timestamp}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-warning" />
                  <span className="text-sm font-medium text-warning">
                    {alertData.affectedPersonnel} Personnel at Risk
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Required Actions */}
          <div className="space-y-3">
            <h4 className="font-medium">Required Actions:</h4>
            <div className="grid grid-cols-1 gap-2">
              <Button 
                onClick={handleEmergencyCall}
                className="w-full bg-danger hover:bg-danger/90 text-danger-foreground"
                size="sm"
              >
                <Phone className="w-4 h-4 mr-2" />
                Emergency Call
              </Button>
              
              <Button 
                onClick={handleNotifyPersonnel}
                variant="outline"
                className="w-full border-warning text-warning hover:bg-warning/10"
                size="sm"
              >
                <Users className="w-4 h-4 mr-2" />
                Notify Personnel
              </Button>
            </div>
          </div>

          {/* Emergency Protocol (Collapsible) */}
          <Collapsible open={showProtocol} onOpenChange={setShowProtocol}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between text-sm">
                <span>View Emergency Protocol</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showProtocol ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              <div className="p-3 bg-secondary/30 rounded-lg text-sm">
                <div className="space-y-2">
                  <p className="font-medium">Immediate Actions:</p>
                  <ul className="space-y-1 text-xs text-muted-foreground ml-4">
                    <li>• Evacuate all personnel from high-risk zones</li>
                    <li>• Contact emergency response team</li>
                    <li>• Establish safety perimeter around affected area</li>
                    <li>• Monitor real-time sensor data continuously</li>
                    <li>• Prepare equipment for emergency response</li>
                  </ul>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {!isAcknowledged ? (
              <>
                <Button 
                  onClick={handleAcknowledge}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Acknowledge Alert
                </Button>
                <Button 
                  onClick={onClose}
                  variant="outline"
                  className="px-4"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <div className="flex-1 text-center text-sm text-safe">
                ✓ Alert Acknowledged - Closing...
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmergencyAlertModal;