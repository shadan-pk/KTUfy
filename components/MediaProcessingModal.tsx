/**
 * MediaProcessingModal.tsx
 *
 * A combined Processing + Completion overlay modal for all media tools.
 *
 * Phase 1  — PROCESSING:  Skeleton shimmer, spinner, "Processing…"
 * Phase 2  — COMPLETED :  File preview, rename, download, WhatsApp, share
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
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { ProcessingResult, shareFile } from '../services/mediaService';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────
export type MediaType = 'image' | 'audio' | 'video' | 'pdf';

export interface MediaProcessingModalProps {
    /** Controls visibility */
    visible: boolean;
    /** 'processing' → skeleton screen  |  'complete' → result UI  |  'error' → error display */
    phase: 'processing' | 'complete' | 'error';
    /** Accent colour of the parent tool screen */
    accent: string;
    /** Type of media being processed — drives the preview */
    mediaType: MediaType;
    /** Available once processing succeeds */
    result?: ProcessingResult | null;
    /** Error message string for the error phase */
    errorMessage?: string;
    /** Called when user taps "Done" / overlay */
    onClose: () => void;
    /** Called with new filename when user renames */
    onRename?: (newName: string) => void;
}

// ─── Sub-components ──────────────────────────────────────────

/** Flickering skeleton bars used during processing */
const SkeletonShimmer: React.FC<{ accent: string }> = ({ accent }) => {
    const anim = useRef(new Animated.Value(0.35)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0.35, duration: 900, useNativeDriver: true }),
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
                borderRadius: 8,
                backgroundColor: accent + '25',
                opacity: anim,
                marginBottom: mb,
            }}
        />
    );

    return (
        <View style={{ alignItems: 'center', width: '100%', paddingHorizontal: 24 }}>
            {/* Fake preview area */}
            {bar('100%', 180, 16)}
            {/* Fake filename */}
            {bar('70%', 18, 12)}
            {/* Fake buttons row */}
            <View style={{ flexDirection: 'row', gap: 10, width: '100%', justifyContent: 'center' }}>
                {bar(90, 42, 0)}
                {bar(90, 42, 0)}
                {bar(90, 42, 0)}
            </View>
        </View>
    );
};

