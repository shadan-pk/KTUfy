import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'AudioTools'> };

const ACCENT = '#8B5CF6';

const AUDIO_FORMATS = ['MP3', 'AAC', 'WAV', 'OGG', 'FLAC', 'M4A'];
const QUALITY_OPTIONS = ['Low (64kbps)', 'Medium (128kbps)', 'High (192kbps)', 'Lossless (320kbps)'];

type TabKey = 'convert' | 'trim' | 'merge' | 'normalize';
const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'convert', label: 'Converter', icon: '♫' },
    { key: 'trim', label: 'Trim', icon: '✂' },
    { key: 'merge', label: 'Merge', icon: '⊕' },
    { key: 'normalize', label: 'Normalize', icon: '◬' },
];

const AudioToolsScreen: React.FC<Props> = ({ navigation }) => {
    const { theme, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState<TabKey>('convert');
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [mergeFiles, setMergeFiles] = useState<string[]>([]);
    const [selectedFormat, setSelectedFormat] = useState(AUDIO_FORMATS[0]);
    const [selectedQuality, setSelectedQuality] = useState(QUALITY_OPTIONS[2]);

    const pickFile = (multi = false) => {
        Alert.alert('File Picker', 'Connect your backend to enable file selection & processing.');
        if (multi) {
            setMergeFiles(['audio_1.mp3', 'audio_2.mp3', 'audio_3.wav']);
        } else {
            setSelectedFile('sample_audio.mp3');
        }
    };

    const process = () =>
        Alert.alert('Processing', 'Backend integration coming soon! The server will handle all audio processing.');

    const renderFilePicker = (label: string) => (
        <TouchableOpacity
            style={[styles.filePicker, { backgroundColor: theme.backgroundSecondary, borderColor: ACCENT + '60' }]}
            onPress={() => pickFile(false)}
            activeOpacity={0.7}
        >
            <Text style={[styles.fileIcon, { color: ACCENT }]}>⬆</Text>
            {selectedFile ? (
                <Text style={[styles.fileName, { color: theme.text }]}>{selectedFile}</Text>
            ) : (
                <>
                    <Text style={[styles.filePickerTitle, { color: theme.text }]}>{label}</Text>
                    <Text style={[styles.filePickerSub, { color: theme.textSecondary }]}>MP3, WAV, AAC, FLAC supported</Text>
                </>
            )}
        </TouchableOpacity>
    );

    const renderChips = (items: string[], selected: string, onSelect: (v: string) => void, label: string) => (
        <View style={styles.optionBlock}>
            <Text style={[styles.optionLabel, { color: theme.textSecondary }]}>{label}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                {items.map(item => (
                    <TouchableOpacity
                        key={item}
                        style={[styles.chip, { backgroundColor: selected === item ? ACCENT : ACCENT + '12', borderColor: ACCENT + '40' }]}
                        onPress={() => onSelect(item)}
                    >
                        <Text style={[styles.chipText, { color: selected === item ? '#FFF' : ACCENT }]}>{item}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderProcessBtn = () => (
        <TouchableOpacity style={[styles.processBtn, { backgroundColor: ACCENT }]} onPress={process} activeOpacity={0.8}>
            <Text style={styles.processBtnText}>Process Audio</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.background }}>
                <View style={[styles.header, { borderBottomColor: theme.divider }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
                    </TouchableOpacity>
                    <View>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>🎵 Audio Tools</Text>
                        <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Convert, trim, merge and enhance audio files</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            {/* Tab Bar */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabBar, { backgroundColor: theme.backgroundSecondary }]} contentContainerStyle={styles.tabBarContent}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && { backgroundColor: ACCENT + '1A', borderBottomColor: ACCENT }]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={[styles.tabIcon, { color: activeTab === tab.key ? ACCENT : theme.textSecondary }]}>{tab.icon}</Text>
                        <Text style={[styles.tabLabel, { color: activeTab === tab.key ? ACCENT : theme.textSecondary }]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Tab Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentPad}>
                {activeTab === 'convert' && (
                    <>
                        {renderFilePicker('Select Audio File')}
                        {renderChips(AUDIO_FORMATS, selectedFormat, setSelectedFormat, 'Output Format')}
                        {renderChips(QUALITY_OPTIONS, selectedQuality, setSelectedQuality, 'Quality')}
                        {renderProcessBtn()}
                    </>
                )}

                {activeTab === 'trim' && (
                    <>
                        {renderFilePicker('Select Audio File')}
                        <View style={styles.optionBlock}>
                            <Text style={[styles.optionLabel, { color: theme.textSecondary }]}>Trim Range</Text>
                            <View style={[styles.infoCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                                    ⏱ Start time and end time inputs will be enabled after selecting a file. You can set the trim range in seconds or mm:ss format.
                                </Text>
                            </View>
                        </View>
                        {renderChips(AUDIO_FORMATS, selectedFormat, setSelectedFormat, 'Output Format')}
                        {renderProcessBtn()}
                    </>
                )}

                {activeTab === 'merge' && (
                    <>
                        <TouchableOpacity
                            style={[styles.filePicker, { backgroundColor: theme.backgroundSecondary, borderColor: ACCENT + '60' }]}
                            onPress={() => pickFile(true)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.fileIcon, { color: ACCENT }]}>⊕</Text>
                            <Text style={[styles.filePickerTitle, { color: theme.text }]}>Add Audio Files</Text>
                            <Text style={[styles.filePickerSub, { color: theme.textSecondary }]}>Select multiple files to merge</Text>
                        </TouchableOpacity>

                        {mergeFiles.length > 0 && (
                            <View style={styles.optionBlock}>
                                <Text style={[styles.optionLabel, { color: theme.textSecondary }]}>Files to Merge ({mergeFiles.length})</Text>
                                {mergeFiles.map((f, i) => (
                                    <View key={i} style={[styles.fileRow, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                                        <Text style={[styles.fileRowNum, { color: ACCENT }]}>{i + 1}</Text>
                                        <Text style={[styles.fileRowName, { color: theme.text }]}>{f}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                        {renderChips(AUDIO_FORMATS, selectedFormat, setSelectedFormat, 'Output Format')}
                        {renderProcessBtn()}
                    </>
                )}

                {activeTab === 'normalize' && (
                    <>
                        {renderFilePicker('Select Audio File')}
                        <View style={[styles.infoCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, marginBottom: 20 }]}>
                            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                                🎚 Normalization adjusts the overall loudness of an audio file to a standard target level without clipping. Great for mixing multiple audio files together.
                            </Text>
                        </View>
                        {renderChips(AUDIO_FORMATS, selectedFormat, setSelectedFormat, 'Output Format')}
                        {renderProcessBtn()}
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
    backIcon: { fontSize: 22, fontWeight: '500' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    headerSub: { fontSize: 12, marginTop: 1 },
    tabBar: { maxHeight: 60 },
    tabBarContent: { paddingHorizontal: 8, gap: 4 },
    tab: { paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', flexDirection: 'row', gap: 6, borderRadius: 8 },
    tabIcon: { fontSize: 16 },
    tabLabel: { fontSize: 13, fontWeight: '600' },
    content: { flex: 1 },
    contentPad: { padding: 16 },
    filePicker: { borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', paddingVertical: 32, alignItems: 'center', marginBottom: 20 },
    fileIcon: { fontSize: 28, marginBottom: 8 },
    filePickerTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    filePickerSub: { fontSize: 13 },
    fileName: { fontSize: 14, fontWeight: '600' },
    optionBlock: { marginBottom: 20 },
    optionLabel: { fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    chipScroll: { gap: 8 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    chipText: { fontSize: 13, fontWeight: '600' },
    processBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    processBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    infoCard: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 0 },
    infoText: { fontSize: 13, lineHeight: 19 },
    fileRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 8 },
    fileRowNum: { width: 24, fontSize: 14, fontWeight: '700' },
    fileRowName: { flex: 1, fontSize: 14, fontWeight: '500' },
});

export default AudioToolsScreen;
