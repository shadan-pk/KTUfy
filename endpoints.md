# 🎯 KTUfy Backend API Endpoints

> Last updated: 2026-03-01  
> Base URL env var: `API_BASE_URL` (set in `.env`)  
> Auth: every request from `utils/api.ts` sends the Supabase JWT as `Authorization: Bearer <token>`

---

## ✅ Implemented & In Use

### Auth / User Profile
| Method | Endpoint | Description | Service |
|--------|----------|-------------|---------|
| `GET` | `/api/v1/auth/me` | Get current user's profile (reads `public.users`) | `userService.ts` |
| `PUT` | `/api/v1/auth/me` | Update profile (name, branch, semester, etc.) | `userService.ts` |
| `POST` | `/api/v1/auth/verify-email` | Send email verification link | `userService.ts` |
| `POST` | `/api/v1/auth/request-password-reset?email=` | Send password reset email (public, no auth) | `userService.ts` |
| `DELETE` | `/api/v1/users/{user_id}` | Delete user account permanently | `userService.ts` |

### Ticklists (Study Checklist)
| Method | Endpoint | Description | Service |
|--------|----------|-------------|---------|
| `GET` | `/api/v1/ticklists?user_id={id}` | Get all ticklists for a user | direct Supabase |
| `GET` | `/api/v1/ticklists/{id}` | Get a single ticklist | direct Supabase |
| `POST` | `/api/v1/ticklists` | Create a new ticklist | direct Supabase |
| `PUT` | `/api/v1/ticklists/{id}` | Update ticklist (name / color / items) | direct Supabase |
| `DELETE` | `/api/v1/ticklists/{id}` | Delete a ticklist | direct Supabase |
| `POST` | `/api/v1/ticklists/{id}/items` | Add item to ticklist | direct Supabase |
| `PUT` | `/api/v1/ticklists/{id}/items/{item_id}/toggle` | Toggle item completion | direct Supabase |

> **Note:** Ticklists are read/written **directly via the Supabase client** (not proxied through the backend API), using `public.ticklists` with RLS.

### AI Chatbot
| Method | Endpoint | Description | Service |
|--------|----------|-------------|---------|
| `POST` | `/api/v1/chat/message` | Send message; returns user msg + AI response + session_id | `chatService.ts` |
| `GET` | `/api/v1/chat/sessions` | List all chat sessions for current user | `chatService.ts` |
| `POST` | `/api/v1/chat/sessions` | Create a new chat session | `chatService.ts` |
| `GET` | `/api/v1/chat/sessions/{id}` | Get session + all messages | `chatService.ts` |
| `PUT` | `/api/v1/chat/sessions/{id}` | Rename a chat session | `chatService.ts` |
| `DELETE` | `/api/v1/chat/sessions/{id}` | Delete a chat session | `chatService.ts` |

### AI Flashcards
| Method | Endpoint | Request Body | Response | Service |
|--------|----------|-------------|----------|---------|
| `POST` | `/api/v1/flashcards/generate` | `{ topic: string, count?: number }` | `{ flashcards: [{front, back}], topic }` | `flashcardService.ts` |

### Syllabus Viewer
| Method | Endpoint | Description | Service |
|--------|----------|-------------|---------|
| `GET` | `/api/v1/syllabus/branches` | List available branches `[{code, name}]` | `syllabusService.ts` |
| `GET` | `/api/v1/syllabus/subjects?branch={b}&semester={s}` | Subjects for a branch+semester | `syllabusService.ts` |
| `GET` | `/api/v1/syllabus/subject/{subjectCode}` | Full syllabus detail (modules, outcomes, books) | `syllabusService.ts` |

### Learning Zone — Quizzes & Match
| Method | Endpoint | Request Body | Response | Service |
|--------|----------|-------------|----------|---------|
| `POST` | `/api/v1/learning/quiz/generate` | `{ topic, count?, difficulty?: 'easy'\|'medium'\|'hard' }` | `{ questions: [{question, options[], correctAnswer, explanation?}], topic }` | `quizService.ts` |
| `POST` | `/api/v1/learning/match/generate` | `{ topic, count? }` | `{ pairs: [{term, definition}], topic }` | `quizService.ts` |

### Coding Hub — Code Execution
| Method | Endpoint | Request Body | Response | Service |
|--------|----------|-------------|----------|---------|
| `POST` | `/api/v1/coding/execute` | `{ source_code, language, stdin? }` | `{ stdout, stderr, compile_output, status:{id,description}, time, memory }` | `codingService.ts` |

