-- Migration: Add playbook columns to generated_posts
-- Run this in the Supabase SQL editor for your project.
-- All columns are nullable so existing rows are unaffected.

ALTER TABLE generated_posts
  ADD COLUMN IF NOT EXISTS objective                text,
  ADD COLUMN IF NOT EXISTS image_text               text,
  ADD COLUMN IF NOT EXISTS strategy_json            jsonb,
  ADD COLUMN IF NOT EXISTS copy_json                jsonb,
  ADD COLUMN IF NOT EXISTS visual_brief_json        jsonb,
  ADD COLUMN IF NOT EXISTS critic_json              jsonb,
  ADD COLUMN IF NOT EXISTS selected_asset_ids       text[],
  ADD COLUMN IF NOT EXISTS generation_mode          text,
  ADD COLUMN IF NOT EXISTS prompt_version_strategy  text,
  ADD COLUMN IF NOT EXISTS prompt_version_copy      text,
  ADD COLUMN IF NOT EXISTS prompt_version_visual    text,
  ADD COLUMN IF NOT EXISTS prompt_version_critic    text,
  ADD COLUMN IF NOT EXISTS human_edits_json         jsonb,
  ADD COLUMN IF NOT EXISTS regeneration_counts_json jsonb;
