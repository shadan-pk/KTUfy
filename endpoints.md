🎯 KTUfy Backend API Endpoints - Complete List


✅ Implemented


GET /api/v1/auth/me - Get current user profile


❌ Priority 1: Core Features (Must Implement)


Authentication & User Management

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

AI Chatbot (3 endpoints)

POST /api/v1/chatbot/message - Send chat message
GET /api/v1/chatbot/history?user_id={id} - Get chat history
DELETE /api/v1/chatbot/history/{user_id} - Clear chat history


❌ Priority 2: Important Features


Library/Study Materials (6 endpoints)

GET /api/v1/library/materials - List study materials
GET /api/v1/library/materials/{id} - Get material details
POST /api/v1/library/materials - Upload material (multipart/form-data)
DELETE /api/v1/library/materials/{id} - Delete material
GET /api/v1/library/syllabus?branch={branch}&semester={sem} - Get syllabus
GET /api/v1/library/pyp?year={year}&branch={branch} - Get previous year papers

Group Study (9 endpoints + WebSocket)

GET /api/v1/groups?user_id={id} - Get user's groups
POST /api/v1/groups - Create group
POST /api/v1/groups/{id}/join - Join group with code
GET /api/v1/groups/{id}/members - Get group members
GET /api/v1/groups/{id}/chat - Get group chat messages
POST /api/v1/groups/{id}/chat - Send chat message (or WebSocket)
GET /api/v1/groups/{id}/checklist - Get group checklist
PUT /api/v1/groups/{id}/checklist - Update group checklist
DELETE /api/v1/groups/{id} - Delete/leave group


⏸️ Priority 3: Optional Features


Schedule/Calendar (3 endpoints)

GET /api/v1/schedule/calendar - Get academic calendar
GET /api/v1/schedule/events - Get upcoming events
POST /api/v1/schedule/reminders - Set personal reminders

Coding Hub (4 endpoints)

GET /api/v1/coding/problems - List coding problems
GET /api/v1/coding/problems/{id} - Get problem details
POST /api/v1/coding/submit - Submit code for evaluation
GET /api/v1/coding/leaderboard - Get leaderboard

Learning Zone (5 endpoints)

GET /api/v1/learning/courses - List courses
GET /api/v1/learning/courses/{id} - Get course details
POST /api/v1/learning/progress - Update progress
GET /api/v1/learning/quizzes - Get quizzes
POST /api/v1/learning/quiz/submit - Submit quiz answers


📊 Summary
Total Endpoints: 42

✅ Implemented: 1
❌ Priority 1 (Core): 14 endpoints
❌ Priority 2 (Important): 15 endpoints
⏸️ Priority 3 (Optional): 12 endpoints
Minimum Viable Product (MVP):
Implement Priority 1 only = 15 endpoints total (1 done + 14 pending)