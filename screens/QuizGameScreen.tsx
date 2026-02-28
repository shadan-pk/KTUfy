import React, { useState } from 'react';
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
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.background }}>
                <View style={[styles.header, { borderBottomColor: theme.divider }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>🧠 Topic Quiz</Text>
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
                                placeholder="e.g., Computer Networks..."
                                placeholderTextColor={theme.textTertiary}
                                value={topic}
                                onChangeText={setTopic}
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                style={[styles.generateBtn, isLoading && { opacity: 0.6 }]}
                                onPress={handleGenerate}
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
                        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Generating quiz...</Text>
                    </View>
                )}

                {/* Quiz */}
                {hasStarted && !isLoading && !isFinished && currentQ && (
                    <View>
                        {/* Progress */}
                        <View style={styles.progressRow}>
                            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                                Question {currentIdx + 1}/{questions.length}
                            </Text>
                            <Text style={[styles.scoreText, { color: theme.primary }]}>Score: {score}</Text>
                        </View>
                        <View style={[styles.progressBar, { backgroundColor: theme.divider }]}>
                            <View style={[styles.progressFill, { width: `${((currentIdx + 1) / questions.length) * 100}%`, backgroundColor: theme.primary }]} />
                        </View>

                        {/* Question */}
                        <View style={[styles.questionCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                            <Text style={[styles.questionText, { color: theme.text }]}>{currentQ.question}</Text>
                        </View>

                        {/* Options */}
                        {currentQ.options.map((option, i) => {
                            const isSelected = selectedAnswer === i;
                            const isCorrect = i === currentQ.correctAnswer;
                            let optionStyle = { backgroundColor: theme.backgroundSecondary, borderColor: theme.border };

                            if (showResult) {
                                if (isCorrect) optionStyle = { backgroundColor: '#10B98120', borderColor: '#10B981' };
                                else if (isSelected && !isCorrect) optionStyle = { backgroundColor: '#EF444420', borderColor: '#EF4444' };
                            } else if (isSelected) {
                                optionStyle = { backgroundColor: theme.primary + '15', borderColor: theme.primary };
                            }

                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.optionBtn, optionStyle]}
                                    onPress={() => handleAnswer(i)}
                                    disabled={showResult}
                                >
                                    <Text style={[styles.optionLabel, { color: theme.textSecondary }]}>{String.fromCharCode(65 + i)}</Text>
                                    <Text style={[styles.optionText, { color: theme.text }]}>{option}</Text>
                                    {showResult && isCorrect && <Text style={styles.optionIcon}>✓</Text>}
                                    {showResult && isSelected && !isCorrect && <Text style={[styles.optionIcon, { color: '#EF4444' }]}>✗</Text>}
                                </TouchableOpacity>
                            );
                        })}

                        {/* Explanation */}
                        {showResult && currentQ.explanation && (
                            <View style={[styles.explanationCard, { backgroundColor: '#3B82F610', borderColor: '#3B82F6' }]}>
                                <Text style={[styles.explanationText, { color: theme.text }]}>💡 {currentQ.explanation}</Text>
                            </View>
                        )}

                        {/* Next Button */}
                        {showResult && (
                            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: theme.primary }]} onPress={handleNext}>
                                <Text style={styles.nextBtnText}>
                                    {currentIdx + 1 < questions.length ? 'Next Question →' : 'See Results'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Results */}
                {isFinished && (
                    <View style={[styles.resultsCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                        <Text style={styles.resultsEmoji}>{score >= questions.length * 0.8 ? '🏆' : score >= questions.length * 0.5 ? '👏' : '📚'}</Text>
                        <Text style={[styles.resultsTitle, { color: theme.text }]}>Quiz Complete!</Text>
                        <Text style={[styles.resultsScore, { color: theme.primary }]}>{score}/{questions.length}</Text>
                        <Text style={[styles.resultsLabel, { color: theme.textSecondary }]}>correct answers</Text>

                        <View style={styles.resultsActions}>
                            <TouchableOpacity
                                style={[styles.retryBtn, { borderColor: theme.primary }]}
                                onPress={() => { setHasStarted(false); setIsFinished(false); }}
                            >
                                <Text style={[styles.retryBtnText, { color: theme.primary }]}>🔄 New Topic</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.retryBtn, { backgroundColor: theme.primary }]}
                                onPress={() => {
                                    setCurrentIdx(0);
                                    setScore(0);
                                    setSelectedAnswer(null);
                                    setShowResult(false);
                                    setIsFinished(false);
                                }}
                            >
                                <Text style={[styles.retryBtnText, { color: '#FFF' }]}>🔁 Retry Same</Text>
                            </TouchableOpacity>
                        </View>
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
    generateBtn: { backgroundColor: '#F472B6', height: 46, paddingHorizontal: 18, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    generateBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    loadingCard: { borderRadius: 16, padding: 40, borderWidth: 1, alignItems: 'center' },
    loadingText: { fontSize: 14, marginTop: 16 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressText: { fontSize: 13, fontWeight: '600' },
    scoreText: { fontSize: 13, fontWeight: '700' },
    progressBar: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 20 },
    progressFill: { height: '100%', borderRadius: 2 },
    questionCard: { borderRadius: 16, padding: 20, borderWidth: 1, marginBottom: 16 },
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
