import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Mine {
  id: string;
  name: string;
  location: string;
  state: string;
  latitude: number;
  longitude: number;
}

const predefinedMines: Omit<Mine, 'id'>[] = [
  { name: 'Bellary Iron Ore', location: 'Bellary', state: 'Karnataka', latitude: 15.1394, longitude: 76.9214 },
  { name: 'Bailadila Iron Ore', location: 'Dantewada', state: 'Chhattisgarh', latitude: 18.6298, longitude: 81.3509 },
  { name: 'Goa Iron Ore', location: 'Panaji', state: 'Goa', latitude: 15.2993, longitude: 74.1240 },
  { name: 'Jharia Coalfield', location: 'Dhanbad', state: 'Jharkhand', latitude: 23.7644, longitude: 86.4084 },
  { name: 'Korba Coalfield', location: 'Korba', state: 'Chhattisgarh', latitude: 22.3595, longitude: 82.7501 },
  { name: 'Raniganj Coalfield', location: 'Asansol', state: 'West Bengal', latitude: 23.6739, longitude: 87.0100 },
  { name: 'Singrauli Coalfield', location: 'Singrauli', state: 'Madhya Pradesh', latitude: 24.1970, longitude: 82.6750 },
  { name: 'Talcher Coalfield', location: 'Angul', state: 'Odisha', latitude: 20.9517, longitude: 85.2453 }
];

function generateSensorReading(mineId: string, baseTime: Date, offsetHours: number) {
  const timestamp = new Date(baseTime.getTime() - offsetHours * 60 * 60 * 1000);
  
  // Generate mine-specific realistic patterns
  const hash = mineId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seed = hash % 1000;
  
  // Base values that vary by mine
  const baseDisplacement = 1.5 + (seed % 10) / 5; // 1.5-3.5 range
  const baseStrain = 120 + (seed % 80); // 120-200 range
  const basePorePressure = 35 + (seed % 30); // 35-65 range
  const baseCrackScore = 2 + (seed % 6); // 2-8 range
  
  // Add time-based variation and some randomness
  const timeVariation = Math.sin(offsetHours * 0.1) * 0.5;
  const randomFactor = (Math.random() - 0.5) * 0.8;
  
  return {
    mine_id: mineId,
    displacement: Math.max(0, baseDisplacement + timeVariation + randomFactor),
    strain: Math.max(0, baseStrain + timeVariation * 20 + randomFactor * 30),
    pore_pressure: Math.max(0, basePorePressure + timeVariation * 10 + randomFactor * 8),
    crack_score: Math.max(0, Math.min(10, baseCrackScore + randomFactor * 2)),
    timestamp: timestamp.toISOString(),
    created_at: timestamp.toISOString()
  };
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

    console.log('Starting mine data generation...');

    // First, ensure all mines exist in the database
    for (const mineData of predefinedMines) {
      const { data: existingMine, error: checkError } = await supabase
        .from('mines')
        .select('id')
        .eq('name', mineData.name)
        .single();

      if (!existingMine) {
        console.log(`Creating mine: ${mineData.name}`);
        const { error: insertError } = await supabase
          .from('mines')
          .insert({
            ...mineData,
            mine_type: mineData.name.includes('Iron') ? 'iron_ore' : 'coal',
            current_risk_level: 'low',
            current_risk_probability: 0.15 + Math.random() * 0.3
          });

        if (insertError) {
          console.error(`Error creating mine ${mineData.name}:`, insertError);
        }
      }
    }

    // Get all mine IDs
    const { data: mines, error: minesError } = await supabase
      .from('mines')
      .select('id, name');

    if (minesError) {
      throw new Error(`Failed to fetch mines: ${minesError.message}`);
    }

    console.log(`Found ${mines.length} mines, generating sensor data...`);

    // Generate 300 rows of sensor data for each mine
    const allSensorData = [];
    const baseTime = new Date();

    for (const mine of mines) {
      console.log(`Generating data for mine: ${mine.name}`);
      
      for (let i = 0; i < 300; i++) {
        const sensorReading = generateSensorReading(mine.id, baseTime, i);
        allSensorData.push(sensorReading);
      }
    }

    console.log(`Generated ${allSensorData.length} sensor readings total`);

    // Insert data in batches of 100 to avoid timeout
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < allSensorData.length; i += batchSize) {
      const batch = allSensorData.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('sensor_data')
        .insert(batch);

      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
      } else {
        insertedCount += batch.length;
        console.log(`Inserted batch ${i / batchSize + 1}, total: ${insertedCount}`);
      }
    }

    // Update mine risk levels based on latest sensor data
    for (const mine of mines) {
      const latestReading = allSensorData
        .filter(reading => reading.mine_id === mine.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      if (latestReading) {
        // Calculate risk score based on sensor values
        let riskScore = 0;
        if (latestReading.displacement > 5) riskScore += 30;
        else if (latestReading.displacement > 3) riskScore += 15;
        
        if (latestReading.strain > 200) riskScore += 25;
        else if (latestReading.strain > 150) riskScore += 10;
        
        if (latestReading.pore_pressure > 60) riskScore += 20;
        else if (latestReading.pore_pressure > 45) riskScore += 10;
        
        riskScore += latestReading.crack_score;
        
        const riskProbability = Math.min(1, riskScore / 100);
        const riskLevel = riskProbability > 0.7 ? 'high' : riskProbability > 0.4 ? 'medium' : 'low';

        await supabase
          .from('mines')
          .update({
            current_risk_probability: riskProbability,
            current_risk_level: riskLevel,
            last_updated: new Date().toISOString()
          })
          .eq('id', mine.id);
      }
    }

    console.log('Mine data generation completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated sensor data for ${mines.length} mines`,
        total_records: insertedCount,
        mines: mines.map(m => m.name)
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in generate-mine-data function:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate mine data',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});