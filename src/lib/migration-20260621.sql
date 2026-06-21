-- ===== Migration 2026-06-21: Add two-level structure for questions and ratings =====

-- Create question_sets table
CREATE TABLE IF NOT EXISTS question_sets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create rating_groups table
CREATE TABLE IF NOT EXISTS rating_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Add set_id column to questions (safe for existing D1 with data)
ALTER TABLE questions ADD COLUMN set_id TEXT;

-- Add group_id column to rating_targets (safe for existing D1 with data)
ALTER TABLE rating_targets ADD COLUMN group_id TEXT;
