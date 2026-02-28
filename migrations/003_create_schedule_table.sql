-- migrations/003_create_schedule_table.sql
-- Exam schedule table — populated by the backend server

CREATE TABLE IF NOT EXISTS exam_schedule (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  date        DATE NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('exam', 'holiday', 'deadline', 'event')),
  description TEXT,
  semester    TEXT,        -- e.g. 'S6', 'S7', 'S8' for filtering
  branch      TEXT,        -- e.g. 'CSE', 'ECE', or NULL for all branches
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Fast lookup by date range
CREATE INDEX IF NOT EXISTS idx_exam_schedule_date ON exam_schedule(date);

-- Optional branch filter
CREATE INDEX IF NOT EXISTS idx_exam_schedule_branch ON exam_schedule(branch);

-- Your backend server should use:
--   GET /api/schedule           → SELECT * FROM exam_schedule ORDER BY date ASC
--   GET /api/schedule?semester=S6  → filter by semester
--   GET /api/schedule?branch=CSE   → filter by branch
--   POST /api/schedule          → INSERT a new event (admin only)
--   DELETE /api/schedule/:id    → delete an event (admin only)

-- Example seed data:
-- INSERT INTO exam_schedule (title, date, type, description, semester)
-- VALUES
--   ('Data Structures End Sem', '2025-05-10', 'exam', 'CS301 Final Examination', 'S4'),
--   ('Easter Holiday', '2025-04-18', 'holiday', NULL, NULL),
--   ('Project Submission Deadline', '2025-05-01', 'deadline', 'Mini-project report due', 'S6');
