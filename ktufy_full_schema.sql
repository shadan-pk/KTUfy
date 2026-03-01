-- =====================================================================
-- KTUfy — Full Database Schema (Consolidated Migration File)
-- =====================================================================
-- Generated: 2026-03-01
-- Database:  Supabase (PostgreSQL)
--
-- RUN ORDER:
--   1. Tables  (public.users → dependents)
--   2. Indexes
--   3. Row-Level Security (RLS) policies
--   4. Functions & Triggers
--   5. Storage Policies (storage.objects — 'notes' bucket)
--
-- How to apply:
--   Supabase Dashboard → SQL Editor → paste this file → Run
--   OR use the Supabase CLI: supabase db reset (if using local dev)
--
-- All statements are idempotent (IF NOT EXISTS / CREATE OR REPLACE /
-- DROP … IF EXISTS), so re-running is safe.
-- =====================================================================


-- =====================================================================
-- SECTION 1: TABLES
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1.1  public.users  (extends auth.users)
-- ─────────────────────────────────────────────────────────────────────
-- Mirrors Supabase Auth user records and stores KTU-specific profile
-- data collected during sign-up (name, registration number, college, etc.)
CREATE TABLE IF NOT EXISTS public.users (
  id                  UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT,
  email               TEXT,
  registration_number TEXT,
  college             TEXT,
  branch              TEXT,
  semester            TEXT,                        -- 'S1' … 'S8'
  year_joined         INTEGER,
  year_ending         INTEGER,
  roll_number         TEXT,
  metadata            JSONB       DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- 1.2  public.ticklists  (study checklists per subject)
-- ─────────────────────────────────────────────────────────────────────
-- Each row is one subject checklist owned by a user.
-- Items are stored as a JSONB array: [{ id, text, completed }]
CREATE TABLE IF NOT EXISTS public.ticklists (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_name TEXT    NOT NULL,
  code         TEXT,
  color        TEXT,
  items        JSONB   DEFAULT '[]'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- 1.3  public.game_stats  (Learning Zone scores & achievements)
-- ─────────────────────────────────────────────────────────────────────
-- One row per user (UNIQUE on user_id).
CREATE TABLE IF NOT EXISTS public.game_stats (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID    NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_best_score INTEGER DEFAULT 0,
  quiz_score        INTEGER DEFAULT 0,
  daily_streak      INTEGER DEFAULT 0,
  total_points      INTEGER DEFAULT 0,
  achievements      JSONB   DEFAULT '[]'::jsonb,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- 1.4  public.coding_progress  (Coding Hub user progress)
-- ─────────────────────────────────────────────────────────────────────
-- One row per user (UNIQUE on user_id).
CREATE TABLE IF NOT EXISTS public.coding_progress (
  id                 UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID    NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_problems JSONB   DEFAULT '[]'::jsonb,
  total_attempts     INTEGER DEFAULT 0,
  successful_runs    INTEGER DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- 1.5  public.study_dashboard  (study streak & time tracking)
-- ─────────────────────────────────────────────────────────────────────
-- One row per user (UNIQUE on user_id).
-- Auto-created via trigger when a new auth user signs up.
CREATE TABLE IF NOT EXISTS public.study_dashboard (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  study_streak     INTEGER DEFAULT 0,
  total_study_time INTEGER DEFAULT 0,  -- in minutes
  last_active      TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ─────────────────────────────────────────────────────────────────────
-- 1.6  public.user_notes  (personal notes — Library feature)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_notes (
  id         TEXT        PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  content    TEXT        DEFAULT '',
  subject    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- 1.7  public.user_bookmarks  (bookmarks — Library feature)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  id         TEXT        PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  url        TEXT        NOT NULL,
  subject    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- 1.8  public.exam_schedule  (KTU exam / holiday / event calendar)
-- ─────────────────────────────────────────────────────────────────────
-- Populated by the backend server (admin writes, app reads directly via Supabase client).
CREATE TABLE IF NOT EXISTS public.exam_schedule (
  id           UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT   NOT NULL,
  date         DATE   NOT NULL,
  type         TEXT   NOT NULL CHECK (type IN ('exam', 'holiday', 'deadline', 'event')),
  description  TEXT,
  subject_code TEXT,        -- e.g. 'CST401', 'MAT401'
  semester     TEXT,        -- e.g. 'S6', 'S7' — NULL means applies to all
  branch       TEXT,        -- e.g. 'CSE', 'ECE'  — NULL means all branches
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);


-- =====================================================================
-- SECTION 2: INDEXES
-- =====================================================================

-- exam_schedule: fast lookup by date range
CREATE INDEX IF NOT EXISTS idx_exam_schedule_date   ON public.exam_schedule(date);
-- exam_schedule: optional branch / semester filters
CREATE INDEX IF NOT EXISTS idx_exam_schedule_branch   ON public.exam_schedule(branch);
CREATE INDEX IF NOT EXISTS idx_exam_schedule_semester ON public.exam_schedule(semester);


-- =====================================================================
-- SECTION 3: ROW-LEVEL SECURITY (RLS)
-- =====================================================================

-- Enable RLS on every user-data table
ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticklists        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_stats       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_progress  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_dashboard  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks   ENABLE ROW LEVEL SECURITY;
-- exam_schedule is public-read / admin-write (no RLS needed for app reads,
-- but enable it anyway so we can add admin policies later)
ALTER TABLE public.exam_schedule    ENABLE ROW LEVEL SECURITY;

-- ── Drop existing policies (clean slate) ──────────────────────────────
DROP POLICY IF EXISTS "Users can view own profile"         ON public.users;
DROP POLICY IF EXISTS "Users can update own profile"       ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile"       ON public.users;

DROP POLICY IF EXISTS "Users can view own ticklists"       ON public.ticklists;
DROP POLICY IF EXISTS "Users can insert own ticklists"     ON public.ticklists;
DROP POLICY IF EXISTS "Users can update own ticklists"     ON public.ticklists;
DROP POLICY IF EXISTS "Users can delete own ticklists"     ON public.ticklists;

DROP POLICY IF EXISTS "Users can view own game stats"      ON public.game_stats;
DROP POLICY IF EXISTS "Users can insert own game stats"    ON public.game_stats;
DROP POLICY IF EXISTS "Users can update own game stats"    ON public.game_stats;

DROP POLICY IF EXISTS "Users can view own coding progress" ON public.coding_progress;
DROP POLICY IF EXISTS "Users can insert own coding progress" ON public.coding_progress;
DROP POLICY IF EXISTS "Users can update own coding progress" ON public.coding_progress;

DROP POLICY IF EXISTS "Users can view own dashboard"       ON public.study_dashboard;
DROP POLICY IF EXISTS "Users can insert own dashboard"     ON public.study_dashboard;
DROP POLICY IF EXISTS "Users can update own dashboard"     ON public.study_dashboard;

DROP POLICY IF EXISTS "Users can manage own notes"         ON public.user_notes;
DROP POLICY IF EXISTS "Users can manage own bookmarks"     ON public.user_bookmarks;

DROP POLICY IF EXISTS "Anyone can view exam schedule"      ON public.exam_schedule;

-- ── Recreate policies ─────────────────────────────────────────────────

-- public.users
CREATE POLICY "Users can view own profile"   ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- public.ticklists
CREATE POLICY "Users can view own ticklists"   ON public.ticklists
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ticklists" ON public.ticklists
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ticklists" ON public.ticklists
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ticklists" ON public.ticklists
  FOR DELETE USING (auth.uid() = user_id);

-- public.game_stats
CREATE POLICY "Users can view own game stats"   ON public.game_stats
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own game stats" ON public.game_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own game stats" ON public.game_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- public.coding_progress
CREATE POLICY "Users can view own coding progress"   ON public.coding_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own coding progress" ON public.coding_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own coding progress" ON public.coding_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- public.study_dashboard
CREATE POLICY "Users can view own dashboard"   ON public.study_dashboard
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dashboard" ON public.study_dashboard
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dashboard" ON public.study_dashboard
  FOR UPDATE USING (auth.uid() = user_id);

-- public.user_notes  (single policy covers all operations)
CREATE POLICY "Users can manage own notes" ON public.user_notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- public.user_bookmarks
CREATE POLICY "Users can manage own bookmarks" ON public.user_bookmarks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- public.exam_schedule (public read — anyone with a valid Supabase token can read)
CREATE POLICY "Anyone can view exam schedule" ON public.exam_schedule
  FOR SELECT USING (true);


-- =====================================================================
-- SECTION 4: FUNCTIONS & TRIGGERS
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 4.1  update_updated_at_column()
-- ─────────────────────────────────────────────────────────────────────
-- Generic BEFORE UPDATE trigger that keeps updated_at current.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables that have an updated_at column
DROP TRIGGER IF EXISTS update_users_updated_at            ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ticklists_updated_at        ON public.ticklists;
CREATE TRIGGER update_ticklists_updated_at
  BEFORE UPDATE ON public.ticklists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_game_stats_updated_at       ON public.game_stats;
CREATE TRIGGER update_game_stats_updated_at
  BEFORE UPDATE ON public.game_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_coding_progress_updated_at  ON public.coding_progress;
CREATE TRIGGER update_coding_progress_updated_at
  BEFORE UPDATE ON public.coding_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_study_dashboard_updated_at  ON public.study_dashboard;
CREATE TRIGGER update_study_dashboard_updated_at
  BEFORE UPDATE ON public.study_dashboard
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_notes_updated_at       ON public.user_notes;
CREATE TRIGGER update_user_notes_updated_at
  BEFORE UPDATE ON public.user_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_exam_schedule_updated_at    ON public.exam_schedule;
CREATE TRIGGER update_exam_schedule_updated_at
  BEFORE UPDATE ON public.exam_schedule
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────
-- 4.2  on_auth_user_created()  — sync auth → public.users on sign-up
-- ─────────────────────────────────────────────────────────────────────
-- SECURITY DEFINER is required because auth.uid() is NOT yet set when
-- this trigger fires (the INSERT to auth.users is in progress), so
-- the RLS policy on public.users would otherwise block the write.
--
-- Reads sign-up metadata from raw_user_meta_data / user_metadata and
-- populates public.users.  On conflict (re-sign-up) it updates email
-- and metadata, but never overwrites existing non-null profile fields.
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
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
    semester,
    year_joined,
    year_ending,
    roll_number,
    metadata,
    created_at
  )
  VALUES (
    NEW.id,
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'name',                NEW.user_metadata->>'name'), ''),
    NEW.email,
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'registration_number', NEW.user_metadata->>'registration_number'), ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'college',             NEW.user_metadata->>'college'), ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'branch',              NEW.user_metadata->>'branch'), ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'semester',            NEW.user_metadata->>'semester'), ''),
    (CASE WHEN COALESCE(NEW.raw_user_meta_data->>'year_joined', NEW.user_metadata->>'year_joined') ~ '^[0-9]+$'
          THEN COALESCE(NEW.raw_user_meta_data->>'year_joined', NEW.user_metadata->>'year_joined')::int
          ELSE NULL END),
    (CASE WHEN COALESCE(NEW.raw_user_meta_data->>'year_ending', NEW.user_metadata->>'year_ending') ~ '^[0-9]+$'
          THEN COALESCE(NEW.raw_user_meta_data->>'year_ending', NEW.user_metadata->>'year_ending')::int
          ELSE NULL END),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'roll_number',         NEW.user_metadata->>'roll_number'), ''),
    COALESCE(NEW.raw_user_meta_data::jsonb, NEW.user_metadata::jsonb, '{}'::jsonb),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email               = EXCLUDED.email,
      metadata            = EXCLUDED.metadata,
      name                = COALESCE(EXCLUDED.name,                public.users.name),
      registration_number = COALESCE(EXCLUDED.registration_number, public.users.registration_number),
      college             = COALESCE(EXCLUDED.college,             public.users.college),
      branch              = COALESCE(EXCLUDED.branch,              public.users.branch),
      semester            = COALESCE(EXCLUDED.semester,            public.users.semester),
      year_joined         = COALESCE(EXCLUDED.year_joined,         public.users.year_joined),
      year_ending         = COALESCE(EXCLUDED.year_ending,         public.users.year_ending),
      roll_number         = COALESCE(EXCLUDED.roll_number,         public.users.roll_number);

  RETURN NEW;
