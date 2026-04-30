-- Hybrid AI Credit System Schema
-- Run this in Supabase SQL Editor AFTER supabase-schema.sql

-- Add credits and plan columns to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free',
ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
ADD COLUMN IF NOT EXISTS system_api_key TEXT;

-- Update usage_logs to track credit usage
ALTER TABLE public.usage_logs
ADD COLUMN IF NOT EXISTS credits_used INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_byok BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_timestamp ON public.usage_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_settings_credits_reset ON public.user_settings(credits_reset_at);

-- Function to deduct credits
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_credits INTEGER
)
RETURNS TABLE(
  success BOOLEAN,
  remaining_credits INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_credits INTEGER;
  v_plan TEXT;
  v_reset_at TIMESTAMPTZ;
BEGIN
  -- Get current credits and plan
  SELECT credits, plan, credits_reset_at
  INTO v_current_credits, v_plan, v_reset_at
  FROM public.user_settings
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if credits need reset (monthly)
  IF v_reset_at <= NOW() THEN
    IF v_plan = 'free' THEN
      v_current_credits := 50;
    ELSIF v_plan = 'pro' THEN
      v_current_credits := 1000;
    END IF;
    
    UPDATE public.user_settings
    SET credits = v_current_credits,
        credits_reset_at = NOW() + interval '30 days'
    WHERE user_id = p_user_id;
  END IF;

  -- Check if enough credits
  IF v_current_credits < p_credits THEN
    RETURN QUERY SELECT false, v_current_credits, 'Insufficient credits'::TEXT;
    RETURN;
  END IF;

  -- Deduct credits
  UPDATE public.user_settings
  SET credits = credits - p_credits
  WHERE user_id = p_user_id;

  v_current_credits := v_current_credits - p_credits;

  RETURN QUERY SELECT true, v_current_credits, 'Credits deducted successfully'::TEXT;
END;
$$;

-- Function to get user credits info
CREATE OR REPLACE FUNCTION public.get_user_credits(p_user_id UUID)
RETURNS TABLE(
  credits INTEGER,
  plan TEXT,
  credits_reset_at TIMESTAMPTZ,
  has_api_key BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.credits,
    us.plan,
    us.credits_reset_at,
    (us.api_key IS NOT NULL AND us.api_key != '')::BOOLEAN as has_api_key
  FROM public.user_settings us
  WHERE us.user_id = p_user_id;
END;
$$;

-- Function to upgrade user plan
CREATE OR REPLACE FUNCTION public.upgrade_user_plan(
  p_user_id UUID,
  p_new_plan TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_credits INTEGER;
BEGIN
  IF p_new_plan = 'free' THEN
    v_new_credits := 50;
  ELSIF p_new_plan = 'pro' THEN
    v_new_credits := 1000;
  ELSE
    RETURN QUERY SELECT false, 'Invalid plan'::TEXT;
    RETURN;
  END IF;

  UPDATE public.user_settings
  SET plan = p_new_plan,
      credits = v_new_credits,
      credits_reset_at = NOW() + interval '30 days'
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT true, 'Plan upgraded successfully'::TEXT;
END;
$$;

-- Initialize credits for existing users
INSERT INTO public.user_settings (user_id, credits, plan, credits_reset_at)
SELECT id, 50, 'free', NOW() + interval '30 days'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_settings)
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON COLUMN public.user_settings.credits IS 'Remaining credits for built-in AI usage';
COMMENT ON COLUMN public.user_settings.plan IS 'User subscription plan: free or pro';
COMMENT ON COLUMN public.user_settings.credits_reset_at IS 'When credits will be reset (monthly)';
COMMENT ON COLUMN public.usage_logs.credits_used IS 'Credits deducted for this request';
COMMENT ON COLUMN public.usage_logs.is_byok IS 'Whether user used their own API key (BYOK)';
