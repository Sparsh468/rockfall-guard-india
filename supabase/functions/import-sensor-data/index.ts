import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SensorDataRow {
  mine_id: string;
  displacement: number;
  strain: number;
  pore_pressure: number;
  crack_score: number;
  timestamp: string;
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

    const { csvData }: { csvData: SensorDataRow[] } = await req.json();
    console.log(`Importing ${csvData.length} sensor data rows`);

    // Insert all sensor data
    const { data, error } = await supabase
      .from('sensor_data')
      .insert(csvData);

    if (error) {
      console.error('Error inserting sensor data:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to import sensor data', details: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`Successfully imported ${csvData.length} sensor data rows`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Imported ${csvData.length} sensor data rows`,
        imported_count: csvData.length
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in import-sensor-data function:', error);
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