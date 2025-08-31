import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Image, MapPin, Calendar, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const UploadInterface = () => {
  const [selectedState, setSelectedState] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
    "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
    "West Bengal"
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleSubmit = async () => {
    if (!selectedState || uploadedFiles.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select a state and upload at least one image.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    // Simulate upload process
    setTimeout(() => {
      setUploading(false);
      toast({
        title: "Upload Successful",
        description: `${uploadedFiles.length} drone images uploaded for ${selectedState}`,
      });
      
      // Reset form
      setUploadedFiles([]);
      setSelectedState("");
    }, 2000);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Upload className="w-5 h-5 text-primary" />
          <span>Upload Drone Images</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Mining State
              </label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a state..." />
                </SelectTrigger>
                <SelectContent>
                  {indianStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{state}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Drone Images
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-secondary/20 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Image className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload drone images or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, JPEG up to 10MB each
                  </p>
                </label>
              </div>
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={uploading || !selectedState || uploadedFiles.length === 0}
              className="w-full h-12"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Images
                </>
              )}
            </Button>
          </div>

          {/* Preview Section */}
          <div className="space-y-4">
            <h4 className="font-medium">Uploaded Images ({uploadedFiles.length})</h4>
            
            {uploadedFiles.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Image className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium truncate max-w-40">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Image className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No images uploaded yet</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Upload Guidelines */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <h4 className="font-medium mb-3">Upload Guidelines</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-safe" />
              <span>High-resolution aerial images (minimum 2MP)</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-safe" />
              <span>Clear visibility of rock faces and slopes</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-safe" />
              <span>Multiple angles for comprehensive analysis</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Recent captures (within 7 days preferred)</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-safe" />
              <span>Good lighting conditions</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-safe" />
              <span>GPS metadata included if available</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UploadInterface;