# KTUfy UI Update Tracker

> Last updated: February 26, 2026

## Screen Update Status

| # | Screen | File | Status | Notes |
|---|--------|------|--------|-------|
| 1 | Login | `LoginScreen.tsx` | ✅ Updated | Dark blue theme with bottom sheet card |
| 2 | Signup | `SignupScreen.tsx` | ✅ Updated | Matching dark blue theme |
| 3 | **Home** | `HomeScreen.tsx` | ✅ Updated | Animated gradient, centered prompt + explore |
| 4 | **Chatbot** | `ChatbotScreen.tsx` | ✅ Updated | Dark ChatGPT-like UI with bubble messages |
| 5 | **Explore** | `ExploreScreen.tsx` | ✅ New | Tools grid + study dashboard (was in Home) |
| 6 | Settings | `SettingsScreen.tsx` | ✅ Updated | Added TestBackendButton developer section |
| 7 | Profile | `ProfileScreen.tsx` | ❌ Not Updated | Old UI |
| 8 | Library | `LibraryScreen.tsx` | ❌ Not Updated | Old UI |
| 9 | Ticklist | `TicklistScreen.tsx` | ❌ Not Updated | Old UI |
| 10 | Schedule | `ScheduleScreen.tsx` | ❌ Not Updated | Old UI |
| 11 | Coding Hub | `CodingHubScreen.tsx` | ❌ Not Updated | Old UI |
| 12 | Group Study | `GroupStudyScreen.tsx` | ❌ Not Updated | Old UI |
| 13 | GPA Calculator | `GPACalculatorScreen.tsx` | ❌ Not Updated | Old UI |
| 14 | Learning Zone | `LearningZoneScreen.tsx` | ❌ Not Updated | Old UI |
| 15 | Quiz Session | `QuizSessionScreen.tsx` | ❌ Not Updated | Old UI |
| 16 | Syllabus Viewer | `SyllabusViewerScreen.tsx` | ❌ Not Updated | Old UI |
| 17 | PYP | `PYPScreen.tsx` | ❌ Not Updated | Old UI |
| 18 | Help | `HelpScreen.tsx` | ❌ Not Updated | Old UI |

## Other Updated Files

| File | Status | Notes |
|------|--------|-------|
| `types/navigation.ts` | ✅ Updated | Added `Explore` route & `Chatbot` params |
| `App.tsx` | ✅ Updated | Added Explore route, hidden Chatbot header |
| `contexts/ThemeContext.tsx` | ⏳ Not Changed | Works as-is; theme variables used inline |

## Summary

- **6 files updated** (HomeScreen, ChatbotScreen, ExploreScreen, SettingsScreen, App.tsx, navigation.ts)
- **12 screens pending** dark theme update
- TestBackendButton moved from HomeScreen → SettingsScreen
