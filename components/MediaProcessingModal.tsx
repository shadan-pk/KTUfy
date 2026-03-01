/**
 * MediaProcessingModal.tsx
 *
 * A combined Processing + Completion overlay modal for all media tools.
 *
 * Phase 1  — PROCESSING:  Skeleton shimmer, spinner, "Processing…"
 * Phase 2  — COMPLETED :  File preview, rename, download, WhatsApp, share
 *
 * Design: Minimal / shadcn-inspired — clean cards, muted accents, Lucide icons.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    Image,
    TextInput,
    StyleSheet,
    Animated,
    Dimensions,
    Platform,
    Linking,
    ActivityIndicator,
    Alert,
} from 'react-native';
import {
    CheckCircle2,
    XCircle,
    Download,
    Share2,
    MessageCircle,
    Pencil,
    Check,
    Music,
    Video,
    FileText,
} from 'lucide-react-native';
import { Paths, File as ExpoFile } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as IntentLauncher from 'expo-intent-launcher';
import { useTheme } from '../contexts/ThemeContext';
import { ProcessingResult, shareFile } from '../services/mediaService';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────
export type MediaType = 'image' | 'audio' | 'video' | 'pdf';

export interface MediaProcessingModalProps {
    visible: boolean;
    phase: 'processing' | 'complete' | 'error';
    accent: string;
    mediaType: MediaType;
    result?: ProcessingResult | null;
    errorMessage?: string;
    onClose: () => void;
    onRename?: (newName: string) => void;
}

// ─── Sub-components ──────────────────────────────────────────

/** Flickering skeleton bars used during processing */
const SkeletonShimmer: React.FC<{ accent: string }> = ({ accent }) => {
    const anim = useRef(new Animated.Value(0.35)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0.35, duration: 1000, useNativeDriver: true }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [anim]);

    const bar = (w: number | string, h: number, mb = 10) => (
        <Animated.View
            style={{
                width: w as any,
                height: h,
                borderRadius: 6,
                backgroundColor: accent + '15',
                opacity: anim,
                marginBottom: mb,
            }}
        />
    );

    return (
        <View style={{ alignItems: 'center', width: '100%', paddingHorizontal: 16 }}>
            {bar('100%', 140, 14)}
            {bar('60%', 14, 10)}
            <View style={{ flexDirection: 'row', gap: 8, width: '100%', justifyContent: 'center' }}>
                {bar(80, 36, 0)}
                {bar(80, 36, 0)}
                {bar(80, 36, 0)}
            </View>
        </View>
    );
};

