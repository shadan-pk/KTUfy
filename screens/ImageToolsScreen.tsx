import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    TextInput,
    Alert,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import {
    pickSingleFile,
    processMedia,
    formatFileSize,
    PickedFile,
    ProcessingResult,
} from '../services/mediaService';
import MediaProcessingModal from '../components/MediaProcessingModal';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'ImageTools'> };

const ACCENT = '#F59E0B';

const IMAGE_FORMATS = ['JPG', 'PNG', 'WEBP', 'AVIF', 'GIF', 'BMP'];
const QUALITY_OPTIONS = ['100%', '90%', '80%', '70%', '60%', '50%'];

type TabKey = 'convert' | 'compress' | 'resize';
const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'convert', label: 'Converter', icon: '⇄' },
    { key: 'compress', label: 'Compress', icon: '⊞' },
    { key: 'resize', label: 'Resize', icon: '⤢' },
];

const ImageToolsScreen: React.FC<Props> = ({ navigation }) => {
    const { theme, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState<TabKey>('convert');
    const [selectedFile, setSelectedFile] = useState<PickedFile | null>(null);
    const [selectedFormat, setSelectedFormat] = useState(IMAGE_FORMATS[0]);
    const [selectedQuality, setSelectedQuality] = useState(QUALITY_OPTIONS[2]);
    const [resizeWidth, setResizeWidth] = useState('1920');
    const [resizeHeight, setResizeHeight] = useState('1080');

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [modalPhase, setModalPhase] = useState<'processing' | 'complete' | 'error'>('processing');
    const [modalResult, setModalResult] = useState<ProcessingResult | null>(null);
    const [modalError, setModalError] = useState('');

    const pickFile = async () => {
        const file = await pickSingleFile(['image/*']);
        if (file) setSelectedFile(file);
    };

    const process = useCallback(async () => {
        if (!selectedFile) {
            Alert.alert('No file', 'Please select an image file first.');
            return;
        }

        setModalResult(null);
        setModalError('');
        setModalPhase('processing');
        setModalVisible(true);

        try {
            let endpoint = '';
            const fields: Record<string, string> = {};

            switch (activeTab) {
                case 'convert':
                    endpoint = '/image/convert';
                    fields.output_format = selectedFormat.toLowerCase();
                    break;
                case 'compress':
                    endpoint = '/image/compress';
                    fields.quality = selectedQuality.replace('%', '');
                    fields.output_format = selectedFormat.toLowerCase();
                    break;
                case 'resize':
                    endpoint = '/image/resize';
                    fields.width = resizeWidth;
                    fields.height = resizeHeight;
                    fields.output_format = selectedFormat.toLowerCase();
                    break;
            }

            const result = await processMedia(
                endpoint,
                [{ fieldName: 'file', file: selectedFile }],
                fields,
            );

            setModalResult(result);
            setModalPhase('complete');
        } catch (err: any) {
            setModalError(err?.message || 'Something went wrong.');
            setModalPhase('error');
        }
    }, [selectedFile, activeTab, selectedFormat, selectedQuality, resizeWidth, resizeHeight]);

    const closeModal = useCallback(() => {
        setModalVisible(false);
        setModalResult(null);
        setModalError('');
    }, []);

    const renderFilePicker = (label: string) => (
        <TouchableOpacity
            style={[styles.filePicker, { backgroundColor: theme.backgroundSecondary, borderColor: ACCENT + '60' }]}
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
                    <Text style={[styles.filePickerSub, { color: theme.textSecondary }]}>JPG, PNG, WEBP & more</Text>
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
                        style={[styles.chip, { backgroundColor: selected === item ? ACCENT : ACCENT + '14', borderColor: ACCENT + '40' }]}
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
            style={[styles.processBtn, { backgroundColor: ACCENT, opacity: !selectedFile ? 0.5 : 1 }]}
            onPress={process}
            activeOpacity={0.8}
            disabled={!selectedFile}
        >
            <Text style={styles.processBtnText}>Process Image</Text>
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
                        <Text style={[styles.headerTitle, { color: theme.text }]}>🖼️ Image Tools</Text>
                        <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Convert, compress, resize and crop images</Text>
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
                        onPress={() => { setActiveTab(tab.key); setSelectedFile(null); setResizeWidth('1920'); setResizeHeight('1080'); }}
                    >
                        <Text style={[styles.tabIcon, { color: activeTab === tab.key ? ACCENT : theme.textSecondary }]}>{tab.icon}</Text>
                        <Text style={[styles.tabLabel, { color: activeTab === tab.key ? ACCENT : theme.textSecondary }]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentPad}>
                {activeTab === 'convert' && (
                    <>
                        {renderFilePicker('Select Image File')}
                        {renderChips(IMAGE_FORMATS, selectedFormat, setSelectedFormat, 'Output Format')}
                        <View style={[styles.infoCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                                💡 WEBP provides 25–35% smaller files than JPEG at equivalent quality. Great for web usage.
                            </Text>
                        </View>
                        {renderProcessBtn()}
                    </>
                )}

                {activeTab === 'compress' && (
                    <>
                        {renderFilePicker('Select Image File')}
                        {renderChips(QUALITY_OPTIONS, selectedQuality, setSelectedQuality, 'Quality')}
                        {renderChips(IMAGE_FORMATS, selectedFormat, setSelectedFormat, 'Output Format')}
                        {renderProcessBtn()}
                    </>
                )}

                {activeTab === 'resize' && (
                    <>
                        {renderFilePicker('Select Image File')}
                        <View style={styles.optionBlock}>
                            <Text style={[styles.optionLabel, { color: theme.textSecondary }]}>Target Resolution</Text>
                            <View style={styles.resizeRow}>
                                <View style={[styles.dimensionInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                                    <Text style={[styles.dimensionLabel, { color: theme.textSecondary }]}>Width (px)</Text>
                                    <TextInput
                                        style={[styles.dimensionField, { color: theme.text }]}
                                        value={resizeWidth}
                                        onChangeText={setResizeWidth}
                                        keyboardType="number-pad"
                                        placeholder="1920"
                                        placeholderTextColor={theme.textTertiary}
                                    />
                                </View>
                                <Text style={[styles.crossIcon, { color: theme.textSecondary }]}>×</Text>
                                <View style={[styles.dimensionInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                                    <Text style={[styles.dimensionLabel, { color: theme.textSecondary }]}>Height (px)</Text>
                                    <TextInput
                                        style={[styles.dimensionField, { color: theme.text }]}
                                        value={resizeHeight}
                                        onChangeText={setResizeHeight}
                                        keyboardType="number-pad"
                                        placeholder="1080"
                                        placeholderTextColor={theme.textTertiary}
                                    />
                                </View>
                            </View>
                            {/* Preset resolutions */}
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                                {[
                                    { label: 'HD', w: '1280', h: '720' },
                                    { label: 'FHD', w: '1920', h: '1080' },
                                    { label: '4K', w: '3840', h: '2160' },
                                    { label: 'Square', w: '1080', h: '1080' },
                                ].map(preset => (
                                    <TouchableOpacity
                                        key={preset.label}
                                        style={[styles.presetChip, { backgroundColor: ACCENT + '14', borderColor: ACCENT + '40' }]}
                                        onPress={() => { setResizeWidth(preset.w); setResizeHeight(preset.h); }}
                                    >
                                        <Text style={[styles.presetText, { color: ACCENT }]}>{preset.label}</Text>
                                        <Text style={[styles.presetDim, { color: theme.textSecondary }]}>{preset.w}×{preset.h}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        {renderChips(IMAGE_FORMATS, selectedFormat, setSelectedFormat, 'Output Format')}
                        {renderProcessBtn()}
                    </>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Processing / Completion Modal */}
            <MediaProcessingModal
                visible={modalVisible}
                phase={modalPhase}
                accent={ACCENT}
                mediaType="image"
                result={modalResult}
                errorMessage={modalError}
                onClose={closeModal}
            />
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
    tab: { paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', flexDirection: 'row', gap: 6, borderRadius: 8 },
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
    infoCard: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 20 },
    infoText: { fontSize: 13, lineHeight: 19 },
    resizeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    dimensionInput: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12 },
    dimensionLabel: { fontSize: 11, fontWeight: '600', marginBottom: 6 },
    dimensionField: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
    crossIcon: { fontSize: 22, fontWeight: '300' },
    presetChip: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
    presetText: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
    presetDim: { fontSize: 10 },
});

export default ImageToolsScreen;
