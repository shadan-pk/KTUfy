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
    headerBackground: { paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden' },
    headerContent: { paddingHorizontal: 20, paddingTop: 10 },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    headerTitleText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
    headerSummary: { marginTop: 5, paddingLeft: 4 },
    welcomeText: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 4 },
    subtitleText: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
    scroll: { flex: 1 },
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
