-- ============================================
-- Add Audio Memory Support
-- Migration: 004_add_audio_memories
-- ============================================

-- Update the memories type constraint to include 'audio'
ALTER TABLE memories DROP CONSTRAINT IF EXISTS memories_type_check;
ALTER TABLE memories ADD CONSTRAINT memories_type_check 
  CHECK (type IN ('photo', 'text', 'audio'));

-- Add duration column for audio memories (in seconds)
ALTER TABLE memories ADD COLUMN IF NOT EXISTS duration INTEGER;

-- Add index for filtering by type (useful for stats)
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);

-- Comment for documentation
COMMENT ON COLUMN memories.duration IS 'Duration in seconds, used for audio memories';

