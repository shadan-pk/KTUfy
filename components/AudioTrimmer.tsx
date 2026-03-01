/**
 * AudioTrimmer.tsx
 *
 * Interactive audio trimmer with:
 *   • A fake waveform visualisation
 *   • Left / Right draggable trim handles (PanGestureHandler + Reanimated)
 *   • Play‑preview of the selected region (expo-av)
 *   • Start / End time display that auto-updates from the handles
 */
import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
    clamp,
} from 'react-native-reanimated';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { useTheme } from '../contexts/ThemeContext';

// ─── Props ───────────────────────────────────────────────────
export interface AudioTrimmerProps {
    /** Local URI of the audio file to preview */
    fileUri: string;
    /** Duration in seconds (if known) — helps calculate handle positions */
    durationSeconds?: number;
    /** Accent colour */
    accent: string;
    /** Called when user adjusts the handles */
    onTrimChange: (start: string, end: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const HANDLE_W = 22;
const BAR_COUNT = 60;
const MIN_REGION_PX = 30; // minimum region width in pixels

// ─── Component ───────────────────────────────────────────────

const AudioTrimmer: React.FC<AudioTrimmerProps> = ({
    fileUri,
    durationSeconds: initialDuration,
    accent,
    onTrimChange,
}) => {
    const { theme, isDark } = useTheme();

    // Track rail width measured via onLayout
    const railWidth = useSharedValue(300); // default; recalculated on layout
    const [measuredWidth, setMeasuredWidth] = React.useState(300);
    const duration = useSharedValue(initialDuration ?? 60);

    // Handle positions (0 = left edge, railWidth = right edge)
    const leftX = useSharedValue(0);
    const rightX = useSharedValue(300);
    const leftStart = useSharedValue(0);
    const rightStart = useSharedValue(300);

    // Playback state
    const soundRef = useRef<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [startLabel, setStartLabel] = React.useState('00:00');
    const [endLabel, setEndLabel] = React.useState(initialDuration ? formatTime(initialDuration) : '01:00');

    // Sync duration when it changes
    useEffect(() => {
        if (initialDuration && initialDuration > 0) {
            duration.value = initialDuration;
            rightX.value = measuredWidth;
            rightStart.value = measuredWidth;
            setEndLabel(formatTime(initialDuration));
        }
    }, [initialDuration, measuredWidth]);

    // Generate pseudo-random waveform bars (deterministic from URI)
    const waveBars = useMemo(() => {
        let seed = 0;
        for (let i = 0; i < fileUri.length; i++) seed = (seed * 31 + fileUri.charCodeAt(i)) & 0x7fffffff;
        return Array.from({ length: BAR_COUNT }, (_, i) => {
            seed = (seed * 16807 + i) % 2147483647;
            return 0.15 + (seed % 1000) / 1000 * 0.85; // 0.15–1.0
        });
    }, [fileUri]);

    // ── Layout ──
    const onLayout = useCallback((e: LayoutChangeEvent) => {
        const w = e.nativeEvent.layout.width;
        railWidth.value = w;
        setMeasuredWidth(w);
        // Reset right handle to full width
        rightX.value = w;
        rightStart.value = w;
    }, []);

    // ── Time helpers (called from UI thread via runOnJS) ──
    const updateStartLabel = useCallback((x: number, rw: number) => {
        const ratio = rw > 0 ? x / rw : 0;
        setStartLabel(formatTime(ratio * duration.value));
    }, [duration]);

    const updateEndLabel = useCallback((x: number, rw: number) => {
        const ratio = rw > 0 ? x / rw : 0;
        setEndLabel(formatTime(ratio * duration.value));
    }, [duration]);

    const emitTrimChange = useCallback((lx: number, rx: number, rw: number) => {
        const ratio = rw > 0 ? 1 / rw : 0;
        onTrimChange(formatTime(lx * ratio * duration.value), formatTime(rx * ratio * duration.value));
    }, [duration, onTrimChange]);

    // ── Gestures ──

    const leftGesture = Gesture.Pan()
        .onStart(() => {
            leftStart.value = leftX.value;
        })
        .onUpdate((e) => {
            const newX = clamp(leftStart.value + e.translationX, 0, rightX.value - MIN_REGION_PX);
            leftX.value = newX;
            runOnJS(updateStartLabel)(newX, railWidth.value);
        })
        .onEnd(() => {
            runOnJS(emitTrimChange)(leftX.value, rightX.value, railWidth.value);
        });

    const rightGesture = Gesture.Pan()
        .onStart(() => {
            rightStart.value = rightX.value;
        })
        .onUpdate((e) => {
            const newX = clamp(rightStart.value + e.translationX, leftX.value + MIN_REGION_PX, railWidth.value);
            rightX.value = newX;
            runOnJS(updateEndLabel)(newX, railWidth.value);
        })
        .onEnd(() => {
            runOnJS(emitTrimChange)(leftX.value, rightX.value, railWidth.value);
        });

    // ── Animated styles ──

    const leftHandleStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: leftX.value }],
    }));

    const rightHandleStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: rightX.value - HANDLE_W }],
    }));

    const regionStyle = useAnimatedStyle(() => ({
        left: leftX.value,
        width: rightX.value - leftX.value,
    }));

    const leftMaskStyle = useAnimatedStyle(() => ({
        width: leftX.value,
    }));

    const rightMaskStyle = useAnimatedStyle(() => ({
        left: rightX.value,
        right: 0,
    }));

    // ── Playback ──

    const loadAndPlay = useCallback(async () => {
        try {
            // Unload previous
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
            });

            const { sound, status } = await Audio.Sound.createAsync(
                { uri: fileUri },
                { shouldPlay: false },
            );

            soundRef.current = sound;

            // Determine playback range from handle positions
            const rw = railWidth.value;
            const lRatio = rw > 0 ? leftX.value / rw : 0;
            const rRatio = rw > 0 ? rightX.value / rw : 1;
            const startMs = lRatio * duration.value * 1000;
            const endMs = rRatio * duration.value * 1000;

            await sound.setPositionAsync(Math.round(startMs));
            await sound.playAsync();
            setIsPlaying(true);

            // Stop at end position
            sound.setOnPlaybackStatusUpdate((s: AVPlaybackStatus) => {
                if (!s.isLoaded) return;
                if (s.positionMillis >= endMs || s.didJustFinish) {
                    sound.stopAsync();
                    setIsPlaying(false);
                }
            });
        } catch (err) {
            console.error('AudioTrimmer playback error:', err);
            setIsPlaying(false);
        }
    }, [fileUri, duration]);

    const stopPlayback = useCallback(async () => {
        if (soundRef.current) {
            await soundRef.current.stopAsync();
            setIsPlaying(false);
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            soundRef.current?.unloadAsync();
        };
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>TRIM RANGE</Text>

            {/* Time labels */}
            <View style={styles.timeRow}>
                <View style={[styles.timeBadge, { backgroundColor: accent + '18' }]}>
                    <Text style={[styles.timeText, { color: accent }]}>{startLabel}</Text>
                </View>
                <Text style={[styles.timeDash, { color: theme.textSecondary }]}>→</Text>
                <View style={[styles.timeBadge, { backgroundColor: accent + '18' }]}>
                    <Text style={[styles.timeText, { color: accent }]}>{endLabel}</Text>
                </View>
            </View>

            {/* Waveform track */}
            <View style={styles.trackWrap} onLayout={onLayout}>
                {/* Waveform bars */}
                <View style={styles.waveformRow}>
                    {waveBars.map((h, i) => (
                        <View
                            key={i}
                            style={[
                                styles.bar,
                                {
                                    height: h * 48,
                                    backgroundColor: accent + '50',
                                },
                            ]}
                        />
                    ))}
                </View>

                {/* Selected region highlight */}
                <Animated.View style={[styles.region, regionStyle, { backgroundColor: accent + '22', borderColor: accent + '80' }]} />

                {/* Left dimmed mask */}
                <Animated.View style={[styles.maskLeft, leftMaskStyle]} />
                {/* Right dimmed mask */}
                <Animated.View style={[styles.maskRight, rightMaskStyle]} />

                {/* Left handle */}
                <GestureDetector gesture={leftGesture}>
                    <Animated.View style={[styles.handle, leftHandleStyle, { backgroundColor: accent }]}>
                        <View style={styles.handleBar} />
                        <View style={styles.handleBar} />
                    </Animated.View>
                </GestureDetector>

                {/* Right handle */}
                <GestureDetector gesture={rightGesture}>
                    <Animated.View style={[styles.handle, rightHandleStyle, { backgroundColor: accent }]}>
                        <View style={styles.handleBar} />
                        <View style={styles.handleBar} />
                    </Animated.View>
                </GestureDetector>
            </View>

            {/* Play preview button */}
            <TouchableOpacity
                style={[styles.playBtn, { backgroundColor: accent }]}
                onPress={isPlaying ? stopPlayback : loadAndPlay}
                activeOpacity={0.8}
            >
                <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
                <Text style={styles.playText}>{isPlaying ? 'Stop Preview' : 'Play Preview'}</Text>
            </TouchableOpacity>
        </View>
    );
};

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        marginBottom: 16,
    },
    timeBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    timeText: {
        fontSize: 18,
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
    },
    timeDash: {
        fontSize: 20,
        fontWeight: '300',
    },
    trackWrap: {
        height: 68,
        position: 'relative',
        marginBottom: 16,
        justifyContent: 'center',
    },
    waveformRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 48,
        gap: 2,
        paddingHorizontal: 2,
        justifyContent: 'space-evenly',
    },
    bar: {
        flex: 1,
        borderRadius: 2,
        maxWidth: 6,
    },
    region: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        borderWidth: 1,
        borderRadius: 4,
    },
    maskLeft: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderTopLeftRadius: 4,
        borderBottomLeftRadius: 4,
    },
    maskRight: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
    },
    handle: {
        position: 'absolute',
        top: -2,
        width: HANDLE_W,
        height: 72,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    handleBar: {
        width: 3,
        height: 18,
        borderRadius: 1.5,
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    playBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 12,
        paddingVertical: 12,
    },
    playIcon: {
        fontSize: 16,
        color: '#FFF',
    },
    playText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
    },
});

export default AudioTrimmer;
