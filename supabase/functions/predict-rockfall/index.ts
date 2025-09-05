import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

interface PredictionRequest {
  mine_id?: string;
  displacement: number;
  strain: number;
  pore_pressure: number;
  rainfall: number;
  temperature: number;
  dem_slope: number;
  crack_score: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      mine_id, 
      displacement, 
      strain, 
      pore_pressure, 
      rainfall, 
      temperature, 
      dem_slope, 
      crack_score 
    }: PredictionRequest = await req.json();

    console.log('Received prediction request:', { 
      mine_id, displacement, strain, pore_pressure, rainfall, temperature, dem_slope, crack_score 
    });

    // Prepare data for ML backend
    const mlPayload = {
      displacement,
      strain,
      pore_pressure,
      rainfall,
      temperature,
      dem_slope,
      crack_score
    };

    // Call ML backend
    const mlBackendUrl = Deno.env.get('ML_BACKEND_URL');
    if (!mlBackendUrl) {
      throw new Error('ML_BACKEND_URL not configured');
    }

    console.log('Calling ML backend at:', `${mlBackendUrl}/predict`);

    const mlResponse = await fetch(`${mlBackendUrl}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mlPayload),
    });

    if (!mlResponse.ok) {
      console.error('ML backend error:', mlResponse.status, await mlResponse.text());
      throw new Error(`ML backend error: ${mlResponse.status}`);
    }

    const mlResult = await mlResponse.json();
    const riskProbability = mlResult.probability || mlResult.risk_probability || 0;

    console.log('ML prediction result:', { riskProbability });

    // Store sensor data in database
    const { error: sensorError } = await supabase
      .from('sensor_data')
      .insert({
        mine_id,
        displacement,
        strain,
        pore_pressure,
        rainfall,
        temperature,
        dem_slope,
        crack_score,
      });

    if (sensorError) {
      console.error('Error storing sensor data:', sensorError);
    }

    // Update mine risk level if mine_id provided
    if (mine_id) {
      const riskLevel = riskProbability > 0.7 ? 'high' : riskProbability > 0.4 ? 'medium' : 'low';
      
      const { error: mineError } = await supabase
        .from('mines')
        .update({
          current_risk_probability: riskProbability,
          current_risk_level: riskLevel,
          last_updated: new Date().toISOString(),
        })
        .eq('id', mine_id);

      if (mineError) {
        console.error('Error updating mine risk:', mineError);
      }

      // Check if high risk alert needs to be triggered
      if (riskProbability > 0.7) {
        console.log('High risk detected, triggering alert');
        
        // Get mine details
        const { data: mine } = await supabase
          .from('mines')
          .select('name, location')
          .eq('id', mine_id)
          .single();

        // Create alert record
        const { error: alertError } = await supabase
          .from('alerts')
          .insert({
            mine_id,
            alert_level: 'high',
            risk_probability: riskProbability,
            message: `High Rockfall Risk Detected at ${mine?.name || 'Unknown Mine'} - Risk: ${Math.round(riskProbability * 100)}%`,
          });

        if (alertError) {
          console.error('Error creating alert:', alertError);
        }

        // Trigger alert notifications (SMS/Email)
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-alert`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              mine_id,
              mine_name: mine?.name || 'Unknown Mine',
              location: mine?.location || 'Unknown Location',
              risk_probability: riskProbability,
            }),
          });
        } catch (alertSendError) {
          console.error('Error sending alert notifications:', alertSendError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        risk_probability: riskProbability,
        risk_level: riskProbability > 0.7 ? 'high' : riskProbability > 0.4 ? 'medium' : 'low',
        recommendation: riskProbability > 0.7 
          ? 'Immediate evacuation recommended. Implement emergency protocols.'
          : riskProbability > 0.4
          ? 'Enhanced monitoring required. Consider preventive measures.'
          : 'Continue regular monitoring schedule.',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in predict-rockfall function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);