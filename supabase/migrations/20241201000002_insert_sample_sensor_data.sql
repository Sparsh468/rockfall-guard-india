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

-- Insert some historical sensor data (older timestamps)
INSERT INTO public.sensor_data (mine_id, displacement, strain, pore_pressure, rainfall, temperature, dem_slope, crack_score, timestamp) VALUES
-- Historical data for Jharia Coalfield
((SELECT id FROM public.mines WHERE name = 'Jharia Coalfield'), 7.2, 265, 70, 40, 33, 62, 6.8, now() - interval '1 day'),
((SELECT id FROM public.mines WHERE name = 'Jharia Coalfield'), 6.8, 250, 68, 35, 31, 60, 6.5, now() - interval '2 days'),
-- Historical data for Talcher Coalfield
((SELECT id FROM public.mines WHERE name = 'Talcher Coalfield'), 3.8, 165, 50, 20, 30, 42, 3.8, now() - interval '1 day'),
((SELECT id FROM public.mines WHERE name = 'Talcher Coalfield'), 3.5, 155, 48, 18, 29, 40, 3.5, now() - interval '2 days'),
-- Historical data for Korba Coalfield
((SELECT id FROM public.mines WHERE name = 'Korba Coalfield'), 8.2, 300, 75, 45, 35, 65, 7.9, now() - interval '1 day'),
((SELECT id FROM public.mines WHERE name = 'Korba Coalfield'), 7.9, 290, 72, 42, 34, 63, 7.6, now() - interval '2 days');









