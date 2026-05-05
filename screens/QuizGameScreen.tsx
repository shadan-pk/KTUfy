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
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Brain, Zap, CheckCircle2, XCircle, Trophy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { generateQuiz, QuizQuestion } from '../services/quizService';

type Props = {
    navigation: StackNavigationProp<RootStackParamList, 'QuizGame'>;
    route: RouteProp<RootStackParamList, 'QuizGame'>;
};

const QuizGameScreen: React.FC<Props> = ({ navigation, route }) => {
    const { theme, isDark } = useTheme();
    const initialTopic = route.params?.topic || '';

    const [topic, setTopic] = useState(initialTopic);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    // Auto-generate when navigated with a topic (e.g., from chatbot)
    useEffect(() => {
        if (initialTopic) {
            handleGenerate();
        }
    }, []);
    const [isFinished, setIsFinished] = useState(false);

    const handleGenerate = async () => {
        const t = topic.trim();
        if (!t) {
            Alert.alert('Enter a Topic', 'Please type a topic.');
            return;
        }

        setIsLoading(true);
        setQuestions([]);
        setCurrentIdx(0);
        setScore(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setIsFinished(false);

        try {
            const response = await generateQuiz(t, 5);
            if (response.questions && response.questions.length > 0) {
                setQuestions(response.questions);
                setHasStarted(true);
            } else {
                Alert.alert('No Questions', 'Could not generate questions. Try a different topic.');
            }
        } catch (error: any) {
            Alert.alert('Error', 'Failed to generate quiz. Backend may not be available.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswer = (answerIdx: number) => {
        if (showResult) return;
        setSelectedAnswer(answerIdx);
        setShowResult(true);

        const q = questions[currentIdx];
        if (answerIdx === q.correctAnswer) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIdx + 1 < questions.length) {
            setCurrentIdx(prev => prev + 1);
            setSelectedAnswer(null);
            setShowResult(false);
        } else {
            setIsFinished(true);
        }
    };

    const currentQ = questions[currentIdx];

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
                        <Text style={styles.headerTitleText}>AI Topic Quiz</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <View style={styles.headerSummary}>
                        <Text style={styles.welcomeText}>Knowledge Check</Text>
                        <Text style={styles.subtitleText}>Test your understanding of {topic || 'any topic'}.</Text>
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
                ) : isFinished ? (
                    <View style={[styles.resultCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                        <View style={[styles.resultIconBox, { backgroundColor: theme.primary + '1A' }]}>
                            <Trophy size={48} color={theme.primary} />
                        </View>
                        <Text style={[styles.resultTitle, { color: theme.text }]}>Quiz Complete!</Text>
                        <Text style={[styles.resultScore, { color: theme.primary }]}>{score} / {questions.length}</Text>
                        <Text style={[styles.resultMsg, { color: theme.textSecondary }]}>
                            {score === questions.length ? "Perfect score! You're a master." : "Good effort! Keep learning."}
                        </Text>
                        <TouchableOpacity
                            style={[styles.retryBtn, { backgroundColor: theme.primary }]}
                            onPress={() => { setHasStarted(false); setIsFinished(false); }}
                        >
                            <Text style={styles.retryText}>Try New Topic</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.quizSection}>
                        <View style={styles.progressRow}>
                            <Text style={[styles.progressText, { color: theme.textTertiary }]}>QUESTION {currentIdx + 1} OF {questions.length}</Text>
                            <View style={[styles.scoreBadge, { backgroundColor: theme.primary + '1A' }]}>
                                <Text style={[styles.scoreBadgeText, { color: theme.primary }]}>Score: {score}</Text>
                            </View>
                        </View>
                        <View style={[styles.progressBar, { backgroundColor: theme.backgroundTertiary }]}>
                            <View style={[styles.progressFill, { width: `${((currentIdx + 1) / questions.length) * 100}%`, backgroundColor: theme.primary }]} />
                        </View>

                        <View style={[styles.questionCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                            <Text style={[styles.questionText, { color: theme.text }]}>{currentQ.question}</Text>
                        </View>

                        <View style={styles.optionsList}>
                            {currentQ.options.map((option, idx) => {
                                const isSelected = selectedAnswer === idx;
                                const isCorrect = idx === currentQ.correctAnswer;
                                let borderColor = theme.border;
                                let bgColor = theme.backgroundSecondary;
                                let icon = null;

                                if (showResult) {
                                    if (isCorrect) {
                                        borderColor = '#10B981';
                                        bgColor = '#10B9811A';
                                        icon = <CheckCircle2 size={18} color="#10B981" />;
                                    } else if (isSelected) {
                                        borderColor = '#EF4444';
                                        bgColor = '#EF44441A';
                                        icon = <XCircle size={18} color="#EF4444" />;
                                    }
                                } else if (isSelected) {
                                    borderColor = theme.primary;
                                    bgColor = theme.primary + '1A';
                                }

                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[styles.optionBtn, { backgroundColor: bgColor, borderColor }]}
                                        onPress={() => handleAnswer(idx)}
                                        disabled={showResult}
                                    >
                                        <Text style={[styles.optionText, { color: theme.text }]}>{option}</Text>
                                        {icon}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {showResult && (
                            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: theme.primary }]} onPress={handleNext}>
                                <Text style={styles.nextBtnText}>{currentIdx + 1 === questions.length ? 'Finish Quiz' : 'Next Question'}</Text>
                            </TouchableOpacity>
                        )}
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

    // Quiz Section
    quizSection: { flex: 1 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 20, paddingHorizontal: 4 },
    progressText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    scoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    scoreBadgeText: { fontSize: 12, fontWeight: '700' },
    progressBar: { height: 6, borderRadius: 3, marginBottom: 25, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },

    questionCard: {
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        marginBottom: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3,
    },
    questionText: { fontSize: 18, fontWeight: '700', lineHeight: 26, textAlign: 'center' },

    optionsList: { gap: 12 },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 15,
        borderWidth: 2,
    },
    optionText: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 10 },

    nextBtn: {
        marginTop: 30,
        paddingVertical: 16,
        borderRadius: 15,
        alignItems: 'center',
        shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

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

export default QuizGameScreen;
