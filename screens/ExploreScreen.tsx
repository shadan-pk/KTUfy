import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
    Platform,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthProvider';
import { getUserProfile, getTicklistsForUser, upsertTicklist } from '../supabaseConfig';
import { ExploreScreenNavigationProp } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface ExploreScreenProps {
    navigation: ExploreScreenNavigationProp;
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

const ExploreScreen: React.FC<ExploreScreenProps> = ({ navigation }) => {
    const { theme, isDark } = useTheme();
    const { user: authUser } = useAuth();
    const [supabaseUser, setSupabaseUser] = useState<any | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [studyStreak] = useState(7);

    const loadUserData = React.useCallback(async () => {
        if (!authUser) return;
        try {
            setSupabaseUser(authUser);
            const profile = await getUserProfile(authUser.id);
            if (profile) setUserData(profile as UserData);
        } catch (err) {
            console.error('Error loading user profile:', err);
        }
    }, [authUser]);

    useEffect(() => {
        loadUserData();
        const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timeInterval);
    }, [loadUserData]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => loadUserData());
        return unsubscribe;
    }, [navigation, loadUserData]);

    useEffect(() => {
        (async () => {
            if (!supabaseUser) return;
            try {
                const lists = await getTicklistsForUser(supabaseUser.id);
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

    const getSubjectProgress = (subject: Subject) => {
        const completed = subject.items.filter(item => item.completed).length;
        const total = subject.items.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { completed, total, percentage };
    };

    const getTotalProgress = () => {
        const totalItems = subjects.reduce((sum, s) => sum + s.items.length, 0);
        const completedItems = subjects.reduce(
            (sum, s) => sum + s.items.filter(i => i.completed).length,
            0
        );
        const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        return { completed: completedItems, total: totalItems, percentage };
    };

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
            setSubjects(prev =>
                prev.map(s => (s.id === subjectId ? { ...s, items: updatedItems } : s))
            );
        } catch (error) {
            console.error('Error toggling item:', error);
        }
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const totalProgress = getTotalProgress();

    // Tool cards data
    const toolCards = [
        { key: 'Chatbot', label: 'AI Assistant', icon: '◎', desc: 'Ask anything about your studies', color: '#2563EB' },
        { key: 'CodingHub', label: 'Coding Hub', icon: '⟨/⟩', desc: 'Practice coding problems', color: '#34D399' },
        { key: 'GroupStudy', label: 'Group Study', icon: '⊕', desc: 'Join or create study groups', color: '#FBBF24' },
        { key: 'GPACalculator', label: 'GPA Calculator', icon: '∑', desc: 'Calculate SGPA & CGPA', color: '#A78BFA' },
        { key: 'Schedule', label: 'Schedule', icon: '▦', desc: 'View your class schedule', color: '#60A5FA' },
        { key: 'LearningZone', label: 'Learning Zone', icon: '◇', desc: 'Quizzes and challenges', color: '#F472B6' },
        { key: 'Library', label: 'Library', icon: '▤', desc: 'Study materials & uploads', color: '#38BDF8' },
        { key: 'Ticklist', label: 'Study Checklist', icon: '☐', desc: 'Track your study progress', color: '#FB923C' },
        { key: 'SyllabusViewer', label: 'Syllabus', icon: '≡', desc: 'Browse KTU syllabus', color: '#4ADE80' },
        { key: 'PYP', label: 'Previous Papers', icon: '⊞', desc: 'Past year question papers', color: '#E879F9' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />

            {/* Header */}
            <SafeAreaView edges={['top']} style={[styles.headerSafe, { backgroundColor: theme.background }]}>
                <View style={[styles.header, { borderBottomColor: theme.divider }]}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={[styles.greetingText, { color: theme.textSecondary }]}>{getGreeting()}</Text>
                        <Text style={[styles.userName, { color: theme.text }]}>
                            {userData?.name || authUser?.email || 'Student'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.profileButton, { borderColor: theme.border }]}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Text style={[styles.profileIcon, { color: theme.primary }]}>○</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Study Dashboard Card */}
                <View style={[styles.dashboardCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                    <View style={styles.dashboardHeader}>
                        <Text style={[styles.dashboardTitle, { color: theme.text }]}>Study Dashboard</Text>
                        <View style={[styles.streakBadge, { backgroundColor: theme.warning + '1F' }]}>
                            <Text style={[styles.streakText, { color: theme.warning }]}>🔥 {studyStreak}d streak</Text>
                        </View>
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
                            <Text style={[styles.statValue, { color: theme.text }]}>--</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Days to Exam</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.text }]}>{totalProgress.completed}/{totalProgress.total}</Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Completed</Text>
                        </View>
                    </View>
                </View>

                {/* Tools Grid */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Tools & Features</Text>
                <View style={styles.toolsGrid}>
                    {toolCards.map((tool) => (
                        <TouchableOpacity
                            key={tool.key}
                            style={[styles.toolCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                            onPress={() => navigation.navigate(tool.key as any)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.toolIconContainer, { backgroundColor: tool.color + '18' }]}>
                                <Text style={[styles.toolIcon, { color: tool.color }]}>{tool.icon}</Text>
                            </View>
                            <Text style={[styles.toolLabel, { color: theme.text }]}>{tool.label}</Text>
                            <Text style={[styles.toolDesc, { color: theme.textSecondary }]} numberOfLines={1}>{tool.desc}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Subject Progress */}
                {subjects.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Subject Progress</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Ticklist')}>
                                <Text style={[styles.viewAllText, { color: theme.primary }]}>View All →</Text>
                            </TouchableOpacity>
                        </View>
                        {subjects.slice(0, 3).map(subject => {
                            const progress = getSubjectProgress(subject);
                            return (
                                <View key={subject.id} style={[styles.subjectCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                                    <View style={styles.subjectHeader}>
                                        <Text style={[styles.subjectName, { color: theme.text }]}>{subject.name}</Text>
                                        <Text style={[styles.subjectPercent, { color: theme.primary }]}>{progress.percentage}%</Text>
                                    </View>
                                    <View style={[styles.subjectProgressBar, { backgroundColor: theme.divider }]}>
                                        <View
                                            style={[
                                                styles.subjectProgressFill,
                                                { width: `${progress.percentage}%`, backgroundColor: subject.color },
                                            ]}
                                        />
                                    </View>
                                    <Text style={[styles.subjectMeta, { color: theme.textTertiary }]}>
                                        {progress.completed} of {progress.total} topics completed
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                )}

                <View style={{ height: 32 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // Header
    headerSafe: {
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
    backIcon: {
        fontSize: 22,
        fontWeight: '500',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 8,
    },
    greetingText: {
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 1,
    },
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileIcon: {
        fontSize: 20,
    },
    // ScrollView
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    // Dashboard Card
    dashboardCard: {
        borderRadius: 16,
        padding: 18,
        marginBottom: 20,
        borderWidth: 1,
    },
    dashboardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    dashboardTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    streakBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    streakText: {
        fontSize: 12,
        fontWeight: '600',
    },
    progressContainer: {
        marginBottom: 16,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 13,
    },
    progressPercent: {
        fontSize: 14,
        fontWeight: '700',
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
    },
    // Section
    sectionContainer: {
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 12,
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '600',
    },
    // Tools Grid
    toolsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 24,
    },
    toolCard: {
        width: (width - 42) / 2,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
    },
    toolIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    toolIcon: {
        fontSize: 20,
        fontWeight: '700',
    },
    toolLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 3,
    },
    toolDesc: {
        fontSize: 11,
        lineHeight: 15,
    },
    // Subject Cards
    subjectCard: {
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
    },
    subjectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    subjectName: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    subjectPercent: {
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 8,
    },
    subjectProgressBar: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 6,
    },
    subjectProgressFill: {
        height: '100%',
        borderRadius: 2,
    },
    subjectMeta: {
        fontSize: 11,
    },
});

export default ExploreScreen;
