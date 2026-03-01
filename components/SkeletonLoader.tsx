/**
 * SkeletonLoader.tsx
 * Reusable animated shimmer skeleton components for KTUfy.
 * Replaces ActivityIndicator across all screens.
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

// ─── Base animated shimmer hook ──────────────────────────────────────────────
function useShimmer() {
    const anim = useRef(new Animated.Value(0.4)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
            ])
        ).start();
        return () => anim.stopAnimation();
    }, []);
    return anim;
}

// ─── SkeletonBox — single shimmer block ───────────────────────────────────────
interface SkeletonBoxProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
    width: w = '100%',
    height = 16,
    borderRadius = 8,
    style,
}) => {
    const { theme } = useTheme();
    const opacity = useShimmer();
    const shimmerColor = theme.backgroundSecondary;

    return (
        <Animated.View
            style={[
                { width: w as any, height, borderRadius, backgroundColor: shimmerColor, opacity },
                style,
            ]}
        />
    );
};

// ─── SkeletonText — 1-3 stacked text lines ────────────────────────────────────
interface SkeletonTextProps {
    lines?: number;
    widths?: (number | string)[];
    style?: ViewStyle;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
    lines = 2,
    widths,
    style,
}) => {
    const defaultWidths = ['100%', '75%', '85%'];
    const lineWidths = widths ?? defaultWidths.slice(0, lines);
    return (
        <View style={style}>
            {lineWidths.map((w, i) => (
                <SkeletonBox key={i} width={w} height={14} borderRadius={6} style={{ marginBottom: i < lines - 1 ? 8 : 0 }} />
            ))}
        </View>
    );
};

// ─── Shared header skeleton row ───────────────────────────────────────────────
const HeaderSkeleton = () => (
    <View style={sk.headerRow}>
        <SkeletonBox width={40} height={40} borderRadius={10} />
        <View style={{ flex: 1, marginLeft: 12 }}>
            <SkeletonBox width="50%" height={12} borderRadius={5} style={{ marginBottom: 6 }} />
            <SkeletonBox width="70%" height={18} borderRadius={6} />
        </View>
        <SkeletonBox width={40} height={40} borderRadius={20} />
    </View>
);

// ─── ExploreScreenSkeleton ────────────────────────────────────────────────────
export const ExploreScreenSkeleton: React.FC = () => {
    const { theme } = useTheme();
    return (
        <View style={[sk.container, { backgroundColor: theme.background }]}>
            <HeaderSkeleton />
            {/* Dashboard card */}
            <View style={[sk.card, { backgroundColor: theme.backgroundSecondary }]}>
                <View style={sk.cardRow}>
                    <SkeletonBox width="50%" height={16} borderRadius={6} />
                    <SkeletonBox width={80} height={24} borderRadius={12} />
                </View>
                <SkeletonBox height={8} borderRadius={4} style={{ marginVertical: 12 }} />
                <View style={sk.statsRow}>
                    {[0, 1, 2].map(i => (
                        <View key={i} style={sk.statItem}>
                            <SkeletonBox width={40} height={28} borderRadius={6} style={{ marginBottom: 6 }} />
                            <SkeletonBox width={50} height={10} borderRadius={4} />
                        </View>
                    ))}
                </View>
            </View>
            {/* Tools grid */}
            <SkeletonBox width="40%" height={18} borderRadius={6} style={{ marginBottom: 14 }} />
            <View style={sk.grid}>
                {[0, 1, 2, 3, 4, 5].map(i => (
                    <View key={i} style={[sk.toolBox, { backgroundColor: theme.backgroundSecondary }]}>
                        <SkeletonBox width={40} height={40} borderRadius={12} style={{ marginBottom: 10 }} />
                        <SkeletonBox width="70%" height={14} borderRadius={5} style={{ marginBottom: 6 }} />
                        <SkeletonBox width="90%" height={10} borderRadius={4} />
                    </View>
                ))}
            </View>
        </View>
    );
};

// ─── HomeScreenSkeleton ───────────────────────────────────────────────────────
export const HomeScreenSkeleton: React.FC = () => {
    const { theme } = useTheme();
    return (
        <View style={[sk.container, { backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }]}>
            <SkeletonBox width={120} height={40} borderRadius={8} style={{ marginBottom: 12 }} />
            <SkeletonBox width="60%" height={12} borderRadius={5} style={{ marginBottom: 40 }} />
            <SkeletonBox width="100%" height={52} borderRadius={20} style={{ marginBottom: 14 }} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
                {['50%', '50%', '50%'].map((_, i) => (
                    <SkeletonBox key={i} width={90} height={34} borderRadius={16} />
                ))}
            </View>
        </View>
    );
};

