-- Phase 10 Gap Closure: Add images column to details table
-- Required for DETAIL-02: MRM technical images in gallery

ALTER TABLE "details" ADD COLUMN IF NOT EXISTS "images" jsonb;

-- Add comment for documentation
COMMENT ON COLUMN "details"."images" IS 'Array of R2 keys for MRM technical images';
