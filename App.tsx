import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth, AuthProvider } from './auth/AuthProvider';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
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
import ScheduleScreen from './screens/ScheduleScreen';
import LearningZoneScreen from './screens/LearningZoneScreen';
import CodingHubScreen from './screens/CodingHubScreen';
import GroupStudyScreen from './screens/GroupStudyScreen';
import GPACalculatorScreen from './screens/GPACalculatorScreen';
import SyllabusViewerScreen from './screens/SyllabusViewerScreen';
import PYPScreen from './screens/PYPScreen';
import { RootStackParamList } from './types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

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
          headerShown: true,
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {user ? (
          // Authenticated stack
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Chatbot" 
              component={ChatbotScreen}
              options={{ title: 'AI Assistant' }}
            />
            <Stack.Screen 
              name="Ticklist" 
              component={TicklistScreen}
              options={{ title: 'Study Checklist' }}
            />
            <Stack.Screen 
              name="Library" 
              component={LibraryScreen}
              options={{ title: 'Study Library' }}
            />
            <Stack.Screen 
              name="Schedule" 
              component={ScheduleScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="LearningZone" 
              component={LearningZoneScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="CodingHub" 
              component={CodingHubScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="GroupStudy" 
              component={GroupStudyScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="GPACalculator" 
              component={GPACalculatorScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="SyllabusViewer" 
              component={SyllabusViewerScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="PYP" 
              component={PYPScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ title: 'My Profile' }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ title: 'Settings' }}
            />
            <Stack.Screen 
              name="Help" 
              component={HelpScreen}
              options={{ title: 'Help & Support' }}
            />
          </>
        ) : (
          // Non-authenticated stack
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Signup" 
              component={SignupScreen}
              options={{ headerShown: false }}
            />
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
