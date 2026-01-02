-- ============================================
-- Add Location & Weather Context to Memories
-- Migration: 005_add_location_weather
-- ============================================

-- Add location columns to memories
ALTER TABLE memories ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS location_name TEXT;

-- Add weather column (JSONB for flexibility)
-- Structure: { temp: number, condition: string, icon: string, humidity?: number }
ALTER TABLE memories ADD COLUMN IF NOT EXISTS weather JSONB;

-- Add index for location-based queries (useful for map views)
CREATE INDEX IF NOT EXISTS idx_memories_location ON memories(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN memories.latitude IS 'GPS latitude where memory was captured';
COMMENT ON COLUMN memories.longitude IS 'GPS longitude where memory was captured';
COMMENT ON COLUMN memories.location_name IS 'Reverse-geocoded place name (city, landmark, etc.)';
COMMENT ON COLUMN memories.weather IS 'Weather conditions at capture time: { temp, condition, icon, humidity }';

