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
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthProvider';
import { getUserProfile, getTicklistsForUser, upsertTicklist } from '../supabaseConfig';
import { ExploreScreenNavigationProp } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { getCachedTicklists, setCachedTicklists } from '../services/cacheService';
import supabase from '../supabaseClient';
import { getExamSchedule, ExamEvent } from '../services/scheduleService';

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
    semester?: string;
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
    const [upcomingExams, setUpcomingExams] = useState<ExamEvent[]>([]);
    const [examsLoading, setExamsLoading] = useState(true);

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
                // Cache-first for ticklists
                const cached = await getCachedTicklists();
                if (cached && cached.length > 0) {
                    setSubjects(cached);
                }

                const lists = await getTicklistsForUser(supabaseUser.id);
                const loadedSubjects: Subject[] = (lists || []).map((r: any) => ({
                    id: r.id,
                    name: r.subject_name,
                    code: r.code,
                    color: r.color,
                    items: r.items || [],
                }));
                setSubjects(loadedSubjects);
                await setCachedTicklists(loadedSubjects);
            } catch (err) {
                console.error('Error loading ticklist:', err);
            }
        })();
    }, [supabaseUser]);

    // Load upcoming exams — filtered by user's semester + branch when available
    useEffect(() => {
        (async () => {
            try {
                const sem = userData?.semester ?? '';
                const branch = userData?.branch ?? '';
                const data = await getExamSchedule(
                    sem ? { semester: sem, branch } : undefined
                );
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const upcoming = data
                    .filter(e => {
                        const d = new Date(e.date);
                        d.setHours(0, 0, 0, 0);
                        return d >= today;
                    })
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 4);
                setUpcomingExams(upcoming);
            } catch (err) {
                // Backend offline — silent
            } finally {
                setExamsLoading(false);
            }
        })();
    }, [userData]);

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
    const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/XXXXXXXXXX'; // TODO: Replace with actual group link

    const toolCards = [
        { key: 'MediaTools', label: 'Media Tools', icon: '⬡', desc: 'Video, Audio, Image & PDF', color: '#F43F5E' },
        { key: 'Ticklist', label: 'Study Checklist', icon: '☐', desc: 'Track your study progress', color: '#FB923C' },
        { key: 'Flashcards', label: 'AI Flashcards', icon: '🃏', desc: 'Generate flashcards by topic', color: '#8B5CF6' },
        { key: 'CodingHub', label: 'Coding Hub', icon: '⟨/⟩', desc: 'Practice coding problems', color: '#34D399' },
        { key: 'WhatsApp', label: 'WhatsApp Group', icon: '💬', desc: 'Join our student community', color: '#25D366' },
        { key: 'GPACalculator', label: 'GPA Calculator', icon: '∑', desc: 'Calculate SGPA & CGPA', color: '#A78BFA' },
        { key: 'Schedule', label: 'Schedule', icon: '▦', desc: 'View exam schedule', color: '#60A5FA' },
        { key: 'LearningZone', label: 'Learning Zone', icon: '◇', desc: 'Topic quizzes & games', color: '#F472B6' },
        { key: 'Library', label: 'Library', icon: '▤', desc: 'Notes & bookmarks', color: '#38BDF8' },
        { key: 'SyllabusViewer', label: 'Syllabus', icon: '≡', desc: 'Browse KTU syllabus', color: '#4ADE80' },
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
                {/* Upcoming Exams Card */}
                <View style={[styles.dashboardCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                    <View style={styles.dashboardHeader}>
                        <Text style={[styles.dashboardTitle, { color: theme.text }]}>Upcoming Exams</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
                            <Text style={[styles.viewAllText, { color: theme.primary }]}>View All →</Text>
                        </TouchableOpacity>
                    </View>

                    {examsLoading ? (
                        <View style={{ paddingVertical: 12 }}>
                            {[0, 1, 2].map(i => (
                                <View key={i} style={[styles.examSkeletonRow, { backgroundColor: theme.divider }]} />
                            ))}
                        </View>
                    ) : upcomingExams.length === 0 ? (
                        // Always show a card even when empty — with today's date
                        <View style={[styles.calCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                            <View style={[styles.calDateBox, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '30' }]}>
                                <Text style={[styles.calWeekday, { color: theme.primary + 'CC' }]}>
                                    {new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                                </Text>
                                <Text style={[styles.calDay, { color: theme.primary }]}>
                                    {new Date().getDate()}
                                </Text>
                                <Text style={[styles.calMon, { color: theme.primary + 'CC' }]}>
                                    {new Date().toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.calInfo}>
                                <Text style={[styles.calTitle, { color: theme.textSecondary }]}>
                                    No upcoming exams
                                </Text>
                                <Text style={[styles.calDesc, { color: theme.textTertiary }]}>
                                    {userData?.semester
                                        ? `Nothing scheduled for ${userData.semester} yet`
                                        : 'Set your semester in Profile for tailored results'}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        upcomingExams.map((exam, i) => {
                            const d = new Date(exam.date);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            d.setHours(0, 0, 0, 0);
                            const daysLeft = Math.round((d.getTime() - today.getTime()) / 86400000);
                            const day = d.getDate();
                            const mon = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                            const weekday = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                            const typeColors: Record<string, string> = {
                                exam: '#EF4444', holiday: '#10B981',
                                deadline: '#F59E0B', event: '#3B82F6',
                            };
                            const color = typeColors[exam.type] ?? '#8B5CF6';
                            const isUrgent = daysLeft <= 3 && exam.type === 'exam';
                            const isLast = i === upcomingExams.length - 1;
                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={[
                                        styles.calCard,
                                        { backgroundColor: theme.background, borderColor: isUrgent ? color + '60' : theme.border },
                                        !isLast && { marginBottom: 8 },
                                    ]}
                                    onPress={() => navigation.navigate('Schedule')}
                                    activeOpacity={0.7}
                                >
                                    {/* Left — Date Box */}
                                    <View style={[styles.calDateBox, { backgroundColor: color + '18', borderColor: color + '30' }]}>
                                        <Text style={[styles.calWeekday, { color: color + 'CC' }]}>{weekday}</Text>
                                        <Text style={[styles.calDay, { color }]}>{day}</Text>
                                        <Text style={[styles.calMon, { color: color + 'CC' }]}>{mon}</Text>
                                    </View>

                                    {/* Right — Info */}
                                    <View style={styles.calInfo}>
                                        <Text style={[styles.calTitle, { color: theme.text }]} numberOfLines={2}>
                                            {exam.title}
                                        </Text>
                                        <View style={styles.calMeta}>
                                            {exam.subject_code ? (
                                                <View style={[styles.calSubjectChip, { backgroundColor: color + '14', borderColor: color + '30' }]}>
                                                    <Text style={[styles.calSubjectText, { color }]}>{exam.subject_code}</Text>
                                                </View>
                                            ) : null}
                                            {exam.description ? (
                                                <Text style={[styles.calDesc, { color: theme.textSecondary }]} numberOfLines={1}>
                                                    {exam.description}
                                                </Text>
                                            ) : null}
                                        </View>
                                    </View>

                                    {/* Right edge — days left */}
                                    <View style={styles.calRight}>
                                        {daysLeft === 0 ? (
                                            <Text style={[styles.calDaysNum, { color }]}>Today</Text>
                                        ) : daysLeft === 1 ? (
                                            <Text style={[styles.calDaysNum, { color }]}>Tomorrow</Text>
                                        ) : (
                                            <>
                                                <Text style={[styles.calDaysNum, { color: isUrgent ? color : theme.textSecondary }]}>
                                                    {daysLeft}
                                                </Text>
                                                <Text style={[styles.calDaysLabel, { color: theme.textTertiary }]}>days</Text>
                                            </>
                                        )}
                                        <View style={[styles.calTypeDot, { backgroundColor: color }]} />
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>

                {/* Tools Grid */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Tools & Features</Text>
                <View style={styles.toolsGrid}>
                    {toolCards.map((tool) => (
                        <TouchableOpacity
                            key={tool.key}
                            style={[styles.toolCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                            onPress={() => {
                                if (tool.key === 'WhatsApp') {
                                    Linking.openURL(WHATSAPP_GROUP_LINK);
                                } else {
                                    navigation.navigate(tool.key as any);
                                }
                            }}
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
    subjectMeta: { fontSize: 11 },
    // Upcoming Exams skeleton / empty
    examSkeletonRow: { height: 64, borderRadius: 12, marginBottom: 8 },
    emptyExams: { alignItems: 'center', paddingVertical: 20 },
    emptyExamsIcon: { fontSize: 36, marginBottom: 8 },
    emptyExamsText: { fontSize: 13, textAlign: 'center' },
    // Calendar-style exam card
    calCard: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 14, borderWidth: 1,
        padding: 12, overflow: 'hidden',
    },
    calDateBox: {
        width: 56, alignItems: 'center', justifyContent: 'center',
        paddingVertical: 8, borderRadius: 10, borderWidth: 1, marginRight: 12,
    },
    calWeekday: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginBottom: 1 },
    calDay: { fontSize: 24, fontWeight: '800', lineHeight: 28 },
    calMon: { fontSize: 10, fontWeight: '600', marginTop: 1 },
    calInfo: { flex: 1, marginRight: 8 },
    calTitle: { fontSize: 14, fontWeight: '600', marginBottom: 5, lineHeight: 19 },
    calMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    calSubjectChip: {
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 6, borderWidth: 1,
    },
    calSubjectText: { fontSize: 11, fontWeight: '700' },
    calDesc: { fontSize: 11, flex: 1 },
    calRight: { alignItems: 'center', minWidth: 44 },
    calDaysNum: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
    calDaysLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    calTypeDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
    // Keep old refs in case used elsewhere
    examRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, gap: 12 },
    examDate: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    examDay: { fontSize: 16, fontWeight: '800' },
    examMon: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
    examInfo: { flex: 1 },
    examTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
    examDesc: { fontSize: 11 },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    typeBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
});

export default ExploreScreen;
