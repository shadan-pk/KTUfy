import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type MediaToolsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MediaTools'>;

interface Props {
    navigation: MediaToolsScreenNavigationProp;
}

const { width } = Dimensions.get('window');

const TOOL_CATEGORIES = [
    {
        key: 'VideoTools',
        label: 'Video Tools',
        icon: '🎬',
        color: '#EF4444',
        description: 'Convert, extract audio, create GIFs & compress videos',
        tools: ['Convert', 'Extract Audio', 'Video to GIF', 'Compressor'],
    },
    {
        key: 'AudioTools',
        label: 'Audio Tools',
        icon: '🎵',
        color: '#8B5CF6',
        description: 'Convert, trim, merge & normalize audio files',
        tools: ['Convert', 'Trim', 'Merge', 'Normalize'],
    },
    {
        key: 'ImageTools',
        label: 'Image Tools',
        icon: '🖼️',
        color: '#F59E0B',
        description: 'Convert, compress & resize images to any resolution',
        tools: ['Convert', 'Compress', 'Resize'],
    },
    {
        key: 'PdfTools',
        label: 'PDF Tools',
        icon: '📄',
        color: '#10B981',
        description: 'Merge, split, compress, and convert PDF files',
        tools: ['Merge', 'Split', 'Compress', 'Images to PDF', 'PDF to Images'],
    },
];

const MediaToolsScreen: React.FC<Props> = ({ navigation }) => {
    const { theme, isDark } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.background }}>
                <View style={[styles.header, { borderBottomColor: theme.divider }]}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
                    </TouchableOpacity>
                    <View>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>Media Tools</Text>
                        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                            Video · Audio · Image · PDF
                        </Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                    Select a category to get started
                </Text>

                {TOOL_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat.key}
                        style={[styles.card, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                        onPress={() => navigation.navigate(cat.key as any)}
                        activeOpacity={0.75}
                    >
                        {/* Left accent bar */}
                        <View style={[styles.accentBar, { backgroundColor: cat.color }]} />

                        <View style={styles.cardBody}>
                            {/* Top row */}
                            <View style={styles.cardTop}>
                                <View style={[styles.iconWrap, { backgroundColor: cat.color + '1A' }]}>
                                    <Text style={styles.icon}>{cat.icon}</Text>
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={[styles.cardTitle, { color: theme.text }]}>{cat.label}</Text>
                                    <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                                        {cat.description}
                                    </Text>
                                </View>
                                <Text style={[styles.chevron, { color: theme.textTertiary }]}>›</Text>
                            </View>

                            {/* Tool chips */}
                            <View style={styles.chips}>
                                {cat.tools.map((tool) => (
                                    <View
                                        key={tool}
                                        style={[styles.chip, { backgroundColor: cat.color + '14', borderColor: cat.color + '30' }]}
                                    >
                                        <Text style={[styles.chipText, { color: cat.color }]}>{tool}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}

                {/* Coming soon note */}
                <View style={[styles.noteBanner, { backgroundColor: theme.primary + '12', borderColor: theme.primary + '30' }]}>
                    <Text style={[styles.noteIcon]}>⚡</Text>
                    <Text style={[styles.noteText, { color: theme.textSecondary }]}>
                        Processing is powered by the backend server. Make sure you're connected when using these tools.
                    </Text>
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
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
    backIcon: { fontSize: 22, fontWeight: '500' },
    headerTitle: { fontSize: 20, fontWeight: '700' },
    headerSubtitle: { fontSize: 12, marginTop: 1 },
    scroll: { flex: 1, paddingHorizontal: 16 },
    sectionLabel: { fontSize: 13, marginTop: 20, marginBottom: 14, fontWeight: '500' },
    card: {
        flexDirection: 'row', borderRadius: 16, borderWidth: 1,
        marginBottom: 14, overflow: 'hidden',
    },
    accentBar: { width: 4 },
    cardBody: { flex: 1, padding: 16 },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    iconWrap: {
        width: 48, height: 48, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    icon: { fontSize: 24 },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
    cardDesc: { fontSize: 12, lineHeight: 17 },
    chevron: { fontSize: 26, marginLeft: 8, marginTop: 4 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
    chipText: { fontSize: 11, fontWeight: '600' },
    noteBanner: {
        flexDirection: 'row', alignItems: 'center', borderRadius: 12,
        borderWidth: 1, padding: 14, marginTop: 8, gap: 10,
    },
    noteIcon: { fontSize: 20 },
    noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
});

export default MediaToolsScreen;
