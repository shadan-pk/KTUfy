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

const { width, height } = Dimensions.get('window');

// ─── Theme Colors (Blue Palette) ─────────────────────────────────
const C = {
  bg900: '#050816',
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
  const { theme } = useTheme();
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

  const glowOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.04, 0.18] });

  const handlePromptSubmit = () => {
    if (!promptText.trim()) return;
    const prompt = promptText.trim();
    setPromptText('');
    navigation.navigate('Chatbot', { initialPrompt: prompt });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg900} />

      {/* Background gradient */}
      <LinearGradient
        colors={[C.bg900, C.bg800, C.bg700, C.bg900]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Animated glow orbs */}
      <Animated.View style={[styles.orb, styles.orb1, { opacity: glowOpacity }]} />
      <Animated.View style={[styles.orb, styles.orb2, { opacity: glowOpacity }]} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Main content area */}
        <View style={styles.mainContent}>
          {/* Logo — upper portion */}
          <Animated.View style={[styles.logoSection, { opacity: logoOpacity }]}>
            <Animated.View style={[styles.logoGlow, { opacity: glowOpacity }]} />
            <Text style={styles.logoText}>KTUfy</Text>
            <Text style={styles.tagline}>YOUR AI STUDY COMPANION</Text>
          </Animated.View>

          {/* Center — prompt input only */}
          <Animated.View
            style={[
              styles.centerContent,
              { opacity: contentOpacity, transform: [{ translateY: contentY }] },
            ]}
          >
            <View style={styles.promptContainer}>
              <View style={styles.promptInputWrapper}>
                <TextInput
                  style={styles.promptInput}
                  placeholder="Ask anything about your studies..."
                  placeholderTextColor={C.textMuted}
                  value={promptText}
                  onChangeText={setPromptText}
                  multiline
                  maxLength={500}
                  onSubmitEditing={handlePromptSubmit}
                  returnKeyType="send"
                  blurOnSubmit
                />
                <TouchableOpacity
                  style={[styles.sendBtn, !promptText.trim() && styles.sendBtnDisabled]}
                  onPress={handlePromptSubmit}
                  disabled={!promptText.trim()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sendIcon}>→</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick suggestion chips */}
            <View style={styles.chips}>
              {['Exam tips', 'Study plan', 'KTU syllabus'].map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={styles.chip}
                  onPress={() => navigation.navigate('Chatbot', { initialPrompt: chip })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>

      {/* Explore KTUfy — floating card above nav */}
      <View style={styles.exploreFloating}>
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => navigation.navigate('Explore')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(37, 99, 235, 0.18)', 'rgba(37, 99, 235, 0.06)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.exploreGradient}
          >
            <Text style={styles.exploreText}>Explore KTUfy</Text>
            <Text style={styles.exploreArrow}>›</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Bottom Nav */}
      <View style={styles.navContainer}>
        <View style={styles.nav}>
          <TouchableOpacity style={styles.navBtn}>
            <Text style={styles.navActiveLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Chatbot')}>
            <Text style={styles.navLabel}>AI Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Library')}>
            <Text style={styles.navLabel}>Library</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.navLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg900 },
  keyboardView: { flex: 1 },
  // Glow orbs
  orb: { position: 'absolute', borderRadius: 999 },
  orb1: {
    width: width * 1.2, height: width * 1.2,
    top: -height * 0.15, left: -width * 0.3,
    backgroundColor: 'rgba(37, 99, 235, 0.07)',
  },
  orb2: {
    width: width * 0.8, height: width * 0.8,
    bottom: height * 0.2, right: -width * 0.2,
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
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
    borderRadius: 100, backgroundColor: C.accentGlow, top: -60,
  },
  logoText: {
    fontSize: FONT.display,
    fontWeight: '800',
    letterSpacing: 12,
    color: C.textPrimary,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(37, 99, 235, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  tagline: {
    fontSize: FONT.caption,
    color: C.textSecondary,
    marginTop: 8,
    letterSpacing: 3,
    fontWeight: '500',
  },
  // Center
  centerContent: { alignItems: 'center' },
  promptContainer: { width: '100%', marginBottom: 14 },
  promptInputWrapper: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: C.inputBg,
    borderRadius: 20, borderWidth: 1, borderColor: C.inputBorder,
    paddingHorizontal: 16, paddingVertical: 8,
    minHeight: 52, maxHeight: 120,
  },
  promptInput: {
    flex: 1, fontSize: FONT.body, color: C.textPrimary,
    paddingVertical: 8, maxHeight: 100, lineHeight: 20,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.accent,
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
  sendBtnDisabled: { backgroundColor: 'rgba(37, 99, 235, 0.3)' },
  sendIcon: { color: C.white, fontSize: 18, fontWeight: '700' },
  // Chips
  chips: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 8, flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 16, borderWidth: 1,
    borderColor: C.accentBorder,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  chipText: { fontSize: FONT.caption, color: C.accentLight, fontWeight: '500' },
  // Explore floating card
  exploreFloating: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 78 : 58,
    left: 24, right: 24,
  },
  exploreButton: {
    borderRadius: 14, borderWidth: 1,
    borderColor: C.accentBorder, overflow: 'hidden',
  },
  exploreGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, paddingHorizontal: 24,
  },
  exploreText: {
    fontSize: FONT.body, fontWeight: '600',
    color: C.textPrimary, letterSpacing: 0.5,
  },
  exploreArrow: {
    fontSize: 22, color: C.accentLight, marginLeft: 10, fontWeight: '300',
  },
  // Nav
  navContainer: {
    backgroundColor: C.navBg,
    borderTopWidth: 1, borderTopColor: C.navBorder,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 10,
  },
  nav: {
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'center', paddingHorizontal: 16,
  },
  navBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 4, minWidth: 64,
  },
  navLabel: {
    fontSize: FONT.caption, color: C.textMuted,
    fontWeight: '500',
  },
  navActiveLabel: {
    fontSize: FONT.caption, color: C.accent,
    fontWeight: '700',
  },
});

export default HomeScreen;
