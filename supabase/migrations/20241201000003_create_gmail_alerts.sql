-- Create gmail_alerts table for tracking Gmail alert delivery
CREATE TABLE public.gmail_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mine_name TEXT NOT NULL,
  location TEXT NOT NULL,
  risk_percentage INTEGER NOT NULL,
  risk_type TEXT NOT NULL CHECK (risk_type IN ('low', 'medium', 'high', 'critical')),
  risk_probability DECIMAL(3,2) NOT NULL,
  mine_id UUID REFERENCES public.mines(id) ON DELETE SET NULL,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_method TEXT,
  email_error TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gmail_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own gmail alerts"
ON public.gmail_alerts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert gmail alerts"
ON public.gmail_alerts
FOR INSERT
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_gmail_alerts_user_id ON public.gmail_alerts(user_id);
CREATE INDEX idx_gmail_alerts_timestamp ON public.gmail_alerts(timestamp);
CREATE INDEX idx_gmail_alerts_risk_type ON public.gmail_alerts(risk_type);









