import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { ArrowRight, WifiOff, BookOpen, Wrench } from 'lucide-react-native';
import { useServerStatus } from '../hooks/useServerStatus';

const { width, height } = Dimensions.get('window');

// ─── Theme Colors (Blue Palette) ─────────────────────────────────
const C = {
  bg900: '#0D1117',
  bg850: '#161B22',
  bg800: '#21262D',
  bg700: '#161B22',
  accent: '#2563EB',
  accentLight: '#3B82F6',
  accentGlow: 'rgba(37, 99, 235, 0.10)',
  accentBorder: 'rgba(48, 54, 61, 0.8)',
  textPrimary: '#E6EDF3',
  textSecondary: '#8B949E',
  textMuted: '#484F58',
  inputBg: 'rgba(22, 27, 34, 0.85)',
  inputBorder: 'rgba(48, 54, 61, 0.6)',
  navBg: 'rgba(13, 17, 23, 0.95)',
  navBorder: 'rgba(48, 54, 61, 0.6)',
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

const TAGLINES = [
  'Your AI Study Companion',
  'Learn Faster with Intelligence',
  'Your Grades, Reimagined',
  'Built for KTU Students',
];

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const [promptText, setPromptText] = useState('');

  // Typewriter state
  const [displayedText, setDisplayedText] = useState('');
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const cursorAnim = useRef(new Animated.Value(1)).current;
  const blinkRef = useRef<Animated.CompositeAnimation | null>(null);

  // Cursor: blink only when paused, solid otherwise
  useEffect(() => {
    if (isPaused) {
      blinkRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
          Animated.timing(cursorAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
        ])
      );
      blinkRef.current.start();
    } else {
      if (blinkRef.current) {
        blinkRef.current.stop();
        blinkRef.current = null;
      }
      cursorAnim.stopAnimation(() => {
        cursorAnim.setValue(1);
      });
    }
    return () => {
      if (blinkRef.current) {
        blinkRef.current.stop();
        blinkRef.current = null;
      }
    };
  }, [isPaused]);

  // Typewriter effect
  useEffect(() => {
    const current = TAGLINES[taglineIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && charIndex <= current.length) {
      setDisplayedText(current.slice(0, charIndex));
      if (charIndex === current.length) {
        // Pause at full text, then start deleting
        setIsPaused(true);
        timeout = setTimeout(() => { setIsPaused(false); setIsDeleting(true); }, 2000);
      } else {
        timeout = setTimeout(() => setCharIndex((c) => c + 1), 70);
      }
    } else if (isDeleting && charIndex >= 0) {
      setDisplayedText(current.slice(0, charIndex));
      if (charIndex === 0) {
        setIsDeleting(false);
        setTaglineIndex((i) => (i + 1) % TAGLINES.length);
      } else {
        timeout = setTimeout(() => setCharIndex((c) => c - 1), 40);
      }
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, taglineIndex]);

  // Animations
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(24)).current;

  // Particle system
  const PARTICLE_COUNT = 12;
  const particleAnims = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => new Animated.Value(0))
  ).current;
  const particleConfigs = useRef(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x: width * 0.12 + (i / PARTICLE_COUNT) * width * 0.76 + (Math.random() - 0.5) * 24,
      duration: 2400 + Math.random() * 2200,
      initialDelay: i * 380 + Math.random() * 500,
      size: 2 + Math.random() * 1.5,
      trailHeight: 22 + Math.random() * 28,
    }))
  ).current;

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 700, delay: 350, useNativeDriver: true }),
      Animated.timing(contentY, { toValue: 0, duration: 700, delay: 350, useNativeDriver: true }),
    ]).start();

    // Particles — shoot upward in a loop
    particleAnims.forEach((anim, i) => {
      const cfg = particleConfigs[i];
      let first = true;
      const run = () => {
        anim.setValue(0);
        Animated.timing(anim, {
          toValue: 1,
          duration: cfg.duration + (Math.random() - 0.5) * 500,
          useNativeDriver: true,
          delay: first ? cfg.initialDelay : Math.random() * 900,
        }).start(() => { first = false; run(); });
      };
      run();
    });
  }, []);

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

      {/* Particles shooting upward */}
      <View style={styles.particleContainer} pointerEvents="none">
        {particleAnims.map((anim, i) => {
          const cfg = particleConfigs[i];
          const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [height * 0.45, -cfg.trailHeight - 30],
          });
          const opacity = anim.interpolate({
            inputRange: [0, 0.08, 0.5, 0.85, 1],
            outputRange: [0, isDark ? 0.9 : 0.45, isDark ? 0.4 : 0.35, 0.2, 0],
          });
          const scale = anim.interpolate({
            inputRange: [0, 0.15, 0.8, 1],
            outputRange: [0.3, 1, 0.8, 0.4],
          });
          return (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                left: cfg.x - cfg.size / 2,
                width: cfg.size,
                height: cfg.trailHeight,
                borderRadius: cfg.size,
                opacity,
                transform: [{ translateY }, { scaleY: scale }],
                overflow: 'hidden',
              }}
            >
              <LinearGradient
                colors={['#60A5FA', '#3B82F6', '#3B82F660', 'transparent']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{ flex: 1, borderRadius: cfg.size }}
              />
            </Animated.View>
          );
        })}
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Main content area */}
        <View style={styles.mainContent}>
          {/* Logo — upper portion */}
          <Animated.View style={[styles.logoSection, { opacity: logoOpacity }]}>
            <Text style={[styles.logoText, { color: theme.text, textShadowColor: theme.primary + '66' }]}>KTUfy</Text>
            <View style={styles.taglineRow}>
              <Text style={[styles.tagline, { color: theme.textSecondary }]}>{displayedText}</Text>
              <Animated.Text style={[styles.cursor, { color: '#3B82F6', opacity: cursorAnim }]}>|</Animated.Text>
            </View>
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

      {/* Feature shortcuts + Explore — floating above nav */}
      <View style={styles.exploreFloating}>
        <View style={styles.featureRow}>
          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={() => navigation.navigate('LearningZone')}
            activeOpacity={0.7}
          >
            <View style={[styles.featureIconWrap, { backgroundColor: theme.learningZone + '1A' }]}>  
              <BookOpen size={18} color={theme.learningZone} strokeWidth={2} />
            </View>
            <Text style={[styles.featureLabel, { color: theme.text }]}>Learning Zone</Text>
            <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>Flashcards, quizzes & more</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={() => navigation.navigate('MediaTools')}
            activeOpacity={0.7}
          >
            <View style={[styles.featureIconWrap, { backgroundColor: theme.primary + '1A' }]}>
              <Wrench size={18} color={theme.primary} strokeWidth={2} />
            </View>
            <Text style={[styles.featureLabel, { color: theme.text }]}>Media Tools</Text>
            <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>Video, audio & PDF tools</Text>
          </TouchableOpacity>
        </View>
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
  // Particle layer
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  // Main
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 130, // space for feature cards + explore + nav
  },
  // Logo
  logoSection: { alignItems: 'center', marginBottom: 48 },
  logoText: {
    fontSize: FONT.display + 20,
    fontFamily: 'Inter-Black',
    fontWeight: '900',
    letterSpacing: 2,
    // textTransform: 'uppercase',
    textShadowOffset: { width: 5, height: 0 },
    textShadowRadius: 20,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 18,
  },
  tagline: {
    fontSize: FONT.caption,
    letterSpacing: 2,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  cursor: {
    fontSize: FONT.caption + 5,
    fontWeight: '800',
    marginLeft: 1,
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
  featureRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  featureCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureLabel: {
    fontSize: FONT.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: FONT.micro + 1,
    lineHeight: 15,
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
