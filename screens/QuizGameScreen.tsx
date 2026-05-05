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
    questionText: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
    optionBtn: {
        flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14,
        borderWidth: 1, marginBottom: 10, position: 'relative',
    },
    optionLabel: { fontSize: 14, fontWeight: '700', marginRight: 12, width: 20 },
    optionText: { fontSize: 14, flex: 1 },
    optionIcon: { fontSize: 16, fontWeight: '700', color: '#10B981', marginLeft: 8 },
    explanationCard: { borderRadius: 12, padding: 14, borderWidth: 1, marginTop: 8, marginBottom: 16 },
    explanationText: { fontSize: 13, lineHeight: 20 },
    nextBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    nextBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    resultsCard: { borderRadius: 16, padding: 28, borderWidth: 1, alignItems: 'center' },
    resultsEmoji: { fontSize: 56, marginBottom: 12 },
    resultsTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
    resultsScore: { fontSize: 40, fontWeight: '800' },
    resultsLabel: { fontSize: 14, marginBottom: 24 },
    resultsActions: { flexDirection: 'row', gap: 12, width: '100%' },
    retryBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    retryBtnText: { fontSize: 14, fontWeight: '600' },
});

export default QuizGameScreen;