/** Preview component based on media type */
const FilePreview: React.FC<{ mediaType: MediaType; uri: string; accent: string; isDark: boolean }> = ({
    mediaType,
    uri,
    accent,
    isDark,
}) => {
    const bg = isDark ? '#0F1A3E' : '#F1F5F9';

    if (mediaType === 'image') {
        return (
            <View style={[previewStyles.wrapper, { backgroundColor: bg }]}>
                <Image source={{ uri }} style={previewStyles.image} resizeMode="contain" />
            </View>
        );
    }

    // For audio, video, pdf — show a styled icon card
    const iconMap: Record<string, { icon: string; label: string }> = {
        audio: { icon: '🎵', label: 'Audio File Ready' },
        video: { icon: '🎬', label: 'Video File Ready' },
        pdf: { icon: '📄', label: 'PDF File Ready' },
    };

    const { icon, label } = iconMap[mediaType] ?? iconMap.pdf;

    return (
        <View style={[previewStyles.wrapper, { backgroundColor: bg }]}>
            <View style={[previewStyles.iconCircle, { backgroundColor: accent + '18' }]}>
                <Text style={previewStyles.iconEmoji}>{icon}</Text>
            </View>
            <Text style={[previewStyles.iconLabel, { color: accent }]}>{label}</Text>
            {/* Simple playback hint for audio/video */}
            {(mediaType === 'audio' || mediaType === 'video') && (
                <View style={previewStyles.waveRow}>
                    {Array.from({ length: 30 }).map((_, i) => {
                        const h = Math.random() * 28 + 6;
                        return (
                            <View
                                key={i}
                                style={[
                                    previewStyles.waveBar,
                                    { height: h, backgroundColor: accent + '60' },
                                ]}
                            />
                        );
                    })}
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

    // ── Actions ──

    const handleDownload = useCallback(async () => {
        if (!result) return;

        if (Platform.OS === 'web') {
            // Trigger browser download
            const a = document.createElement('a');
            a.href = result.localUri;
            a.download = fileName || result.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            // On native, use expo-sharing which lets the user "Save to Files"
            await shareFile(result.localUri);
        }
    }, [result, fileName]);

    const handleShareWhatsApp = useCallback(async () => {
        if (!result) return;

        if (Platform.OS === 'web') {
            // Open WhatsApp web share (text only — file must be downloaded first)
            const url = `https://wa.me/?text=${encodeURIComponent('Check out this file: ' + (fileName || result.filename))}`;
            window.open(url, '_blank');
        } else {
            // On native, share the file via system share sheet (user picks WhatsApp)
            await shareFile(result.localUri);
        }
    }, [result, fileName]);

    const handleShare = useCallback(async () => {
        if (!result) return;
        await shareFile(result.localUri);
    }, [result]);

    const handleRename = useCallback(() => {
        setEditingName(false);
        onRename?.(fileName);
    }, [fileName, onRename]);

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    {/* ── PROCESSING PHASE ── */}
                    {phase === 'processing' && (
                        <View style={styles.phaseWrap}>
                            <ActivityIndicator size="large" color={accent} style={{ marginBottom: 18 }} />
                            <Text style={[styles.phaseTitle, { color: theme.text }]}>Processing…</Text>
                            <Text style={[styles.phaseSub, { color: theme.textSecondary }]}>
                                This may take a moment depending on file size.
                            </Text>
                            <View style={{ marginTop: 24, width: '100%' }}>
                                <SkeletonShimmer accent={accent} />
                            </View>
                        </View>
                    )}

                    {/* ── ERROR PHASE ── */}
                    {phase === 'error' && (
                        <View style={styles.phaseWrap}>
                            <View style={[styles.errorCircle, { backgroundColor: theme.error + '18' }]}>
                                <Text style={{ fontSize: 36 }}>✕</Text>
                            </View>
                            <Text style={[styles.phaseTitle, { color: theme.error, marginTop: 16 }]}>
                                Processing Failed
                            </Text>
                            <Text style={[styles.phaseSub, { color: theme.textSecondary, marginTop: 8 }]}>
                                {errorMessage || 'Something went wrong. Please try again.'}
                            </Text>
                            <TouchableOpacity
                                style={[styles.doneBtn, { backgroundColor: theme.error, marginTop: 28 }]}
                                onPress={onClose}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.doneBtnText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ── COMPLETE PHASE ── */}
                    {phase === 'complete' && result && (
                        <View style={styles.phaseWrap}>
                            {/* Success badge */}
                            <View style={[styles.successBadge, { backgroundColor: accent + '18' }]}>
                                <Text style={{ fontSize: 18 }}>✓</Text>
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
                            <View style={[styles.nameRow, { borderColor: theme.border }]}>
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
                                    style={[styles.renameBtn, { backgroundColor: accent + '14' }]}
                                    onPress={() => setEditingName(!editingName)}
                                >
                                    <Text style={[styles.renameBtnText, { color: accent }]}>
                                        {editingName ? '✓' : '✎'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Action buttons */}
                            <View style={styles.actionRow}>
                                {/* Download */}
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#2563EB' }]}
                                    onPress={handleDownload}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.actionIcon}>⬇</Text>
                                    <Text style={styles.actionLabel}>Download</Text>
                                </TouchableOpacity>

                                {/* WhatsApp */}
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#25D366' }]}
                                    onPress={handleShareWhatsApp}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.actionIcon}>💬</Text>
                                    <Text style={styles.actionLabel}>WhatsApp</Text>
                                </TouchableOpacity>

                                {/* Share */}
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: accent }]}
                                    onPress={handleShare}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.actionIcon}>↗</Text>
                                    <Text style={styles.actionLabel}>Share</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Done button */}
                            <TouchableOpacity
                                style={[styles.doneBtn, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                                onPress={onClose}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.doneBtnText, { color: theme.text }]}>Done</Text>
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
        paddingHorizontal: 20,
    },
    card: {
        width: '100%',
        maxWidth: 420,
        borderRadius: 22,
        borderWidth: 1,
        overflow: 'hidden',
    },
    phaseWrap: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 28,
    },
    phaseTitle: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
    },
    phaseSub: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 20,
    },

    /* Success badge */
    successBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 16,
    },
    successText: {
        fontSize: 14,
        fontWeight: '700',
    },

    /* Error circle */
    errorCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },

    /* Filename row */
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginTop: 14,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 10,
    },
    nameText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
    },
    nameInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        borderBottomWidth: 1.5,
        paddingVertical: 2,
    },
    renameBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    renameBtnText: {
        fontSize: 18,
        fontWeight: '700',
    },

    /* Action buttons */
    actionRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 18,
        width: '100%',
    },
    actionBtn: {
        flex: 1,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        gap: 4,
    },
    actionIcon: {
        fontSize: 18,
        color: '#FFF',
    },
    actionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFF',
    },

    /* Done button */
    doneBtn: {
        width: '100%',
        marginTop: 14,
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        borderWidth: 1,
    },
    doneBtnText: {
        fontSize: 15,
        fontWeight: '700',
    },
});

const previewStyles = StyleSheet.create({
    wrapper: {
        width: '100%',
        borderRadius: 14,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 160,
        paddingVertical: 20,
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 10,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    iconEmoji: {
        fontSize: 34,
    },
    iconLabel: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 14,
    },
    waveRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 3,
        height: 40,
        paddingHorizontal: 12,
    },
    waveBar: {
        width: 4,
        borderRadius: 2,
    },
});

export default MediaProcessingModal;
