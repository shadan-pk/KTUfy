# KTUfy - Features & Tech Stack Documentation

> **Last Updated:** February 23, 2026  
> **Version:** 1.0.0  
> **Status:** Active Development

---

## 📱 App Overview

**KTUfy** is a comprehensive academic companion app designed for KTU (Kerala Technological University) students. It combines study management, AI assistance, coding practice, gamified learning, and academic tools in one cross-platform mobile application.

**Platform Support:** iOS, Android, Web

---

## ✨ Core Features

### 🔐 Authentication & User Management
- **Email/Password Authentication** via Supabase Auth
- **User Profile Management**
  - Full profile editing (name, registration number, college, branch, roll number, year)
  - Email verification system
  - Password reset via email
  - Account deletion functionality
  - Secure session management with JWT tokens
- **Row Level Security (RLS)** for data protection
- **Persistent Sessions** using Expo Secure Store

### 🏠 Home Dashboard
- **Personalized Welcome Screen**
  - User greeting with real-time clock
  - Profile quick view (name, email, registration details)
- **Study Analytics**
  - Study streak tracking (consecutive days)
  - Focus timer with start/pause functionality
  - Total study time tracking
- **Gamification System**
  - Points and achievements system
  - Daily challenges with progress tracking
    - Complete 5 Tasks (50 points)
    - Focus Session - 25 minutes (30 points)
    - Early Bird - Study before 9 AM (20 points)
- **Quick Action Cards** for all major features
- **Backend API Testing** integration button

### 📝 Study Management

#### ✅ Ticklist (Study Checklist)
- **Multi-Subject Management**
  - Create subjects with custom names, codes, and colors
  - Add/remove/edit checklist items per subject
  - Mark items as completed with visual feedback
  - Trending items indicator
  - Subject-based organization
- **Supabase Integration**
  - Real-time data synchronization
  - Persistent storage across devices
  - User-specific ticklists with RLS policies

#### 📚 Library (Study Materials)
- **Document Management**
  - Upload and organize study materials
  - Document picker integration (PDF, DOCX, PPTX, etc.)
  - File preview and download functionality
  - Categorization by subject/topic
- **Supabase Storage Integration**
  - Secure file storage with access policies
  - Direct file URLs for sharing
  - Storage quota management

#### 📖 Previous Year Papers (PYP)
- **Exam Paper Repository**
  - Browse previous year question papers
  - Filter by year, semester, subject
  - Download and view papers offline
  - Community-driven paper uploads
- **Organized by:**
  - Academic year
  - Semester
  - Subject code
  - Exam type (regular/supply)

#### 📅 Schedule Management
- **Timetable System**
  - Create and manage class schedules
  - Add/edit/delete schedule entries
  - Daily and weekly views
  - Reminder notifications (planned)
- **Calendar Integration**
  - Exam dates tracking
  - Assignment deadlines
  - Important academic events

#### 📄 Syllabus Viewer
- **Interactive Syllabus Browser**
  - View complete KTU syllabus by branch
  - Module-wise organization
  - Course outcomes and objectives
  - Credit and hour information
- **Offline Access**
  - Download syllabus for offline viewing
  - Search within syllabus content

### 🤖 AI-Powered Features

#### 💬 AI Chatbot Assistant
- **Intelligent Study Helper**
  - Answer academic questions
  - Explain complex concepts
  - Provide study tips and strategies
  - 24/7 availability
- **Context-Aware Responses**
  - Understands KTU syllabus context
  - Subject-specific assistance
  - Code explanation and debugging help
- **Chat History**
  - Persistent conversation storage
  - Search previous conversations
  - Export chat transcripts

### 💻 Coding Hub

#### 🔧 Multi-Language Code Editor
- **Supported Languages:**
  - 🐍 Python (beginner-friendly)
  - 🔧 C (system programming)
  - ⚙️ C++ (object-oriented programming)
  - ☕ Java (enterprise development)

