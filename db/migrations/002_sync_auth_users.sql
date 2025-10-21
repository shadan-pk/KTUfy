-- Migration: Sync auth.users -> public.users on INSERT
-- Run this in Supabase SQL editor or apply through your migration tooling.

-- Function: sync new auth users to public.users
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
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

-- Trigger on auth.users INSERT
DROP TRIGGER IF EXISTS sync_auth_user_to_public_users ON auth.users;
CREATE TRIGGER sync_auth_user_to_public_users
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.on_auth_user_created();
