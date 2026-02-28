import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    ScrollView,
    Alert,
    Platform,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { generateMatchPairs, MatchPair } from '../services/quizService';

type Props = {
    navigation: StackNavigationProp<RootStackParamList, 'MatchGame'>;
    route: RouteProp<RootStackParamList, 'MatchGame'>;
};

const MatchGameScreen: React.FC<Props> = ({ navigation, route }) => {
    const { theme, isDark } = useTheme();
    const initialTopic = route.params?.topic || '';

    const [topic, setTopic] = useState(initialTopic);
    const [pairs, setPairs] = useState<MatchPair[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    // Game state
    const [shuffledDefinitions, setShuffledDefinitions] = useState<string[]>([]);
    const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
    const [selectedDef, setSelectedDef] = useState<number | null>(null);
    const [matched, setMatched] = useState<Set<number>>(new Set());
    const [wrongPair, setWrongPair] = useState<{ term: number; def: number } | null>(null);
    const [score, setScore] = useState(0);
    const [attempts, setAttempts] = useState(0);

    useEffect(() => {
        if (initialTopic) {
            handleGenerate(initialTopic);
        }
    }, []);

    const handleGenerate = async (t?: string) => {
        const useTopic = (t || topic).trim();
        if (!useTopic) {
            Alert.alert('Enter a Topic', 'Please type a topic to generate match pairs.');
            return;
        }

        setIsLoading(true);
        setHasStarted(false);
        setPairs([]);
        setMatched(new Set());
        setScore(0);
        setAttempts(0);
        setSelectedTerm(null);
        setSelectedDef(null);
        setWrongPair(null);

        try {
            const response = await generateMatchPairs(useTopic, 6);
            if (response.pairs && response.pairs.length > 0) {
                setPairs(response.pairs);
                // Shuffle definitions
                const defs = response.pairs.map(p => p.definition);
                setShuffledDefinitions(defs.sort(() => Math.random() - 0.5));
                setHasStarted(true);
            } else {
                Alert.alert('No Pairs', 'Could not generate match pairs. Try a different topic.');
            }
        } catch (error: any) {
            Alert.alert('Error', 'Failed to generate match pairs. Backend may not be available.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTermSelect = (index: number) => {
        if (matched.has(index)) return;
        setSelectedTerm(index);
        setWrongPair(null);

        if (selectedDef !== null) {
            checkMatch(index, selectedDef);
        }
    };

    const handleDefSelect = (index: number) => {
        // Check if this definition is already matched
        const defText = shuffledDefinitions[index];
        const matchedDefs = [...matched].map(i => pairs[i].definition);
        if (matchedDefs.includes(defText)) return;

        setSelectedDef(index);
        setWrongPair(null);

        if (selectedTerm !== null) {
            checkMatch(selectedTerm, index);
        }
    };

    const checkMatch = (termIdx: number, defIdx: number) => {
        setAttempts(prev => prev + 1);
        const term = pairs[termIdx];
        const selectedDefText = shuffledDefinitions[defIdx];

        if (term.definition === selectedDefText) {
            // Correct match!
            const newMatched = new Set(matched);
            newMatched.add(termIdx);
            setMatched(newMatched);
            setScore(prev => prev + 1);
            setSelectedTerm(null);
            setSelectedDef(null);

            if (newMatched.size === pairs.length) {
                setTimeout(() => {
                    Alert.alert('🎉 All Matched!', `Score: ${score + 1}/${pairs.length}\nAttempts: ${attempts + 1}`);
                }, 300);
            }
        } else {
            // Wrong match
            setWrongPair({ term: termIdx, def: defIdx });
            setTimeout(() => {
                setSelectedTerm(null);
                setSelectedDef(null);
                setWrongPair(null);
            }, 800);
        }
    };

    const isDefMatched = (defIdx: number) => {
        const defText = shuffledDefinitions[defIdx];
        return [...matched].some(i => pairs[i].definition === defText);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.background }}>
                <View style={[styles.header, { borderBottomColor: theme.divider }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>🔗 Match the Following</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                {/* Topic Input */}
                {!hasStarted && (
                    <View style={[styles.inputCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                        <Text style={[styles.inputLabel, { color: theme.text }]}>Choose a Topic</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
                                placeholder="e.g., OSI Model layers..."
                                placeholderTextColor={theme.textTertiary}
                                value={topic}
                                onChangeText={setTopic}
                                editable={!isLoading}
                                returnKeyType="go"
                                onSubmitEditing={() => handleGenerate()}
                            />
                            <TouchableOpacity
                                style={[styles.generateBtn, isLoading && { opacity: 0.6 }]}
                                onPress={() => handleGenerate()}
                                disabled={isLoading}
                            >
                                {isLoading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.generateBtnText}>Start</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {isLoading && (
                    <View style={[styles.loadingCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Generating match pairs...</Text>
                    </View>
                )}

                {/* Game Board */}
                {hasStarted && !isLoading && (
                    <View>
                        {/* Score */}
                        <View style={styles.scoreRow}>
                            <Text style={[styles.scoreText, { color: theme.textSecondary }]}>
                                Matched: {score}/{pairs.length}
                            </Text>
                            <Text style={[styles.scoreText, { color: theme.textSecondary }]}>
                                Attempts: {attempts}
                            </Text>
                            <Text style={[styles.topicBadge, { backgroundColor: theme.primary + '18', color: theme.primary }]}>
                                {topic}
                            </Text>
                        </View>

                        {/* Match columns */}
                        <View style={styles.gameBoard}>
                            {/* Terms Column */}
                            <View style={styles.column}>
                                <Text style={[styles.columnLabel, { color: theme.textSecondary }]}>Terms</Text>
                                {pairs.map((pair, i) => {
                                    const isMatched = matched.has(i);
                                    const isSelected = selectedTerm === i;
                                    const isWrong = wrongPair?.term === i;

                                    return (
                                        <TouchableOpacity
                                            key={`t-${i}`}
                                            style={[
                                                styles.card,
                                                { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
                                                isMatched && styles.cardMatched,
                                                isSelected && { borderColor: theme.primary, borderWidth: 2 },
                                                isWrong && styles.cardWrong,
                                            ]}
                                            onPress={() => handleTermSelect(i)}
                                            disabled={isMatched}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[
                                                styles.cardText,
                                                { color: theme.text },
                                                isMatched && styles.cardTextMatched,
                                            ]}>{pair.term}</Text>
                                            {isMatched && <Text style={styles.checkIcon}>✓</Text>}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Definitions Column */}
                            <View style={styles.column}>
                                <Text style={[styles.columnLabel, { color: theme.textSecondary }]}>Definitions</Text>
                                {shuffledDefinitions.map((def, i) => {
                                    const defMatched = isDefMatched(i);
                                    const isSelected = selectedDef === i;
                                    const isWrong = wrongPair?.def === i;

                                    return (
                                        <TouchableOpacity
                                            key={`d-${i}`}
                                            style={[
                                                styles.card,
                                                { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
                                                defMatched && styles.cardMatched,
                                                isSelected && { borderColor: '#8B5CF6', borderWidth: 2 },
                                                isWrong && styles.cardWrong,
                                            ]}
                                            onPress={() => handleDefSelect(i)}
                                            disabled={defMatched}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[
                                                styles.cardText,
                                                { color: theme.text },
                                                defMatched && styles.cardTextMatched,
                                                { fontSize: 12 },
                                            ]}>{def}</Text>
                                            {defMatched && <Text style={styles.checkIcon}>✓</Text>}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Play Again */}
                        {matched.size === pairs.length && (
                            <TouchableOpacity
                                style={[styles.playAgainBtn, { borderColor: theme.primary }]}
                                onPress={() => { setHasStarted(false); setPairs([]); }}
                            >
                                <Text style={[styles.playAgainText, { color: theme.primary }]}>🔄 Play Again</Text>
                            </TouchableOpacity>
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
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    },
    backIcon: { fontSize: 22, fontWeight: '500' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    scroll: { flex: 1 },
    scrollContent: { padding: 16 },
    inputCard: { borderRadius: 16, padding: 18, borderWidth: 1, marginBottom: 16 },
    inputLabel: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
    inputRow: { flexDirection: 'row', gap: 10 },
    input: { flex: 1, height: 46, borderRadius: 12, paddingHorizontal: 14, fontSize: 15 },
    generateBtn: { backgroundColor: '#8B5CF6', height: 46, paddingHorizontal: 18, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    generateBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    loadingCard: { borderRadius: 16, padding: 40, borderWidth: 1, alignItems: 'center' },
    loadingText: { fontSize: 14, marginTop: 16 },
    scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    scoreText: { fontSize: 13, fontWeight: '600' },
    topicBadge: { fontSize: 12, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
    gameBoard: { flexDirection: 'row', gap: 12 },
    column: { flex: 1 },
    columnLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, textAlign: 'center' },
    card: {
        borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, minHeight: 56,
        justifyContent: 'center', alignItems: 'center', position: 'relative',
    },
    cardMatched: { backgroundColor: '#10B98120', borderColor: '#10B981' },
    cardWrong: { backgroundColor: '#EF444420', borderColor: '#EF4444' },
    cardText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
    cardTextMatched: { textDecorationLine: 'line-through', opacity: 0.6 },
    checkIcon: { position: 'absolute', top: 4, right: 6, fontSize: 12, color: '#10B981' },
    playAgainBtn: { borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 20 },
    playAgainText: { fontSize: 14, fontWeight: '600' },
});

export default MatchGameScreen;
