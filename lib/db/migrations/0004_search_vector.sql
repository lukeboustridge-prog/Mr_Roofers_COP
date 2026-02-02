-- Add generated search vector column for full-text search
-- Weights: name=A (highest), description=B, specifications=C (lowest)
ALTER TABLE details
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', name), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(specifications::text, '')), 'C')
) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX idx_details_search_vector ON details USING gin(search_vector);

-- Add comment for documentation
COMMENT ON COLUMN details.search_vector IS 'Generated full-text search vector: name (A), description (B), specifications (C)';
