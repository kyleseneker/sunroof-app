-- Performance Optimization Indexes
-- Migration: 002_add_performance_indexes

-- Composite index for active journey queries
-- Optimizes: WHERE user_id = ? AND status = 'active' AND unlock_date > NOW()
CREATE INDEX IF NOT EXISTS idx_journeys_active_lookup 
  ON journeys(user_id, status, unlock_date) 
  WHERE deleted_at IS NULL;

-- Composite index for past journey queries  
-- Optimizes: WHERE user_id = ? AND (status = 'completed' OR unlock_date <= NOW())
CREATE INDEX IF NOT EXISTS idx_journeys_past_lookup
  ON journeys(user_id, unlock_date, status)
  WHERE deleted_at IS NULL;

-- Memory count optimization
-- Optimizes: COUNT(*) WHERE journey_id = ? (used for memory counts)
CREATE INDEX IF NOT EXISTS idx_memories_count
  ON memories(journey_id)
  WHERE deleted_at IS NULL;

-- ============================================
-- OPTIONAL: Materialized View for Memory Counts
-- 
-- Uncomment if you need ultra-fast memory counts
-- Requires periodic refresh (e.g., via cron/edge function)
-- ============================================

-- CREATE MATERIALIZED VIEW IF NOT EXISTS journey_memory_counts AS
-- SELECT 
--   journey_id,
--   COUNT(*) as memory_count,
--   COUNT(*) FILTER (WHERE type = 'photo') as photo_count,
--   COUNT(*) FILTER (WHERE type = 'text') as note_count
-- FROM memories
-- WHERE deleted_at IS NULL
-- GROUP BY journey_id;

-- CREATE UNIQUE INDEX ON journey_memory_counts(journey_id);

-- To refresh: REFRESH MATERIALIZED VIEW CONCURRENTLY journey_memory_counts;