#### 📝 Problem Library
**8 Practice Problems:**
1. **Hello World** (Easy) - First program basics
2. **Sum of Two Numbers** (Easy) - Arithmetic operations
3. **Print Numbers 1 to 10** (Easy) - Loop practice
4. **Factorial Calculator** (Medium) - Calculate 5!
5. **Find Maximum in Array** (Medium) - Array operations
6. **Fibonacci Sequence** (Medium) - Recursion practice
7. **Reverse a String** (Easy) - String manipulation
8. **Check Prime Number** (Medium) - Mathematical logic

#### 📊 Progress Tracking
- **Firebase Firestore Integration**
  - Completed problems list
  - Total attempts counter
  - Successful runs counter
  - Success rate calculation
- **Dashboard Statistics**
  - Problems solved / Total problems
  - Personal best scores
  - Coding streak tracking

#### ⚙️ Editor Features
- Dark theme code editor (#1E293B)
- Monospace font for readability
- Syntax-friendly input (no autocorrect)
- Multi-line scrollable text area
- Mobile-optimized keyboard handling
- Code syntax support (coming soon)

### 🎮 Learning Zone (Gamified Learning)

#### 🧠 Memory Match Game
- **Classic card matching with emojis**
- 16 cards (8 pairs)
- Move counter and timer
- Score calculation: 100 - (moves × 5)
- High score tracking in Firestore
- Victory detection and celebration

#### 📝 Quick Quiz
- **Multi-Subject Quizzes**
  - Geography, Math, Literature, Science
  - 5 questions per session
  - 20 points per correct answer
  - Real-time feedback (green/red indicators)
- **Progress Tracking**
  - Question counter (X/5)
  - Running score display
  - Best score saved to Firestore

#### 🎴 Study Flashcards
- **Interactive Learning Cards**
  - Programming concepts (Algorithm, Variable, Function, Loop, Array)
  - Tap-to-flip interaction
  - Navigation buttons (Previous/Next)
  - Card counter display
  - Easily extensible for more topics

#### 🔤 Word Scramble
- **Status:** 🚧 Coming Soon
- Planned features:
  - Unscramble jumbled words
  - Timer-based challenges
  - Difficulty levels
  - Vocabulary building

### 🎓 Academic Tools

#### 📊 GPA Calculator
- **Semester GPA Calculation**
  - Grade point input per subject
  - Credit-based calculation
  - Weighted average computation
- **CGPA Tracking**
  - Multi-semester CGPA calculation
  - Grade improvement suggestions
  - Performance analytics
- **KTU Grade System**
  - Supports KTU grading scale
  - Credit weightage consideration

### 👥 Group Study

#### 🤝 Study Groups
- **Create/Join Study Groups**
  - Subject-based groups
  - College/branch-specific groups
  - Private and public groups
- **Collaborative Features**
  - Group chat functionality
  - File sharing within groups
  - Study session scheduling
  - Progress tracking as a group
- **Group Management**
  - Admin controls
  - Member invitation system
  - Activity notifications

### 🎨 User Experience

#### 🌓 Theme System
- **Dark Mode Support**
  - System-wide dark/light theme
  - Smooth theme transitions
  - Custom color schemes per theme
- **Theme Provider Context**
  - Consistent theming across all screens
  - Dynamic color updates
  - User preference persistence

#### ⚙️ Settings
- **App Preferences**
  - Theme toggle (Light/Dark)
  - Notification settings
  - Language preferences (planned)
  - Data sync options
- **Account Management**
  - Profile editing access
  - Security settings
  - Privacy controls
  - Data export/backup

#### ❓ Help & Support
- **In-App Documentation**
  - Feature tutorials
  - FAQs section
  - Troubleshooting guides
- **Contact Support**
  - Email support integration
  - Bug reporting system
  - Feature request submission

---

## 🛠️ Tech Stack

### Frontend Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.81.5 | Cross-platform mobile framework |
| **React** | 19.1.0 | UI component library |
| **Expo** | ~54.0.33 | Development platform and tooling |
| **React Native Web** | 0.21.0 | Web platform support |
| **TypeScript** | ~5.9.2 | Type safety and developer experience |

### Navigation & Routing
| Technology | Version | Purpose |
|------------|---------|---------|
| **React Navigation** | 7.1.17 | Screen navigation and routing |
| **React Navigation Stack** | 7.4.5 | Stack navigator implementation |

### Backend & Database
| Technology | Purpose |
|------------|---------|
| **Supabase** | PostgreSQL database, Authentication, Storage |
| **Supabase Auth** | User authentication and session management |
| **Supabase Storage** | File and document storage |
| **Firebase Firestore** | Coding hub and game progress tracking |
| **Custom REST API** | Backend business logic |

### State Management & Storage
| Technology | Version | Purpose |
|------------|---------|---------|
| **React Context API** | Built-in | Global state management (Auth, Theme) |
| **Expo Secure Store** | 15.0.7 | Secure token/credential storage |
| **AsyncStorage** | 2.2.0 | Local data persistence |

### UI & Animation
| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native Reanimated** | ~4.1.1 | Smooth animations and transitions |
| **React Native Gesture Handler** | ~2.28.0 | Touch gesture handling |
| **React Native Worklets** | 0.5.1 | High-performance animations |
| **React Native Safe Area Context** | ~5.6.0 | Safe area management |
| **React Native Screens** | ~4.16.0 | Native screen optimization |

### Utilities & Tools
| Technology | Version | Purpose |
|------------|---------|---------|
| **Expo File System** | 19.0.17 | File system access and management |
| **Expo Document Picker** | 14.0.7 | Document selection from device |
| **Expo Constants** | 18.0.9 | App constants and configuration |
| **Expo Status Bar** | 3.0.8 | Status bar styling |
| **dotenv** | 17.2.3 | Environment variable management |
| **react-native-dotenv** | 3.4.11 | React Native env variable support |

### Development Tools
| Technology | Version | Purpose |
|------------|---------|---------|
| **Expo Ngrok** | 4.1.3 | Development tunneling |
| **Babel** | 7.25.2 | JavaScript transpilation |
| **Babel Preset Expo** | 54.0.4 | Expo-specific Babel configuration |
| **pnpm** | 10.30.1 | Fast, disk-efficient package manager |

---

## 🏗️ Architecture Overview

### Project Structure
```
KTUfy/
├── App.tsx                      # Main app component & navigation setup
├── index.ts                     # App entry point
│
├── screens/                     # All screen components
│   ├── HomeScreen.tsx          # Dashboard with analytics
│   ├── LoginScreen.tsx         # Authentication
│   ├── SignupScreen.tsx        # User registration
│   ├── ProfileScreen.tsx       # Profile management
│   ├── ChatbotScreen.tsx       # AI assistant
│   ├── TicklistScreen.tsx      # Study checklist
│   ├── LibraryScreen.tsx       # Study materials
│   ├── PYPScreen.tsx           # Previous year papers
│   ├── ScheduleScreen.tsx      # Timetable management
│   ├── SyllabusViewerScreen.tsx # Syllabus browser
│   ├── CodingHubScreen.tsx     # Coding practice
│   ├── LearningZoneScreen.tsx  # Gamified learning
│   ├── QuizSessionScreen.tsx   # Quiz gameplay
│   ├── GroupStudyScreen.tsx    # Study groups
│   ├── GPACalculatorScreen.tsx # GPA/CGPA calculator
│   ├── SettingsScreen.tsx      # App settings
│   └── HelpScreen.tsx          # Help & support
│
├── auth/                        # Authentication logic
│   ├── AuthProvider.tsx        # Auth context & state management
│   └── secureStore.ts          # Secure token storage
│
├── services/                    # API services
│   ├── userService.ts          # User profile API calls
│   └── chatService.ts          # Chatbot API integration
│
├── contexts/                    # React contexts
│   └── ThemeContext.tsx        # Theme provider (dark/light mode)
│
├── components/                  # Reusable components
│   └── TestBackendButton.tsx   # API testing component
│
├── types/                       # TypeScript definitions
│   └── navigation.ts           # Navigation type definitions
│
├── utils/                       # Utility functions
│   └── api.ts                  # API request helpers
│
├── db/migrations/              # Database migrations
│   ├── 002_sync_auth_users.sql
│   └── 003_fix_rls_policies.sql
│
├── assets/                     # Images, icons, fonts
│
├── supabaseClient.ts          # Supabase client initialization
├── supabaseConfig.ts          # Supabase helper functions
├── supabaseStorage.ts         # Storage management
├── firebaseConfig.ts          # Firebase configuration
├── app.config.js              # Expo configuration
├── babel.config.js            # Babel configuration
└── tsconfig.json              # TypeScript configuration
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Native App                     │
│                  (Expo + TypeScript)                    │
└─────────────────────────────────────────────────────────┘
                            │
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌─────────────────┐                    ┌─────────────────┐
│  Auth Provider  │                    │ Theme Provider  │
│  (JWT Tokens)   │                    │  (Dark/Light)   │
└─────────────────┘                    └─────────────────┘
        │
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│               Backend Services Layer                    │
├─────────────────┬─────────────────┬────────────────────┤
│  Supabase Auth  │ Supabase DB     │ Supabase Storage   │
│  (Users)        │ (PostgreSQL)    │ (Files)            │
├─────────────────┼─────────────────┼────────────────────┤
│  Firebase       │ Custom REST API │                    │
│  (Game Stats)   │ (Business Logic)│                    │
└─────────────────┴─────────────────┴────────────────────┘
```

---

## 💾 Database Schema

### Supabase Tables

#### `public.users`
Stores extended user profile information
```sql
- id (uuid, primary key, references auth.users)
- email (text, unique)
- name (text)
- registration_number (text)
- college (text)
- branch (text)
- year_joined (integer)
- year_ending (integer)
- roll_number (text)
- role (text, default: 'student')
- metadata (jsonb)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `public.ticklists`
Stores user study checklists
```sql
- id (uuid, primary key)
- user_id (uuid, references public.users)
- subject_name (text)
- code (text)
- color (text)
- items (jsonb[])
- created_at (timestamp)
- updated_at (timestamp)
```

#### `public.game_stats`
Tracks Learning Zone game progress
```sql
- id (uuid, primary key)
- user_id (uuid, references public.users)
- game_type (text) -- 'memory_match', 'quick_quiz', etc.
- best_score (integer)
- total_plays (integer)
- last_played (timestamp)
- metadata (jsonb)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `public.coding_progress`
Tracks Coding Hub progress
```sql
- id (uuid, primary key)
- user_id (uuid, references public.users)
- completed_problems (text[])
- total_attempts (integer)
- successful_runs (integer)
- success_rate (numeric)
- last_problem_solved (text)
- last_solved_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

### Firebase Collections

#### `users/{uid}/coding/progress`
Coding Hub progress tracking
```javascript
{
  completedProblems: string[],
  totalAttempts: number,
  successfulRuns: number,
  successRate: number
}
```

#### `users/{uid}/games/{gameType}`
Learning Zone game statistics
```javascript
{
  bestScore: number,
  totalPlays: number,
  lastPlayed: timestamp
}
```

---

## 🔒 Security Features

### Authentication & Authorization
- ✅ JWT-based authentication with auto-refresh
- ✅ Secure token storage using Expo Secure Store
- ✅ Row Level Security (RLS) on all database tables
- ✅ User-specific data isolation
- ✅ Email verification system
- ✅ Secure password reset flow

### Data Protection
- ✅ Encrypted storage for sensitive data
- ✅ HTTPS-only API communication
- ✅ Access policies on file storage
- ✅ Input validation and sanitization
- ✅ SQL injection prevention via parameterized queries

---

## 🚀 Future Roadmap

> **Note:** This section will be updated as new features are planned and implemented.

### Q2 2026 (Planned)
- [ ] **Real-time Notifications**
  - Push notifications for assignments
  - Class schedule reminders
  - Group study invitations
- [ ] **Enhanced Chatbot**
  - Voice input support
  - Image-based problem solving
  - Handwriting recognition
- [ ] **Offline Mode**
  - Full offline functionality
  - Sync when online
  - Offline document access

### Q3 2026 (Planned)
- [ ] **Social Features**
  - Student profiles
  - Friend system
  - Study leaderboards
  - Achievement badges
- [ ] **Advanced Analytics**
  - Study pattern analysis
  - Performance predictions
  - Personalized recommendations
- [ ] **More Games**
  - Word Scramble completion
  - Typing speed test
  - Code debugging challenges

### Q4 2026 (Planned)
- [ ] **Voice Assistant**
  - Voice-controlled navigation
  - Hands-free study mode
  - Text-to-speech for notes
- [ ] **AR Study Tools**
  - 3D model visualization
  - AR flashcards
  - Virtual lab simulations
- [ ] **Advanced Coding Hub**
  - Real-time code collaboration
  - Code reviews and feedback
  - Competitive programming contests
  - More programming languages

### Long-term Vision
- [ ] **AI-Powered Study Plans**
  - Personalized study schedules
  - Adaptive learning paths
  - Intelligent content recommendations
- [ ] **College Integration**
  - Official college partnerships
  - Direct exam result integration
  - Attendance tracking
  - Internal marks access
- [ ] **Multi-University Support**
  - Expand beyond KTU
  - Support for other universities
  - Custom syllabus per university

---

## 📊 Current Development Status

| Feature Category | Status | Completion |
|------------------|--------|------------|
| Authentication | ✅ Complete | 100% |
| Profile Management | ✅ Complete | 100% |
| Home Dashboard | ✅ Complete | 95% |
| Study Management | ✅ Complete | 90% |
| Coding Hub | ✅ Complete | 85% |
| Learning Zone | 🚧 In Progress | 70% |
| AI Chatbot | ✅ Complete | 80% |
| Group Study | 🚧 In Progress | 60% |
| Academic Tools | ✅ Complete | 85% |
| Theme System | ✅ Complete | 100% |

**Legend:**
- ✅ Complete - Feature is production-ready
- 🚧 In Progress - Feature is partially implemented
- 📋 Planned - Feature is in the roadmap

---

## 🔧 Development & Deployment

### Development Scripts
```bash
# Start development server
pnpm start

# Start on specific platform
pnpm run web       # Web browser
pnpm run android   # Android emulator/device
pnpm run ios       # iOS simulator/device (macOS only)
```

### Environment Setup
Required environment variables (`.env`):
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
API_BASE_URL=your_backend_api_url
```

### Platform-Specific Builds
- **Web:** Hosted via Expo web build
- **Android:** APK generated via EAS Build
- **iOS:** IPA generated via EAS Build (requires Apple Developer account)

---

## 📝 Notes for Developers

### Adding New Features
1. **Create Screen Component** in `screens/` directory
2. **Add Navigation Type** in `types/navigation.ts`
3. **Register Route** in `App.tsx` navigation stack
4. **Create API Service** if backend integration needed
5. **Add Database Migration** if new tables required
6. **Update This Document** in relevant sections

### Best Practices
- Use TypeScript for type safety
- Follow React Native best practices for cross-platform compatibility
- Implement RLS policies for new database tables
- Add error handling and loading states
- Test on all platforms (iOS, Android, Web)
- Keep dependencies updated
- Document new features in dedicated markdown files

### Useful Documentation Files
- `CODING_HUB_DOCUMENTATION.md` - Detailed Coding Hub docs
- `LEARNING_ZONE_FEATURES.md` - Learning Zone game specs
- `BACKEND_INTEGRATION_UPDATE.md` - API integration guide
- `PROFILE_UPDATE_SUMMARY.md` - Profile feature changes
- `SUPABASE_SETUP.md` - Database setup instructions
- `SUPABASE_STORAGE_SETUP.md` - File storage configuration
- `TROUBLESHOOTING.md` - Common issues and solutions

---

## 📞 Support & Contact

For questions, bug reports, or feature requests:
- **Email:** support@ktufy.app (placeholder)
- **GitHub Issues:** [Repository URL] (placeholder)
- **Documentation:** See individual feature docs in project root

---

## 📄 License

[To be determined - Add license information]

---

## 📚 Version History

| Version | Date | Key Changes |
|---------|------|-------------|
| 1.0.0 | Feb 2026 | Initial release with core features |

---

**🎓 Built with ❤️ for KTU Students**
