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
  background: '#050816',
  backgroundSecondary: '#0A1128',
  backgroundTertiary: '#0F1A3E',

  // Card colors
  card: '#0F1535',
  cardSecondary: '#152154',
  cardBorder: 'rgba(71, 85, 105, 0.25)',

  // Text colors
  text: '#E6EDF3',
  textSecondary: '#8B949E',
  textTertiary: '#484F58',

  // Primary colors
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1E3A8A',

  // Status colors
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#3B82F6',

  // UI element colors
  border: 'rgba(71, 85, 105, 0.4)',
  divider: 'rgba(71, 85, 105, 0.15)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.6)',

  // Feature colors
  aiAssistant: '#2563EB',
  learningZone: '#EC4899',
  codingHub: '#34D399',
  groupStudy: '#FBBF24',
  gpaCalculator: '#8B5CF6',
};

const darkTheme: Theme = {
  // Background colors
  background: '#050816',
  backgroundSecondary: '#0A1128',
  backgroundTertiary: '#0F1A3E',

  // Card colors
  card: '#0F1535',
  cardSecondary: '#152154',
  cardBorder: 'rgba(71, 85, 105, 0.25)',

  // Text colors
  text: '#E6EDF3',
  textSecondary: '#8B949E',
  textTertiary: '#484F58',

  // Primary colors
  primary: '#3B82F6',
  primaryLight: '#1E3A8A',
  primaryDark: '#2563EB',

  // Status colors
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',

  // UI element colors
  border: 'rgba(71, 85, 105, 0.4)',
  divider: 'rgba(71, 85, 105, 0.15)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Feature colors (slightly adjusted for dark mode)
  aiAssistant: '#3B82F6',
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
