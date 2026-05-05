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
import { ArrowLeft, Layers, Zap, CheckCircle2, XCircle, Trophy, RefreshCcw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <View style={styles.headerBackground}>
                <LinearGradient
                    colors={['#2563EB', '#1E3A8A']}
                    style={StyleSheet.absoluteFill}
                />
                <SafeAreaView edges={['top']} style={styles.headerContent}>
                    <View style={styles.headerTopRow}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <ArrowLeft size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitleText}>Match the Following</Text>
                        <View style={{ width: 44 }} />
                    </View>
                    <View style={styles.headerSummary}>
                        <Text style={styles.welcomeText}>Focus & Pair</Text>
                        <Text style={styles.subtitleText}>Connect the terms to their definitions.</Text>
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {!hasStarted ? (
                    <View style={[styles.inputCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Enter a Topic</Text>
                        <View style={[styles.inputRow, { borderColor: theme.border, backgroundColor: theme.backgroundTertiary }]}>
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                placeholder="e.g., Computer Networks, DBMS..."
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
                                {isLoading ? <ActivityIndicator color="#FFF" size="small" /> : <Zap size={18} color="#FFF" />}
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : matched.size === pairs.length ? (
                    <View style={[styles.resultCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                        <View style={[styles.resultIconBox, { backgroundColor: theme.primary + '1A' }]}>
                            <Trophy size={48} color={theme.primary} />
                        </View>
                        <Text style={[styles.resultTitle, { color: theme.text }]}>Game Over!</Text>
                        <Text style={[styles.resultScore, { color: theme.primary }]}>{score} / {pairs.length}</Text>
                        <Text style={[styles.resultMsg, { color: theme.textSecondary }]}>
                            Took you {attempts} attempts. Great work!
                        </Text>
                        <TouchableOpacity 
                            style={[styles.retryBtn, { backgroundColor: theme.primary }]} 
                            onPress={() => { setHasStarted(false); }}
                        >
                            <Text style={styles.retryText}>New Topic</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.gameSection}>
                        <View style={styles.progressRow}>
                            <Text style={[styles.progressText, { color: theme.textTertiary }]}>MATCHED {matched.size} OF {pairs.length}</Text>
                            <View style={[styles.scoreBadge, { backgroundColor: theme.primary + '1A' }]}>
                                <Text style={[styles.scoreBadgeText, { color: theme.primary }]}>Attempts: {attempts}</Text>
                            </View>
                        </View>
                        <View style={[styles.progressBar, { backgroundColor: theme.backgroundTertiary }]}>
                            <View style={[styles.progressFill, { width: `${(matched.size / pairs.length) * 100}%`, backgroundColor: theme.primary }]} />
                        </View>
                        <View style={styles.matchGrid}>
                            <View style={styles.column}>
                                <Text style={[styles.colTitle, { color: theme.textTertiary }]}>TERMS</Text>
                                {pairs.map((pair, idx) => {
                                    const isMatched = matched.has(idx);
                                    const isSelected = selectedTerm === idx;
                                    const isWrong = wrongPair?.term === idx;
                                    let borderColor = theme.border;
                                    let bgColor = theme.backgroundSecondary;
                                    if (isMatched) { borderColor = '#10B981'; bgColor = '#10B9811A'; }
                                    else if (isWrong) { borderColor = '#EF4444'; bgColor = '#EF44441A'; }
                                    else if (isSelected) { borderColor = theme.primary; bgColor = theme.primary + '1A'; }
                                    return (
                                        <TouchableOpacity 
                                            key={idx} 
                                            style={[styles.matchItem, { backgroundColor: bgColor, borderColor }]}
                                            onPress={() => handleTermSelect(idx)}
                                            disabled={isMatched}
                                        >
                                            <Text style={[styles.itemText, { color: isMatched ? '#10B981' : theme.text }]} numberOfLines={3}>{pair.term}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            <View style={styles.column}>
                                <Text style={[styles.colTitle, { color: theme.textTertiary }]}>DEFINITIONS</Text>
                                {shuffledDefinitions.map((def, idx) => {
                                    const matchedPairIdx = pairs.findIndex(p => p.definition === def);
                                    const isMatched = matched.has(matchedPairIdx);
                                    const isSelected = selectedDef === idx;
                                    const isWrong = wrongPair?.def === idx;
                                    let borderColor = theme.border;
                                    let bgColor = theme.backgroundSecondary;
                                    if (isMatched) { borderColor = '#10B981'; bgColor = '#10B9811A'; }
                                    else if (isWrong) { borderColor = '#EF4444'; bgColor = '#EF44441A'; }
                                    else if (isSelected) { borderColor = theme.primary; bgColor = theme.primary + '1A'; }
                                    return (
                                        <TouchableOpacity 
                                            key={idx} 
                                            style={[styles.matchItem, { backgroundColor: bgColor, borderColor }]}
                                            onPress={() => handleDefSelect(idx)}
                                            disabled={isMatched}
                                        >
                                            <Text style={[styles.itemText, { color: isMatched ? '#10B981' : theme.text, fontSize: 11 }]} numberOfLines={4}>{def}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                        <TouchableOpacity style={[styles.resetBtn, { borderColor: theme.border }]} onPress={() => handleGenerate()}>
                            <RefreshCcw size={16} color={theme.textTertiary} />
                            <Text style={[styles.resetText, { color: theme.textTertiary }]}>Restart Game</Text>
                        </TouchableOpacity>
                    </View>
                )}
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
    scroll: { flex: 1 },
    scrollContent: { padding: 20, marginTop: -20 },

    // Input Card
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

    // Game Section
    gameSection: { flex: 1 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 20, paddingHorizontal: 4 },
    progressText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    scoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    scoreBadgeText: { fontSize: 12, fontWeight: '700' },
    progressBar: { height: 6, borderRadius: 3, marginBottom: 25, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },

    matchGrid: { flexDirection: 'row', gap: 15 },
    column: { flex: 1 },
    colTitle: { fontSize: 11, fontWeight: '800', marginBottom: 12, letterSpacing: 1, textAlign: 'center' },
    matchItem: {
        borderRadius: 15,
        padding: 12,
        borderWidth: 2,
        marginBottom: 12,
        minHeight: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },

    resetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        gap: 8,
        borderStyle: 'dashed',
    },
    resetText: { fontSize: 13, fontWeight: '700' },

    // Result Card
    resultCard: {
        borderRadius: 24,
        padding: 40,
        borderWidth: 1,
        alignItems: 'center',
        marginTop: 20,
    },
    resultIconBox: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    resultTitle: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
    resultScore: { fontSize: 40, fontWeight: '800', marginBottom: 12 },
    resultMsg: { fontSize: 16, textAlign: 'center', marginBottom: 30, lineHeight: 24 },
    retryBtn: { paddingVertical: 16, paddingHorizontal: 30, borderRadius: 15 },
    retryText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

export default MatchGameScreen;
