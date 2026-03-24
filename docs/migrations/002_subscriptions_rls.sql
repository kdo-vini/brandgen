-- ============================================================
-- Migration 002: subscriptions + usage_tracking + RLS
-- Run in Supabase SQL editor
-- ============================================================

-- 1. Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  plan text NOT NULL DEFAULT 'free',      -- 'free' | 'pro'
  status text NOT NULL DEFAULT 'active',  -- 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive'
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Usage tracking table (monthly counters per user)
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month text NOT NULL,                  -- 'YYYY-MM'
  text_generations integer NOT NULL DEFAULT 0,
  image_generations integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month)
);

-- 3. Atomic increment function (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id uuid,
  p_month text,
  p_text_generations integer DEFAULT 0,
  p_image_generations integer DEFAULT 0
) RETURNS void AS $$
BEGIN
  INSERT INTO public.usage_tracking (user_id, month, text_generations, image_generations)
  VALUES (p_user_id, p_month, p_text_generations, p_image_generations)
  ON CONFLICT (user_id, month)
  DO UPDATE SET
    text_generations = usage_tracking.text_generations + p_text_generations,
    image_generations = usage_tracking.image_generations + p_image_generations,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Row-Level Security
-- ============================================================

-- Enable RLS on all user data tables
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "brands_user_policy" ON public.brands;
DROP POLICY IF EXISTS "brand_assets_user_policy" ON public.brand_assets;
DROP POLICY IF EXISTS "generated_posts_user_policy" ON public.generated_posts;
DROP POLICY IF EXISTS "subscriptions_select_policy" ON public.subscriptions;
DROP POLICY IF EXISTS "usage_tracking_select_policy" ON public.usage_tracking;

-- brands: full CRUD for owner
CREATE POLICY "brands_user_policy"
  ON public.brands FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- brand_assets: full CRUD for owner
CREATE POLICY "brand_assets_user_policy"
  ON public.brand_assets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- generated_posts: full CRUD for owner
CREATE POLICY "generated_posts_user_policy"
  ON public.generated_posts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- subscriptions: users can only read their own (written by webhook via service_role)
CREATE POLICY "subscriptions_select_policy"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- usage_tracking: users can only read their own (written by server via service_role)
CREATE POLICY "usage_tracking_select_policy"
  ON public.usage_tracking FOR SELECT
  USING (auth.uid() = user_id);
