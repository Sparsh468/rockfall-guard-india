-- Create storage bucket for rockfall data
INSERT INTO storage.buckets (id, name, public) VALUES ('rockfall-data', 'rockfall-data', true);

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

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create mines table for mining locations
CREATE TABLE public.mines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  state TEXT NOT NULL,
  mine_type TEXT NOT NULL,
  current_risk_level TEXT DEFAULT 'low',
  current_risk_probability DECIMAL(5,4) DEFAULT 0.0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on mines (public read access)
ALTER TABLE public.mines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mines" 
ON public.mines 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can modify mines" 
ON public.mines 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create uploads table for image metadata
CREATE TABLE public.uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  location TEXT NOT NULL,
  mine_id UUID REFERENCES public.mines(id),
  uploader UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on uploads
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all uploads" 
ON public.uploads 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own uploads" 
ON public.uploads 
FOR INSERT 
WITH CHECK (auth.uid() = uploader);

CREATE POLICY "Users can update their own uploads" 
ON public.uploads 
FOR UPDATE 
USING (auth.uid() = uploader);

CREATE POLICY "Users can delete their own uploads" 
ON public.uploads 
FOR DELETE 
USING (auth.uid() = uploader);

-- Create sensor_data table for real-time monitoring
CREATE TABLE public.sensor_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mine_id UUID NOT NULL REFERENCES public.mines(id) ON DELETE CASCADE,
  displacement DECIMAL(10,4),
  strain DECIMAL(10,4),
  pore_pressure DECIMAL(10,4),
  rainfall DECIMAL(10,4),
  temperature DECIMAL(10,4),
  dem_slope DECIMAL(10,4),
  crack_score DECIMAL(10,4),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on sensor_data
ALTER TABLE public.sensor_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all sensor data" 
ON public.sensor_data 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can insert sensor data" 
ON public.sensor_data 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create alerts table for risk alerts
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mine_id UUID NOT NULL REFERENCES public.mines(id) ON DELETE CASCADE,
  risk_probability DECIMAL(5,4) NOT NULL,
  alert_level TEXT NOT NULL,
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on alerts
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all alerts" 
ON public.alerts 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can manage alerts" 
ON public.alerts 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Insert sample mine data
INSERT INTO public.mines (name, location, latitude, longitude, state, mine_type, current_risk_level, current_risk_probability) VALUES
('Jharia Coalfield', 'Dhanbad, Jharkhand', 23.7441, 86.4105, 'Jharkhand', 'Coal', 'high', 0.8500),
('Talcher Coalfield', 'Angul, Odisha', 20.9517, 85.2283, 'Odisha', 'Coal', 'medium', 0.5200),
('Korba Coalfield', 'Korba, Chhattisgarh', 22.3595, 82.7501, 'Chhattisgarh', 'Coal', 'high', 0.7800),
('Raniganj Coalfield', 'Paschim Bardhaman, West Bengal', 23.6209, 87.1280, 'West Bengal', 'Coal', 'low', 0.2100),
('Singrauli Coalfield', 'Singrauli, Madhya Pradesh', 24.1967, 82.6757, 'Madhya Pradesh', 'Coal', 'medium', 0.4900),
('Bellary Iron Ore', 'Bellary, Karnataka', 15.1393, 76.9214, 'Karnataka', 'Iron Ore', 'medium', 0.5800),
('Bailadila Iron Ore', 'Dantewada, Chhattisgarh', 18.6298, 81.3082, 'Chhattisgarh', 'Iron Ore', 'high', 0.8200),
('Goa Iron Ore', 'South Goa, Goa', 15.2993, 74.1240, 'Goa', 'Iron Ore', 'low', 0.1800);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();