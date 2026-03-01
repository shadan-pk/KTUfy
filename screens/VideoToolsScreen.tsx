import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import {
    pickSingleFile,
    processMedia,
    shareFile,
    formatFileSize,
    PickedFile,
} from '../services/mediaService';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'VideoTools'> };

const ACCENT = '#EF4444';

const VIDEO_FORMATS = ['MP4', 'MKV', 'AVI', 'MOV', 'WEBM', 'FLV'];
const AUDIO_FORMATS = ['MP3', 'AAC', 'WAV', 'OGG', 'FLAC'];
const QUALITY_OPTIONS = ['Original', '1080p', '720p', '480p', '360p'];
const FPS_OPTIONS = ['5 fps', '10 fps', '15 fps', '24 fps'];

type TabKey = 'convert' | 'extract' | 'gif' | 'compress';

const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'convert', label: 'Convert', icon: '⇄' },
    { key: 'extract', label: 'Extract Audio', icon: '♪' },
    { key: 'gif', label: 'Video to GIF', icon: '◉' },
    { key: 'compress', label: 'Compressor', icon: '⊞' },
];

const VideoToolsScreen: React.FC<Props> = ({ navigation }) => {
    const { theme, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState<TabKey>('convert');
    const [selectedFile, setSelectedFile] = useState<PickedFile | null>(null);
    const [selectedFormat, setSelectedFormat] = useState(VIDEO_FORMATS[0]);
    const [selectedAudioFmt, setSelectedAudioFmt] = useState(AUDIO_FORMATS[0]);
    const [selectedQuality, setSelectedQuality] = useState(QUALITY_OPTIONS[0]);
    const [selectedFps, setSelectedFps] = useState(FPS_OPTIONS[1]);
    const [processing, setProcessing] = useState(false);

    const pickFile = async () => {
        const file = await pickSingleFile(['video/*']);
        if (file) setSelectedFile(file);
    };

    const handleTabSwitch = (key: TabKey) => {
        setActiveTab(key);
        setSelectedFile(null);
        // Reset to valid defaults per tab
        if (key === 'compress') setSelectedQuality(QUALITY_OPTIONS[1]); // '1080p'
        else setSelectedQuality(QUALITY_OPTIONS[0]); // 'Original'
    };

    const process = async () => {
        if (!selectedFile) {
            Alert.alert('No file', 'Please select a video file first.');
            return;
        }

        setProcessing(true);
        try {
            let endpoint = '';
            const fields: Record<string, string> = {};

            switch (activeTab) {
                case 'convert':
                    endpoint = '/video/convert';
                    fields.output_format = selectedFormat.toLowerCase();
                    if (selectedQuality !== 'Original') {
                        fields.quality = selectedQuality.toLowerCase();
                    }
                    break;
                case 'extract':
                    endpoint = '/video/extract-audio';
                    fields.output_format = selectedAudioFmt.toLowerCase();
                    break;
                case 'gif':
                    endpoint = '/video/to-gif';
                    fields.fps = selectedFps.replace(' fps', '');
                    break;
                case 'compress': {
                    endpoint = '/video/compress';
                    // Ensure we never send 'original' — only valid resolutions
                    const compressQ = selectedQuality === 'Original' ? '720p' : selectedQuality.toLowerCase();
                    fields.quality = compressQ;
                    break;
                }
            }

            const result = await processMedia(
                endpoint,
                [{ fieldName: 'file', file: selectedFile }],
                fields,
            );

            Alert.alert('Success ✅', `File processed: ${result.filename}`, [
                { text: 'Share / Save', onPress: () => shareFile(result.localUri) },
                { text: 'OK' },
            ]);
        } catch (err: any) {
            Alert.alert('Processing Failed', err?.message || 'Something went wrong.');
        } finally {
            setProcessing(false);
        }
    };

    const renderFilePicker = (label: string) => (
        <TouchableOpacity
            style={[styles.filePicker, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
            onPress={pickFile}
            activeOpacity={0.7}
        >
            <Text style={[styles.fileIcon, { color: ACCENT }]}>⬆</Text>
            {selectedFile ? (
                <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.fileName, { color: theme.text }]}>{selectedFile.name}</Text>
                    {selectedFile.size ? (
                        <Text style={[styles.fileSize, { color: theme.textSecondary }]}>{formatFileSize(selectedFile.size)}</Text>
                    ) : null}
                </View>
            ) : (
                <>
                    <Text style={[styles.filePickerTitle, { color: theme.text }]}>{label}</Text>
                    <Text style={[styles.filePickerSub, { color: theme.textSecondary }]}>Tap to browse files</Text>
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
                        style={[
                            styles.chip,
                            { borderColor: ACCENT + '40', backgroundColor: selected === item ? ACCENT : ACCENT + '12' },
                        ]}
                        onPress={() => onSelect(item)}
                    >
                        <Text style={[styles.chipText, { color: selected === item ? '#FFF' : ACCENT }]}>{item}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderProcessBtn = () => (
        <TouchableOpacity
            style={[styles.processBtn, { backgroundColor: ACCENT, opacity: processing ? 0.7 : 1 }]}
            onPress={process}
            activeOpacity={0.8}
            disabled={processing}
        >
            {processing ? (
                <View style={styles.processingRow}>
                    <ActivityIndicator color="#FFF" size="small" />
                    <Text style={[styles.processBtnText, { marginLeft: 8 }]}>Processing…</Text>
                </View>
            ) : (
                <Text style={styles.processBtnText}>Process Video</Text>
            )}
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
                        <Text style={[styles.headerTitle, { color: theme.text }]}>🎬 Video Tools</Text>
                        <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Convert, extract, GIF & compress</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            {/* Tab Bar */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabBar, { backgroundColor: theme.backgroundSecondary }]} contentContainerStyle={styles.tabBarContent}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && { backgroundColor: ACCENT + '20', borderBottomColor: ACCENT }]}
                        onPress={() => handleTabSwitch(tab.key)}
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
                        {renderFilePicker('Select Video File')}
                        {renderChips(VIDEO_FORMATS, selectedFormat, setSelectedFormat, 'Output Format')}
                        {renderChips(QUALITY_OPTIONS, selectedQuality, setSelectedQuality, 'Quality')}
                        {renderProcessBtn()}
                    </>
                )}
                {activeTab === 'extract' && (
                    <>
                        {renderFilePicker('Select Video File')}
                        {renderChips(AUDIO_FORMATS, selectedAudioFmt, setSelectedAudioFmt, 'Audio Format')}
                        {renderProcessBtn()}
                    </>
                )}
                {activeTab === 'gif' && (
                    <>
                        {renderFilePicker('Select Video File')}
                        {renderChips(FPS_OPTIONS, selectedFps, setSelectedFps, 'GIF Frame Rate')}
                        <View style={[styles.infoCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                                💡 Tip: Lower FPS creates smaller GIFs. 10–15 fps works best for smooth playback.
                            </Text>
                        </View>
                        {renderProcessBtn()}
                    </>
                )}
                {activeTab === 'compress' && (
                    <>
                        {renderFilePicker('Select Video File')}
                        {renderChips(QUALITY_OPTIONS.slice(1), selectedQuality, setSelectedQuality, 'Target Resolution')}
                        <View style={[styles.infoCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                                💡 Tip: 720p strikes the best balance between quality and file size for most videos.
                            </Text>
                        </View>
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
    fileSize: { fontSize: 12, marginTop: 2 },
    optionBlock: { marginBottom: 20 },
    optionLabel: { fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    chipScroll: { gap: 8 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    chipText: { fontSize: 13, fontWeight: '600' },
    processBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    processBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    processingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    infoCard: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 20 },
    infoText: { fontSize: 13, lineHeight: 19 },
});

export default VideoToolsScreen;
