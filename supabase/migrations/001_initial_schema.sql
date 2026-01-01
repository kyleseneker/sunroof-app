-- ============================================
-- Sunroof Database Schema
-- Migration: 001_initial_schema
-- 
-- Run this in Supabase SQL Editor or via CLI:
-- supabase db push
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Journeys table
CREATE TABLE IF NOT EXISTS journeys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  destination TEXT,
  unlock_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'unlocked')),
  shared_with UUID[] DEFAULT '{}',
  cover_url TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memories table  
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('photo', 'text')),
  url TEXT,
  note TEXT,
  metadata JSONB DEFAULT '{}',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT,
  auth TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- ============================================
-- INDEXES
-- ============================================

-- Journey lookups by user and status
CREATE INDEX IF NOT EXISTS idx_journeys_user_id ON journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_journeys_user_status ON journeys(user_id, status);
CREATE INDEX IF NOT EXISTS idx_journeys_unlock_date ON journeys(unlock_date);

-- Shared journeys lookup (GIN index for array containment)
CREATE INDEX IF NOT EXISTS idx_journeys_shared_with ON journeys USING gin(shared_with);

-- Memory lookups by journey
CREATE INDEX IF NOT EXISTS idx_memories_journey_id ON memories(journey_id);
CREATE INDEX IF NOT EXISTS idx_memories_journey_created ON memories(journey_id, created_at);

-- Push subscription lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Journeys: Users can CRUD their own journeys
CREATE POLICY "Users can view own journeys" ON journeys
  FOR SELECT USING (
    auth.uid() = user_id 
    OR auth.uid() = ANY(shared_with)
  );

CREATE POLICY "Users can create journeys" ON journeys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journeys" ON journeys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journeys" ON journeys
  FOR DELETE USING (auth.uid() = user_id);

-- Memories: Users can CRUD memories in their journeys (or shared journeys)
CREATE POLICY "Users can view memories in accessible journeys" ON memories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM journeys 
      WHERE journeys.id = memories.journey_id 
      AND (journeys.user_id = auth.uid() OR auth.uid() = ANY(journeys.shared_with))
    )
  );

CREATE POLICY "Users can create memories in accessible journeys" ON memories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM journeys 
      WHERE journeys.id = journey_id 
      AND (journeys.user_id = auth.uid() OR auth.uid() = ANY(journeys.shared_with))
    )
  );

CREATE POLICY "Users can update memories in own journeys" ON memories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM journeys 
      WHERE journeys.id = memories.journey_id 
      AND journeys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete memories in own journeys" ON memories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM journeys 
      WHERE journeys.id = memories.journey_id 
      AND journeys.user_id = auth.uid()
    )
  );

-- Push subscriptions: Users can only manage their own
CREATE POLICY "Users can view own subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to journeys
DROP TRIGGER IF EXISTS journeys_updated_at ON journeys;
CREATE TRIGGER journeys_updated_at
  BEFORE UPDATE ON journeys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Apply updated_at trigger to push_subscriptions
DROP TRIGGER IF EXISTS push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Note: Run these in Supabase Dashboard > Storage or via API
-- 
-- 1. Create bucket: sunroof-media (public)
-- 2. Create bucket: avatars (public)
--
-- Storage policies should allow:
-- - Authenticated users can upload to their own folder
-- - Public read access for all files

