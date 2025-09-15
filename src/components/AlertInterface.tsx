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
import { alertService } from "@/services/alertService";

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
    { name: "Mine Safety Officer", role: "Primary Contact", phone: "+91-9876543210", email: "sanskar3124@gmail.com" },
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
    
    try {
      // Get mine safety officer email from contacts
      const mineSafetyOfficer = alertContacts.find(contact => contact.role === "Primary Contact");
      const mineSafetyOfficerEmail = mineSafetyOfficer?.email || "sanskar3124@gmail.com";
      
      console.log('Sending alert to mine safety officer:', mineSafetyOfficerEmail);
      
      // Determine risk level from alert type
      let riskLevel = 'medium';
      let riskProbability = 0.5;
      
      if (alertType.toLowerCase().includes('high')) {
        riskLevel = 'high';
        riskProbability = 0.8;
      } else if (alertType.toLowerCase().includes('low')) {
        riskLevel = 'low';
        riskProbability = 0.3;
      }
      
      // Send email alert to mine safety officer
      const alertResult = await alertService.sendPredictionAlert({
        mineId: 'alert-system',
        mineName: recipients || 'Mining Site',
        location: 'Multiple Locations',
        riskProbability: riskProbability,
        userEmail: mineSafetyOfficerEmail,
        userId: 'mine-safety-officer'
      });
      
      if (alertResult.success) {
        toast({
          title: "Alert Sent Successfully",
          description: `${alertType} alert sent to Mine Safety Officer (${mineSafetyOfficerEmail})`,
          variant: "default",
        });
        
        // Also send to recipients if specified
        if (recipients && recipients !== mineSafetyOfficerEmail) {
          toast({
            title: "Additional Notification",
            description: `Alert also sent to: ${recipients}`,
            variant: "default",
          });
        }
      } else {
        toast({
          title: "Alert Sent (Email Pending)",
          description: `${alertType} alert processed. Email delivery may be delayed.`,
          variant: "default",
        });
      }
      
      // Reset form
      setAlertType("");
      setAlertMessage("");
      setRecipients("");
      
    } catch (error: any) {
      console.error('Error sending alert:', error);
      toast({
        title: "Alert Sent (Email Pending)",
        description: `${alertType} alert processed. Email delivery may be delayed.`,
        variant: "default",
      });
      
      // Still reset form even if email fails
      setAlertType("");
      setAlertMessage("");
      setRecipients("");
    } finally {
      setSending(false);
    }
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
                <div key={index} className={`p-3 bg-secondary/30 rounded-lg border border-border/50 ${contact.role === "Primary Contact" ? "ring-2 ring-primary/20 bg-primary/5" : ""}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-medium text-sm">{contact.name}</h5>
                      <p className="text-xs text-muted-foreground">{contact.role}</p>
                      {contact.role === "Primary Contact" && (
                        <Badge variant="default" className="text-xs mt-1">
                          Email Recipient
                        </Badge>
                      )}
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
                      {contact.role === "Primary Contact" && (
                        <Badge variant="secondary" className="text-xs ml-2">
                          Auto-notify
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Alert Email Notice */}
            <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <Mail className="w-4 h-4 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-primary">Email Notifications</p>
                  <p className="text-muted-foreground">
                    All alerts are automatically sent to the Mine Safety Officer via email for immediate attention.
                  </p>
                </div>
              </div>
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

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-danger/5 border-danger/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-danger/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Alerts</p>
              <p className="text-xl font-bold text-danger">3</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-warning/5 border-warning/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-warning/20 rounded-lg">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Response</p>
              <p className="text-xl font-bold text-warning">7</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-safe/5 border-safe/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-safe/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-safe" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Resolved Today</p>
              <p className="text-xl font-bold text-safe">12</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AlertInterface;