/** Preview component based on media type */
const FilePreview: React.FC<{
    mediaType: MediaType;
    uri: string;
    accent: string;
    isDark: boolean;
}> = ({ mediaType, uri, accent, isDark }) => {
    const bg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';

    if (mediaType === 'image') {
        return (
            <View style={[previewStyles.wrapper, { backgroundColor: bg }]}>
                <Image source={{ uri }} style={previewStyles.image} resizeMode="contain" />
            </View>
        );
    }

    const iconMap: Record<string, { Icon: typeof Music; label: string }> = {
        audio: { Icon: Music, label: 'Audio File Ready' },
        video: { Icon: Video, label: 'Video File Ready' },
        pdf: { Icon: FileText, label: 'PDF File Ready' },
    };

    const { Icon, label } = iconMap[mediaType] ?? iconMap.pdf;

    // Generate deterministic waveform heights using the URI as seed
    const waveHeights = React.useMemo(() => {
        let seed = 0;
        for (let i = 0; i < uri.length; i++) seed = (seed * 31 + uri.charCodeAt(i)) & 0x7fffffff;
        return Array.from({ length: 30 }, (_, i) => {
            seed = (seed * 16807 + i) % 2147483647;
            return 6 + (seed % 1000) / 1000 * 28;
        });
    }, [uri]);

    return (
        <View style={[previewStyles.wrapper, { backgroundColor: bg }]}>
            <View style={[previewStyles.iconCircle, { backgroundColor: accent + '12' }]}>
                <Icon size={32} color={accent} strokeWidth={1.8} />
            </View>
            <Text style={[previewStyles.iconLabel, { color: accent }]}>{label}</Text>
            {(mediaType === 'audio' || mediaType === 'video') && (
                <View style={previewStyles.waveRow}>
                    {waveHeights.map((h, i) => (
                        <View
                            key={i}
                            style={[previewStyles.waveBar, { height: h, backgroundColor: accent + '40' }]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

// ─── Main component ──────────────────────────────────────────

const MediaProcessingModal: React.FC<MediaProcessingModalProps> = ({
    visible,
    phase,
    accent,
    mediaType,
    result,
    errorMessage,
    onClose,
    onRename,
}) => {
    const { theme, isDark } = useTheme();
    const [editingName, setEditingName] = useState(false);
    const [fileName, setFileName] = useState('');

    // Sync filename from result
    useEffect(() => {
        if (result?.filename) setFileName(result.filename);
    }, [result?.filename]);

    // ── Rename: actually rename the cached file ──

    const handleRename = useCallback(async () => {
        setEditingName(false);
        if (!result || !fileName || fileName === result.filename) return;

        try {
            if (Platform.OS !== 'web') {
                // Copy file to new name in cache
                const newFile = new ExpoFile(Paths.cache, fileName);
                const oldFile = new ExpoFile(result.localUri);
                await oldFile.copy(newFile);

                // Update result reference so subsequent actions use the new file
                result.localUri = newFile.uri;
                result.filename = fileName;
            } else {
                // On web, just update the name (used for download attribute)
                result.filename = fileName;
            }

            onRename?.(fileName);
        } catch (err) {
            console.error('Rename failed:', err);
            Alert.alert('Rename failed', 'Could not rename the file. The original name will be used.');
            setFileName(result.filename);
        }
    }, [result, fileName, onRename]);

    // ── Actions ──

    const handleDownload = useCallback(async () => {
        if (!result) return;

        if (Platform.OS === 'web') {
            const a = document.createElement('a');
            a.href = result.localUri;
            a.download = fileName || result.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            // Save directly to device gallery / media library
            try {
                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission needed', 'Storage permission is required to save files.');
                    return;
                }
                const asset = await MediaLibrary.createAssetAsync(result.localUri);
                Alert.alert('Saved', `"${fileName || result.filename}" saved to your device gallery.`);
            } catch (err: any) {
                console.error('Save to gallery failed:', err);
                // Fallback: if not a media type gallery supports, use share sheet to "Save to Files"
                await shareFile(result.localUri);
            }
        }
    }, [result, fileName]);

    const handleShareWhatsApp = useCallback(async () => {
        if (!result) return;

        if (Platform.OS === 'web') {
            const url = `https://wa.me/?text=${encodeURIComponent('Check out this file: ' + (fileName || result.filename))}`;
            window.open(url, '_blank');
        } else if (Platform.OS === 'android') {
            // On Android, use IntentLauncher to target WhatsApp directly
            try {
                const canOpen = await Linking.canOpenURL('whatsapp://send');
                if (!canOpen) {
                    Alert.alert('WhatsApp not found', 'WhatsApp does not seem to be installed on this device.');
                    return;
                }
                // Get content URI for the file
                const fileObj = new ExpoFile(result.localUri);
                const ext = result.filename.split('.').pop()?.toLowerCase() || '';
                const mimeMap: Record<string, string> = {
                    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
                    webp: 'image/webp', gif: 'image/gif', bmp: 'image/bmp',
                    mp3: 'audio/mpeg', wav: 'audio/wav', aac: 'audio/aac',
                    ogg: 'audio/ogg', flac: 'audio/flac', m4a: 'audio/mp4',
                    mp4: 'video/mp4', avi: 'video/x-msvideo', mkv: 'video/x-matroska',
                    mov: 'video/quicktime', webm: 'video/webm',
                    pdf: 'application/pdf',
                };
                const mimeType = mimeMap[ext] || 'application/octet-stream';

                await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
                    type: mimeType,
                    packageName: 'com.whatsapp',
                    extra: { 'android.intent.extra.STREAM': result.localUri },
                    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
                });
            } catch (err) {
                console.warn('WhatsApp intent failed, falling back to share sheet:', err);
                await shareFile(result.localUri);
            }
        } else {
            // iOS: no direct WhatsApp targeting, use share sheet
            await shareFile(result.localUri);
        }
    }, [result, fileName]);

    const handleShare = useCallback(async () => {
        if (!result) return;

        if (Platform.OS === 'web') {
            // Use Web Share API if available
            if (typeof navigator !== 'undefined' && navigator.share) {
                try {
                    const res = await fetch(result.localUri);
                    const blob = await res.blob();
                    const file = new File([blob], fileName || result.filename, { type: blob.type });
                    await navigator.share({ files: [file], title: fileName || result.filename });
                    return;
                } catch { /* fall through to download */ }
            }
            // Fallback: trigger download
            const a = document.createElement('a');
            a.href = result.localUri;
            a.download = fileName || result.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            // Generic share sheet
            await shareFile(result.localUri);
        }
    }, [result, fileName]);

    if (!visible) return null;

    const borderCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    const mutedAccent = accent + '14';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.45)' }]}>
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: borderCol }]}>
                    {/* ── PROCESSING PHASE ── */}
                    {phase === 'processing' && (
                        <View style={styles.phaseWrap}>
                            <ActivityIndicator size="large" color={accent} style={{ marginBottom: 16 }} />
                            <Text style={[styles.phaseTitle, { color: theme.text }]}>Processing</Text>
                            <Text style={[styles.phaseSub, { color: theme.textSecondary }]}>
                                This may take a moment depending on file size.
                            </Text>
                            <View style={{ marginTop: 20, width: '100%' }}>
                                <SkeletonShimmer accent={accent} />
                            </View>
                        </View>
                    )}

                    {/* ── ERROR PHASE ── */}
                    {phase === 'error' && (
                        <View style={styles.phaseWrap}>
                            <View style={[styles.iconBadge, { backgroundColor: (theme.error || '#EF4444') + '10' }]}>
                                <XCircle size={36} color={theme.error || '#EF4444'} strokeWidth={1.6} />
                            </View>
                            <Text style={[styles.phaseTitle, { color: theme.error || '#EF4444', marginTop: 14 }]}>
                                Processing Failed
                            </Text>
                            <Text style={[styles.phaseSub, { color: theme.textSecondary, marginTop: 6 }]}>
                                {errorMessage || 'Something went wrong. Please try again.'}
                            </Text>
                            <TouchableOpacity
                                style={[styles.primaryBtn, { backgroundColor: theme.error || '#EF4444', marginTop: 24 }]}
                                onPress={onClose}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.primaryBtnText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ── COMPLETE PHASE ── */}
                    {phase === 'complete' && result && (
                        <View style={styles.phaseWrap}>
                            {/* Success badge */}
                            <View style={[styles.successRow, { backgroundColor: accent + '0A' }]}>
                                <CheckCircle2 size={18} color={accent} strokeWidth={2} />
                                <Text style={[styles.successText, { color: accent }]}>Completed</Text>
                            </View>

                            {/* Preview */}
                            <FilePreview
                                mediaType={mediaType}
                                uri={result.localUri}
                                accent={accent}
                                isDark={isDark}
                            />

                            {/* Filename row */}
                            <View style={[styles.nameRow, { borderColor: borderCol, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                                {editingName ? (
                                    <TextInput
                                        style={[styles.nameInput, { color: theme.text, borderColor: accent }]}
                                        value={fileName}
                                        onChangeText={setFileName}
                                        onBlur={handleRename}
                                        onSubmitEditing={handleRename}
                                        autoFocus
                                        selectTextOnFocus
                                    />
                                ) : (
                                    <Text
                                        style={[styles.nameText, { color: theme.text }]}
                                        numberOfLines={1}
                                        ellipsizeMode="middle"
                                    >
                                        {fileName}
                                    </Text>
                                )}
                                <TouchableOpacity
                                    style={[styles.renameBtn, { backgroundColor: mutedAccent }]}
                                    onPress={() => {
                                        if (editingName) {
                                            handleRename();
                                        } else {
                                            setEditingName(true);
                                        }
                                    }}
                                >
                                    {editingName ? (
                                        <Check size={16} color={accent} strokeWidth={2.5} />
                                    ) : (
                                        <Pencil size={14} color={accent} strokeWidth={2} />
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Action buttons */}
                            <View style={styles.actionRow}>
                                {/* Download */}
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: borderCol }]}
                                    onPress={handleDownload}
                                    activeOpacity={0.7}
                                >
                                    <Download size={18} color={accent} strokeWidth={2} />
                                    <Text style={[styles.actionLabel, { color: theme.text }]}>Save</Text>
                                </TouchableOpacity>

                                {/* WhatsApp */}
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#25D366' + '12', borderColor: '#25D366' + '30' }]}
                                    onPress={handleShareWhatsApp}
                                    activeOpacity={0.7}
                                >
                                    <MessageCircle size={18} color="#25D366" strokeWidth={2} />
                                    <Text style={[styles.actionLabel, { color: isDark ? '#4ADE80' : '#16A34A' }]}>WhatsApp</Text>
                                </TouchableOpacity>

                                {/* Share */}
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: borderCol }]}
                                    onPress={handleShare}
                                    activeOpacity={0.7}
                                >
                                    <Share2 size={18} color={accent} strokeWidth={2} />
                                    <Text style={[styles.actionLabel, { color: theme.text }]}>Share</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Done button */}
                            <TouchableOpacity
                                style={[styles.primaryBtn, { backgroundColor: accent, marginTop: 16 }]}
                                onPress={onClose}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.primaryBtnText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    card: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    phaseWrap: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    phaseTitle: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: -0.3,
    },
    phaseSub: {
        fontSize: 13,
        textAlign: 'center',
        marginTop: 4,
        lineHeight: 18,
    },

    /* Success row */
    successRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: 14,
    },
    successText: {
        fontSize: 13,
        fontWeight: '600',
    },

    /* Icon badge (error) */
    iconBadge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },

    /* Filename row */
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginTop: 12,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
    },
    nameText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '500',
    },
    nameInput: {
        flex: 1,
        fontSize: 13,
        fontWeight: '500',
        borderBottomWidth: 1.5,
        paddingVertical: 2,
    },
    renameBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },

    /* Action buttons */
    actionRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 14,
        width: '100%',
    },
    actionBtn: {
        flex: 1,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
    },
    actionLabel: {
        fontSize: 11,
        fontWeight: '600',
    },

    /* Primary button */
    primaryBtn: {
        width: '100%',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    primaryBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
});

const previewStyles = StyleSheet.create({
    wrapper: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 140,
        paddingVertical: 16,
    },
    image: {
        width: '100%',
        height: 180,
        borderRadius: 8,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    iconLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 12,
    },
    waveRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 3,
        height: 36,
        paddingHorizontal: 12,
    },
    waveBar: {
        width: 3,
        borderRadius: 1.5,
    },
});

export default MediaProcessingModal;
