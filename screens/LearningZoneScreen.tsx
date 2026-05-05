import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, Brain, Zap, Gamepad2, Layers, Trophy, Flame, Clock, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../auth/AuthProvider';
import supabase from '../supabaseClient';
import { listFlashcardSets } from '../services/flashcardService';
import { listLearningSets } from '../services/quizService';

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
  const [history, setHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [stats, setStats] = useState<GameStats>({ totalPoints: 0, gamesPlayed: 0, dailyStreak: 0 });

  useEffect(() => {
    if (user) {
      loadStats();
      loadHistory();
    }
  }, [user]);

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

  const loadHistory = async () => {
    if (!user) return;
    setIsHistoryLoading(true);
    try {
      // Fetch from the new generated_content table as requested
      const { data, error } = await supabase
        .from('generated_content')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        setHistory(data.map(item => ({
          ...item,
          topic: item.title || 'Untitled Topic',
          type: item.content_type === 'qa' ? 'quiz' : item.content_type // Map qa to quiz for now or handle separately
        })));
      }
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const games = [
    {
      id: 'quiz',
      title: 'Topic Quiz',
      description: 'Test your knowledge with AI-generated questions on any topic',
      icon: Brain,
      color: '#3B82F6',
      onPress: () => navigation.navigate('QuizGame', { topic: '' }),
    },
    {
      id: 'match',
      title: 'Match the Following',
      description: 'Match terms to their definitions — perfect for memorizing concepts',
      icon: Layers,
      color: '#10B981',
      onPress: () => navigation.navigate('MatchGame', { topic: '' }),
    },
    {
      id: 'flashcards',
      title: 'AI Flashcards',
      description: 'Generate flashcards for any topic and flip to study',
      icon: Zap,
      color: '#F59E0B',
      onPress: () => navigation.navigate('Flashcards'),
    },
  ];

  const suggestedTopics = [
    'Data Structures', 'Computer Networks', 'DBMS', 'Operating Systems',
    'Algorithms', 'Machine Learning', 'Digital Electronics', 'Compiler Design',
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Header with Gradient */}
      <View style={styles.headerBackground}>
        <LinearGradient
          colors={['#06070a', '#1E3A8A']}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ArrowLeft size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>Learning Zone</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.headerSummary}>
            <Text style={styles.welcomeText}>Boost your skills!</Text>
            <Text style={styles.subtitleText}>Choose an activity to start learning.</Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Stats Bar */}
        {/* <View style={[styles.statsBar, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <View style={styles.statItem}>
            <View style={[styles.statIconBox, { backgroundColor: theme.primary + '1A' }]}>
              <Trophy size={16} color={theme.primary} />
            </View>
            <View>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalPoints}</Text>
              <Text style={[styles.statLabel, { color: theme.textTertiary }]}>Points</Text>
            </View>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />
          <View style={styles.statItem}>
            <View style={[styles.statIconBox, { backgroundColor: '#F472B61A' }]}>
              <Gamepad2 size={16} color="#F472B6" />
            </View>
            <View>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.gamesPlayed}</Text>
              <Text style={[styles.statLabel, { color: theme.textTertiary }]}>Games</Text>
            </View>
          </View>
          <View style={[styles.statItem, { paddingLeft: 12 }]}>
            <View style={[styles.statIconBox, { backgroundColor: '#F59E0B1A' }]}>
              <Flame size={16} color="#F59E0B" />
            </View>
            <View>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.dailyStreak}</Text>
              <Text style={[styles.statLabel, { color: theme.textTertiary }]}>Streak</Text>
            </View>
          </View>
        </View> */}

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
              <game.icon size={26} color={game.color} />
            </View>
            <View style={styles.gameInfo}>
              <Text style={[styles.gameTitle, { color: theme.text }]}>{game.title}</Text>
              <Text style={[styles.gameDesc, { color: theme.textSecondary }]}>{game.description}</Text>
            </View>
            <View style={[styles.gameArrowCircle, { backgroundColor: theme.backgroundTertiary }]}>
              <ArrowLeft size={16} color={theme.textTertiary} style={{ transform: [{ rotate: '180deg' }] }} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Recent Activities (History) */}
        <View style={styles.historySection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activities</Text>
          {isHistoryLoading ? (
            <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
          ) : history.length === 0 ? (
            <View style={[styles.emptyHistory, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
              <Clock size={32} color={theme.textTertiary} />
              <Text style={[styles.emptyHistoryText, { color: theme.textTertiary }]}>No recent activities yet.</Text>
            </View>
          ) : (
            history.map((item, i) => (
              <TouchableOpacity 
                key={i} 
                style={[styles.historyCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                onPress={() => {
                  if (item.type === 'flashcard') navigation.navigate('Flashcards', { topic: item.topic });
                  else if (item.type === 'quiz') navigation.navigate('QuizGame', { topic: item.topic });
                  else navigation.navigate('MatchGame', { topic: item.topic });
                }}
              >
                <View style={[styles.historyIcon, { backgroundColor: (item.type === 'flashcard' ? '#F59E0B' : item.type === 'quiz' ? '#3B82F6' : '#10B981') + '1A' }]}>
                  {item.type === 'flashcard' ? <Zap size={18} color="#F59E0B" /> : 
                   item.type === 'quiz' ? <Brain size={18} color="#3B82F6" /> : 
                   <Layers size={18} color="#10B981" />}
                </View>
                <View style={styles.historyInfo}>
                  <Text style={[styles.historyTopic, { color: theme.text }]} numberOfLines={1}>{item.topic}</Text>
                  <Text style={[styles.historyType, { color: theme.textTertiary }]}>{item.type.toUpperCase()}</Text>
                </View>
                <ChevronRight size={16} color={theme.textTertiary} />
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBackground: {
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    marginBottom: 5
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSummary: {
    marginTop: 5,
    paddingLeft: 4,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, marginTop: -20 },

  // Stats
  statsBar: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 16,
    borderWidth: 1, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3,
    marginTop:20
  },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  statIconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 24, marginHorizontal: 12 },

  // Section
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,marginTop:10, marginLeft: 4 },
  sectionSubtitle: { fontSize: 13, marginBottom: 16, marginLeft: 4 },

  // Game Cards
  gameCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 16,
    borderWidth: 1, marginBottom: 12,
  },
  gameIconContainer: {
    width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  gameInfo: { flex: 1, marginLeft: 16 },
  gameTitle: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
  gameDesc: { fontSize: 12, lineHeight: 17 },
  gameArrowCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

  // Topics
  topicsRow: { gap: 8, paddingBottom: 10, paddingLeft: 4 },
  topicChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 15, borderWidth: 1.5 },
  topicChipText: { fontSize: 13, fontWeight: '700' },

  // How it works
  howItWorks: { borderRadius: 20, padding: 20, borderWidth: 1, marginTop: 24 },
  howTitle: { fontSize: 16, fontWeight: '800', marginBottom: 16 },
  howStep: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  howStepNum: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#3B82F620',
    textAlign: 'center', lineHeight: 26, fontSize: 12, fontWeight: '800', color: '#3B82F6',
    marginRight: 12, overflow: 'hidden',
  },
  howStepText: { fontSize: 13, flex: 1, fontWeight: '500' },

  // History
  historySection: { marginTop: 30 },
  historyCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 12,
    borderWidth: 1, marginBottom: 10,
  },
  historyIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  historyInfo: { flex: 1 },
  historyTopic: { fontSize: 14, fontWeight: '700' },
  historyType: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginTop: 2 },
  emptyHistory: { borderRadius: 16, padding: 30, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyHistoryText: { fontSize: 13 },
});

export default LearningZoneScreen;
