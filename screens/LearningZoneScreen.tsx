import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../auth/AuthProvider';
import supabase from '../supabaseClient';

type LearningZoneScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'LearningZone'>;
};

interface GameStats {
  totalPoints: number;
  gamesPlayed: number;
  dailyStreak: number;
}

const LearningZoneScreen: React.FC<LearningZoneScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [stats, setStats] = useState<GameStats>({ totalPoints: 0, gamesPlayed: 0, dailyStreak: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('game_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setStats({
          totalPoints: data.total_points || 0,
          gamesPlayed: data.games_played || 0,
          dailyStreak: data.daily_streak || 0,
        });
      }
    } catch (err) {
      // Table may not exist yet — silent fail
    }
  };

  const games = [
    {
      id: 'quiz',
      title: 'Topic Quiz',
      description: 'Test your knowledge with AI-generated questions on any topic',
      icon: '🧠',
      color: '#F472B6',
      gradient: ['#F472B6', '#EC4899'],
      onPress: () => navigation.navigate('QuizGame', { topic: '' }),
    },
    {
      id: 'match',
      title: 'Match the Following',
      description: 'Match terms to their definitions — perfect for memorizing concepts',
      icon: '🔗',
      color: '#8B5CF6',
      gradient: ['#8B5CF6', '#7C3AED'],
      onPress: () => navigation.navigate('MatchGame', { topic: '' }),
    },
    {
      id: 'flashcards',
      title: 'AI Flashcards',
      description: 'Generate flashcards for any topic and flip to study',
      icon: '�',
      color: '#3B82F6',
      gradient: ['#3B82F6', '#2563EB'],
      onPress: () => navigation.navigate('Flashcards'),
    },
  ];

  const suggestedTopics = [
    'Data Structures', 'Computer Networks', 'DBMS', 'Operating Systems',
    'Algorithms', 'Machine Learning', 'Digital Electronics', 'Compiler Design',
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.background }}>
        <View style={[styles.header, { borderBottomColor: theme.divider }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Learning Zone</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Stats Bar */}
        <View style={[styles.statsBar, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.primary }]}>{stats.totalPoints}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Points</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#F472B6' }]}>{stats.gamesPlayed}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Games</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>🔥 {stats.dailyStreak}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Streak</Text>
          </View>
        </View>

        {/* Section Title */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Study Activities</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Pick a topic, let AI create the challenge</Text>

        {/* Game Cards */}
        {games.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={[styles.gameCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
            onPress={game.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.gameIconContainer, { backgroundColor: game.color + '18' }]}>
              <Text style={styles.gameIcon}>{game.icon}</Text>
            </View>
            <View style={styles.gameInfo}>
              <Text style={[styles.gameTitle, { color: theme.text }]}>{game.title}</Text>
              <Text style={[styles.gameDesc, { color: theme.textSecondary }]}>{game.description}</Text>
            </View>
            <Text style={[styles.gameArrow, { color: theme.textTertiary }]}>›</Text>
          </TouchableOpacity>
        ))}

        {/* Suggested Topics */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Suggested Topics</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicsRow}>
          {suggestedTopics.map((topic) => (
            <TouchableOpacity
              key={topic}
              style={[styles.topicChip, { backgroundColor: theme.primary + '12', borderColor: theme.primary + '30' }]}
              onPress={() => navigation.navigate('QuizGame', { topic })}
            >
              <Text style={[styles.topicChipText, { color: theme.primary }]}>{topic}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* How it Works */}
        <View style={[styles.howItWorks, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <Text style={[styles.howTitle, { color: theme.text }]}>How It Works</Text>
          <View style={styles.howStep}>
            <Text style={styles.howStepNum}>1</Text>
            <Text style={[styles.howStepText, { color: theme.textSecondary }]}>Choose an activity from above</Text>
          </View>
          <View style={styles.howStep}>
            <Text style={styles.howStepNum}>2</Text>
            <Text style={[styles.howStepText, { color: theme.textSecondary }]}>Enter any topic you want to study</Text>
          </View>
          <View style={styles.howStep}>
            <Text style={styles.howStepNum}>3</Text>
            <Text style={[styles.howStepText, { color: theme.textSecondary }]}>AI generates personalized questions & pairs</Text>
          </View>
          <View style={styles.howStep}>
            <Text style={styles.howStepNum}>4</Text>
            <Text style={[styles.howStepText, { color: theme.textSecondary }]}>Play, learn, and earn points!</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backIcon: { fontSize: 22, fontWeight: '500' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  // Stats
  statsBar: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16,
    borderWidth: 1, marginBottom: 24,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 30 },

  // Section
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, marginBottom: 16 },

  // Game Cards
  gameCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16,
    borderWidth: 1, marginBottom: 12,
  },
  gameIconContainer: {
    width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  gameIcon: { fontSize: 26 },
  gameInfo: { flex: 1, marginLeft: 14 },
  gameTitle: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
  gameDesc: { fontSize: 12, lineHeight: 17 },
  gameArrow: { fontSize: 22, fontWeight: '300', marginLeft: 8 },

  // Topics
  topicsRow: { gap: 8, paddingBottom: 4 },
  topicChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  topicChipText: { fontSize: 13, fontWeight: '600' },

  // How it works
  howItWorks: { borderRadius: 16, padding: 18, borderWidth: 1, marginTop: 24 },
  howTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  howStep: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  howStepNum: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#8B5CF620',
    textAlign: 'center', lineHeight: 24, fontSize: 12, fontWeight: '700', color: '#8B5CF6',
    marginRight: 10, overflow: 'hidden',
  },
  howStepText: { fontSize: 13, flex: 1 },
});

export default LearningZoneScreen;
