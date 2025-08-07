# KTUfy

A React Native mobile application built with Expo, featuring Firebase authentication and modern UI design.

## Features

- 🔐 Firebase Authentication (Email/Password)
- 📱 Modern React Native UI
- 🧭 React Navigation with TypeScript
- 🎨 Beautiful and responsive design
- 📱 Cross-platform (iOS, Android, Web)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Firebase project setup

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

3. Set up Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication with Email/Password provider
   - Copy your Firebase configuration to `firebaseConfig.ts`

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
├── firebaseConfig.ts       # Firebase configuration
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
- **Firebase** - Authentication and backend
- **React Navigation** - Navigation library
- **React Native Reanimated** - Animations
- **React Native Gesture Handler** - Gesture handling

## Firebase Setup

1. Create a new Firebase project
2. Enable Authentication with Email/Password
3. Update the Firebase configuration in `firebaseConfig.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## Environment Variables

Create a `.env` file in the root directory with your Firebase configuration:

```
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
