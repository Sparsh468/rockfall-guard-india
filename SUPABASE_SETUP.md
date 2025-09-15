# Supabase Setup Guide

## Database Setup Required

The application requires several database tables and a storage bucket to function properly. Here's what needs to be set up:

### 1. Storage Bucket

Create a storage bucket named `rockfall-data`:

```sql
-- Create storage bucket for rockfall data
INSERT INTO storage.buckets (id, name, public) VALUES ('rockfall-data', 'rockfall-data', true);
```

### 2. Storage Policies

Set up the necessary storage policies:

```sql
-- Create storage policies for rockfall data bucket
CREATE POLICY "Allow authenticated users to upload rockfall data" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'rockfall-data' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow public access to rockfall data" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'rockfall-data');

CREATE POLICY "Allow authenticated users to update their uploads" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'rockfall-data' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow authenticated users to delete their uploads" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'rockfall-data' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 3. Database Tables

The following tables should already exist from the migration files:
- `profiles`
- `mines` 
- `uploads`
- `sensor_data`
- `alerts`

### 4. Prediction Logs Table

Create the prediction logs table:

```sql
-- Create prediction_logs table for tracking prediction activities
CREATE TABLE public.prediction_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'prediction' or 'image_upload'
  parameters JSONB NOT NULL, -- Store activity-specific parameters
  result JSONB, -- Store prediction results if applicable
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on prediction_logs
ALTER TABLE public.prediction_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for prediction_logs
CREATE POLICY "Users can view their own prediction logs" 
ON public.prediction_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prediction logs" 
ON public.prediction_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_prediction_logs_user_id ON public.prediction_logs(user_id);
CREATE INDEX idx_prediction_logs_activity_type ON public.prediction_logs(activity_type);
CREATE INDEX idx_prediction_logs_timestamp ON public.prediction_logs(timestamp);
```

### 5. Sample Data

Add sample sensor data for testing:

```sql
-- Insert sample sensor data for all mines
INSERT INTO public.sensor_data (mine_id, displacement, strain, pore_pressure, rainfall, temperature, dem_slope, crack_score) VALUES
-- Jharia Coalfield (high risk)
((SELECT id FROM public.mines WHERE name = 'Jharia Coalfield'), 8.5, 285, 75, 45, 35, 65, 7.2),
-- Talcher Coalfield (medium risk)
((SELECT id FROM public.mines WHERE name = 'Talcher Coalfield'), 4.2, 180, 55, 25, 32, 45, 4.1),
-- Korba Coalfield (high risk)
((SELECT id FROM public.mines WHERE name = 'Korba Coalfield'), 9.1, 320, 82, 52, 38, 68, 8.5),
-- Raniganj Coalfield (low risk)
((SELECT id FROM public.mines WHERE name = 'Raniganj Coalfield'), 2.1, 120, 35, 15, 28, 35, 2.3),
-- Singrauli Coalfield (medium risk)
((SELECT id FROM public.mines WHERE name = 'Singrauli Coalfield'), 5.8, 195, 60, 30, 33, 50, 5.2),
-- Bellary Iron Ore (medium risk)
((SELECT id FROM public.mines WHERE name = 'Bellary Iron Ore'), 6.2, 210, 65, 28, 36, 55, 6.1),
-- Bailadila Iron Ore (high risk)
((SELECT id FROM public.mines WHERE name = 'Bailadila Iron Ore'), 8.8, 295, 78, 48, 37, 62, 7.8),
-- Goa Iron Ore (low risk)
((SELECT id FROM public.mines WHERE name = 'Goa Iron Ore'), 1.8, 95, 25, 12, 26, 30, 1.9);
```

## How to Set Up

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL commands above in the order listed
4. Verify that the storage bucket `rockfall-data` exists in the Storage section
5. Check that all tables exist in the Table Editor

## Troubleshooting

If you get "Bucket not found" errors:
1. Make sure the storage bucket `rockfall-data` exists
2. Check that the storage policies are set up correctly
3. Verify that the user has the necessary permissions

The application will now work properly with file uploads and predictions!