// ─── ScheduleScreenSkeleton ───────────────────────────────────────────────────
export const ScheduleScreenSkeleton: React.FC = () => {
    const { theme } = useTheme();
    return (
        <View style={[sk.container, { backgroundColor: theme.background }]}>
            {/* Month chips */}
            <View style={sk.chipRow}>
                {[80, 90, 70, 85, 75].map((w, i) => (
                    <SkeletonBox key={i} width={w} height={36} borderRadius={8} />
                ))}
            </View>
            {/* Title */}
            <SkeletonBox width="40%" height={28} borderRadius={8} style={{ margin: 16, marginBottom: 6 }} />
            <SkeletonBox width="30%" height={12} borderRadius={5} style={{ marginLeft: 16, marginBottom: 16 }} />
            {/* Event cards */}
            {[0, 1, 2, 3, 4].map(i => (
                <View key={i} style={[sk.eventCard, { backgroundColor: theme.backgroundSecondary }]}>
                    <View style={sk.eventDate}>
                        <SkeletonBox width={36} height={30} borderRadius={6} style={{ marginBottom: 4 }} />
                        <SkeletonBox width={28} height={10} borderRadius={4} style={{ marginBottom: 3 }} />
                        <SkeletonBox width={24} height={10} borderRadius={4} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={sk.cardRow}>
                            <SkeletonBox width="60%" height={16} borderRadius={5} />
                            <SkeletonBox width={60} height={22} borderRadius={11} />
                        </View>
                        <SkeletonBox width="80%" height={12} borderRadius={5} style={{ marginTop: 8 }} />
                    </View>
                </View>
            ))}
        </View>
    );
};

// ─── LibraryScreenSkeleton ────────────────────────────────────────────────────
export const LibraryScreenSkeleton: React.FC = () => {
    const { theme } = useTheme();
    return (
        <View style={[sk.container, { backgroundColor: theme.background }]}>
            {/* Tab bar */}
            <View style={[sk.tabRow, { backgroundColor: theme.backgroundSecondary }]}>
                <SkeletonBox width="45%" height={36} borderRadius={6} />
                <SkeletonBox width="45%" height={36} borderRadius={6} />
            </View>
            {/* Note cards */}
            <View style={{ padding: 16 }}>
                {[0, 1, 2, 3].map(i => (
                    <View key={i} style={[sk.noteCard, { backgroundColor: theme.backgroundSecondary }]}>
                        <View style={sk.cardRow}>
                            <SkeletonBox width="55%" height={16} borderRadius={5} />
                            <SkeletonBox width={45} height={11} borderRadius={4} />
                        </View>
                        <SkeletonBox width="90%" height={12} borderRadius={5} style={{ marginTop: 8 }} />
                        <SkeletonBox width="70%" height={12} borderRadius={5} style={{ marginTop: 6 }} />
                    </View>
                ))}
            </View>
        </View>
    );
};