> **Fallback:** If the backend is unavailable, `codingService.ts` falls back to the free [Judge0 CE public API](https://ce.judge0.com) automatically.

### Exam Schedule / Events
| Method | Endpoint | Description | Service |
|--------|----------|-------------|---------|
| `GET` | `(Supabase direct)` `exam_schedule` table | Filtered by `semester` and/or `branch`, ordered by date | `scheduleService.ts` |
| `GET` | `(Supabase direct)` upcoming 30 days | `date >= today AND date <= today+30` | `scheduleService.ts` |

> **Note:** Schedule data is read **directly from Supabase** (`public.exam_schedule`), not via a backend REST endpoint. The backend server populates the table; the app reads it directly.

---

## 🎬 Media Tools

> **Status: Frontend UI complete — backend endpoints NOT yet implemented.**  
> All 4 tool screens (Video, Audio, Image, PDF) are built and ready. Processing is `multipart/form-data` upload → backend processes → returns file download.  
> See [`MEDIA_TOOLS_SPEC.md`](./MEDIA_TOOLS_SPEC.md) for full request/response contracts and FFmpeg/Pillow/PyMuPDF implementation hints.

### 🎬 Video Tools (`/api/v1/media/video/`)
| Method | Endpoint | Inputs | Notes |
|--------|----------|--------|-------|
| `POST` | `/api/v1/media/video/convert` | `file`, `output_format`, `quality?` | Formats: mp4, mkv, avi, mov, webm, flv |
| `POST` | `/api/v1/media/video/extract-audio` | `file`, `output_format` | Audio formats: mp3, aac, wav, ogg, flac |
| `POST` | `/api/v1/media/video/to-gif` | `file`, `fps?` | fps: 5/10/15/24 — default 10 |
| `POST` | `/api/v1/media/video/compress` | `file`, `quality` | Target res: 1080p/720p/480p/360p |

### 🎵 Audio Tools (`/api/v1/media/audio/`)
| Method | Endpoint | Inputs | Notes |
|--------|----------|--------|-------|
| `POST` | `/api/v1/media/audio/convert` | `file`, `output_format`, `quality?` | Formats: mp3, aac, wav, ogg, flac, m4a |
| `POST` | `/api/v1/media/audio/trim` | `file`, `start`, `end`, `output_format?` | Times in `mm:ss` or seconds |
| `POST` | `/api/v1/media/audio/merge` | `files[]`, `output_format?` | Multiple files merged in order |
| `POST` | `/api/v1/media/audio/normalize` | `file`, `output_format?` | Loudness normalization via FFmpeg |

### 🖼️ Image Tools (`/api/v1/media/image/`)
| Method | Endpoint | Inputs | Notes |
|--------|----------|--------|-------|
| `POST` | `/api/v1/media/image/convert` | `file`, `output_format` | Formats: jpg, png, webp, avif, gif, bmp |
| `POST` | `/api/v1/media/image/compress` | `file`, `quality?`, `output_format?` | Quality: 50–100 |
| `POST` | `/api/v1/media/image/resize` | `file`, `width`, `height`, `output_format?` | Pixel dimensions |

### 📄 PDF Tools (`/api/v1/media/pdf/`)
| Method | Endpoint | Inputs | Notes |
|--------|----------|--------|-------|
| `POST` | `/api/v1/media/pdf/merge` | `files[]` | Merged in order provided |
| `POST` | `/api/v1/media/pdf/split` | `file`, `ranges` | e.g. `"1-3,4-7,8-end"` → ZIP |
| `POST` | `/api/v1/media/pdf/compress` | `file`, `quality?` | screen/print/high/max |
| `POST` | `/api/v1/media/pdf/images-to-pdf` | `files[]` | JPG/PNG/WEBP → single PDF |
| `POST` | `/api/v1/media/pdf/pdf-to-images` | `file`, `output_format?`, `quality?` | Each page → image → ZIP |

---

## ⏸️ Deferred / Future Features

| Feature | Status | Notes |
|---------|--------|-------|
| `POST /api/v1/auth/change-password` | Not implemented | Could use Supabase Auth directly |
| Group Study | Deferred | Using a WhatsApp group invite link instead |
| Previous Year Papers (PYP) | Hidden | Page hidden; revisit when papers are sourced |
| Library — Notes/Bookmarks endpoints | Supabase direct | `user_notes` and `user_bookmarks` tables exist; currently read/written via Supabase client |
| Admin: `POST /api/schedule` | Backend-only | Admin inserts events directly into `exam_schedule` table |

---

## 📊 Summary

| Category | Count | Implementation |
|----------|-------|----------------|
| Auth / Profile | 5 | FastAPI backend |
| Ticklists | 7 | Supabase direct (RLS) |
| AI Chatbot | 6 | FastAPI backend |
| AI Flashcards | 1 | FastAPI backend |
| Syllabus | 3 | FastAPI backend |
| Quiz / Match | 2 | FastAPI backend |
| Code Execution | 1 | FastAPI backend + Judge0 fallback |
| Exam Schedule | 2 | Supabase direct (RLS) |
| 🎬 Video Tools | 4 | FastAPI backend (FFmpeg) — not yet implemented |
| 🎵 Audio Tools | 4 | FastAPI backend (FFmpeg) — not yet implemented |
| 🖼️ Image Tools | 3 | FastAPI backend (Pillow) — not yet implemented |
| 📄 PDF Tools | 5 | FastAPI backend (PyMuPDF) — not yet implemented |
| **Total** | **43** | |
