# KTUfy — Backend Implementation Specification
> **For:** Backend server / agentic AI  
> **Generated:** 2026-03-01  
> **Frontend stack:** React Native (Expo) + TypeScript  
> **Backend expected:** FastAPI (Python) + Supabase (PostgreSQL)

```
Authorization: Bearer <supabase_access_token>
```

The backend **must** validate this token via the Supabase JWT secret (`SUPABASE_JWT_SECRET`)
and extract `sub` (= the user's UUID) to identify the caller.  
The frontend helper is `utils/api.ts → apiRequest()` — it auto-attaches the token and retries
once on 401 with a refreshed token. It times out after **8 seconds**.

### Error response format expected by frontend
```json
{ "detail": "Human-readable error message" }
```
OR
```json
{ "message": "Human-readable error message" }
```

### Environment variable the frontend uses
```
API_BASE_URL=https://your-backend-domain.com
```
All URLs below are relative to this base.

---

## 1. Database (Supabase)

The **full schema** is in [`ktufy_full_schema.sql`](./ktufy_full_schema.sql).  
Run it once in the Supabase SQL Editor — it is idempotent.

### Tables overview

| Table | Owner | Notes |
|-------|-------|-------|
| `public.users` | per-user row | Mirrors `auth.users`; auto-created by trigger on sign-up |
| `public.ticklists` | per-user rows | Study checklists; CRUD done directly via Supabase client (no backend needed) |
| `public.game_stats` | one row / user | Learning Zone scores |
| `public.coding_progress` | one row / user | Coding Hub stats |
| `public.study_dashboard` | one row / user | Streak & study time; auto-created by trigger |
| `public.user_notes` | per-user rows | Library notes; CRUD via Supabase client |
| `public.user_bookmarks` | per-user rows | Library bookmarks; CRUD via Supabase client |
| `public.exam_schedule` | global | Backend populates; app reads directly via Supabase client |

> **Direct Supabase tables** (ticklists, notes, bookmarks, exam_schedule) are accessed by the
> app using the Supabase JS client with RLS. The backend does **not** need REST endpoints for
> these — just populate `exam_schedule` as needed.

---

## 2. Endpoints Required

### 2.1 Auth / User Profile

#### `GET /api/v1/auth/me`
**Status: MUST implement**

Returns the authenticated user's profile row from `public.users`.

```
Headers: Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "user_id": "uuid",
  "email": "student@example.com",
  "name": "John Doe",
  "registration_number": "KTU20CS001",
  "college": "College of Engineering",
  "branch": "CSE",
  "semester": "S6",
  "year_joined": 2020,
  "year_ending": 2024,
  "roll_number": "20CS001",
  "metadata": {},
  "role": "student",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Implementation hint:**
```python
user_id = get_jwt_sub(token)          # extract UUID from JWT
row = supabase.table("users").select("*").eq("id", user_id).single().execute()
```

---

#### `PUT /api/v1/auth/me`
**Status: MUST implement**

Updates any subset of the user's profile fields.

**Request body (all fields optional):**
```json
{
  "name": "Jane Doe",
  "email": "new@example.com",
  "registration_number": "KTU20CS001",
  "college": "Model Engineering College",
  "branch": "CSE",
  "semester": "S6",
  "year_joined": 2020,
  "year_ending": 2024,
  "roll_number": "20CS001",
  "metadata": {}
}
```

**Response 200:** Updated full profile (same shape as GET /api/v1/auth/me)

---

#### `POST /api/v1/auth/request-password-reset`
**Status: MUST implement — PUBLIC endpoint (no JWT required)**

Accepts `email` as a query parameter and triggers Supabase's built-in password reset flow.

```
POST /api/v1/auth/request-password-reset?email=student@example.com
```

**Response 200:**
```json
{ "message": "Password reset email sent." }
```

**Implementation hint:**
```python
supabase.auth.reset_password_for_email(email, options={"redirect_to": "..."})
```

> ⚠️ This is a **public** endpoint — do NOT require Authorization header.

---

#### `POST /api/v1/auth/verify-email`
**Status: MUST implement**

Resends the email verification link to the authenticated user.

```
Headers: Authorization: Bearer <token>
```

**Response 200:**
```json
{ "message": "Verification email sent." }
```

---

#### `DELETE /api/v1/users/{user_id}`
**Status: MUST implement**

Permanently deletes the user account. The caller must match the `{user_id}` in the JWT subject.

```
Headers: Authorization: Bearer <token>
DELETE /api/v1/users/550e8400-e29b-41d4-a716-446655440000
```

**Response 200:**
```json
{ "message": "Account deleted successfully." }
```

**Implementation hint:**
```python
# Delete from auth.users cascades to public.users via FK
supabase.auth.admin.delete_user(user_id)
```

---

### 2.2 AI Chatbot

> The chatbot stores sessions and messages in the backend database (or Supabase — your choice).
> The frontend does NOT directly query any chat tables.

#### `POST /api/v1/chat/message`
**Status: MUST implement**

Sends a user message and returns the AI response. Optionally continues an existing session.

**Request:**
```json
{
  "message": "Explain Operating System scheduling algorithms",
  "session_id": "optional-existing-session-uuid"
}
```

**Response 200:**
```json
{
  "message": {
    "id": "uuid",
    "role": "user",
    "content": "Explain Operating System scheduling algorithms",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "assistant_message": {
    "id": "uuid",
    "role": "assistant",
    "content": "Operating System scheduling algorithms include...",
    "created_at": "2024-01-01T00:00:01Z"
  },
  "session_id": "uuid"
}
```

> If `session_id` is omitted, create a new session automatically and return its id.

---

#### `GET /api/v1/chat/sessions`
**Status: MUST implement**

Returns all chat sessions for the authenticated user (newest first).

**Response 200:**
```json
[
  {
    "id": "uuid",
    "title": "OS Scheduling",
    "model_name": "gemini-1.5-flash",
    "created_at": "...",
    "updated_at": "..."
  }
]
```

---

#### `POST /api/v1/chat/sessions`
**Status: MUST implement**

Creates a new empty chat session.

**Request:**
```json
{ "title": "New Chat" }
```

**Response 200:** Single session object (same shape as above)

---

#### `GET /api/v1/chat/sessions/{id}`
**Status: MUST implement**

Returns a session with all its messages.

**Response 200:**
```json
{
  "id": "uuid",
  "title": "OS Scheduling",
  "model_name": "gemini-1.5-flash",
  "created_at": "...",
  "updated_at": "...",
  "messages": [
    { "id": "uuid", "role": "user",      "content": "...", "created_at": "..." },
    { "id": "uuid", "role": "assistant", "content": "...", "created_at": "..." }
  ]
}
```

---

#### `PUT /api/v1/chat/sessions/{id}`
**Status: MUST implement**

Renames a chat session.

**Request:** `{ "title": "New title" }`  
**Response 200:** Updated session object

---

#### `DELETE /api/v1/chat/sessions/{id}`
**Status: MUST implement**

Deletes a session and all its messages.

**Response 200:** `{ "message": "Session deleted." }`

---

### 2.3 AI Flashcards

#### `POST /api/v1/flashcards/generate`
**Status: MUST implement**

Generates AI flashcards for a given topic using an LLM.

**Request:**
```json
{
  "topic": "Dijkstra's Algorithm",
  "count": 10
}
```
- `count` defaults to **10** if omitted.

**Response 200:**
```json
{
  "topic": "Dijkstra's Algorithm",
  "flashcards": [
    { "front": "What is Dijkstra's algorithm used for?", "back": "Finding the shortest path in a weighted graph." },
    { "front": "Time complexity of Dijkstra with min-heap?", "back": "O((V + E) log V)" }
  ]
}
```

---

### 2.4 Syllabus Viewer

> The syllabus is KTU's official curriculum parsed by the backend's RAG/PDF pipeline.

#### `GET /api/v1/syllabus/branches`
**Status: MUST implement**

Returns all available branch codes.

**Response 200:**
```json
[
  { "code": "CSE", "name": "Computer Science & Engineering" },
  { "code": "ECE", "name": "Electronics & Communication Engineering" },
  { "code": "ME",  "name": "Mechanical Engineering" }
]
```

---

#### `GET /api/v1/syllabus/subjects?branch={branch}&semester={semester}`
**Status: MUST implement**

Returns list of subjects for a branch + semester combination.

**Query params:** `branch=CSE`, `semester=S6`

**Response 200:**
```json
[
  { "name": "Compiler Design",   "code": "CST302", "credits": 4 },
  { "name": "Computer Networks", "code": "CST304", "credits": 4 }
]
```

---

#### `GET /api/v1/syllabus/subject/{subjectCode}`
**Status: MUST implement**

Returns the full detailed syllabus for one subject.

**Response 200:**
```json
{
  "subject_name": "Compiler Design",
  "subject_code": "CST302",
  "credits": 4,
  "modules": [
    {
      "module_number": 1,
      "title": "Introduction to Compilers",
      "topics": ["Phases of compilation", "Lexical analysis", "Regular expressions"],
      "hours": 9
    }
  ],
  "course_outcomes": ["CO1: ...", "CO2: ..."],
  "textbooks": ["Compilers: Principles, Techniques and Tools — Aho et al."],
  "references": ["Engineering a Compiler — Cooper & Torczon"]
}
```

---

### 2.5 Learning Zone — Quiz & Match

#### `POST /api/v1/learning/quiz/generate`
**Status: MUST implement**

Generates multiple-choice quiz questions for a topic using an LLM.

**Request:**
```json
{
  "topic": "Binary Trees",
  "count": 5,
  "difficulty": "medium"
}
```
- `count` defaults to **5**; `difficulty` defaults to `"medium"`.
- `difficulty` values: `"easy"` | `"medium"` | `"hard"`

**Response 200:**
```json
{
  "topic": "Binary Trees",
  "questions": [
    {
      "question": "What is the maximum number of nodes in a binary tree of height h?",
      "options": ["h", "2h", "2^h - 1", "2^(h+1) - 1"],
      "correctAnswer": 3,
      "explanation": "A complete binary tree of height h has 2^(h+1) - 1 nodes."
    }
  ]
}
```
- `correctAnswer` is a **0-based index** into `options`.

---

#### `POST /api/v1/learning/match/generate`
**Status: MUST implement**

Generates term–definition pairs for a "Match the Following" game.

**Request:**
```json
{
  "topic": "DBMS Normal Forms",
  "count": 6
}
```
- `count` defaults to **6**.

**Response 200:**
```json
{
  "topic": "DBMS Normal Forms",
  "pairs": [
    { "term": "1NF", "definition": "Eliminates repeating groups; each cell holds atomic values." },
    { "term": "2NF", "definition": "No partial dependency on a composite primary key." }
  ]
}
```

---

### 2.6 Coding Hub — Code Execution

#### `POST /api/v1/coding/execute`
**Status: SHOULD implement (has auto-fallback)**

Executes a code snippet in a sandboxed environment.

> **Fallback behaviour:** If this endpoint returns an error or is unreachable,
> `codingService.ts` automatically falls back to the **free Judge0 CE public API**
> (`https://ce.judge0.com`). So the app works without this endpoint, but having
> the backend proxy is preferred for reliability.

**Supported languages (frontend constants):**

| Key | Judge0 language_id |
|-----|--------------------|
| `python` | 71 (Python 3.8.1) |
| `c` | 50 (GCC 9.2.0) |
| `cpp` | 54 (GCC 9.2.0) |
| `java` | 62 (OpenJDK 13) |

**Request:**
```json
{
  "source_code": "print('Hello, world!')",
  "language": "python",
  "stdin": ""
}
```

**Response 200:**
```json
{
  "stdout": "Hello, world!\n",
  "stderr": null,
  "compile_output": null,
  "status": { "id": 3, "description": "Accepted" },
  "time": "0.012",
  "memory": 9216
}
```

**Implementation hint:** Proxy to Judge0 CE (self-hosted or `ce.judge0.com`).

---

## 3. What the Frontend Does NOT Call the Backend For

These are handled directly via the Supabase JS client with RLS — no backend REST endpoints needed:

| Feature | Supabase Table | Operation |
|---------|----------------|-----------|
| Ticklists (study checklists) | `public.ticklists` | Full CRUD |
| Personal Notes | `public.user_notes` | Full CRUD |
| Bookmarks | `public.user_bookmarks` | Full CRUD |
| Exam Schedule (read) | `public.exam_schedule` | SELECT (app reads) |
| Game Stats | `public.game_stats` | SELECT + UPSERT |
| Coding Progress | `public.coding_progress` | SELECT + UPSERT |
| Study Dashboard | `public.study_dashboard` | SELECT + UPSERT |
| Sign-up profile sync | Trigger `on_auth_user_created` | Auto via DB trigger |
| Study dashboard creation | Trigger `create_study_dashboard` | Auto via DB trigger |

---

## 4. Missing / Not Yet Implemented (Future)

| Feature | Endpoint | Notes |
|---------|----------|-------|
| Admin: add exam event | `POST /api/admin/schedule` | Backend only; admin tool to insert into `exam_schedule` |
| Delete account (frontend ready) | `DELETE /api/v1/users/{user_id}` | Service written, not yet wired to a UI button |
| Profile picture upload | — | Store URL in `users.metadata`; use Supabase Storage |
| Full profile edit modal | — | `updateUserProfile()` already supports all fields |

---

## 5. Request / Response Patterns

### Standard success
```json
HTTP 200
{ ...data... }
```

### Standard error
```json
HTTP 4xx / 5xx
{ "detail": "Error description" }
```

### Auth failure (missing / expired token)
```json
HTTP 401
{ "detail": "Not authenticated" }
```

### Validation error (FastAPI default)
```json
HTTP 422
{
  "detail": [
    { "loc": ["body", "topic"], "msg": "field required", "type": "value_error.missing" }
  ]
}
```

---

## 6. Priority Order for Backend Implementation

Implement in this order for the fastest path to a working MVP:

```
1. GET  /api/v1/auth/me                        ← app won't load profile without this
2. PUT  /api/v1/auth/me                        ← profile editing
3. POST /api/v1/auth/request-password-reset    ← password reset flow
4. POST /api/v1/auth/verify-email              ← email verification
5. POST /api/v1/chat/message                   ← core AI feature
6. GET/POST/PUT/DELETE /api/v1/chat/sessions   ← chat history
7. POST /api/v1/flashcards/generate            ← AI flashcards
8. GET  /api/v1/syllabus/branches              ← syllabus viewer
9. GET  /api/v1/syllabus/subjects              ← syllabus viewer
10. GET  /api/v1/syllabus/subject/{code}       ← syllabus viewer
11. POST /api/v1/learning/quiz/generate        ← quiz game
12. POST /api/v1/learning/match/generate       ← match game
13. POST /api/v1/coding/execute                ← code runner (has fallback)
14. DELETE /api/v1/users/{user_id}             ← account deletion (low priority)
```

---

## 7. Supabase Setup Checklist

- [ ] Run `ktufy_full_schema.sql` in Supabase SQL Editor  
- [ ] Confirm triggers fire correctly on a test sign-up  
- [ ] Confirm RLS policies are active (`SELECT * FROM pg_policies WHERE schemaname = 'public'`)  
- [ ] Create `notes` storage bucket (public download, auth upload)  
- [ ] Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` env vars in backend  
- [ ] Set `SUPABASE_JWT_SECRET` env var for JWT verification  

---

*This file was auto-generated from the KTUfy frontend codebase on 2026-03-01.*  
*Source of truth: `services/*.ts` and `ktufy_full_schema.sql`.*
