import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    FlatList,
    Animated,
    PanResponder,
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

const TYPE_COLORS: Record<string, string> = {
    exam: '#EF4444', holiday: '#10B981',
    deadline: '#F59E0B', event: '#3B82F6',
};

// ── UpcomingExamWidget ─────────────────────────────────────────
const UpcomingExamWidget = ({ groups, theme, styles, onPress }: {
    groups: { date: string; events: any[] }[];
    theme: any; styles: any;
    onPress: () => void;
}) => {
    const [dayIdx, setDayIdx] = useState(0);
    const [eventIdx, setEventIdx] = useState(0);
    const [listWidth, setListWidth] = useState(0);
    const flatRef = useRef<FlatList>(null);
    const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const isPaused = useRef(false);
    const touchX = useRef(0);

    const group = groups[dayIdx];

    // Reset eventIdx when day changes
    useEffect(() => {
        setEventIdx(0);
        flatRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, [dayIdx]);

    // Auto-cycle events within the same day every 3s
    useEffect(() => {
        if (autoTimer.current) clearInterval(autoTimer.current);
        if (!group || group.events.length <= 1) return;
        autoTimer.current = setInterval(() => {
            if (isPaused.current) return;
            setEventIdx(prev => {
                const next = (prev + 1) % group.events.length;
                flatRef.current?.scrollToIndex({ index: next, animated: true });
                return next;
            });
        }, 3000);
        return () => { if (autoTimer.current) clearInterval(autoTimer.current); };
    }, [dayIdx, group]);

    if (!group) return null;

    const d = new Date(group.date + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0); d.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((d.getTime() - today.getTime()) / 86400000);
    const day = d.getDate();
    const mon = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const exam = group.events[eventIdx];
    const color = TYPE_COLORS[exam?.type] ?? '#8B5CF6';
    const canUp = dayIdx > 0;
    const canDown = dayIdx < groups.length - 1;

    const handleHSwipe = (dx: number) => {
        if (group.events.length <= 1) return;
        isPaused.current = true;
        setTimeout(() => { isPaused.current = false; }, 5000);
        const next = dx < 0
            ? (eventIdx + 1) % group.events.length
            : (eventIdx - 1 + group.events.length) % group.events.length;
        flatRef.current?.scrollToIndex({ index: next, animated: true });
        setEventIdx(next);
    };

    return (
        <View style={{ flexDirection: 'column' }}>
            <TouchableOpacity
                style={[styles.calCard, { backgroundColor: theme.background, borderColor: color + '40', borderWidth: 1.5 }]}
                activeOpacity={0.9}
                onPress={onPress}
            >
                {/* Date box */}
                <View style={[styles.calDateBox, { backgroundColor: color + '18', borderColor: color + '30' }]}>
                    <Text style={[styles.calWeekday, { color }]}>{weekday}</Text>
                    <Text style={[styles.calDay, { color }]}>{day}</Text>
                    <Text style={[styles.calMon, { color }]}>{mon}</Text>
                </View>

                {/* Event carousel + swipe responder */}
                <View style={{ flex: 1 }}
                    onStartShouldSetResponder={() => group.events.length > 1}
                    onMoveShouldSetResponder={() => group.events.length > 1}
                    onResponderGrant={e => { touchX.current = e.nativeEvent.pageX; }}
                    onResponderRelease={e => {
                        const dx = e.nativeEvent.pageX - touchX.current;
                        if (Math.abs(dx) > 20) handleHSwipe(dx);
                    }}
                >
                    <View style={{ flex: 1, overflow: 'hidden' }} onLayout={e => setListWidth(e.nativeEvent.layout.width)}>
                        {listWidth > 0 && (
                            <FlatList
                                ref={flatRef}
                                data={group.events}
                                horizontal pagingEnabled scrollEnabled={false}
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(_, i) => String(i)}
                                getItemLayout={(_, i) => ({ length: listWidth, offset: listWidth * i, index: i })}
                                renderItem={({ item: ev }) => {
                                    const c = TYPE_COLORS[ev.type] ?? '#8B5CF6';
                                    return (
                                        <View style={{
                                            width: listWidth, justifyContent: 'center',
                                            borderLeftWidth: 3, borderLeftColor: c,
                                            paddingLeft: 10, paddingRight: 4, paddingVertical: 4,
                                        }}>
                                            <Text style={[styles.calTitle, { color: theme.text }]} numberOfLines={2}>{ev.title}</Text>
                                            <View style={styles.calMeta}>
                                                {ev.subject_code ? (
                                                    <View style={[styles.calSubjectChip, { backgroundColor: c + '14', borderColor: c + '30' }]}>
                                                        <Text style={[styles.calSubjectText, { color: c }]}>{ev.subject_code}</Text>
                                                    </View>
                                                ) : null}
                                                {ev.description ? (
                                                    <Text style={[styles.calDesc, { color: theme.textSecondary }]} numberOfLines={1}>{ev.description}</Text>
                                                ) : null}
                                            </View>
                                        </View>
                                    );
                                }}
                            />
                        )}
                    </View>
                </View>

                {/* Right column: days left + ▲/▼ nav */}
                <View style={[styles.calRight, { gap: 4, alignItems: 'center' }]}>
                    {daysLeft === 0 ? (
                        <Text style={[styles.calDaysNum, { color, fontSize: 11 }]}>Today</Text>
                    ) : daysLeft === 1 ? (
                        <Text style={[styles.calDaysNum, { color, fontSize: 11 }]}>Tomorrow</Text>
                    ) : (
                        <>
                            <Text style={[styles.calDaysNum, { color: theme.textSecondary }]}>{daysLeft}</Text>
                            <Text style={[styles.calDaysLabel, { color: theme.textTertiary }]}>days</Text>
                        </>
                    )}
                    {groups.length > 1 && (
                        <View style={{ alignItems: 'center', gap: 2, marginTop: 4 }}>
                            <TouchableOpacity onPress={() => setDayIdx(i => Math.max(0, i - 1))} hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }} disabled={!canUp}>
                                <Text style={{ fontSize: 12, color: canUp ? color : theme.divider, lineHeight: 14 }}>▲</Text>
                            </TouchableOpacity>
                            {groups.map((_, di) => (
                                <View key={di} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: di === dayIdx ? color : theme.divider, opacity: di === dayIdx ? 1 : 0.4 }} />
                            ))}
                            <TouchableOpacity onPress={() => setDayIdx(i => Math.min(groups.length - 1, i + 1))} hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }} disabled={!canDown}>
                                <Text style={{ fontSize: 12, color: canDown ? color : theme.divider, lineHeight: 14 }}>▼</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={[styles.calTypeDot, { backgroundColor: color }]} />
                </View>
            </TouchableOpacity>

            {/* Dot indicators — BELOW the entire card, centred, never moves with slides */}
            {group.events.length > 1 && (
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 8 }}>
                    {group.events.map((_: any, di: number) => (
                        <View key={di} style={{
                            width: di === eventIdx ? 16 : 6, height: 5, borderRadius: 3,
                            backgroundColor: di === eventIdx ? color : theme.divider,
                        }} />
                    ))}
                </View>
            )}
        </View>
    );
};


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
                    // forceRefresh so widget never shows stale cache
                    { semester: sem || undefined, branch: branch || undefined, forceRefresh: true }
                );
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const upcoming = data
                    .filter(e => {
                        const d = new Date(e.date + 'T00:00:00');
                        d.setHours(0, 0, 0, 0);
                        return d >= today;
                    })
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                // Priority: if any exam is within 30 days, only show exams.
                // Otherwise show all event types.
                const hasNearExam = upcoming.some(e => {
                    const dLeft = Math.round(
                        (new Date(e.date + 'T00:00:00').setHours(0, 0, 0, 0) - today.getTime()) / 86400000
                    );
                    return e.type === 'exam' && dLeft <= 30;
                });
                const filtered = hasNearExam
                    ? upcoming.filter(e => e.type === 'exam')
                    : upcoming;

                setUpcomingExams(filtered.slice(0, 8));
            } catch (err) {
                // silent
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
                    ) : (() => {
                        // Group events by date
                        const grouped: { date: string; events: typeof upcomingExams }[] = [];
                        upcomingExams.forEach(exam => {
                            const existing = grouped.find(g => g.date === exam.date);
                            if (existing) existing.events.push(exam);
                            else grouped.push({ date: exam.date, events: [exam] });
                        });
                        return (
                            <UpcomingExamWidget
                                groups={grouped.slice(0, 5)}
                                theme={theme}
                                styles={styles}
                                onPress={() => navigation.navigate('Schedule')}
                            />
                        );
                    })()}
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
