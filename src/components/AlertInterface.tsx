import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, 
  Send, 
  Clock, 
  Users, 
  Bell,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AlertInterface = () => {
  const [alertType, setAlertType] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [recipients, setRecipients] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const activeAlerts = [
    {
      id: 1,
      type: "High Risk",
      location: "Jharia Coalfield - Section A",
      message: "Critical rockfall risk detected. Immediate evacuation required.",
      timestamp: "2 minutes ago",
      status: "active",
      recipients: 24
    },
    {
      id: 2,
      type: "Medium Risk",
      location: "Talcher Coalfield - Section B",
      message: "Increased strain measurements detected. Monitor closely.",
      timestamp: "15 minutes ago",
      status: "acknowledged",
      recipients: 12
    },
    {
      id: 3,
      type: "Weather Alert",
      location: "Korba Coalfield",
      message: "Heavy rainfall expected. Prepare drainage systems.",
      timestamp: "1 hour ago",
      status: "resolved",
      recipients: 18
    }
  ];

  const alertContacts = [
    { name: "Mine Safety Officer", role: "Primary Contact", phone: "+91-9876543210", email: "safety@mine.gov.in" },
    { name: "Emergency Response Team", role: "Emergency", phone: "+91-9876543211", email: "emergency@mine.gov.in" },
    { name: "Local Administration", role: "Authority", phone: "+91-9876543212", email: "admin@district.gov.in" },
    { name: "Geological Survey", role: "Technical", phone: "+91-9876543213", email: "geology@gsi.gov.in" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-danger text-danger-foreground';
      case 'acknowledged': return 'bg-warning text-warning-foreground';
      case 'resolved': return 'bg-safe text-safe-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertTriangle className="w-4 h-4" />;
      case 'acknowledged': return <Clock className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const sendAlert = async () => {
    if (!alertType || !alertMessage || !recipients) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    
    // Simulate sending process
    setTimeout(() => {
      setSending(false);
      toast({
        title: "Alert Sent Successfully",
        description: `${alertType} alert sent to ${recipients}`,
      });
      
      // Reset form
      setAlertType("");
      setAlertMessage("");
      setRecipients("");
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Send New Alert */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Send className="w-5 h-5 text-primary" />
          <span>Send Emergency Alert</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Alert Type
              </label>
              <Select value={alertType} onValueChange={setAlertType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select alert type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High Risk">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-danger rounded-full" />
                      <span>High Risk - Immediate Action</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Medium Risk">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-warning rounded-full" />
                      <span>Medium Risk - Monitor Closely</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Weather Alert">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-primary rounded-full" />
                      <span>Weather Alert</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="System Maintenance">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-muted rounded-full" />
                      <span>System Maintenance</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Recipients
              </label>
              <Select value={recipients} onValueChange={setRecipients}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipients..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Contacts">All Emergency Contacts</SelectItem>
                  <SelectItem value="Mine Safety Only">Mine Safety Officers Only</SelectItem>
                  <SelectItem value="Emergency Team">Emergency Response Team</SelectItem>
                  <SelectItem value="Local Authority">Local Administration</SelectItem>
                  <SelectItem value="Technical Team">Geological Survey Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Alert Message
              </label>
              <Textarea
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                placeholder="Enter detailed alert message..."
                rows={4}
                className="resize-none"
              />
            </div>

            <Button 
              onClick={sendAlert} 
              disabled={sending}
              className="w-full h-12 bg-danger hover:bg-danger/90 text-danger-foreground"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Sending Alert...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Emergency Alert
                </>
              )}
            </Button>
          </div>

          {/* Emergency Contacts */}
          <div className="space-y-4">
            <h4 className="font-medium">Emergency Contacts</h4>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {alertContacts.map((contact, index) => (
                <div key={index} className="p-3 bg-secondary/30 rounded-lg border border-border/50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-medium text-sm">{contact.name}</h5>
                      <p className="text-xs text-muted-foreground">{contact.role}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs">
                      <Phone className="w-3 h-3" />
                      <span>{contact.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <Mail className="w-3 h-3" />
                      <span>{contact.email}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Active Alerts */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Bell className="w-5 h-5 text-primary" />
          <span>Recent Alerts</span>
        </h3>

        <div className="space-y-3">
          {activeAlerts.map((alert) => (
            <div key={alert.id} className="p-4 bg-secondary/20 rounded-lg border border-border/50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Badge className={getStatusColor(alert.status)}>
                    {getStatusIcon(alert.status)}
                    <span className="ml-1">{alert.status.toUpperCase()}</span>
                  </Badge>
                  <Badge variant="outline">
                    {alert.type}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                    <Users className="w-3 h-3" />
                    <span>{alert.recipients} recipients</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-medium text-sm">{alert.location}</p>
                <p className="text-sm text-muted-foreground">{alert.message}</p>
              </div>

              <div className="flex items-center space-x-2 mt-3">
                {alert.status === 'active' && (
                  <>
                    <Button size="sm" variant="outline" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Acknowledge
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      <XCircle className="w-3 h-3 mr-1" />
                      Resolve
                    </Button>
                  </>
                )}
                <Button size="sm" variant="ghost" className="text-xs">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
};

export default AlertInterface;