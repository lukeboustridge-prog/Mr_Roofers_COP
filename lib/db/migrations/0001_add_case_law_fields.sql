-- Add new columns to failure_cases table for case law functionality
-- Migration: Add caseType and pdfUrl fields

-- Add case_type column with default value 'determination'
ALTER TABLE "failure_cases" ADD COLUMN IF NOT EXISTS "case_type" text NOT NULL DEFAULT 'determination';

-- Add pdf_url column for local PDF links
ALTER TABLE "failure_cases" ADD COLUMN IF NOT EXISTS "pdf_url" text;

-- Create index on case_type for filtering
CREATE INDEX IF NOT EXISTS "idx_failure_cases_case_type" ON "failure_cases" ("case_type");
