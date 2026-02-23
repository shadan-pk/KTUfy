-- ============================================
-- Migration 003: Fix RLS Policies & Ensure SECURITY DEFINER on Trigger
-- ============================================
-- Run this in Supabase Dashboard > SQL Editor
--
-- This migration:
--   1. Ensures all missing columns exist on public.users
--   2. Drops and re-creates RLS policies for existing tables
--   3. Optionally creates game_stats/coding_progress if they don't exist
--   4. Ensures the on_auth_user_created trigger uses SECURITY DEFINER
-- ============================================

-- ============================================
-- 1. Add missing columns to public.users (no-op if they already exist)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'year_joined') THEN
    ALTER TABLE public.users ADD COLUMN year_joined INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'year_ending') THEN
    ALTER TABLE public.users ADD COLUMN year_ending INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'roll_number') THEN
    ALTER TABLE public.users ADD COLUMN roll_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'metadata') THEN
    ALTER TABLE public.users ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- ============================================
-- 2. Create game_stats and coding_progress if they don't exist
-- ============================================
CREATE TABLE IF NOT EXISTS public.game_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_best_score INTEGER DEFAULT 0,
  quiz_score INTEGER DEFAULT 0,
  daily_streak INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  achievements JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_problems JSONB DEFAULT '[]'::jsonb,
  total_attempts INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. Ensure RLS is enabled on all tables
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_progress ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Drop existing policies (clean slate)
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

DROP POLICY IF EXISTS "Users can view own ticklists" ON public.ticklists;
DROP POLICY IF EXISTS "Users can insert own ticklists" ON public.ticklists;
DROP POLICY IF EXISTS "Users can update own ticklists" ON public.ticklists;
DROP POLICY IF EXISTS "Users can delete own ticklists" ON public.ticklists;

DROP POLICY IF EXISTS "Users can view own game stats" ON public.game_stats;
DROP POLICY IF EXISTS "Users can insert own game stats" ON public.game_stats;
DROP POLICY IF EXISTS "Users can update own game stats" ON public.game_stats;

DROP POLICY IF EXISTS "Users can view own coding progress" ON public.coding_progress;
DROP POLICY IF EXISTS "Users can insert own coding progress" ON public.coding_progress;
DROP POLICY IF EXISTS "Users can update own coding progress" ON public.coding_progress;

-- ============================================
-- 5. Re-create RLS policies
-- ============================================

-- public.users: authenticated users can SELECT/UPDATE/INSERT their own row
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- public.ticklists: full CRUD scoped to own rows
CREATE POLICY "Users can view own ticklists" ON public.ticklists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ticklists" ON public.ticklists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ticklists" ON public.ticklists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ticklists" ON public.ticklists
  FOR DELETE USING (auth.uid() = user_id);

-- public.game_stats: SELECT, INSERT, UPDATE scoped to own rows
CREATE POLICY "Users can view own game stats" ON public.game_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game stats" ON public.game_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game stats" ON public.game_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- public.coding_progress: SELECT, INSERT, UPDATE scoped to own rows
CREATE POLICY "Users can view own coding progress" ON public.coding_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coding progress" ON public.coding_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coding progress" ON public.coding_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 5. Ensure on_auth_user_created trigger uses SECURITY DEFINER
-- ============================================
-- SECURITY DEFINER is critical: the trigger fires during auth.users INSERT,
-- at which point auth.uid() is NOT yet set. Without SECURITY DEFINER, the
-- RLS policy on public.users (which checks auth.uid() = id) would block
-- the INSERT from the trigger.
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (
    id, name, email, registration_number, college, branch,
    year_joined, year_ending, roll_number, metadata, created_at
  )
  VALUES (
    NEW.id,
    NULLIF( (COALESCE(NEW.raw_user_meta_data->>'name', NEW.user_metadata->>'name')) , '' ),
    NEW.email,
    NULLIF( COALESCE(NEW.raw_user_meta_data->>'registration_number', NEW.user_metadata->>'registration_number'), '' ),
    NULLIF( COALESCE(NEW.raw_user_meta_data->>'college', NEW.user_metadata->>'college'), '' ),
    NULLIF( COALESCE(NEW.raw_user_meta_data->>'branch', NEW.user_metadata->>'branch'), '' ),
    (CASE WHEN COALESCE(NEW.raw_user_meta_data->>'year_joined', NEW.user_metadata->>'year_joined') ~ '^[0-9]+$' THEN (COALESCE(NEW.raw_user_meta_data->>'year_joined', NEW.user_metadata->>'year_joined'))::int ELSE NULL END),
    (CASE WHEN COALESCE(NEW.raw_user_meta_data->>'year_ending', NEW.user_metadata->>'year_ending') ~ '^[0-9]+$' THEN (COALESCE(NEW.raw_user_meta_data->>'year_ending', NEW.user_metadata->>'year_ending'))::int ELSE NULL END),
    NULLIF( COALESCE(NEW.raw_user_meta_data->>'roll_number', NEW.user_metadata->>'roll_number'), '' ),
    COALESCE(NEW.raw_user_meta_data::jsonb, NEW.user_metadata::jsonb, '{}'::jsonb),
    now()
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      metadata = EXCLUDED.metadata,
      name = COALESCE(EXCLUDED.name, public.users.name),
      registration_number = COALESCE(EXCLUDED.registration_number, public.users.registration_number),
      college = COALESCE(EXCLUDED.college, public.users.college),
      branch = COALESCE(EXCLUDED.branch, public.users.branch),
      year_joined = COALESCE(EXCLUDED.year_joined, public.users.year_joined),
      year_ending = COALESCE(EXCLUDED.year_ending, public.users.year_ending),
      roll_number = COALESCE(EXCLUDED.roll_number, public.users.roll_number);

  RETURN NEW;
END;
$$;

-- Re-create trigger (idempotent)
DROP TRIGGER IF EXISTS sync_auth_user_to_public_users ON auth.users;
CREATE TRIGGER sync_auth_user_to_public_users
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.on_auth_user_created();

-- ============================================
-- VERIFICATION: Run these queries to confirm
-- ============================================
-- SELECT * FROM pg_policies WHERE tablename IN ('users', 'ticklists', 'game_stats', 'coding_progress');
-- SELECT prosrc FROM pg_proc WHERE proname = 'on_auth_user_created';
-- SELECT * FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users';
