-- ============================================
-- Add emoji field to journeys
-- Migration: 006_add_journey_emoji
-- ============================================

-- Add emoji column (nullable, single emoji character or short string)
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS emoji TEXT;

-- Add index for potential filtering by emoji (optional, lightweight)
CREATE INDEX IF NOT EXISTS idx_journeys_emoji ON journeys(emoji) WHERE emoji IS NOT NULL;