// ─── TicklistScreenSkeleton ───────────────────────────────────────────────────
export const TicklistScreenSkeleton: React.FC = () => {
    const { theme } = useTheme();
    const shimmer = theme.backgroundSecondary;
    return (
        <View style={[sk.container, { backgroundColor: theme.background }]}>
            {/* Stats row */}
            <View style={sk.statsRow}>
                {[0, 1, 2].map(i => (
                    <View key={i} style={[sk.tickStatCard, { backgroundColor: theme.card }]}>
                        <SkeletonBox width={60} height={28} borderRadius={6} style={{ marginBottom: 6, backgroundColor: shimmer }} />
                        <SkeletonBox width={50} height={12} borderRadius={4} style={{ backgroundColor: shimmer }} />
                    </View>
                ))}
            </View>
            {/* Progress bar card */}
            <View style={[sk.progressCard, { backgroundColor: theme.card }]}>
                <View style={sk.cardRow}>
                    <SkeletonBox width="50%" height={14} borderRadius={5} style={{ backgroundColor: shimmer }} />
                    <SkeletonBox width={40} height={14} borderRadius={5} style={{ backgroundColor: shimmer }} />
                </View>
                <SkeletonBox height={8} borderRadius={4} style={{ marginTop: 10, backgroundColor: shimmer }} />
            </View>
            {/* Filter tabs */}
            <View style={sk.filterRow}>
                {[0, 1, 2].map(i => (
                    <SkeletonBox key={i} width={80} height={38} borderRadius={10} style={{ backgroundColor: shimmer }} />
                ))}
            </View>
            {/* Subject cards */}
            {[0, 1].map(i => (
                <View key={i} style={[sk.subjectCard, { backgroundColor: theme.card }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <View style={[sk.colorBar, { backgroundColor: shimmer }]} />
                        <View style={{ flex: 1 }}>
                            <SkeletonBox width="60%" height={16} borderRadius={5} style={{ marginBottom: 5, backgroundColor: shimmer }} />
                            <SkeletonBox width="30%" height={11} borderRadius={4} style={{ backgroundColor: shimmer }} />
                        </View>
                    </View>
                    <SkeletonBox height={8} borderRadius={4} style={{ marginBottom: 12, backgroundColor: shimmer }} />
                    {[0, 1, 2].map(j => (
                        <SkeletonBox key={j} height={40} borderRadius={8} style={{ marginBottom: 8, backgroundColor: shimmer }} />
                    ))}
                </View>
            ))}
        </View>
    );
};

// ─── UpcomingExamWidgetSkeleton ───────────────────────────────────────────────
export const UpcomingExamWidgetSkeleton: React.FC = () => {
    const { theme } = useTheme();
    const shimmer = theme.backgroundSecondary;
    return (
        <View style={[sk.examWidgetCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            {/* Date box skeleton */}
            <View style={[sk.examWidgetDate, { backgroundColor: shimmer }]}>
                <SkeletonBox width={28} height={10} borderRadius={3} style={{ marginBottom: 4, backgroundColor: theme.background + '40' }} />
                <SkeletonBox width={28} height={28} borderRadius={5} style={{ marginBottom: 2, backgroundColor: theme.background + '40' }} />
                <SkeletonBox width={22} height={10} borderRadius={3} style={{ backgroundColor: theme.background + '40' }} />
            </View>
            {/* Event info skeleton */}
            <View style={{ flex: 1, paddingLeft: 4 }}>
                <SkeletonBox width="80%" height={14} borderRadius={5} style={{ marginBottom: 8, backgroundColor: shimmer }} />
                <SkeletonBox width="50%" height={11} borderRadius={4} style={{ backgroundColor: shimmer }} />
            </View>
            {/* Right col skeleton */}
            <View style={sk.examWidgetRight}>
                <SkeletonBox width={32} height={16} borderRadius={4} style={{ marginBottom: 4, backgroundColor: shimmer }} />
                <SkeletonBox width={24} height={10} borderRadius={3} style={{ backgroundColor: shimmer }} />
            </View>
        </View>
    );
};

// ─── FlashcardScreenSkeleton ──────────────────────────────────────────────────
export const FlashcardScreenSkeleton: React.FC = () => {
    const { theme } = useTheme();
    return (
        <View style={[sk.container, { backgroundColor: theme.background, padding: 16 }]}>
            {/* Input card */}
            <View style={[sk.card, { backgroundColor: theme.backgroundSecondary }]}>
                <SkeletonBox width="40%" height={18} borderRadius={6} style={{ marginBottom: 6 }} />
                <SkeletonBox width="70%" height={12} borderRadius={5} style={{ marginBottom: 16 }} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <SkeletonBox width="70%" height={46} borderRadius={12} />
                    <SkeletonBox width={90} height={46} borderRadius={12} />
                </View>
                {/* Quick topic chips */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                    {[80, 100, 60, 90, 70, 110].map((w, i) => (
                        <SkeletonBox key={i} width={w} height={30} borderRadius={20} />
                    ))}
                </View>
            </View>
            {/* Card placeholder */}
            <SkeletonBox width="100%" height={260} borderRadius={20} style={{ marginTop: 16 }} />
            {/* Nav buttons */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                <SkeletonBox width="48%" height={46} borderRadius={12} />
                <SkeletonBox width="48%" height={46} borderRadius={12} />
            </View>
        </View>
    );
};

// ─── ProfileScreenSkeleton ────────────────────────────────────────────────────
export const ProfileScreenSkeleton: React.FC = () => {
    const { theme } = useTheme();
    return (
        <View style={[sk.container, { backgroundColor: theme.background, paddingHorizontal: 16 }]}>
            {/* Avatar + name area */}
            <View style={[sk.profileTop, { borderBottomColor: theme.divider }]}>
                <SkeletonBox width={80} height={80} borderRadius={40} style={{ marginBottom: 14 }} />
                <SkeletonBox width={160} height={22} borderRadius={8} style={{ marginBottom: 8 }} />
                <SkeletonBox width={200} height={12} borderRadius={5} style={{ marginBottom: 14 }} />
                {/* Badges row */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <SkeletonBox width={70} height={26} borderRadius={10} />
                    <SkeletonBox width={90} height={26} borderRadius={10} />
                    <SkeletonBox width={60} height={26} borderRadius={10} />
                </View>
            </View>
            {/* Info card */}
            <View style={[sk.card, { backgroundColor: theme.backgroundSecondary, marginTop: 16 }]}>
                <SkeletonBox width="30%" height={10} borderRadius={4} style={{ marginBottom: 14 }} />
                {[0, 1].map(i => (
                    <View key={i} style={sk.cardRow}>
                        <SkeletonBox width="35%" height={14} borderRadius={5} />
                        <SkeletonBox width="45%" height={14} borderRadius={5} />
                    </View>
                ))}
            </View>
            {/* Account card */}
            <View style={[sk.card, { backgroundColor: theme.backgroundSecondary }]}>
                <SkeletonBox width="25%" height={10} borderRadius={4} style={{ marginBottom: 14 }} />
                {[0, 1].map(i => (
                    <View key={i} style={sk.cardRow}>
                        <SkeletonBox width="35%" height={14} borderRadius={5} />
                        <SkeletonBox width="30%" height={22} borderRadius={8} />
                    </View>
                ))}
            </View>
            {/* Action buttons */}
            {[0, 1, 2].map(i => (
                <SkeletonBox key={i} height={50} borderRadius={12} style={{ marginBottom: 8 }} />
            ))}
        </View>
    );
};
// ─── LoginScreenSkeleton ───────────────────────────────────────────────────────
export const LoginScreenSkeleton: React.FC = () => {
    const { theme } = useTheme();
    return (
        <View style={[sk.container, { backgroundColor: theme.background, justifyContent: 'flex-end' }]}>
            {/* Logo area */}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <SkeletonBox width={160} height={48} borderRadius={10} style={{ marginBottom: 12 }} />
            </View>
            {/* Bottom sheet card */}
            <View style={[sk.loginCard, { backgroundColor: theme.backgroundSecondary }]}>
                {/* Title */}
                <SkeletonBox width={180} height={24} borderRadius={8} style={{ alignSelf: 'center', marginBottom: 24 }} />
                {/* Google button */}
                <SkeletonBox width="100%" height={48} borderRadius={999} style={{ marginBottom: 12 }} />
                {/* Divider */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 }}>
                    <SkeletonBox width="40%" height={1} borderRadius={0} />
                    <SkeletonBox width={24} height={14} borderRadius={4} />
                    <SkeletonBox width="40%" height={1} borderRadius={0} />
                </View>
                {/* Email button */}
                <SkeletonBox width="100%" height={48} borderRadius={999} style={{ marginBottom: 24 }} />
                {/* Footer */}
                <SkeletonBox width={200} height={14} borderRadius={6} style={{ alignSelf: 'center' }} />
            </View>
        </View>
    );
};
// ─── Styles ───────────────────────────────────────────────────────────────────
const sk = StyleSheet.create({
    container: { flex: 1 },
    headerRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
    },
    card: {
        borderRadius: 16, padding: 18, marginHorizontal: 16,
        marginBottom: 16,
    },
    cardRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8, gap: 12 },
    statItem: { flex: 1, alignItems: 'center' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16 },
    toolBox: {
        width: (width - 42) / 2, borderRadius: 14, padding: 16,
    },
    chipRow: {
        flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12,
    },
    eventCard: {
        flexDirection: 'row', borderRadius: 12, padding: 16,
        marginHorizontal: 16, marginBottom: 12,
    },
    eventDate: { width: 60, alignItems: 'center', marginRight: 16 },
    tabRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 10 },
    noteCard: { borderRadius: 14, padding: 16, marginBottom: 12 },
    tickStatCard: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
    progressCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 12, padding: 16 },
    filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 8 },
    subjectCard: { borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16 },
    colorBar: { width: 4, height: 48, borderRadius: 2, marginRight: 12 },
    profileTop: {
        alignItems: 'center', paddingVertical: 28,
        borderBottomWidth: 1, marginBottom: 0,
    },
    // Upcoming exam widget skeleton
    examWidgetCard: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 14, borderWidth: 1, padding: 12,
    },
    examWidgetDate: {
        width: 56, paddingVertical: 8, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    examWidgetRight: { alignItems: 'center', minWidth: 44 },
    loginCard: {
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32,
    },
});
