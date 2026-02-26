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

// ─── Theme Variables ──────────────────────────────────────────────
const COLORS = {
  bgDark: '#050816',
  bgMid: '#0A0F2E',
  bgLight: '#0F1942',
  accent: '#818CF8',
  accentGlow: 'rgba(129, 140, 248, 0.15)',
  accentBorder: 'rgba(129, 140, 248, 0.3)',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  inputBg: 'rgba(15, 23, 42, 0.8)',
  inputBorder: 'rgba(71, 85, 105, 0.5)',
  cardBg: 'rgba(15, 23, 42, 0.6)',
  navBg: 'rgba(5, 8, 22, 0.95)',
  navBorder: 'rgba(71, 85, 105, 0.3)',
  white: '#FFFFFF',
};

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [promptText, setPromptText] = useState('');

  // Animated gradient background
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Background gradient animation - continuous loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 6000,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Subtle pulse glow around logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Entrance animations
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 800,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslate, {
        toValue: 0,
        duration: 800,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Interpolate gradient colors for animation
  const gradientColor1 = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#050816', '#0A0F2E', '#050816'],
  });

  const gradientColor2 = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#0A0F2E', '#131B4D', '#0F1942'],
  });

  const gradientColor3 = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#0F1942', '#0A0F2E', '#131B4D'],
  });

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.05, 0.2],
  });

  const handlePromptSubmit = () => {
    if (!promptText.trim()) return;
    const prompt = promptText.trim();
    setPromptText('');
    navigation.navigate('Chatbot', { initialPrompt: prompt });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />

      {/* Animated gradient background */}
      <LinearGradient
        colors={[COLORS.bgDark, COLORS.bgMid, COLORS.bgLight, COLORS.bgDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Animated overlay orbs for visual depth */}
      <Animated.View
        style={[
          styles.glowOrb,
          styles.glowOrb1,
          { opacity: glowOpacity },
        ]}
      />
      <Animated.View
        style={[
          styles.glowOrb,
          styles.glowOrb2,
          { opacity: glowOpacity },
        ]}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {/* Logo Section - positioned in the upper area (~25% from top = 75% from bottom) */}
          <Animated.View style={[styles.logoSection, { opacity: logoOpacity }]}>
            <Animated.View
              style={[
                styles.logoGlow,
                { opacity: glowOpacity },
              ]}
            />
            <Text style={styles.logoText}>KTUfy</Text>
            <Text style={styles.tagline}>Your AI Study Companion</Text>
          </Animated.View>

          {/* Center Content - Prompt Input & Explore Button */}
          <Animated.View
            style={[
              styles.centerContent,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslate }],
              },
            ]}
          >
            {/* Prompt Input Box */}
            <View style={styles.promptContainer}>
              <View style={styles.promptInputWrapper}>
                <TextInput
                  style={styles.promptInput}
                  placeholder="Ask anything about your studies..."
                  placeholderTextColor={COLORS.textMuted}
                  value={promptText}
                  onChangeText={setPromptText}
                  multiline
                  maxLength={500}
                  onSubmitEditing={handlePromptSubmit}
                  returnKeyType="send"
                  blurOnSubmit
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    !promptText.trim() && styles.sendButtonDisabled,
                  ]}
                  onPress={handlePromptSubmit}
                  disabled={!promptText.trim()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sendIcon}>→</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Suggestion Chips */}
            <View style={styles.suggestionsRow}>
              {['Exam tips', 'Study plan', 'KTU syllabus'].map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={styles.suggestionChip}
                  onPress={() => {
                    setPromptText(chip);
                    navigation.navigate('Chatbot', { initialPrompt: chip });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Explore KTUfy Button */}
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => navigation.navigate('Explore')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(129, 140, 248, 0.15)', 'rgba(129, 140, 248, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.exploreGradient}
              >
                <Text style={styles.exploreIcon}>◈</Text>
                <Text style={styles.exploreText}>Explore KTUfy</Text>
                <Text style={styles.exploreArrow}>›</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>

      {/* Bottom Navigation Bar - Professional Icons */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navButton}>
            <View style={[styles.navIconContainer, styles.navIconActive]}>
              <Text style={styles.navIconTextActive}>⌂</Text>
            </View>
            <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('Chatbot')}
          >
            <View style={styles.navIconContainer}>
              <Text style={styles.navIconText}>◎</Text>
            </View>
            <Text style={styles.navLabel}>AI Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('Library')}
          >
            <View style={styles.navIconContainer}>
              <Text style={styles.navIconText}>▤</Text>
            </View>
            <Text style={styles.navLabel}>Library</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.navIconContainer}>
              <Text style={styles.navIconText}>○</Text>
            </View>
            <Text style={styles.navLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  keyboardView: {
    flex: 1,
  },
  // Glow orbs for animated background
  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowOrb1: {
    width: width * 1.2,
    height: width * 1.2,
    top: -height * 0.15,
    left: -width * 0.3,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  glowOrb2: {
    width: width * 0.8,
    height: width * 0.8,
    bottom: height * 0.15,
    right: -width * 0.2,
    backgroundColor: 'rgba(129, 140, 248, 0.06)',
  },
  // Main content
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  // Logo section
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.accentGlow,
    top: -60,
  },
  logoText: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: 12,
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(129, 140, 248, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    letterSpacing: 2,
    fontWeight: '400',
    textTransform: 'uppercase',
  },
  // Center content
  centerContent: {
    alignItems: 'center',
  },
  // Prompt input
  promptContainer: {
    width: '100%',
    marginBottom: 16,
  },
  promptInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.inputBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 52,
    maxHeight: 120,
  },
  promptInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    paddingVertical: 8,
    maxHeight: 100,
    lineHeight: 20,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(129, 140, 248, 0.3)',
  },
  sendIcon: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  // Suggestion chips
  suggestionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
    flexWrap: 'wrap',
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    backgroundColor: 'rgba(129, 140, 248, 0.08)',
  },
  suggestionText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '500',
  },
  // Explore button
  exploreButton: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    overflow: 'hidden',
  },
  exploreGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  exploreIcon: {
    fontSize: 18,
    color: COLORS.accent,
    marginRight: 10,
  },
  exploreText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  exploreArrow: {
    fontSize: 22,
    color: COLORS.accent,
    marginLeft: 10,
    fontWeight: '300',
  },
  // Bottom navigation
  bottomNavContainer: {
    backgroundColor: COLORS.navBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.navBorder,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 64,
  },
  navIconContainer: {
    width: 40,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 2,
  },
  navIconActive: {
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
  },
  navIconText: {
    fontSize: 20,
    color: COLORS.textMuted,
  },
  navIconTextActive: {
    fontSize: 20,
    color: COLORS.accent,
  },
  navLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  navLabelActive: {
    color: COLORS.accent,
    fontWeight: '600',
  },
});

export default HomeScreen;
