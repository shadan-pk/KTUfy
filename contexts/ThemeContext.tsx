import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'auto';

interface Theme {
  // Background colors
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  
  // Card colors
  card: string;
  cardSecondary: string;
  cardBorder: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // UI element colors
  border: string;
  divider: string;
  shadow: string;
  overlay: string;
  
  // Feature colors (keep consistent)
  aiAssistant: string;
  learningZone: string;
  codingHub: string;
  groupStudy: string;
  gpaCalculator: string;
}

const lightTheme: Theme = {
  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FD',
  backgroundTertiary: '#F3F4F6',
  
  // Card colors
  card: '#F8FAFC',
  cardSecondary: '#FFFFFF',
  cardBorder: '#E2E8F0',
  
  // Text colors
  text: '#1F2937',
  textSecondary: '#64748B',
  textTertiary: '#9CA3AF',
  
  // Primary colors
  primary: '#6366F1',
  primaryLight: '#EEF2FF',
  primaryDark: '#4F46E5',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // UI element colors
  border: '#E5E7EB',
  divider: '#F3F4F6',
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Feature colors
  aiAssistant: '#6366F1',
  learningZone: '#EC4899',
  codingHub: '#10B981',
  groupStudy: '#F59E0B',
  gpaCalculator: '#8B5CF6',
};

const darkTheme: Theme = {
  // Background colors
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  backgroundTertiary: '#334155',
  
  // Card colors
  card: '#1E293B',
  cardSecondary: '#334155',
  cardBorder: '#475569',
  
  // Text colors
  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  
  // Primary colors
  primary: '#818CF8',
  primaryLight: '#312E81',
  primaryDark: '#6366F1',
  
  // Status colors
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
  
  // UI element colors
  border: '#475569',
  divider: '#334155',
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  
  // Feature colors (slightly adjusted for dark mode)
  aiAssistant: '#818CF8',
  learningZone: '#F472B6',
  codingHub: '#34D399',
  groupStudy: '#FBBF24',
  gpaCalculator: '#A78BFA',
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@KTUfy:theme_mode';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'auto')) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  // Determine if dark mode should be active
  const isDark = themeMode === 'dark' || (themeMode === 'auto' && systemColorScheme === 'dark');
  
  // Select the appropriate theme
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, themeMode, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export theme objects for direct use if needed
export { lightTheme, darkTheme };
export type { Theme, ThemeMode };
