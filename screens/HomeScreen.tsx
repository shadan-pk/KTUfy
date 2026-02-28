import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HomeScreenNavigationProp } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowRight, WifiOff } from 'lucide-react-native';
import { useServerStatus } from '../hooks/useServerStatus';

const { width, height } = Dimensions.get('window');

// ─── Theme Colors (Blue Palette) ─────────────────────────────────
const C = {
  bg900: '#01040f',
  bg850: '#070B1E',
  bg800: '#0A1128',
  bg700: '#0F1A3E',
  accent: '#2563EB',
  accentLight: '#3B82F6',
  accentGlow: 'rgba(37, 99, 235, 0.12)',
  accentBorder: 'rgba(37, 99, 235, 0.3)',
  textPrimary: '#E6EDF3',
  textSecondary: '#8B949E',
  textMuted: '#484F58',
  inputBg: 'rgba(10, 17, 40, 0.85)',
  inputBorder: 'rgba(71, 85, 105, 0.4)',
  navBg: 'rgba(5, 8, 22, 0.95)',
  navBorder: 'rgba(71, 85, 105, 0.3)',
  white: '#FFFFFF',
};

// ─── Golden-Ratio Typography ─────────────────────────────────────
// Base 15, φ = 1.618 → 24 → 39. Down: 12, 10
const FONT = {
  display: 39,
  h1: 24,
  h2: 20,
  body: 15,
  caption: 12,
  micro: 10,
};

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const [promptText, setPromptText] = useState('');

  // Animations
  const animValue = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    // Gradient cycle
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, { toValue: 1, duration: 6000, useNativeDriver: false }),
        Animated.timing(animValue, { toValue: 0, duration: 6000, useNativeDriver: false }),
      ])
    ).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 3000, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 3000, useNativeDriver: false }),
      ])
    ).start();

    // Entrance
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 700, delay: 350, useNativeDriver: true }),
      Animated.timing(contentY, { toValue: 0, duration: 700, delay: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  const glowOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: isDark ? [0.04, 0.18] : [0.02, 0.1] });

  const handlePromptSubmit = () => {
    if (!promptText.trim()) return;
    const prompt = promptText.trim();
    setPromptText('');
    navigation.navigate('Chatbot', { initialPrompt: prompt });
  };

  const { hasInternet, serverOnline } = useServerStatus();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Server status indicator */}
      <View style={[styles.statusBar, { backgroundColor: theme.backgroundTertiary, borderColor: theme.border }]}>
        <View style={[styles.statusDot, { backgroundColor: serverOnline ? theme.success : theme.error }]} />
        <Text style={[styles.statusLabel, { color: serverOnline ? theme.success : theme.error }]}>
          {serverOnline ? 'Online' : 'Offline'}
        </Text>
      </View>

      {/* No internet warning */}
      {!hasInternet && (
        <View style={[styles.offlineBanner, { backgroundColor: theme.warning + '26', borderColor: theme.warning + '4D' }]}>
          <WifiOff size={16} color={theme.warning} strokeWidth={2} />
          <Text style={[styles.offlineText, { color: theme.warning }]}>No internet connection. Some features require internet access.</Text>
        </View>
      )}

      {/* Animated glow orbs */}
      <Animated.View style={[styles.orb, styles.orb1, { opacity: glowOpacity, backgroundColor: theme.primary + '12' }]} />
      <Animated.View style={[styles.orb, styles.orb2, { opacity: glowOpacity, backgroundColor: theme.primary + '0D' }]} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Main content area */}
        <View style={styles.mainContent}>
          {/* Logo — upper portion */}
          <Animated.View style={[styles.logoSection, { opacity: logoOpacity }]}>
            <Animated.View style={[styles.logoGlow, { opacity: glowOpacity, backgroundColor: theme.primary + '1F' }]} />
            <Text style={[styles.logoText, { color: theme.text, textShadowColor: theme.primary + '66' }]}>KTUfy</Text>
            <Text style={[styles.tagline, { color: theme.textSecondary }]}>YOUR AI STUDY COMPANION</Text>
          </Animated.View>

          {/* Center — prompt input only */}
          <Animated.View
            style={[
              styles.centerContent,
              { opacity: contentOpacity, transform: [{ translateY: contentY }] },
            ]}
          >
            <View style={styles.promptContainer}>
              <View style={[styles.promptInputWrapper, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                <TextInput
                  style={[styles.promptInput, { color: theme.text }]}
                  placeholder="Ask anything about your studies..."
                  placeholderTextColor={theme.textTertiary}
                  value={promptText}
                  onChangeText={setPromptText}
                  multiline
                  maxLength={500}
                  onSubmitEditing={handlePromptSubmit}
                  returnKeyType="send"
                  blurOnSubmit
                />
                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: theme.primary }, !promptText.trim() && { backgroundColor: theme.primary + '4D' }]}
                  onPress={handlePromptSubmit}
                  disabled={!promptText.trim()}
                  activeOpacity={0.7}
                >
                  <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick suggestion chips */}
            <View style={styles.chips}>
              {['Exam tips', 'Study plan', 'KTU syllabus'].map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.primary + '14' }]}
                  onPress={() => navigation.navigate('Chatbot', { initialPrompt: chip })}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, { color: theme.primaryLight }]}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>

      {/* Explore KTUfy — floating card above nav */}
      <View style={styles.exploreFloating}>
        <TouchableOpacity
          style={[styles.exploreButton, { borderColor: theme.border }]}
          onPress={() => navigation.navigate('Explore')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.primary + '2E', theme.primary + '0F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.exploreGradient}
          >
            <Text style={[styles.exploreText, { color: theme.text }]}>Explore KTUfy</Text>
            <Text style={[styles.exploreArrow, { color: theme.primaryLight }]}>›</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  // Status & Offline
  statusBar: {
    position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, zIndex: 10,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: FONT.caption, fontWeight: '600', letterSpacing: 0.5 },
  offlineBanner: {
    position: 'absolute', top: Platform.OS === 'ios' ? 100 : 80, left: 24, right: 24,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12,
    borderRadius: 12, borderWidth: 1, zIndex: 10,
  },
  offlineText: { fontSize: FONT.caption, flex: 1, lineHeight: 18 },
  // Glow orbs
  orb: { position: 'absolute', borderRadius: 999 },
  orb1: {
    width: width * 1.2, height: width * 1.2,
    top: -height * 0.15, left: -width * 0.3,
  },
  orb2: {
    width: width * 0.8, height: width * 0.8,
    bottom: height * 0.2, right: -width * 0.2,
  },
  // Main
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 120, // space for explore card + nav
  },
  // Logo
  logoSection: { alignItems: 'center', marginBottom: 48 },
  logoGlow: {
    position: 'absolute', width: 200, height: 200,
    borderRadius: 100, top: -60,
  },
  logoText: {
    fontSize: FONT.display,
    fontWeight: '800',
    letterSpacing: 12,
    textTransform: 'uppercase',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  tagline: {
    fontSize: FONT.caption,
    marginTop: 8,
    letterSpacing: 3,
    fontWeight: '500',
  },
  // Center
  centerContent: { alignItems: 'center' },
  promptContainer: { width: '100%', marginBottom: 14 },
  promptInputWrapper: {
    flexDirection: 'row', alignItems: 'flex-end',
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 8,
    minHeight: 52, maxHeight: 120,
  },
  promptInput: {
    flex: 1, fontSize: FONT.body,
    paddingVertical: 8, maxHeight: 100, lineHeight: 20,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
  // Chips
  chips: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 8, flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 16, borderWidth: 1,
  },
  chipText: { fontSize: FONT.caption, fontWeight: '500' },
  // Explore floating card
  exploreFloating: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 78 : 28,
    left: 24, right: 24,
  },
  exploreButton: {
    borderRadius: 14, borderWidth: 1,
    overflow: 'hidden',
  },
  exploreGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, paddingHorizontal: 24,
  },
  exploreText: {
    fontSize: FONT.body, fontWeight: '600',
    letterSpacing: 0.5,
  },
  exploreArrow: {
    fontSize: 22, marginLeft: 10, fontWeight: '300',
  },
});

export default HomeScreen;
