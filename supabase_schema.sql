-- KTUfy Database Schema Setup
-- Run this in your Supabase SQL Editor

-- 1. Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  registration_number TEXT,
  college TEXT,
  branch TEXT,
  year_joined INTEGER,
  year_ending INTEGER,
  roll_number TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Create ticklists table
CREATE TABLE IF NOT EXISTS public.ticklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  code TEXT,
  color TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ticklists ENABLE ROW LEVEL SECURITY;

-- Users can only access their own ticklists
CREATE POLICY "Users can view own ticklists" ON public.ticklists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ticklists" ON public.ticklists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ticklists" ON public.ticklists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ticklists" ON public.ticklists
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Create game_stats table (for Learning Zone)
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

-- Enable RLS
ALTER TABLE public.game_stats ENABLE ROW LEVEL SECURITY;

-- Users can only access their own game stats
CREATE POLICY "Users can view own game stats" ON public.game_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game stats" ON public.game_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game stats" ON public.game_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Create coding_progress table (for Coding Hub)
CREATE TABLE IF NOT EXISTS public.coding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_problems JSONB DEFAULT '[]'::jsonb,
  total_attempts INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.coding_progress ENABLE ROW LEVEL SECURITY;

-- Users can only access their own coding progress
CREATE POLICY "Users can view own coding progress" ON public.coding_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coding progress" ON public.coding_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coding progress" ON public.coding_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticklists_updated_at BEFORE UPDATE ON public.ticklists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_stats_updated_at BEFORE UPDATE ON public.game_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coding_progress_updated_at BEFORE UPDATE ON public.coding_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
