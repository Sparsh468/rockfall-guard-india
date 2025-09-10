import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Image as ImageIcon, 
  Download, 
  MapPin, 
  Clock, 
  User, 
  FileImage,
  ExternalLink,
  Trash2,
  Eye
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface UploadedImage {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  location: string;
  timestamp: string;
  uploader: string;
}

const RecentUploadsPanel = () => {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);

  const fetchUploads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('uploads')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);

      if (error) throw error;
      setUploads(data || []);
    } catch (error) {
      console.error('Error fetching uploads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch uploaded images",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  const handleDownload = async (upload: UploadedImage) => {
    try {
      setDownloading(upload.id);
      
      // Download file from Supabase Storage
      const { data, error } = await supabase.storage
        .from('rockfall-data')
        .download(`${upload.location}/${upload.file_name}`);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = upload.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `Downloading ${upload.file_name}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the image",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (upload: UploadedImage) => {
    if (!user || user.id !== upload.uploader) {
      toast({
        title: "Permission Denied",
        description: "You can only delete your own uploads",
        variant: "destructive",
      });
      return;
    }

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('rockfall-data')
        .remove([`${upload.location}/${upload.file_name}`]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('uploads')
        .delete()
        .eq('id', upload.id);

      if (dbError) throw dbError;

      toast({
        title: "Image Deleted",
        description: "Image has been successfully deleted",
      });

      // Refresh uploads
      fetchUploads();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the image",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <ImageIcon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Recent Uploads</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3 p-3 bg-secondary/30 rounded-lg">
                <div className="w-12 h-12 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Recent Uploads</h3>
          </div>
          <Badge variant="outline">
            {uploads.length} images
          </Badge>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {uploads.length > 0 ? (
            uploads.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center space-x-3 p-3 bg-secondary/30 rounded-lg border border-border/50 hover:bg-secondary/50 transition-colors"
              >
                <div className="relative">
                  <img
                    src={upload.file_url}
                    alt="Upload preview"
                    className="w-12 h-12 object-cover rounded-lg border border-border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAxNkM2IDE2IDYgMzIgMjQgMzJTNDIgMzIgNDIgMTYiIGZpbGw9IiM5Q0E0QUIiLz4KPC9zdmc+';
                    }}
                  />
                  <FileImage className="absolute -bottom-1 -right-1 w-4 h-4 text-primary bg-background rounded-full p-0.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{upload.file_name}</p>
                  <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-1">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{upload.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(upload.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatFileSize(upload.file_size)}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedImage(upload)}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>{selectedImage?.file_name}</DialogTitle>
                      </DialogHeader>
                      {selectedImage && (
                        <div className="space-y-4">
                          <img
                            src={selectedImage.file_url}
                            alt={selectedImage.file_name}
                            className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                          />
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong>Location:</strong> {selectedImage.location}
                            </div>
                            <div>
                              <strong>Size:</strong> {formatFileSize(selectedImage.file_size)}
                            </div>
                            <div>
                              <strong>Type:</strong> {selectedImage.file_type}
                            </div>
                            <div>
                              <strong>Uploaded:</strong> {new Date(selectedImage.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(upload)}
                    disabled={downloading === upload.id}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {downloading === upload.id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>

                  {user && user.id === upload.uploader && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(upload)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No uploads found</p>
              <p className="text-sm">Upload drone images to see them here</p>
            </div>
          )}
        </div>
      </Card>
    </>
  );
};

export default RecentUploadsPanel;