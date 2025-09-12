-- Remove all existing sensor data
DELETE FROM sensor_data;

-- Remove the dem_slope column from sensor_data table
ALTER TABLE sensor_data DROP COLUMN IF EXISTS dem_slope;