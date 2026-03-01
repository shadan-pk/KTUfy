# KTUfy Backend — Pending Tasks

> Generated: 2026-03-01
> Source: Compared frontend spec (`BACKEND_SPEC.md`, `endpoints.md`, `ktufy_full_schema.sql`)
> against current backend implementation.

---

## Priority Legend

| Tag | Meaning |
|-----|---------|
| P0 | Blocks the app from working — implement first |
| P1 | Core feature the frontend actively calls |
| P2 | Important but has a fallback or is lower priority |
| P3 | Nice to have / admin-only |

---

## 1. API Response Format Fixes (P0) — DONE

The frontend expects specific response shapes that differ from what the backend currently returns.

### 1.1 `GET /api/v1/auth/me` — Flatten response
- [x] Frontend expects a flat JSON object with top-level fields:
  `user_id`, `email`, `name`, `registration_number`, `college`, `branch`, `semester`,
  `year_joined`, `year_ending`, `roll_number`, `metadata`, `role`, `created_at`
- [x] Backend currently returns `{ user_id, email, role, metadata: { ...all fields nested... } }`
- [x] Fix: Return all `public.users` columns as top-level fields, not nested inside `metadata`

### 1.2 `PUT /api/v1/auth/me` — Add `semester` field
- [x] Frontend sends `semester` (string like `"S6"`) as an update field
- [x] Backend `UserUpdateRequest` schema does **not** have a `semester` field
- [x] Fix: Add `semester: Optional[str]` to `UserUpdateRequest` and handle it in the upsert logic
- [x] Response must match the flat shape described in 1.1

### 1.3 `DELETE /api/v1/users/{user_id}` — Path mismatch
- [x] Frontend calls `DELETE /api/v1/users/{user_id}`
- [x] Backend has it at `DELETE /api/v1/auth/users/{user_id}`
- [x] Fix: Either add a new route at the expected path, or redirect/alias it

---

## 2. Missing Endpoints — Must Implement (P1)

These endpoints are actively called by the frontend and have no fallback.

### 2.1 `POST /api/v1/flashcards/generate` — DONE
- [x] Create a new router: `routers/flashcards.py`
- [x] Accept: `{ "topic": "string", "count": 10, "force_regenerate": false }`  (count defaults to 10)
- [x] Return: `{ "id": "uuid", "topic": "...", "flashcards": [...], "cached": bool, "created_at": "..." }`
- [x] Use Groq/Ollama LLM to generate flashcards for the given topic
- [x] Cache results in `generated_content` table (`content_type = 'flashcard'`)
- [x] Return cached version if topic already generated (bypass with `force_regenerate: true`)
- [x] Additional endpoints: `GET /` (list sets), `GET /{id}`, `DELETE /{id}`
- [x] Register router in `main.py`

### 2.2 `GET /api/v1/syllabus/branches` — DONE
- [x] Create a new router: `routers/syllabus.py`
- [x] Return all available branch codes from Neo4j KG
- [x] Response: `[{ "code": "CSE", "name": "Computer Science & Engineering", "subject_count": 4 }, ...]`

### 2.3 `GET /api/v1/syllabus/subjects?branch={branch}&semester={semester}` — DONE
- [x] Add to syllabus router
- [x] Query params: `branch` (e.g. "CSE"), `semester` (e.g. "S6" or "6")
- [x] Return: `[{ "name": "...", "code": "CST302", "credits": 4, "semester": 6, "module_count": 5 }, ...]`
- [x] Source data from Neo4j knowledge graph

### 2.4 `GET /api/v1/syllabus/subject/{subjectCode}` — DONE
- [x] Add to syllabus router
- [x] Return full subject detail with modules, topics, textbooks, course outcomes
- [x] Fuzzy code matching (e.g. "CST201" finds "CST 201")
- [x] Source from Neo4j KG (both V1 Topic and V2 Concept nodes)
- [x] Register router in `main.py`

### 2.5 `POST /api/v1/learning/quiz/generate`
- [x] Create a new router: `routers/learning.py`
- [x] Accept: `{ "topic": "...", "count": 5, "difficulty": "medium" }`
  - `count` defaults to 5, `difficulty` defaults to `"medium"`
  - `difficulty` values: `"easy"` | `"medium"` | `"hard"`
- [x] Return:
  ```json
  {
    "topic": "...",
    "questions": [{
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 2,
      "explanation": "..."
    }]
  }
  ```
- [x] `correctAnswer` is a **0-based index** into `options`
- [x] DB caching via `generated_content` table (`content_type = 'quiz'`)
- [x] Fuzzy topic matching (exact → partial ilike)
- [x] `force_regenerate` flag to bypass cache
- [x] CRUD endpoints: GET list, GET by ID, DELETE, GET search
- [x] Register router in `main.py`

