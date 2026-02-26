import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeScreenNavigationProp } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';

const { height } = Dimensions.get('window');

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const [prompt, setPrompt] = useState('');

  const colors = useMemo(() => {
    const baseCard = isDark ? '#050816' : theme.backgroundSecondary;
    return {
      background: theme.background,
      card: baseCard,
      cardBorder: isDark ? '#0F172A' : theme.border,
      title: isDark ? '#F8FAFC' : theme.text,
      text: isDark ? '#E5E7EB' : theme.text,
      muted: isDark ? '#9CA3AF' : theme.textSecondary,
      primary: theme.primary,
      border: isDark ? '#1F2937' : theme.border,
      inputBackground: isDark ? '#0F172A' : theme.background,
      inputBorder: isDark ? '#1F2937' : theme.border,
      inputText: isDark ? '#E5E7EB' : theme.text,
      placeholder: isDark ? '#6B7280' : theme.textSecondary,
      secondaryBackground: isDark ? '#0B1120' : theme.backgroundSecondary,
      toolCard: isDark ? '#0B1224' : theme.backgroundSecondary,
      logo: theme.primaryLight,
      logoTopOffset: Math.max(24, Math.round(height * 0.08)),
    };
  }, [theme, isDark]);

  const handleSendPrompt = () => {
    const value = prompt.trim();
    if (!value) return;
    setPrompt('');
    navigation.navigate('Chatbot', { initialPrompt: value });
  };

  const handleExplore = () => {
    navigation.navigate('Chatbot');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.logoContainer, { marginTop: colors.logoTopOffset }]}>
            <Text style={[styles.logoText, { color: colors.logo }]}>KTUfy</Text>
            <Text style={[styles.logoSubtitle, { color: colors.muted }]}>KG-RAG study companion</Text>
          </View>

          <View style={[styles.promptCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.promptTitle, { color: colors.title }]}>Ask KTUfy</Text>
            <Text style={[styles.promptSubtitle, { color: colors.muted }]}>Start with a question and jump straight into the KG-RAG chatbot.</Text>

            <View style={[styles.inputShell, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
              <TextInput
                style={[styles.input, { color: colors.inputText }]}
                placeholder="Ask about syllabus, exams, or coding tips"
                placeholderTextColor={colors.placeholder}
                value={prompt}
                onChangeText={setPrompt}
                onSubmitEditing={handleSendPrompt}
                returnKeyType="send"
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }, !prompt.trim() && styles.primaryButtonDisabled]}
              onPress={handleSendPrompt}
              disabled={!prompt.trim()}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryButtonText}>Send to KG-RAG</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.secondaryBackground }]}
              onPress={handleExplore}
              activeOpacity={0.9}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Explore KTUfy</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.toolsSection}>
            <Text style={[styles.toolsTitle, { color: colors.title }]}>Student tools</Text>
            <View style={styles.toolsGrid}>
              <TouchableOpacity
                style={[styles.toolCard, { backgroundColor: colors.toolCard, borderColor: colors.border }]}
                onPress={() => navigation.navigate('Library')}
              >
                <Text style={styles.toolEmoji}>📚</Text>
                <Text style={[styles.toolLabel, { color: colors.text }]}>Library</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolCard, { backgroundColor: colors.toolCard, borderColor: colors.border }]}
                onPress={() => navigation.navigate('Ticklist')}
              >
                <Text style={styles.toolEmoji}>✅</Text>
                <Text style={[styles.toolLabel, { color: colors.text }]}>Ticklist</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolCard, { backgroundColor: colors.toolCard, borderColor: colors.border }]}
                onPress={() => navigation.navigate('Schedule')}
              >
                <Text style={styles.toolEmoji}>🗓️</Text>
                <Text style={[styles.toolLabel, { color: colors.text }]}>Schedule</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolCard, { backgroundColor: colors.toolCard, borderColor: colors.border }]}
                onPress={() => navigation.navigate('CodingHub')}
              >
                <Text style={styles.toolEmoji}>💻</Text>
                <Text style={[styles.toolLabel, { color: colors.text }]}>Coding</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolCard, { backgroundColor: colors.toolCard, borderColor: colors.border }]}
                onPress={() => navigation.navigate('GPACalculator')}
              >
                <Text style={styles.toolEmoji}>📊</Text>
                <Text style={[styles.toolLabel, { color: colors.text }]}>GPA</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolCard, { backgroundColor: colors.toolCard, borderColor: colors.border }]}
                onPress={() => navigation.navigate('LearningZone')}
              >
                <Text style={styles.toolEmoji}>🎮</Text>
                <Text style={[styles.toolLabel, { color: colors.text }]}>Games</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 8,
    textTransform: 'uppercase',
  },
  logoSubtitle: {
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 6,
  },
  promptCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  promptTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  promptSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputShell: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 14,
  },
  input: {
    fontSize: 15,
    paddingVertical: 8,
  },
  primaryButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  toolsSection: {
    marginTop: 8,
  },
  toolsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  toolCard: {
    width: '48%',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  toolEmoji: {
    fontSize: 22,
    marginBottom: 8,
  },
  toolLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default HomeScreen;
