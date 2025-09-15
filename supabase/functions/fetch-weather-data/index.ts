import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherRequest {
  latitude: number;
  longitude: number;
}

interface WeatherData {
  temperature: number;
  rainfall: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const weatherApiKey = Deno.env.get('WEATHER_API_KEY');
    if (!weatherApiKey) {
      console.error('Weather API key not found');
      return new Response(
        JSON.stringify({ error: 'Weather API key not configured' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const { latitude, longitude }: WeatherRequest = await req.json();
    console.log(`Fetching weather data for coordinates: ${latitude}, ${longitude}`);

    // Fetch weather data from OpenWeatherMap API
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${weatherApiKey}&units=metric`;
    
    const weatherResponse = await fetch(weatherUrl);
    
    if (!weatherResponse.ok) {
      console.error(`Weather API error: ${weatherResponse.status} ${weatherResponse.statusText}`);
      const errorText = await weatherResponse.text();
      console.error('Weather API error details:', errorText);
      
      return new Response(
        JSON.stringify({ error: 'Failed to fetch weather data', details: errorText }),
        { status: weatherResponse.status, headers: corsHeaders }
      );
    }

    const weatherData = await weatherResponse.json();
    console.log('Weather API response:', weatherData);

    // Extract temperature and rainfall data
    const temperature = weatherData.main?.temp || 25; // Default to 25°C if not available
    const rainfall = weatherData.rain?.['1h'] || weatherData.rain?.['3h'] || 0; // Get rainfall in mm

    const result: WeatherData = {
      temperature,
      rainfall: rainfall * 10 // Convert to match expected scale
    };

    console.log('Processed weather data:', result);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in fetch-weather-data function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});