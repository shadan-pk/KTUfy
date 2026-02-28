-- Study Dashboard table for KTUfy
-- Run this migration in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS study_dashboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  study_streak INTEGER DEFAULT 0,
  total_study_time INTEGER DEFAULT 0,  -- in minutes
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE study_dashboard ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own dashboard
CREATE POLICY "Users can view own dashboard" ON study_dashboard
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dashboard" ON study_dashboard
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dashboard" ON study_dashboard
  FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create dashboard on user signup (optional trigger)
CREATE OR REPLACE FUNCTION create_study_dashboard()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO study_dashboard (user_id, study_streak, total_study_time, last_active)
  VALUES (NEW.id, 0, 0, NOW())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create on new user
DROP TRIGGER IF EXISTS on_auth_user_created_dashboard ON auth.users;
CREATE TRIGGER on_auth_user_created_dashboard
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_study_dashboard();
