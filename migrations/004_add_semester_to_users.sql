-- migrations/004_add_semester_to_users.sql
-- ⚠️  Run this in Supabase SQL Editor to fix the signup error.
-- Step 1 adds the column. Step 2 recreates the trigger to include semester.

-- ── Step 1: Add semester column ──────────────────────────────────────
ALTER TABLE IF EXISTS public.users
    ADD COLUMN IF NOT EXISTS semester TEXT; -- 'S1' .. 'S8'

-- Also ensure subject_code exists in exam_schedule
ALTER TABLE IF EXISTS public.exam_schedule
    ADD COLUMN IF NOT EXISTS subject_code TEXT;

-- ── Step 2: Recreate handle_new_user trigger ─────────────────────────
-- ⚠️  This REPLACES your existing trigger. Adjust column names to match
--     your actual public.users table schema if needed.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    name,
    email,
    registration_number,
    college,
    branch,
    year_joined,
    year_ending,
    roll_number,
    semester
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    NEW.raw_user_meta_data->>'registration_number',
    NEW.raw_user_meta_data->>'college',
    NEW.raw_user_meta_data->>'branch',
    (NEW.raw_user_meta_data->>'year_joined')::int,
    (NEW.raw_user_meta_data->>'year_ending')::int,
    NEW.raw_user_meta_data->>'roll_number',
    NEW.raw_user_meta_data->>'semester'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Recreate the trigger (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
