import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthProvider';
import { getUserProfile, getTicklistsForUser, upsertTicklist } from '../supabaseConfig';
import supabase from '../supabaseClient';
import { HomeScreenNavigationProp } from '../types/navigation';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

interface UserData {
  name?: string;
  email?: string;
  registrationNumber?: string;
  college?: string;
  branch?: string;
}

interface TicklistItem {
  id: string;
  title: string;
  completed: boolean;
  isTrending?: boolean;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
  items: TicklistItem[];
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user: authUser, getToken } = useAuth();
  const [supabaseUser, setSupabaseUser] = useState<any | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [studyStreak, setStudyStreak] = useState(7);
  const [focusTime, setFocusTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data: userRes, error } = await supabase.auth.getUser();
        if (error) throw error;
        const sUser = userRes?.user ?? null;
        setSupabaseUser(sUser);
        if (sUser) {
          const profile = await getUserProfile(sUser.id);
          if (profile) setUserData(profile as UserData);
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
      }
    })();

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => {
        setFocusTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Load ticklist subjects from Firestore
  useEffect(() => {
    (async () => {
      if (!supabaseUser) return;
      try {
        const lists = await getTicklistsForUser(supabaseUser.id);
        // Map rows into Subject[]
        const loadedSubjects: Subject[] = (lists || []).map((r: any) => ({
          id: r.id,
          name: r.subject_name,
          code: r.code,
          color: r.color,
          items: r.items || [],
        }));
        setSubjects(loadedSubjects);
      } catch (err) {
        console.error('Error loading ticklist:', err);
      }
    })();
  }, [supabaseUser]);

  const toggleItem = async (subjectId: string, itemId: string) => {
    if (!supabaseUser) return;

    try {
      const subject = subjects.find(s => s.id === subjectId);
      if (!subject) return;

      const updatedItems = subject.items.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );

      await upsertTicklist({
        id: subjectId,
        user_id: supabaseUser.id,
        subject_name: subject.name,
        code: subject.code,
        color: subject.color,
        items: updatedItems,
      });
    } catch (error) {
      console.error('Error toggling item:', error);
    }
  };

  const getSubjectProgress = (subject: Subject) => {
    const completed = subject.items.filter(item => item.completed).length;
    const total = subject.items.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const getTotalProgress = () => {
    const totalItems = subjects.reduce((sum, subject) => sum + subject.items.length, 0);
    const completedItems = subjects.reduce(
      (sum, subject) => sum + subject.items.filter(item => item.completed).length,
      0
    );
    const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    return {
      completed: completedItems,
      total: totalItems,
      percentage,
    };
  };

  const totalProgress = getTotalProgress();

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{userData?.name || supabaseUser?.user_metadata?.name || supabaseUser?.email || authUser?.email || 'Student'}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileButtonText}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Smart Study Dashboard */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📊 Study Dashboard</Text>
            <Text style={styles.streakBadge}>🔥 {studyStreak} day streak</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Syllabus Completion</Text>
              <Text style={styles.progressPercent}>{totalProgress.percentage}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${totalProgress.percentage}%` }]} />
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{subjects.length}</Text>
              <Text style={styles.statLabel}>Subjects</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.examCountdown]}>--</Text>
              <Text style={styles.statLabel}>Days to Exam</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalProgress.completed}/{totalProgress.total}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
        </View>

        {/* AI Assistant Widget */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🤖 AI Study Assistant</Text>
          </View>
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => navigation.navigate('Chatbot')}
          >
            <Text style={styles.aiButtonText}>💬 Ask anything about your studies</Text>
            <Text style={styles.aiButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Tomorrow's Schedule */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📅 Tomorrow's Classes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.scheduleList}>
            <Text style={styles.progressLabel}>No classes scheduled</Text>
          </View>
        </View>

        {/* Subject Progress */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📖 Subject Progress</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Ticklist')}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.subjectList}>
            {subjects.length === 0 ? (
              <Text style={styles.progressLabel}>No subjects added yet</Text>
            ) : (
              subjects.slice(0, 3).map(subject => {
                const progress = getSubjectProgress(subject);
                return (
                  <View key={subject.id} style={styles.subjectItem}>
                    <View style={styles.subjectHeader}>
                      <Text style={styles.subjectName}>{subject.name}</Text>
                      <Text style={styles.subjectPercent}>{progress.percentage}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${progress.percentage}%`, backgroundColor: subject.color }]} />
                    </View>
                    {subject.items.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsScroll}>
                        {subject.items.slice(0, 5).map(item => (
                          <TouchableOpacity
                            key={item.id}
                            style={styles.miniCheckbox}
                            onPress={() => toggleItem(subject.id, item.id)}
                          >
                            <View style={[
                              styles.checkboxCircle,
                              item.completed && { backgroundColor: subject.color }
                            ]}>
                              {item.completed && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={styles.miniItemText} numberOfLines={1}>
                              {item.title}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Gamification Zone */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🎮 Learning Zone</Text>
          </View>
          <View style={styles.challengeCard}>
            <Text style={styles.challengeTitle}>💪 Daily Challenge</Text>
            <Text style={styles.challengeDesc}>No active challenges</Text>
            <View style={styles.challengeReward}>
              <Text style={styles.rewardText}>0 pts</Text>
              <Text style={styles.challengeProgress}>0/0 completed</Text>
            </View>
          </View>
          <View style={styles.motivationCard}>
            <Text style={styles.motivationText}>
              "Success is the sum of small efforts repeated day in and day out."
            </Text>
          </View>
        </View>

        {/* AI Recommendations */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>💡 Study Recommendations</Text>
          </View>
          <View style={styles.recommendationList}>
            <Text style={styles.progressLabel}>No recommendations available</Text>
          </View>
        </View>

        {/* Analytics Snapshot */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📈 Analytics</Text>
          </View>
          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>0/0</Text>
              <Text style={styles.analyticsLabel}>Topics</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>0%</Text>
              <Text style={styles.analyticsLabel}>Quiz Accuracy</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: '#10B981' }]}>0%</Text>
              <Text style={styles.analyticsLabel}>Improvement</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>0</Text>
              <Text style={styles.analyticsLabel}>Study Sessions</Text>
            </View>
          </View>
        </View>

        {/* Recent Uploads */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📄 Recent Uploads</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Library')}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.uploadsScroll}>
            <Text style={styles.progressLabel}>No recent uploads</Text>
          </View>
        </View>

        {/* Focus Mode Timer */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>⏱️ Focus Mode</Text>
          </View>
          <View style={styles.timerContainer}>
            <Text style={styles.timerDisplay}>{formatTime(focusTime)}</Text>
            <TouchableOpacity
              style={[styles.timerButton, timerRunning && styles.timerButtonActive]}
              onPress={() => setTimerRunning(!timerRunning)}
            >
              <Text style={styles.timerButtonText}>
                {timerRunning ? '⏸ Pause' : '▶ Start Focus Session'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.timerHint}>Stay focused and build your streak! 🎯</Text>
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navButton}>
            <Text style={styles.navIconActive}>🏠</Text>
            <Text style={styles.navLabelActive}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigation.navigate('Chatbot')}
          >
            <Text style={styles.navIcon}>🤖</Text>
            <Text style={styles.navLabel}>Chatbot</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigation.navigate('Library')}
          >
            <Text style={styles.navIcon}>📚</Text>
            <Text style={styles.navLabel}>Library</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.navIcon}>⚙️</Text>
            <Text style={styles.navLabel}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
  },
  greeting: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileButtonText: {
    fontSize: 24,
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  streakBadge: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366F1',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  examCountdown: {
    color: '#EF4444',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  aiButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  aiButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  aiButtonArrow: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  promptChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipText: {
    fontSize: 13,
    color: '#475569',
  },
  scheduleList: {
    gap: 12,
  },
  scheduleItem: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
  },
  scheduleTime: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  scheduleSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  scheduleRoom: {
    fontSize: 13,
    color: '#64748B',
  },
  subjectList: {
    gap: 16,
  },
  subjectItem: {
    gap: 8,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  subjectPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },
  trendingBadge: {
    fontSize: 12,
    color: '#F59E0B',
  },
  itemsScroll: {
    marginTop: 8,
  },
  miniCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxWidth: 150,
  },
  checkboxCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  miniItemText: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
  },
  challengeCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  challengeDesc: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 10,
  },
  challengeReward: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  challengeProgress: {
    fontSize: 14,
    color: '#64748B',
  },
  motivationCard: {
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 12,
  },
  motivationText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontStyle: 'italic',
    lineHeight: 20,
    textAlign: 'center',
  },
  recommendationList: {
    gap: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recommendationIcon: {
    fontSize: 20,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  recommendationText: {
    fontSize: 14,
    color: '#64748B',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  analyticsItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  uploadsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  uploadCard: {
    width: 120,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    textAlign: 'center',
  },
  uploadDate: {
    fontSize: 11,
    color: '#64748B',
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 20,
    fontVariant: ['tabular-nums'],
  },
  timerButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
  },
  timerButtonActive: {
    backgroundColor: '#EF4444',
  },
  timerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timerHint: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    backgroundColor: 'transparent',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 3,
    opacity: 0.6,
  },
  navIconActive: {
    fontSize: 20,
    marginBottom: 3,
  },
  navLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  navLabelActive: {
    fontSize: 10,
    color: '#6366F1',
    fontWeight: '600',
  },
});

export default HomeScreen;