END;
$$;

-- Recreate trigger (idempotent — drop first)
DROP TRIGGER IF EXISTS sync_auth_user_to_public_users ON auth.users;
CREATE TRIGGER sync_auth_user_to_public_users
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.on_auth_user_created();

-- ─────────────────────────────────────────────────────────────────────
-- 4.3  create_study_dashboard()  — auto-create dashboard row on sign-up
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_study_dashboard()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.study_dashboard (user_id, study_streak, total_study_time, last_active)
  VALUES (NEW.id, 0, 0, NOW())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_dashboard ON auth.users;
CREATE TRIGGER on_auth_user_created_dashboard
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_study_dashboard();


-- =====================================================================
-- SECTION 5: STORAGE POLICIES  (storage.objects — 'notes' bucket)
-- =====================================================================
-- The 'notes' bucket stores files attached to personal notes.
-- Before running this section, ensure the bucket exists:
--   INSERT INTO storage.buckets (id, name, public) VALUES ('notes', 'notes', false)
--   ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Public can view/download notes"          ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload notes"    ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own notes"        ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own notes"        ON storage.objects;

-- Anyone (anonymous) can download files from the notes bucket
CREATE POLICY "Public can view/download notes"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'notes');

-- Authenticated users can upload new files
CREATE POLICY "Authenticated users can upload notes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'notes'
    AND auth.role() = 'authenticated'
  );

-- Owners can replace / update their own files
CREATE POLICY "Users can update their own notes"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING  (bucket_id = 'notes' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'notes' AND auth.uid() = owner);

-- Owners can delete their own files
CREATE POLICY "Users can delete their own notes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'notes' AND auth.uid() = owner);


-- =====================================================================
-- SECTION 6: EXAMPLE SEED DATA  (optional — comment out in production)
-- =====================================================================
-- INSERT INTO public.exam_schedule (title, date, type, description, semester, subject_code)
-- VALUES
--   ('Data Structures End Sem',        '2025-05-10', 'exam',     'CS301 Final Examination',  'S4', 'CST401'),
--   ('Easter Holiday',                 '2025-04-18', 'holiday',  NULL,                        NULL,  NULL),
--   ('Project Submission Deadline',    '2025-05-01', 'deadline', 'Mini-project report due',   'S6',  NULL);


-- =====================================================================
-- VERIFICATION QUERIES (run individually after applying schema)
-- =====================================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT * FROM pg_policies WHERE schemaname = 'public';
-- SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema IN ('public','auth');
-- SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace;
