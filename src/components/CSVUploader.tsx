import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CSVUploaderProps {
  onUploadComplete?: () => void;
}

interface SensorDataRow {
  mine_id: string;
  displacement: number;
  strain: number;
  pore_pressure: number;
  crack_score: number;
  timestamp: string;
}

const CSVUploader: React.FC<CSVUploaderProps> = ({ onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadedCount, setUploadedCount] = useState(0);

  const parseCSV = (csvText: string): SensorDataRow[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const data: SensorDataRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        
        // Convert and validate data
        const sensorRow: SensorDataRow = {
          mine_id: row.mine_id || row.Mine_ID,
          displacement: parseFloat(row.displacement || row.Displacement) || 0,
          strain: parseFloat(row.strain || row.Strain) || 0,
          pore_pressure: parseFloat(row.pore_pressure || row.Pore_Pressure) || 0,
          crack_score: parseFloat(row.crack_score || row.Crack_Score) || 0,
          timestamp: row.timestamp || row.Timestamp || new Date().toISOString(),
        };
        
        data.push(sensorRow);
      }
    }
    
    return data;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a CSV file.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      const text = await file.text();
      const csvData = parseCSV(text);

      if (csvData.length === 0) {
        throw new Error('No valid data found in CSV file');
      }

      // Call the import edge function
      const { data, error } = await supabase.functions.invoke('import-sensor-data', {
        body: { csvData }
      });

      if (error) {
        throw error;
      }

      setUploadedCount(csvData.length);
      setUploadStatus('success');
      
      toast({
        title: 'CSV Upload Successful',
        description: `Successfully imported ${csvData.length} sensor data records.`,
      });

      onUploadComplete?.();
      
    } catch (error) {
      console.error('CSV upload error:', error);
      setUploadStatus('error');
      
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload CSV file.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileSpreadsheet className="w-5 h-5" />
          <span>Import Sensor Data</span>
        </CardTitle>
        <CardDescription>
          Upload a CSV file containing sensor data for all mines
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className={`cursor-pointer flex flex-col items-center space-y-2 ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Upload className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm font-medium">
              {isUploading ? 'Uploading...' : 'Click to upload CSV'}
            </span>
            <span className="text-xs text-muted-foreground">
              Expected columns: mine_id, displacement, strain, pore_pressure, crack_score, timestamp
            </span>
          </label>
        </div>

        {uploadStatus === 'success' && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">
              Successfully imported {uploadedCount} records
            </span>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Upload failed. Please try again.</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p><strong>Note:</strong> Temperature and rainfall data will be fetched in real-time from the weather API.</p>
          <p>The slope angle field has been removed from the system.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CSVUploader;