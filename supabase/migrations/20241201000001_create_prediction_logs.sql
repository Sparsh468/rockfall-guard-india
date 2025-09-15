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









