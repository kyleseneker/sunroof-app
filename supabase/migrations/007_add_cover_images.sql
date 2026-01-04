-- Add cover image support for journeys
-- Uses Unsplash API to fetch beautiful location photos

ALTER TABLE journeys
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_attribution TEXT;

-- Index for potential queries filtering by journeys with images
CREATE INDEX IF NOT EXISTS idx_journeys_cover_image ON journeys (cover_image_url) WHERE cover_image_url IS NOT NULL;

COMMENT ON COLUMN journeys.cover_image_url IS 'URL of the cover image from Unsplash';
COMMENT ON COLUMN journeys.cover_image_attribution IS 'Attribution text for the Unsplash photographer';

