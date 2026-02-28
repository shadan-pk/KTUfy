🎯 KTUfy Backend API Endpoints - Complete List


✅ Implemented

GET /api/v1/auth/me - Get current user profile

---

🔴 Priority 1: Core Features (Must Implement)


Authentication & User Management (4 endpoints)

PUT /api/v1/auth/me - Update user profile
POST /api/v1/auth/change-password - Change password
POST /api/v1/auth/verify-email - Send verification email
DELETE /api/v1/users/{user_id} - Delete account

Ticklist Management (7 endpoints)

GET /api/v1/ticklists?user_id={id} - Get all ticklists
GET /api/v1/ticklists/{id} - Get single ticklist
POST /api/v1/ticklists - Create ticklist
PUT /api/v1/ticklists/{id} - Update ticklist
DELETE /api/v1/ticklists/{id} - Delete ticklist
POST /api/v1/ticklists/{id}/items - Add item to ticklist
PUT /api/v1/ticklists/{id}/items/{item_id}/toggle - Toggle item completion

AI Chatbot (3 endpoints - partially implemented via chatService.ts)

POST /api/v1/chat/message - Send chat message & get AI response
GET /api/v1/chat/sessions - Get all chat sessions
GET /api/v1/chat/sessions/{id} - Get chat session with messages
POST /api/v1/chat/sessions - Create new chat session
PUT /api/v1/chat/sessions/{id} - Update chat session title
DELETE /api/v1/chat/sessions/{id} - Delete chat session

---

🟡 Priority 2: New Features (Frontend Ready)


AI Flashcards (1 endpoint)

POST /api/v1/flashcards/generate - Generate flashcards for a topic
  Request: { topic: string, count?: number }
  Response: { flashcards: [{ front: string, back: string }], topic: string }

Schedule / Exam Calendar (2 endpoints)

GET /api/v1/schedule/exams - Get all exam schedule events
  Response: [{ id: string, date: string, title: string, type: 'holiday'|'exam'|'deadline'|'event', description?: string }]
GET /api/v1/schedule/upcoming - Get upcoming events (next 30 days)

Syllabus Viewer (3 endpoints)

GET /api/v1/syllabus/branches - Get available branches
  Response: [{ code: string, name: string }]
GET /api/v1/syllabus/subjects?branch={branch}&semester={semester} - Get subjects
  Response: [{ name: string, code: string, credits: number }]
GET /api/v1/syllabus/subject/{subjectCode} - Get detailed syllabus for a subject
  Response: { subject_name, subject_code, credits, modules: [{ module_number, title, topics, hours }], course_outcomes?, textbooks?, references? }

Learning Zone - Topic Quizzes (2 endpoints)

POST /api/v1/learning/quiz/generate - Generate quiz questions for a topic
  Request: { topic: string, count?: number, difficulty?: 'easy'|'medium'|'hard' }
  Response: { questions: [{ question: string, options: string[], correctAnswer: number, explanation?: string }], topic: string }

POST /api/v1/learning/match/generate - Generate match-the-following pairs
  Request: { topic: string, count?: number }
  Response: { pairs: [{ term: string, definition: string }], topic: string }

Coding Hub - Code Execution (1 endpoint)

POST /api/v1/coding/execute - Execute code in sandbox
  Request: { source_code: string, language: string, stdin?: string }
  Response: { stdout, stderr, compile_output, status: { id, description }, time, memory }
  Note: Frontend also has Judge0 free API fallback

---

⏸️ Priority 3: Future/Deferred Features


Group Study (Deferred - using WhatsApp group link instead)
  Frontend app links to WhatsApp group invite URL.
  Backend group study endpoints NOT needed for MVP.

Previous Year Papers (Hidden)
  PYP page hidden from UI. Will revisit when actual papers are sourced.

Library → Personal Notes/Bookmarks (Repurposed)
  Library is being repurposed from study material uploads to
  personal notes/bookmarks. New endpoints TBD.

---

📊 Summary

Total Endpoints: 30

✅ Implemented: 1
🔴 Priority 1 (Core): 17 endpoints (auth, ticklist, chat)
🟡 Priority 2 (New): 8 endpoints (flashcards, schedule, syllabus, quiz, coding)
⏸️ Priority 3 (Future): 4+ endpoints (group study, PYP, library repurpose)

Minimum Viable Product (MVP):
Priority 1 + Priority 2 = 26 endpoints (1 done + 25 pending)