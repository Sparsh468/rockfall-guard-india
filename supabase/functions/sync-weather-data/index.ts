import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherData {
  temperature: number;
  rainfall: number;
}

Deno.serve(async (req) => {
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
      throw new Error('Weather API key not configured');
    }

    console.log('Starting weather data synchronization...');

    // Get all mines with their coordinates
    const { data: mines, error: minesError } = await supabase
      .from('mines')
      .select('id, name, latitude, longitude');

    if (minesError) {
      throw new Error(`Failed to fetch mines: ${minesError.message}`);
    }

    console.log(`Fetching weather data for ${mines.length} mines`);

    const weatherUpdates = [];

    for (const mine of mines) {
      try {
        // Fetch weather data for each mine location
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${mine.latitude}&lon=${mine.longitude}&appid=${weatherApiKey}&units=metric`;
        
        const weatherResponse = await fetch(weatherUrl);
        
        if (!weatherResponse.ok) {
          console.error(`Weather API error for mine ${mine.name}: ${weatherResponse.status}`);
          continue;
        }

        const weatherData = await weatherResponse.json();
        
        const temperature = weatherData.main?.temp || 25;
        const rainfall = (weatherData.rain?.['1h'] || weatherData.rain?.['3h'] || 0) * 10;

        // Create sensor data entry with current weather
        const sensorEntry = {
          mine_id: mine.id,
          displacement: Math.random() * 2 + 1, // Simulate current displacement
          strain: Math.random() * 50 + 100,    // Simulate current strain
          pore_pressure: Math.random() * 20 + 40, // Simulate current pore pressure
          crack_score: Math.random() * 3 + 2,   // Simulate current crack score
          temperature,
          rainfall,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        };

        weatherUpdates.push(sensorEntry);
        console.log(`Weather data for ${mine.name}: ${temperature}°C, ${rainfall}mm`);

        // Small delay to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error fetching weather for mine ${mine.name}:`, error);
      }
    }

    // Insert all weather-updated sensor data
    if (weatherUpdates.length > 0) {
      const { error: insertError } = await supabase
        .from('sensor_data')
        .insert(weatherUpdates);

      if (insertError) {
        console.error('Error inserting weather data:', insertError);
      } else {
        console.log(`Successfully inserted weather data for ${weatherUpdates.length} mines`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Weather data synchronized for ${weatherUpdates.length} mines`,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in sync-weather-data function:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to sync weather data',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});