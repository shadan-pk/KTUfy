import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Animated,
    Dimensions,
    ActivityIndicator,
    ScrollView,
    Alert,
    Platform,
    StatusBar,
} from 'react-native';
import { ArrowLeft, Zap, Layers, RefreshCcw, ChevronLeft, ChevronRight, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { generateFlashcards, Flashcard } from '../services/flashcardService';
import { FlashcardScreenSkeleton } from '../components/SkeletonLoader';

type FlashcardScreenProps = {
    navigation: StackNavigationProp<RootStackParamList, 'Flashcards'>;
};

const { width } = Dimensions.get('window');

const FlashcardScreen: React.FC<FlashcardScreenProps> = ({ navigation }) => {
    const { theme, isDark } = useTheme();
    const route = useRoute<RouteProp<RootStackParamList, 'Flashcards'>>();
    const initialTopic = route.params?.topic || '';
    const [topic, setTopic] = useState(initialTopic);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [isCached, setIsCached] = useState(false);
    const flipAnim = useRef(new Animated.Value(0)).current;

    // Auto-generate when navigated with a topic (e.g., from chatbot)
    useEffect(() => {
        if (initialTopic) {
            handleGenerate();
        }
    }, []);

    const handleGenerate = async (forceRegenerate: boolean = false) => {
        const trimmed = topic.trim();
        if (!trimmed) {
            Alert.alert('Enter a Topic', 'Please type a topic to generate flashcards.');
            return;
        }

        setIsLoading(true);
        setFlashcards([]);
        setCurrentIndex(0);
        setIsFlipped(false);
        setIsCached(false);
        flipAnim.setValue(0);

        try {
            const response = await generateFlashcards(trimmed, 10, forceRegenerate);
            if (response.flashcards && response.flashcards.length > 0) {
                setFlashcards(response.flashcards);
                setHasGenerated(true);
                setIsCached(response.cached ?? false);
            } else {
                Alert.alert('No Flashcards', 'Could not generate flashcards for this topic. Try a different one.');
            }
        } catch (error: any) {
            console.error('Error generating flashcards:', error);
            Alert.alert(
                'Generation Failed',
                error?.name === 'AbortError'
                    ? 'Server is not responding. Please check your connection.'
                    : 'Failed to generate flashcards. The backend may not have this endpoint yet.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const flipCard = () => {
        const toValue = isFlipped ? 0 : 1;
        Animated.spring(flipAnim, {
            toValue,
            friction: 8,
            tension: 10,
            useNativeDriver: true,
        }).start();
        setIsFlipped(!isFlipped);
    };

    const goToCard = (direction: 'next' | 'prev') => {
        // Reset flip instantly before changing card
        flipAnim.stopAnimation();
        flipAnim.setValue(0);
        setIsFlipped(false);
        // Use setTimeout to let the animation reset take effect before changing content
        setTimeout(() => {
            if (direction === 'next') {
                setCurrentIndex((prev) => (prev + 1) % flashcards.length);
            } else {
                setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
            }
        }, 50);
    };

    const frontInterpolate = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });
    const backInterpolate = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['180deg', '360deg'],
    });

    const frontAnimatedStyle = { transform: [{ rotateY: frontInterpolate }] };
    const backAnimatedStyle = { transform: [{ rotateY: backInterpolate }] };

    const currentCard = flashcards[currentIndex];

    // Suggested topics for quick selection
    const suggestedTopics = [
        'Data Structures',
        'Operating Systems',
        'DBMS',
        'Computer Networks',
        'Machine Learning',
        'Web Development',
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Header with Gradient */}
            <View style={styles.headerBackground}>
        <LinearGradient
          colors={['#06070a', '#1E3A8A']}
          style={StyleSheet.absoluteFill}
        />
                <SafeAreaView edges={['top']} style={styles.headerContent}>
                    <View style={styles.headerTopRow}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <ArrowLeft size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitleText}>AI Flashcards</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <View style={styles.headerSummary}>
                        <Text style={styles.welcomeText}>Flashcard Hub</Text>
                        <Text style={styles.subtitleText}>Master any topic with AI-generated cards.</Text>
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Topic Input */}
                <View style={[styles.inputCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Enter a Topic</Text>
                    <View style={[styles.inputRow, { borderColor: theme.border, backgroundColor: theme.backgroundTertiary }]}>
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="e.g., Binary Trees, DBMS..."
                            placeholderTextColor={theme.textTertiary}
                            value={topic}
                            onChangeText={setTopic}
                            returnKeyType="go"
                            onSubmitEditing={() => handleGenerate()}
                            editable={!isLoading}
                        />
                        <TouchableOpacity
                            style={[styles.generateButton, isLoading && styles.generateButtonDisabled]}
                            onPress={() => handleGenerate()}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Zap size={18} color="#FFF" />
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Quick Topics */}
                    {!hasGenerated && (
                        <View style={styles.suggestedContainer}>
                            <Text style={[styles.suggestedLabel, { color: theme.textSecondary }]}>Quick picks:</Text>
                            <View style={styles.chipRow}>
                                {suggestedTopics.map((t) => (
                                    <TouchableOpacity
                                        key={t}
                                        style={[styles.chip, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}
                                        onPress={() => {
                                            setTopic(t);
                                        }}
                                    >
                                        <Text style={[styles.chipText, { color: theme.primary }]}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* Loading State */}
                {isLoading && <FlashcardScreenSkeleton />}

                {/* Flashcard Display */}
                {flashcards.length > 0 && !isLoading && (
                    <View style={styles.cardSection}>
                        {/* Progress */}
                        <View style={styles.progressRow}>
                            <Text style={[styles.progressText, { color: theme.textTertiary }]}>
                                CARD {currentIndex + 1} OF {flashcards.length}
                            </Text>
                            <View style={[styles.topicBadge, { backgroundColor: theme.primary + '1A' }]}>
                                <Text style={[styles.topicBadgeText, { color: theme.primary }]}>{topic}</Text>
                            </View>
                        </View>

                        {/* Progress Bar */}
                        <View style={[styles.progressBar, { backgroundColor: theme.backgroundTertiary }]}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${((currentIndex + 1) / flashcards.length) * 100}%`,
                                        backgroundColor: theme.primary,
                                    },
                                ]}
                            />
                        </View>

                        {/* The Flashcard */}
                        <TouchableOpacity activeOpacity={0.9} onPress={flipCard} style={styles.cardContainer}>
                            {/* Front */}
                            <Animated.View
                                style={[
                                    styles.card,
                                    frontAnimatedStyle,
                                    { backgroundColor: theme.primary, borderColor: theme.primary },
                                ]}
                            >
                                <Text style={styles.cardSide}>Question</Text>
                                <Text style={styles.cardContent}>{currentCard?.front}</Text>
                                <Text style={styles.cardHint}>Tap to flip</Text>
                            </Animated.View>

                            {/* Back */}
                            <Animated.View
                                style={[
                                    styles.card,
                                    styles.cardBack,
                                    backAnimatedStyle,
                                    { backgroundColor: '#10B981', borderColor: '#059669' },
                                ]}
                            >
                                <Text style={styles.cardSide}>Answer</Text>
                                <Text style={styles.cardContent}>{currentCard?.back}</Text>
                                <Text style={styles.cardHint}>Tap to flip back</Text>
                            </Animated.View>
                        </TouchableOpacity>

                        {/* Navigation */}
                        <View style={styles.navRow}>
                            <TouchableOpacity
                                style={[styles.navBtnCircle, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }, currentIndex === 0 && styles.navBtnDisabled]}
                                onPress={() => goToCard('prev')}
                                disabled={currentIndex === 0}
                            >
                                <ChevronLeft size={24} color={currentIndex === 0 ? theme.textTertiary : theme.text} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.regenerateBtn, { backgroundColor: theme.primary + '1A', borderColor: theme.primary }]}
                                onPress={() => handleGenerate(true)}
                            >
                                <RefreshCcw size={18} color={theme.primary} />
                                <Text style={[styles.regenerateBtnText, { color: theme.primary }]}>REGENERATE</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.navBtnCircle, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }, currentIndex === flashcards.length - 1 && styles.navBtnDisabled]}
                                onPress={() => goToCard('next')}
                                disabled={currentIndex === flashcards.length - 1}
                            >
                                <ChevronRight size={24} color={currentIndex === flashcards.length - 1 ? theme.textTertiary : theme.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Cached indicator */}
                        {isCached && (
                            <View style={[styles.cachedBadge, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                                <Clock size={12} color={theme.textTertiary} style={{ marginRight: 6 }} />
                                <Text style={[styles.cachedBadgeText, { color: theme.textTertiary }]}>Loaded from local archive</Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerBackground: {
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden',
    },
    headerContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    headerSummary: {
        marginTop: 5,
        paddingLeft: 4,
    },
    welcomeText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 4,
    },
    subtitleText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20, marginTop: -20 },
    inputCard: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        marginBottom: 20,
        marginTop: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    inputRow: {
        flexDirection: 'row',
        borderRadius: 15,
        borderWidth: 1.5,
        overflow: 'hidden',
        padding: 6,
    },
    input: {
        flex: 1,
        paddingHorizontal: 12,
        fontSize: 15,
        fontWeight: '500',
    },
    generateButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    generateButtonDisabled: {
        backgroundColor: '#94A3B8',
    },
    suggestedContainer: { marginTop: 16, paddingLeft: 4 },
    suggestedLabel: { fontSize: 12, fontWeight: '600', marginBottom: 10 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5 },
    chipText: { fontSize: 13, fontWeight: '700' },
    cardSection: { marginTop: 10 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 },
    progressText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    topicBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    topicBadgeText: { fontSize: 12, fontWeight: '700' },
    progressBar: { height: 6, borderRadius: 3, marginBottom: 25, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    cardContainer: {
        width: '100%',
        height: 380,
        perspective: 1000,
    },
    card: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        padding: 30,
        justifyContent: 'center',
        alignItems: 'center',
        backfaceVisibility: 'hidden',
        position: 'absolute',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 2,
    },
    cardSide: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 2,
        color: 'rgba(255,255,255,0.7)',
        position: 'absolute',
        top: 30,
    },
    cardContent: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        color: '#FFFFFF',
        lineHeight: 32,
    },
    cardHint: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        position: 'absolute',
        bottom: 30,
        fontWeight: '600',
    },
    // Nav
    navRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 30,
        paddingHorizontal: 10,
    },
    navBtnCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    },
    navBtnDisabled: {
        opacity: 0.4,
    },
    regenerateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 15,
        borderWidth: 1.5,
        gap: 10,
    },
    regenerateBtnText: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
    },
    cachedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 25,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    cachedBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
});

export default FlashcardScreen;
