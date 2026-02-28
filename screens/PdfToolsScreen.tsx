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

type Props = { navigation: StackNavigationProp<RootStackParamList, 'PdfTools'> };

const ACCENT = '#10B981';

type TabKey = 'merge' | 'split' | 'compress' | 'img2pdf' | 'pdf2img';
const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'merge', label: 'Merge', icon: '⊕' },
    { key: 'split', label: 'Split', icon: '✂' },
    { key: 'compress', label: 'Compress', icon: '⊞' },
    { key: 'img2pdf', label: 'Images to PDF', icon: '⬛' },
    { key: 'pdf2img', label: 'PDF to Images', icon: '⬜' },
];

const IMAGE_FORMATS = ['JPG', 'PNG', 'WEBP'];
const QUALITY_OPTIONS = ['Screen (72 dpi)', 'Print (150 dpi)', 'High (300 dpi)', 'Max Quality'];

const PdfToolsScreen: React.FC<Props> = ({ navigation }) => {
    const { theme, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState<TabKey>('merge');
    const [pdfFiles, setPdfFiles] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [selectedImgFormat, setSelectedImgFormat] = useState(IMAGE_FORMATS[0]);
    const [selectedQuality, setSelectedQuality] = useState(QUALITY_OPTIONS[1]);

    const pickPdf = (multi = false) => {
        Alert.alert('File Picker', 'Connect your backend to enable file selection & processing.');
        if (multi) setPdfFiles(['document_1.pdf', 'document_2.pdf', 'report.pdf']);
        else setSelectedFile('document.pdf');
    };

    const pickImages = () => {
        Alert.alert('File Picker', 'Connect your backend to enable file selection & processing.');
        setImageFiles(['page_1.jpg', 'page_2.jpg', 'page_3.png']);
    };

    const process = () =>
        Alert.alert('Processing', 'Backend integration coming soon! The server will handle all PDF processing.');

    const renderSinglePicker = (label: string, sub: string) => (
        <TouchableOpacity
            style={[styles.filePicker, { backgroundColor: theme.backgroundSecondary, borderColor: ACCENT + '50' }]}
            onPress={() => pickPdf(false)}
            activeOpacity={0.7}
        >
            <Text style={[styles.fileIcon, { color: ACCENT }]}>📄</Text>
            {selectedFile ? (
                <Text style={[styles.fileName, { color: theme.text }]}>{selectedFile}</Text>
            ) : (
                <>
                    <Text style={[styles.filePickerTitle, { color: theme.text }]}>{label}</Text>
                    <Text style={[styles.filePickerSub, { color: theme.textSecondary }]}>{sub}</Text>
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

    const renderProcessBtn = (label = 'Process PDF') => (
        <TouchableOpacity style={[styles.processBtn, { backgroundColor: ACCENT }]} onPress={process} activeOpacity={0.8}>
            <Text style={styles.processBtnText}>{label}</Text>
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
                        <Text style={[styles.headerTitle, { color: theme.text }]}>📄 PDF Tools</Text>
                        <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Merge, split, compress and convert PDF files</Text>
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

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentPad}>
                {activeTab === 'merge' && (
                    <>
                        <TouchableOpacity
                            style={[styles.filePicker, { backgroundColor: theme.backgroundSecondary, borderColor: ACCENT + '50' }]}
                            onPress={() => pickPdf(true)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.fileIcon, { color: ACCENT }]}>📄</Text>
                            <Text style={[styles.filePickerTitle, { color: theme.text }]}>Add PDF Files</Text>
                            <Text style={[styles.filePickerSub, { color: theme.textSecondary }]}>Select multiple PDFs to merge</Text>
                        </TouchableOpacity>
                        {pdfFiles.length > 0 && (
                            <View style={styles.optionBlock}>
                                <Text style={[styles.optionLabel, { color: theme.textSecondary }]}>Files to Merge ({pdfFiles.length})</Text>
                                {pdfFiles.map((f, i) => (
                                    <View key={i} style={[styles.fileRow, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                                        <Text style={[styles.fileRowNum, { color: ACCENT }]}>{i + 1}</Text>
                                        <Text style={[styles.fileRowName, { color: theme.text }]}>{f}</Text>
                                        <Text style={[styles.fileRowMeta, { color: theme.textSecondary }]}>PDF</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                        {renderProcessBtn('Merge PDFs')}
                    </>
                )}

                {activeTab === 'split' && (
                    <>
                        {renderSinglePicker('Select PDF File', 'Choose the PDF to split')}
                        <View style={[styles.infoCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                                📑 After selecting a file, you'll be able to specify page ranges to split into separate documents. Example: "1-3, 4-7, 8-end"
                            </Text>
                        </View>
                        {renderProcessBtn('Split PDF')}
                    </>
                )}

                {activeTab === 'compress' && (
                    <>
                        {renderSinglePicker('Select PDF File', 'Choose the PDF to compress')}
                        {renderChips(QUALITY_OPTIONS, selectedQuality, setSelectedQuality, 'Compression Level')}
                        <View style={[styles.infoCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                                💡 "Print (150 dpi)" gives the best balance between file size and readability for most documents.
                            </Text>
                        </View>
                        {renderProcessBtn('Compress PDF')}
                    </>
                )}

                {activeTab === 'img2pdf' && (
                    <>
                        <TouchableOpacity
                            style={[styles.filePicker, { backgroundColor: theme.backgroundSecondary, borderColor: ACCENT + '50' }]}
                            onPress={pickImages}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.fileIcon, { color: ACCENT }]}>🖼️</Text>
                            {imageFiles.length > 0 ? (
                                <Text style={[styles.fileName, { color: theme.text }]}>{imageFiles.length} image(s) selected</Text>
                            ) : (
                                <>
                                    <Text style={[styles.filePickerTitle, { color: theme.text }]}>Select Images</Text>
                                    <Text style={[styles.filePickerSub, { color: theme.textSecondary }]}>JPG, PNG, WEBP — they'll be combined into one PDF</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        {imageFiles.length > 0 && (
                            <View style={styles.optionBlock}>
                                <Text style={[styles.optionLabel, { color: theme.textSecondary }]}>Images ({imageFiles.length})</Text>
                                {imageFiles.map((f, i) => (
                                    <View key={i} style={[styles.fileRow, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                                        <Text style={[styles.fileRowNum, { color: ACCENT }]}>{i + 1}</Text>
                                        <Text style={[styles.fileRowName, { color: theme.text }]}>{f}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                        {renderProcessBtn('Convert to PDF')}
                    </>
                )}

                {activeTab === 'pdf2img' && (
                    <>
                        {renderSinglePicker('Select PDF File', 'Convert each PDF page to an image')}
                        {renderChips(IMAGE_FORMATS, selectedImgFormat, setSelectedImgFormat, 'Output Image Format')}
                        {renderChips(QUALITY_OPTIONS.slice(0, 3), selectedQuality, setSelectedQuality, 'Image Quality')}
                        {renderProcessBtn('Convert to Images')}
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
    tab: { paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', flexDirection: 'row', gap: 5, borderRadius: 8 },
    tabIcon: { fontSize: 15 },
    tabLabel: { fontSize: 12, fontWeight: '600' },
    content: { flex: 1 },
    contentPad: { padding: 16 },
    filePicker: { borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', paddingVertical: 32, alignItems: 'center', marginBottom: 20 },
    fileIcon: { fontSize: 28, marginBottom: 8 },
    filePickerTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    filePickerSub: { fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
    fileName: { fontSize: 14, fontWeight: '600' },
    optionBlock: { marginBottom: 20 },
    optionLabel: { fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    chipScroll: { gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    chipText: { fontSize: 12, fontWeight: '600' },
    processBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    processBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    infoCard: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 20 },
    infoText: { fontSize: 13, lineHeight: 19 },
    fileRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 8 },
    fileRowNum: { width: 24, fontSize: 14, fontWeight: '700' },
    fileRowName: { flex: 1, fontSize: 14, fontWeight: '500' },
    fileRowMeta: { fontSize: 12, fontWeight: '600' },
});

export default PdfToolsScreen;
