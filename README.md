# KTUfy

A React Native mobile application built with Expo, now migrated to Supabase for authentication and data storage.

## Features

 - 🔐 Supabase Authentication (Email/Password)
- 📱 Modern React Native UI
- 🧭 React Navigation with TypeScript
- 🎨 Beautiful and responsive design
- 📱 Cross-platform (iOS, Android, Web)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase project with Auth and Database enabled

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd KTUfy
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
  - Create a Supabase project at https://app.supabase.com/
  - Enable Authentication (Email/Password)
  - Create the following tables (users, ticklists) or use the built-in users table and a `ticklists` table with columns:
    - id (text, primary key)
    - user_id (text, references auth.users)
    - subject_name (text)
    - code (text)
    - color (text)
    - items (jsonb)
  - Copy your Supabase URL and ANON key into `.env` (see `.env.example`)

4. Start the development server:
```bash
npm start
```

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Start the app on Android emulator/device
- `npm run ios` - Start the app on iOS simulator/device
- `npm run web` - Start the app in web browser

## Project Structure

```
KTUfy/
├── App.tsx                 # Main app component
├── supabaseClient.ts       # Supabase client configuration (reads from .env)
├── supabaseConfig.ts       # Supabase helper functions for profile and ticklists
├── index.ts               # App entry point
├── screens/               # Screen components
│   ├── HomeScreen.tsx     # Home screen after login
│   ├── LoginScreen.tsx    # Login screen
│   └── SignupScreen.tsx   # Signup screen
├── types/                 # TypeScript type definitions
│   └── navigation.ts      # Navigation types
└── assets/               # Images and icons
```

## Technologies Used

- **React Native** - Mobile app framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **Supabase** - Authentication and Postgres backend
- **React Navigation** - Navigation library
- **React Native Reanimated** - Animations
- **React Native Gesture Handler** - Gesture handling

## Supabase Setup

1. Create a Supabase project
2. Enable Authentication (Email/Password)
3. Create the needed tables (see above) or adapt to your preferred schema

## Environment Variables

Copy `.env.example` to `.env` and set:

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=public-anon-key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
