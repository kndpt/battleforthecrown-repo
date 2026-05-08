-- Create Barbarian Test World (copy of Test Placement World config)

INSERT INTO world (id, name, status, config, "gridWidth", "gridHeight", speed_multipliers, created_at)
SELECT 
  'barbarian-test-world',
  'Barbarian Test World',
  'OPEN',
  config,
  500,
  500,
  speed_multipliers,
  NOW()
FROM world 
WHERE id = 'test-placement-world'
ON CONFLICT (id) DO UPDATE SET
  config = EXCLUDED.config,
  speed_multipliers = EXCLUDED.speed_multipliers;

-- Verify creation
SELECT id, name, status, created_at FROM world WHERE id = 'barbarian-test-world';
