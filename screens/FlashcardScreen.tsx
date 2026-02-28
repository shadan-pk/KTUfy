import React, { useState, useRef } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
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
    const [topic, setTopic] = useState('');
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const flipAnim = useRef(new Animated.Value(0)).current;

    const handleGenerate = async () => {
        const trimmed = topic.trim();
        if (!trimmed) {
            Alert.alert('Enter a Topic', 'Please type a topic to generate flashcards.');
            return;
        }

        setIsLoading(true);
        setFlashcards([]);
        setCurrentIndex(0);
        setIsFlipped(false);
        flipAnim.setValue(0);

        try {
            const response = await generateFlashcards(trimmed, 10);
            if (response.flashcards && response.flashcards.length > 0) {
                setFlashcards(response.flashcards);
                setHasGenerated(true);
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
        setIsFlipped(false);
        flipAnim.setValue(0);
        if (direction === 'next') {
            setCurrentIndex((prev) => (prev + 1) % flashcards.length);
        } else {
            setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
        }
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
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

            {/* Header */}
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.background }}>
                <View style={[styles.header, { borderBottomColor: theme.divider }]}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>🎴 AI Flashcards</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Topic Input */}
                <View style={[styles.inputCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Enter a Topic</Text>
                    <Text style={[styles.inputHint, { color: theme.textSecondary }]}>
                        Generate flashcards on any subject or concept
                    </Text>
                    <View style={[styles.inputRow, { borderColor: theme.border }]}>
                        <TextInput
                            style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
                            placeholder="e.g., Binary Trees, OSI Model..."
                            placeholderTextColor={theme.textTertiary}
                            value={topic}
                            onChangeText={setTopic}
                            returnKeyType="go"
                            onSubmitEditing={handleGenerate}
                            editable={!isLoading}
                        />
                        <TouchableOpacity
                            style={[styles.generateButton, isLoading && styles.generateButtonDisabled]}
                            onPress={handleGenerate}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.generateButtonText}>Generate</Text>
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
                            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                                Card {currentIndex + 1} of {flashcards.length}
                            </Text>
                            <Text style={[styles.topicBadge, { backgroundColor: theme.primary + '18', color: theme.primary }]}>
                                {topic}
                            </Text>
                        </View>

                        {/* Progress Bar */}
                        <View style={[styles.progressBar, { backgroundColor: theme.divider }]}>
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
                                style={[styles.navButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                                onPress={() => goToCard('prev')}
                            >
                                <Text style={[styles.navButtonText, { color: theme.text }]}>← Previous</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.navButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                                onPress={() => goToCard('next')}
                            >
                                <Text style={[styles.navButtonText, { color: theme.text }]}>Next →</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Regenerate */}
                        <TouchableOpacity
                            style={[styles.regenerateButton, { borderColor: theme.primary }]}
                            onPress={handleGenerate}
                        >
                            <Text style={[styles.regenerateText, { color: theme.primary }]}>🔄 Regenerate Cards</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
    backIcon: {
        fontSize: 22,
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    // Input Card
    inputCard: {
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 4,
    },
    inputHint: {
        fontSize: 13,
        marginBottom: 14,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    input: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        paddingHorizontal: 14,
        fontSize: 15,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    generateButton: {
        backgroundColor: '#8B5CF6',
        height: 46,
        paddingHorizontal: 18,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    generateButtonDisabled: {
        opacity: 0.6,
    },
    generateButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    // Suggestions
    suggestedContainer: {
        marginTop: 14,
    },
    suggestedLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    // Loading
    loadingCard: {
        borderRadius: 16,
        padding: 40,
        borderWidth: 1,
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 14,
        marginTop: 16,
        textAlign: 'center',
    },
    // Card Section
    cardSection: {
        marginTop: 4,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    progressText: {
        fontSize: 13,
        fontWeight: '600',
    },
    topicBadge: {
        fontSize: 12,
        fontWeight: '600',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
        overflow: 'hidden',
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 20,
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    // Flashcard
    cardContainer: {
        height: 260,
        marginBottom: 20,
    },
    card: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 20,
        padding: 28,
        justifyContent: 'center',
        alignItems: 'center',
        backfaceVisibility: 'hidden',
        borderWidth: 2,
        // Shadow
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    cardBack: {
        position: 'absolute',
        top: 0,
    },
    cardSide: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    cardContent: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 28,
    },
    cardHint: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 16,
    },
    // Nav
    navRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 16,
    },
    navButton: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    regenerateButton: {
        borderWidth: 1.5,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    regenerateText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default FlashcardScreen;
