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
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { HomeScreenNavigationProp } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';

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

interface Challenge {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  points: number;
  emoji: string;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [studyStreak, setStudyStreak] = useState(7);
  const [focusTime, setFocusTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [dailyChallenges, setDailyChallenges] = useState<Challenge[]>([
    {
      id: '1',
      title: 'Complete 5 Tasks',
      description: 'Check off 5 items from your ticklist',
      targetCount: 5,
      currentCount: 0,
      points: 50,
      emoji: '✅'
    },
    {
      id: '2',
      title: 'Focus Session',
      description: 'Study for 25 minutes without breaks',
      targetCount: 25,
      currentCount: 0,
      points: 30,
      emoji: '🎯'
    },
    {
      id: '3',
      title: 'Early Bird',
      description: 'Study before 9 AM',
      targetCount: 1,
      currentCount: 0,
      points: 20,
      emoji: '🌅'
    }
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    });

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      unsubscribe();
      clearInterval(timeInterval);
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => {
        setFocusTime(prev => {
          const newTime = prev + 1;
          // Update focus challenge progress (convert seconds to minutes)
          const focusMinutes = Math.floor(newTime / 60);
          setDailyChallenges(challenges => challenges.map(challenge => {
            if (challenge.id === '2') {
              return { ...challenge, currentCount: focusMinutes };
            }
            return challenge;
          }));
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Load ticklist subjects from Firestore
  useEffect(() => {
    if (!user) return;

    const subjectsRef = collection(db, 'users', user.uid, 'ticklist');
    const unsubscribe = onSnapshot(
      subjectsRef,
      (snapshot) => {
        const loadedSubjects: Subject[] = [];
        snapshot.forEach((doc) => {
          loadedSubjects.push({ id: doc.id, ...doc.data() } as Subject);
        });
        setSubjects(loadedSubjects);
        
        // Update challenge progress based on completed tasks
        const totalCompleted = getTotalProgress().completed;
        setDailyChallenges(prev => prev.map(challenge => {
          if (challenge.id === '1') {
            return { ...challenge, currentCount: totalCompleted };
          }
          return challenge;
        }));
      },
      (error) => {
        console.error('Error loading ticklist:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const toggleItem = async (subjectId: string, itemId: string) => {
    if (!user) return;

    try {
      const subject = subjects.find(s => s.id === subjectId);
      if (!subject) return;

      const updatedItems = subject.items.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );

      await updateDoc(doc(db, 'users', user.uid, 'ticklist', subjectId), {
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

  const claimChallengeReward = (challengeId: string) => {
    setDailyChallenges(prev => prev.map(challenge => {
      if (challenge.id === challengeId && challenge.currentCount >= challenge.targetCount) {
        setTotalPoints(points => points + challenge.points);
        // Mark as claimed by setting currentCount to 0
        return { ...challenge, currentCount: 0 };
      }
      return challenge;
    }));
  };

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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      <ScrollView style={[styles.scrollView, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>{getGreeting()}</Text>
            <Text style={[styles.userName, { color: theme.text }]}>{userData?.name || user?.displayName || 'Student'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.profileButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileButtonText}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Smart Study Dashboard */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>📊 Study Dashboard</Text>
            <Text style={[styles.streakBadge, { backgroundColor: theme.warning + '20', color: theme.warning }]}>🔥 {studyStreak} day streak</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressInfo}>
              <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>Syllabus Completion</Text>
              <Text style={[styles.progressPercent, { color: theme.primary }]}>{totalProgress.percentage}%</Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: theme.divider }]}>
              <View style={[styles.progressFill, { width: `${totalProgress.percentage}%`, backgroundColor: theme.primary }]} />
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{subjects.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Subjects</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.examCountdown, { color: theme.text }]}>--</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Days to Exam</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{totalProgress.completed}/{totalProgress.total}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Completed</Text>
            </View>
          </View>
        </View>

        {/* AI Assistant Widget */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>🤖 AI Study Assistant</Text>
          </View>
          <TouchableOpacity
            style={[styles.aiButton, { backgroundColor: theme.aiAssistant }]}
            onPress={() => navigation.navigate('Chatbot')}
          >
            <View style={styles.aiButtonContent}>
              <Text style={styles.aiButtonText}>💬 Ask anything about your studies</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Coding Hub Widget */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>💻 Coding Hub</Text>
            <Text style={[styles.codingBadge, { backgroundColor: theme.success + '20', color: theme.success }]}>Practice</Text>
          </View>
          <TouchableOpacity
            style={[styles.codingButton, { backgroundColor: theme.codingHub }]}
            onPress={() => navigation.navigate('CodingHub')}
          >
            <View style={styles.codingButtonContent}>
              <Text style={styles.codingButtonText}>🚀 Start Coding Practice</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.codingStats}>
            <View style={styles.codingStatItem}>
              <Text style={[styles.codingStatLabel, { color: theme.textSecondary }]}>8 Problems</Text>
            </View>
            <View style={styles.codingStatItem}>
              <Text style={[styles.codingStatLabel, { color: theme.textSecondary }]}>4 Languages</Text>
            </View>
            <View style={styles.codingStatItem}>
              <Text style={[styles.codingStatLabel, { color: theme.textSecondary }]}>Track Progress</Text>
            </View>
          </View>
        </View>

        {/* Group Study Widget */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>👥 Group Study</Text>
            <TouchableOpacity onPress={() => navigation.navigate('GroupStudy')}>
              <Text style={[styles.viewAllText, { color: theme.primary }]}>View All →</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.groupStudyButton, { backgroundColor: theme.groupStudy }]}
            onPress={() => navigation.navigate('GroupStudy')}
          >
            <View style={styles.groupStudyContent}>
              <Text style={styles.groupStudyText}>📚 Join or Create Study Groups</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.groupFeatures}>
            <View style={styles.groupFeatureItem}>
              <Text style={[styles.groupFeatureText, { color: theme.textSecondary }]}>💬 Group Chat</Text>
            </View>
            <View style={styles.groupFeatureItem}>
              <Text style={[styles.groupFeatureText, { color: theme.textSecondary }]}>✅ Shared Checklist</Text>
            </View>
            <View style={styles.groupFeatureItem}>
              <Text style={[styles.groupFeatureText, { color: theme.textSecondary }]}>🔗 Invite Links</Text>
            </View>
          </View>
        </View>

        {/* SGPA & CGPA Calculator */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>🎓 GPA Calculator</Text>
            <TouchableOpacity onPress={() => navigation.navigate('GPACalculator')}>
              <Text style={[styles.viewAllText, { color: theme.primary }]}>View All →</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={[styles.gpaButton, { backgroundColor: theme.gpaCalculator }]}
            onPress={() => navigation.navigate('GPACalculator')}
          >
            <View style={styles.gpaContent}>
              <Text style={styles.gpaText}>📊 Calculate SGPA & CGPA</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.gpaFeatures}>
            <View style={styles.gpaFeatureItem}>
              <Text style={[styles.gpaFeatureText, { color: theme.textSecondary }]}>📈 SGPA</Text>
            </View>
            <View style={styles.gpaFeatureItem}>
              <Text style={[styles.gpaFeatureText, { color: theme.textSecondary }]}>📊 CGPA</Text>
            </View>
            <View style={styles.gpaFeatureItem}>
              <Text style={[styles.gpaFeatureText, { color: theme.textSecondary }]}>🎯 Results</Text>
            </View>
          </View>
        </View>

        {/* Tomorrow's Schedule */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>📅 Tomorrow's Classes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
              <Text style={[styles.viewAllText, { color: theme.primary }]}>View All →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.scheduleList}>
            <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>No classes scheduled</Text>
          </View>
        </View>

        {/* Subject Progress */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>📖 Subject Progress</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Ticklist')}>
              <Text style={[styles.viewAllText, { color: theme.primary }]}>View All →</Text>
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
                      <Text style={[styles.subjectName, { color: theme.text }]}>{subject.name}</Text>
                      <Text style={[styles.subjectPercent, { color: theme.primary }]}>{progress.percentage}%</Text>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: theme.divider }]}>
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
                              { borderColor: theme.border },
                              item.completed && { backgroundColor: subject.color }
                            ]}>
                              {item.completed && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={[styles.miniItemText, { color: theme.textSecondary }]} numberOfLines={1}>
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
            <Text style={styles.pointsBadge}>⭐ {totalPoints} pts</Text>
          </View>
          
          {dailyChallenges.slice(0, 2).map((challenge) => {
            const isCompleted = challenge.currentCount >= challenge.targetCount;
            const progress = Math.min((challenge.currentCount / challenge.targetCount) * 100, 100);
            
            return (
              <View key={challenge.id} style={styles.challengeCard}>
                <View style={styles.challengeHeader}>
                  <Text style={styles.challengeEmoji}>{challenge.emoji}</Text>
                  <View style={styles.challengeInfo}>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                    <Text style={styles.challengeDesc}>{challenge.description}</Text>
                  </View>
                </View>
                
                <View style={styles.challengeProgressBar}>
                  <View style={[styles.challengeProgressFill, { width: `${progress}%` }]} />
                </View>
                
                <View style={styles.challengeFooter}>
                  <Text style={styles.challengeProgress}>
                    {challenge.currentCount}/{challenge.targetCount}
                  </Text>
                  {isCompleted ? (
                    <TouchableOpacity 
                      style={styles.claimButton}
                      onPress={() => claimChallengeReward(challenge.id)}
                    >
                      <Text style={styles.claimButtonText}>Claim +{challenge.points} pts</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.rewardText}>+{challenge.points} pts</Text>
                  )}
                </View>
              </View>
            );
          })}
          
          <TouchableOpacity 
            style={styles.playGamesButton}
            onPress={() => navigation.navigate('LearningZone')}
          >
            <Text style={styles.playGamesButtonText}>🎮 Play More Games</Text>
            <Text style={styles.playGamesButtonArrow}>→</Text>
          </TouchableOpacity>
          
          <View style={[styles.motivationCard, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}>
            <Text style={[styles.motivationText, { color: theme.text }]}>
              "Success is the sum of small efforts repeated day in and day out."
            </Text>
          </View>
        </View>

        {/* AI Recommendations */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>💡 Study Recommendations</Text>
          </View>
          <View style={styles.recommendationList}>
            <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>No recommendations available</Text>
          </View>
        </View>

        {/* Analytics Snapshot */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>📈 Analytics</Text>
          </View>
          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: theme.text }]}>0/0</Text>
              <Text style={[styles.analyticsLabel, { color: theme.textSecondary }]}>Topics</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: theme.text }]}>0%</Text>
              <Text style={[styles.analyticsLabel, { color: theme.textSecondary }]}>Quiz Accuracy</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: theme.success }]}>0%</Text>
              <Text style={[styles.analyticsLabel, { color: theme.textSecondary }]}>Improvement</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: theme.text }]}>0</Text>
              <Text style={[styles.analyticsLabel, { color: theme.textSecondary }]}>Study Sessions</Text>
            </View>
          </View>
        </View>

        {/* Recent Uploads */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>📄 Recent Uploads</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Library')}>
              <Text style={[styles.viewAllText, { color: theme.primary }]}>View All →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.uploadsScroll}>
            <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>No recent uploads</Text>
          </View>
        </View>

        {/* Focus Mode Timer */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>⏱️ Focus Mode</Text>
          </View>
          <View style={styles.timerContainer}>
            <Text style={[styles.timerDisplay, { color: theme.text }]}>{formatTime(focusTime)}</Text>
            <TouchableOpacity
              style={[styles.timerButton, { backgroundColor: timerRunning ? theme.primary : theme.primaryLight }, timerRunning && { backgroundColor: theme.primary }]}
              onPress={() => setTimerRunning(!timerRunning)}
            >
              <Text style={[styles.timerButtonText, { color: timerRunning ? '#FFFFFF' : theme.primary }]}>
                {timerRunning ? '⏸ Pause' : '▶ Start Focus Session'}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.timerHint, { color: theme.textSecondary }]}>Stay focused and build your streak! 🎯</Text>
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={[styles.bottomNavContainer, { backgroundColor: theme.card, borderTopColor: theme.cardBorder }]}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navButton}>
            <Text style={styles.navIconActive}>🏠</Text>
            <Text style={[styles.navLabelActive, { color: theme.primary }]}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigation.navigate('Chatbot')}
          >
            <Text style={styles.navIcon}>🤖</Text>
            <Text style={[styles.navLabel, { color: theme.textSecondary }]}>Chatbot</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigation.navigate('Library')}
          >
            <Text style={styles.navIcon}>📚</Text>
            <Text style={[styles.navLabel, { color: theme.textSecondary }]}>Library</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.navIcon}>⚙️</Text>
            <Text style={[styles.navLabel, { color: theme.textSecondary }]}>Settings</Text>
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
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  aiButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  codingBadge: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  codingButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  codingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codingButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  codingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  codingStatItem: {
    alignItems: 'center',
  },
  codingStatLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  groupStudyButton: {
    backgroundColor: '#F59E0B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  groupStudyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupStudyText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  groupFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  groupFeatureItem: {
    alignItems: 'center',
  },
  groupFeatureText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  gpaButton: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  gpaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpaText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  gpaFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  gpaFeatureItem: {
    alignItems: 'center',
  },
  gpaFeatureText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
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
  pointsBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
  },
  challengeCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  challengeDesc: {
    fontSize: 13,
    color: '#64748B',
  },
  challengeProgressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeReward: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  challengeProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  claimButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  playGamesButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  playGamesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  playGamesButtonArrow: {
    fontSize: 20,
    color: '#FFFFFF',
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