### 2.6 `POST /api/v1/learning/match/generate`
- [x] Add to learning router
- [x] Accept: `{ "topic": "...", "count": 6 }`  (count defaults to 6)
- [x] Return: `{ "topic": "...", "pairs": [{ "term": "...", "definition": "..." }] }`
- [x] DB caching via `generated_content` table (`content_type = 'qa'`)
- [x] Fuzzy topic matching + `force_regenerate` flag
- [x] Shared CRUD endpoints with quiz (filter by ?type=quiz|match|all)

---

## 3. Missing Endpoint — Should Implement (P2)

### 3.1 `POST /api/v1/coding/execute` — DONE
- [x] Create a new router: `routers/coding.py`
- [x] Accept: `{ "source_code": "...", "language": "python", "stdin": "" }`
- [x] Supported languages: `python` (71), `c` (50), `cpp` (54), `java` (62) — Judge0 IDs
- [x] Return: `{ "stdout", "stderr", "compile_output", "status": { "id", "description" }, "time", "memory" }`
- [x] Implementation: Proxy to Judge0 CE via httpx (async, base64-encoded, synchronous wait)
- [x] Configurable via `JUDGE0_API_URL`, `JUDGE0_API_KEY`, `JUDGE0_API_HOST` env vars
- [x] **Has fallback**: Frontend auto-falls back to free Judge0 CE public API if this fails
- [x] Register router in `main.py`

---


## 5. Backend Code Changes Summary

### New routers to create:
| Router | File | Endpoints |
|--------|------|-----------|
| Flashcards | `routers/flashcards.py` | `POST /generate`, `GET /`, `GET /{id}`, `DELETE /{id}` |
| Syllabus | `routers/syllabus.py` | `GET /branches`, `GET /subjects`, `GET /subject/{code}` |
| Learning | `routers/learning.py` | `POST /quiz/generate`, `POST /match/generate` |
| Coding | `routers/coding.py` | `POST /execute` |

### Files to modify:
| File | Change |
|------|--------|
| `main.py` | Register 4 new routers |
| `schemas/user.py` | Add `semester` field to `UserUpdateRequest`; create flat `UserProfileResponse` |
| `routers/auth.py` | Fix `GET /me` response shape (flatten); add `semester` to `PUT /me`; add route alias for `DELETE /api/v1/users/{user_id}` |

### New schema files:
| File | Models |
|------|--------|
| `schemas/flashcard.py` | `FlashcardRequest`, `FlashcardResponse` |
| `schemas/syllabus.py` | `BranchResponse`, `SubjectListItem`, `SubjectDetail`, `ModuleDetail` |
| `schemas/learning.py` | `QuizRequest`, `QuizResponse`, `MatchRequest`, `MatchResponse` |
| `schemas/coding.py` | `CodeExecuteRequest`, `CodeExecuteResponse` |

---

## 6. Implementation Order (Fastest to Working MVP)

```

Step 2: Fix existing endpoints (P0)
  → Fix GET /api/v1/auth/me response shape (flatten)
  → Add semester to PUT /api/v1/auth/me
  → Add DELETE /api/v1/users/{user_id} route

Step 3: Flashcards endpoint (P1)
  → POST /api/v1/flashcards/generate

Step 4: Syllabus endpoints (P1)
  → GET /api/v1/syllabus/branches
  → GET /api/v1/syllabus/subjects
  → GET /api/v1/syllabus/subject/{code}

Step 5: Learning endpoints (P1)
  → POST /api/v1/learning/quiz/generate
  → POST /api/v1/learning/match/generate

Step 6: Coding endpoint (P2)
  → POST /api/v1/coding/execute
```

---

## 7. What's Already Done (No Action Needed)

These frontend-expected endpoints already exist and work:

| Endpoint | Status |
|----------|--------|
| `GET /api/v1/auth/me` | Exists (needs response shape fix) |
| `PUT /api/v1/auth/me` | Exists (needs semester field) |
| `POST /api/v1/auth/request-password-reset` | Working |
| `POST /api/v1/auth/verify-email` | Working |
| `POST /api/v1/chat/message` | Working |
| `GET /api/v1/chat/sessions` | Working |
| `POST /api/v1/chat/sessions` | Working |
| `GET /api/v1/chat/sessions/{id}` | Working |
| `PUT /api/v1/chat/sessions/{id}` | Working |
| `DELETE /api/v1/chat/sessions/{id}` | Working |

Tables handled directly by Supabase client (no backend endpoints needed):
- `ticklists` — once table exists
- `user_notes` — once table exists
- `user_bookmarks` — once table exists
- `exam_schedule` — once table exists and admin populates it
- `game_stats` — once table exists
- `coding_progress` — once table exists
- `study_dashboard` — once table + trigger exists
