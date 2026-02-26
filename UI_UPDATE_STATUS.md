# UI Update Status

Last updated: 2026-02-26

## Updated
- screens/HomeScreen.tsx: new prompt-first KG-RAG home experience with quick student tools.
- screens/ChatbotScreen.tsx: refreshed chat UI and initial prompt handoff from Home.
- types/navigation.ts: Chatbot route accepts an optional initial prompt.

## Not Updated
- screens/LoginScreen.tsx: already updated earlier.
- screens/SignupScreen.tsx: already updated earlier.
- Other screens remain unchanged.

## Notes
- Home prompt sends a starter message into the chatbot flow.
- Theme variables are used for most UI colors and borders.
