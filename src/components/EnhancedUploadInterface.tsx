import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon, MapPin, Clock } from 'lucide-react';

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

interface UploadFile {
  file: File;
  preview: string;
  id: string;
}

const EnhancedUploadInterface = () => {
  const { user } = useAuth();
  const [selectedState, setSelectedState] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length !== files.length) {
      toast({
        title: "Invalid file type",
        description: "Please select only image files.",
        variant: "destructive",
      });
    }

    const newFiles: UploadFile[] = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36),
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleSubmit = async () => {
    if (!selectedState) {
      toast({
        title: "Missing information",
        description: "Please select a state.",
        variant: "destructive",
      });
      return;
    }

    if (uploadedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one image to upload.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload files.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const { file } = uploadedFiles[i];
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `${selectedState}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError, data } = await supabase.storage
          .from('rockfall-data')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('rockfall-data')
          .getPublicUrl(filePath);

        // Store metadata in database
        const { error: dbError } = await supabase
          .from('uploads')
          .insert({
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type,
            file_size: file.size,
            location: selectedState,
            uploader: user.id,
          });

        if (dbError) {
          throw dbError;
        }

        setUploadProgress(((i + 1) / uploadedFiles.length) * 100);
      }

      toast({
        title: "Upload successful!",
        description: `${uploadedFiles.length} image(s) uploaded to ${selectedState}.`,
      });

      // Reset form
      setUploadedFiles([]);
      setSelectedState('');
      setUploadProgress(0);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Upload Drone Images</h1>
        <p className="text-muted-foreground">
          Upload aerial drone photography and DEM data for rockfall analysis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <Label htmlFor="state">Select Mining State</Label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose a state..." />
                </SelectTrigger>
                <SelectContent>
                  {indianStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Upload Images</Label>
              <div className="mt-2">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, JPEG (MAX. 50MB per file)
                    </p>
                  </div>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {uploadProgress > 0 && uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!selectedState || uploadedFiles.length === 0 || uploading}
              className="w-full"
              size="lg"
            >
              {uploading ? 'Uploading...' : `Upload ${uploadedFiles.length} Image(s)`}
            </Button>
          </div>
        </Card>

        {/* File Preview */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Selected Files ({uploadedFiles.length})
          </h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {uploadedFiles.length > 0 ? (
              uploadedFiles.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="flex items-center space-x-3 p-3 bg-accent/30 rounded-lg"
                >
                  <img
                    src={uploadFile.preview}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadFile.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No images selected</p>
                <p className="text-sm">Upload images to see preview here</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Upload Guidelines */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              <h4 className="font-medium">Image Quality</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• High resolution (minimum 1920x1080)</li>
              <li>• Clear, unobstructed views</li>
              <li>• Good lighting conditions</li>
              <li>• Stable, non-blurry images</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h4 className="font-medium">Content Requirements</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Aerial view of mining areas</li>
              <li>• Rock face and slope visibility</li>
              <li>• DEM (Digital Elevation Model) data</li>
              <li>• Multiple angles preferred</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-primary" />
              <h4 className="font-medium">Metadata</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Include GPS coordinates if available</li>
              <li>• Capture timestamp important</li>
              <li>• Weather conditions noted</li>
              <li>• Drone flight altitude</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EnhancedUploadInterface;