import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth, AuthProvider } from './auth/AuthProvider';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, StatusBar as RNStatusBar, Platform } from 'react-native';
import 'react-native-gesture-handler';

// Import Theme Provider
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

// Import screens
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import HelpScreen from './screens/HelpScreen';
import ChatbotScreen from './screens/ChatbotScreen';
import TicklistScreen from './screens/TicklistScreen';
import LibraryScreen from './screens/LibraryScreen';
import QuizSessionScreen from './screens/QuizSessionScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import LearningZoneScreen from './screens/LearningZoneScreen';
import CodingHubScreen from './screens/CodingHubScreen';
import GroupStudyScreen from './screens/GroupStudyScreen';
import GPACalculatorScreen from './screens/GPACalculatorScreen';
import SyllabusViewerScreen from './screens/SyllabusViewerScreen';
import PYPScreen from './screens/PYPScreen';
import ExploreScreen from './screens/ExploreScreen';
import FlashcardScreen from './screens/FlashcardScreen';
import MatchGameScreen from './screens/MatchGameScreen';
import QuizGameScreen from './screens/QuizGameScreen';
import MediaToolsScreen from './screens/MediaToolsScreen';
import VideoToolsScreen from './screens/VideoToolsScreen';
import AudioToolsScreen from './screens/AudioToolsScreen';
import ImageToolsScreen from './screens/ImageToolsScreen';
import PdfToolsScreen from './screens/PdfToolsScreen';

// Import custom tab bar
import BottomNavBar from './components/BottomNavBar';

import { RootStackParamList } from './types/navigation';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// ─── Dark background for smooth transitions ───────────────────────
const DARK_BG = '#050816';

/**
 * Main Tabs — Home, Chatbot, Library, Profile
 * These 4 screens share a persistent BottomNavBar via the Tab Navigator.
 */
function MainTabs() {
  return (
    <View style={{
      flex: 1,
      // paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
      backgroundColor: '#050816',
    }}>
      <Tab.Navigator
        tabBar={(props) => <BottomNavBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Chatbot" component={ChatbotScreen} />
        <Tab.Screen name="Library" component={LibraryScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </View>
  );
}

// ─── App Content ──────────────────────────────────────────────────
function AppContent() {
  const { user } = useAuth();
  const { isDark, theme } = useTheme();

  if (user === undefined) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.background },
          cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
          gestureEnabled: true,
        }}
      >
        {user ? (
          // Authenticated stack
          <>
            {/* Main tabs (Home, Chatbot, Library, Profile with fixed nav bar) */}
            <Stack.Screen name="MainTabs" component={MainTabs} />

            {/* Secondary screens (push on top of tabs, no tab bar) */}
            <Stack.Screen name="Ticklist" component={TicklistScreen} />
            <Stack.Screen name="QuizSession" component={QuizSessionScreen} />
            <Stack.Screen name="Schedule" component={ScheduleScreen} />
            <Stack.Screen name="LearningZone" component={LearningZoneScreen} />
            <Stack.Screen name="CodingHub" component={CodingHubScreen} />
            <Stack.Screen name="GroupStudy" component={GroupStudyScreen} />
            <Stack.Screen name="GPACalculator" component={GPACalculatorScreen} />
            <Stack.Screen name="SyllabusViewer" component={SyllabusViewerScreen} />
            <Stack.Screen name="PYP" component={PYPScreen} />
            <Stack.Screen name="Explore" component={ExploreScreen} />
            <Stack.Screen name="Flashcards" component={FlashcardScreen} />
            <Stack.Screen name="MatchGame" component={MatchGameScreen} />
            <Stack.Screen name="QuizGame" component={QuizGameScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Help" component={HelpScreen} />
            <Stack.Screen name="MediaTools" component={MediaToolsScreen} />
            <Stack.Screen name="VideoTools" component={VideoToolsScreen} />
            <Stack.Screen name="AudioTools" component={AudioToolsScreen} />
            <Stack.Screen name="ImageTools" component={ImageToolsScreen} />
            <Stack.Screen name="PdfTools" component={PdfToolsScreen} />
          </>
        ) : (
          // Non-authenticated stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Wrap with ThemeProvider and AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
