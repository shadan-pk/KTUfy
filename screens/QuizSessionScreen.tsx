import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Trophy, Target, CheckCircle2, XCircle, RotateCcw, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react-native';

// Types for Quiz
interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  subject: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizQuestion[];
  timeLimit: number; // in seconds
}

interface QuizSessionProps {
  navigation: any;
}

const QuizSessionScreen: React.FC<QuizSessionProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();

  // State Management
  const [viewMode, setViewMode] = useState<'menu' | 'select' | 'quiz' | 'results'>('menu');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);

  // Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (quizStarted && timeRemaining > 0 && viewMode === 'quiz') {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [quizStarted, timeRemaining, viewMode]);

  const handleTimeUp = () => {
    setQuizStarted(false);
    Alert.alert(
      'Time Up!',
      'Your quiz session has ended.',
      [
        {
          text: 'View Results',
          onPress: () => handleSubmitQuiz(),
        },
      ]
    );
  };

  // Mock Quiz Data
  const mockQuizzes: Quiz[] = [
    {
      id: '1',
      title: 'Data Structures Basics',
      subject: 'Data Structures and Algorithms',
      description: 'Test your knowledge of fundamental data structures',
      difficulty: 'easy',
      timeLimit: 300, // 5 minutes
      questions: [
        {
          id: 'q1',
          question: 'What is the time complexity of linear search?',
          options: [
            { id: 'o1', text: 'O(1)', isCorrect: false },
            { id: 'o2', text: 'O(n)', isCorrect: true },
            { id: 'o3', text: 'O(n²)', isCorrect: false },
            { id: 'o4', text: 'O(log n)', isCorrect: false },
          ],
          explanation: 'Linear search checks each element sequentially, so its time complexity is O(n).',
        },
        {
          id: 'q2',
          question: 'Which data structure uses LIFO principle?',
          options: [
            { id: 'o1', text: 'Queue', isCorrect: false },
            { id: 'o2', text: 'Stack', isCorrect: true },
            { id: 'o3', text: 'Array', isCorrect: false },
            { id: 'o4', text: 'Graph', isCorrect: false },
          ],
          explanation: 'Stack uses LIFO (Last In First Out) principle, where the last element added is the first one removed.',
        },
        {
          id: 'q3',
          question: 'What is the time complexity of binary search?',
          options: [
            { id: 'o1', text: 'O(n)', isCorrect: false },
            { id: 'o2', text: 'O(n²)', isCorrect: false },
            { id: 'o3', text: 'O(log n)', isCorrect: true },
            { id: 'o4', text: 'O(1)', isCorrect: false },
          ],
          explanation: 'Binary search divides the search space in half with each iteration, resulting in O(log n) complexity.',
        },
      ],
    },
    {
      id: '2',
      title: 'Web Development Fundamentals',
      subject: 'Web Technologies',
      description: 'Basic concepts of web development',
      difficulty: 'easy',
      timeLimit: 600, // 10 minutes
      questions: [
        {
          id: 'q1',
          question: 'What does HTML stand for?',
          options: [
            { id: 'o1', text: 'Hyper Text Markup Language', isCorrect: true },
            { id: 'o2', text: 'High Tech Modern Language', isCorrect: false },
            { id: 'o3', text: 'Home Tool Markup Language', isCorrect: false },
            { id: 'o4', text: 'Hyperlinks and Text Markup Language', isCorrect: false },
          ],
          explanation: 'HTML is the standard markup language for creating web pages.',
        },
        {
          id: 'q2',
          question: 'Which of the following is a semantic HTML5 element?',
          options: [
            { id: 'o1', text: '<div>', isCorrect: false },
            { id: 'o2', text: '<article>', isCorrect: true },
            { id: 'o3', text: '<span>', isCorrect: false },
            { id: 'o4', text: '<section> and <article> are both correct', isCorrect: false },
          ],
          explanation: '<article> is a semantic HTML5 element that represents independent, self-contained content.',
        },
      ],
    },
    {
      id: '3',
      title: 'Advanced Algorithms',
      subject: 'Algorithms',
      description: 'Complex algorithmic concepts',
      difficulty: 'hard',
      timeLimit: 900, // 15 minutes
      questions: [
        {
          id: 'q1',
          question: 'What is the worst-case time complexity of QuickSort?',
          options: [
            { id: 'o1', text: 'O(n log n)', isCorrect: false },
            { id: 'o2', text: 'O(n²)', isCorrect: true },
            { id: 'o3', text: 'O(n)', isCorrect: false },
            { id: 'o4', text: 'O(log n)', isCorrect: false },
          ],
          explanation: 'QuickSort has a worst-case time complexity of O(n²) when the pivot is always the smallest or largest element.',
        },
        {
          id: 'q2',
          question: 'Which algorithm uses dynamic programming?',
          options: [
            { id: 'o1', text: 'Fibonacci sequence calculation', isCorrect: true },
            { id: 'o2', text: 'Linear search', isCorrect: false },
            { id: 'o3', text: 'Bubble sort', isCorrect: false },
            { id: 'o4', text: 'Binary search', isCorrect: false },
          ],
          explanation: 'The Fibonacci sequence can be efficiently calculated using dynamic programming by storing previously computed values.',
        },
      ],
    },
  ];

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setQuizzes(mockQuizzes);
    } catch (error) {
      Alert.alert('Error', 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'menu') {
      loadQuizzes();
    }
  }, [viewMode]);

  const handleQuizSelect = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setViewMode('quiz');
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setTimeRemaining(quiz.timeLimit);
    setQuizStarted(true);
  };

  const handleDifficultyFilter = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (selectedDifficulty === difficulty) {
      setSelectedDifficulty(null);
    } else {
      setSelectedDifficulty(difficulty);
    }
  };

  const filteredQuizzes = selectedDifficulty
    ? quizzes.filter(quiz => quiz.difficulty === selectedDifficulty)
    : quizzes;

  const handleAnswerSelect = (optionId: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuiz?.questions[currentQuestionIndex].id || '']: optionId,
    });
  };

  const handleNextQuestion = () => {
    if (currentQuiz && currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (!currentQuiz) return;

    setQuizStarted(false);
    setViewMode('results');
  };

  const calculateScore = () => {
    if (!currentQuiz) return { correct: 0, total: 0, percentage: 0 };

    let correct = 0;
    currentQuiz.questions.forEach(question => {
      const selectedOptionId = selectedAnswers[question.id];
      if (!selectedOptionId) return;

      const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
      if (selectedOption?.isCorrect) {
        correct++;
      }
    });

    const percentage = Math.round((correct / currentQuiz.questions.length) * 100);
    return {
      correct,
      total: currentQuiz.questions.length,
      percentage,
    };
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return '#10B981';
    if (percentage >= 60) return '#F59E0B';
    return '#EF4444';
  };

  if (viewMode === 'menu') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>📋 Quiz Session</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.welcomeCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.welcomeTitle, { color: theme.text }]}>Test Your Knowledge</Text>
            <Text style={[styles.welcomeDescription, { color: theme.textSecondary }]}>
              Take interactive quizzes on various subjects and track your progress
            </Text>
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterTitle, { color: theme.text }]}>Filter by Difficulty</Text>
            <View style={styles.filterButtons}>
              {(['easy', 'medium', 'hard'] as const).map(difficulty => (
                <TouchableOpacity
                  key={difficulty}
                  style={[
                    styles.filterButton,
                    selectedDifficulty === difficulty && {
                      backgroundColor: difficulty === 'easy' ? '#10B981' : difficulty === 'medium' ? '#F59E0B' : '#EF4444',
                    },
                  ]}
                  onPress={() => handleDifficultyFilter(difficulty)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedDifficulty === difficulty && { color: '#FFFFFF' },
                    ]}
                  >
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : (
            <View style={styles.quizzesContainer}>
              {filteredQuizzes.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📭</Text>
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>No quizzes found</Text>
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    Try adjusting your filters
                  </Text>
                </View>
              ) : (
                filteredQuizzes.map(quiz => (
                  <TouchableOpacity
                    key={quiz.id}
                    style={[styles.quizCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                    onPress={() => handleQuizSelect(quiz)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.quizCardHeader}>
                      <View style={styles.quizInfo}>
                        <Text style={[styles.quizTitle, { color: theme.text }]}>{quiz.title}</Text>
                        <Text style={[styles.quizSubject, { color: theme.textSecondary }]}>{quiz.subject}</Text>
                      </View>
                      <View
                        style={[
                          styles.difficultyBadge,
                          {
                            backgroundColor:
                              quiz.difficulty === 'easy'
                                ? '#D1FAE5'
                                : quiz.difficulty === 'medium'
                                ? '#FEF3C7'
                                : '#FEE2E2',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.difficultyText,
                            {
                              color:
                                quiz.difficulty === 'easy'
                                  ? '#059669'
                                  : quiz.difficulty === 'medium'
                                  ? '#D97706'
                                  : '#DC2626',
                            },
                          ]}
                        >
                          {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.quizDescription, { color: theme.textSecondary }]}>
                      {quiz.description}
                    </Text>
                    <View style={styles.quizMeta}>
                      <Text style={[styles.quizMetaText, { color: theme.textSecondary }]}>
                        📝 {quiz.questions.length} questions
                      </Text>
                      <Text style={[styles.quizMetaText, { color: theme.textSecondary }]}>
                        ⏱️ {Math.floor(quiz.timeLimit / 60)} min
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          <View style={{ height: 50 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (viewMode === 'quiz' && currentQuiz) {
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    const selectedOptionId = selectedAnswers[currentQuestion.id];

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
        <View style={[styles.quizHeader, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
          <View style={styles.quizHeaderTop}>
            <Text style={[styles.quizHeaderTitle, { color: theme.text }]} numberOfLines={1}>
              {currentQuiz.title}
            </Text>
            <View
              style={[
                styles.timerBadge,
                { backgroundColor: timeRemaining < 60 ? '#FEE2E2' : theme.primaryLight },
              ]}
            >
              <Text style={[styles.timerText, { color: timeRemaining < 60 ? '#DC2626' : theme.primary }]}>
                ⏱️ {formatTime(timeRemaining)}
              </Text>
            </View>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100}%`,
                  backgroundColor: theme.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.textSecondary }]}>
            Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
          </Text>
        </View>

        <ScrollView style={styles.quizContent} showsVerticalScrollIndicator={false}>
          <View style={styles.questionContainer}>
            <Text style={[styles.questionText, { color: theme.text }]}>{currentQuestion.question}</Text>

            <View style={styles.optionsContainer}>
              {currentQuestion.options.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor:
                        selectedOptionId === option.id
                          ? theme.primary + '20'
                          : theme.card,
                      borderColor:
                        selectedOptionId === option.id
                          ? theme.primary
                          : theme.cardBorder,
                    },
                  ]}
                  onPress={() => handleAnswerSelect(option.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.optionCircle,
                      {
                        borderColor:
                          selectedOptionId === option.id
                            ? theme.primary
                            : theme.cardBorder,
                        backgroundColor:
                          selectedOptionId === option.id
                            ? theme.primary
                            : 'transparent',
                      },
                    ]}
                  >
                    {selectedOptionId === option.id && (
                      <Text style={styles.checkMark}>✓</Text>
                    )}
                  </View>
                  <Text style={[styles.optionText, { color: theme.text }]}>
                    {option.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={[styles.quizFooter, { backgroundColor: theme.card, borderTopColor: theme.cardBorder }]}>
          <TouchableOpacity
            style={[
              styles.navButton,
              { backgroundColor: theme.primaryLight, opacity: currentQuestionIndex === 0 ? 0.5 : 1 },
            ]}
            onPress={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <Text style={[styles.navButtonText, { color: theme.primary }]}>← Previous</Text>
          </TouchableOpacity>

          {currentQuestionIndex === currentQuiz.questions.length - 1 ? (
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
              onPress={handleSubmitQuiz}
            >
              <Text style={styles.submitButtonText}>Submit Quiz</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: theme.primaryLight }]}
              onPress={handleNextQuestion}
            >
              <Text style={[styles.navButtonText, { color: theme.primary }]}>Next →</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Results View
  if (viewMode === 'results' && currentQuiz) {
    const score = calculateScore();
    const scoreColor = getProgressColor(score.percentage);
    const wrong = score.total - score.correct;

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
        {/* Minimal Header */}
        <View style={[styles.resultHeader, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => { setViewMode('menu'); setCurrentQuiz(null); }}
            style={styles.resultHeaderBackBtn}
          >
            <ArrowLeft size={20} color={theme.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[styles.resultHeaderTitle, { color: theme.text }]}>Results</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Score Hero Card */}
          <View style={[styles.scoreHeroCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={[styles.scoreRing, { borderColor: scoreColor }]}>
              <Text style={[styles.scoreHeroPercent, { color: scoreColor }]}>{score.percentage}%</Text>
            </View>
            <Text style={[styles.scoreHeroTitle, { color: theme.text }]}>
              {score.percentage >= 80
                ? 'Excellent!'
                : score.percentage >= 60
                ? 'Good Job!'
                : 'Keep Learning!'}
            </Text>
            <Text style={[styles.scoreHeroSub, { color: theme.textSecondary }]}>
              {currentQuiz.title}
            </Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.statIconWrap, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                <CheckCircle2 size={18} color="#10B981" strokeWidth={2} />
              </View>
              <Text style={[styles.statBoxValue, { color: '#10B981' }]}>{score.correct}</Text>
              <Text style={[styles.statBoxLabel, { color: theme.textSecondary }]}>Correct</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.statIconWrap, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                <XCircle size={18} color="#EF4444" strokeWidth={2} />
              </View>
              <Text style={[styles.statBoxValue, { color: '#EF4444' }]}>{wrong}</Text>
              <Text style={[styles.statBoxLabel, { color: theme.textSecondary }]}>Wrong</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.statIconWrap, { backgroundColor: 'rgba(99,102,241,0.1)' }]}>
                <Target size={18} color="#6366F1" strokeWidth={2} />
              </View>
              <Text style={[styles.statBoxValue, { color: '#6366F1' }]}>{score.total}</Text>
              <Text style={[styles.statBoxLabel, { color: theme.textSecondary }]}>Total</Text>
            </View>
          </View>

          {/* Review Section */}
          <View style={styles.reviewSectionHeader}>
            <Text style={[styles.reviewSectionTitle, { color: theme.text }]}>Answer Review</Text>
          </View>

          {currentQuiz.questions.map((question, index) => {
            const selectedOptionId = selectedAnswers[question.id];
            const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
            const correctOption = question.options.find(opt => opt.isCorrect);
            const isCorrect = selectedOption?.isCorrect;

            return (
              <View
                key={question.id}
                style={[styles.reviewCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              >
                <View style={styles.reviewCardHeader}>
                  <View style={[styles.reviewQBadge, { backgroundColor: isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                    <Text style={[styles.reviewQBadgeText, { color: isCorrect ? '#10B981' : '#EF4444' }]}>
                      Q{index + 1}
                    </Text>
                  </View>
                  {isCorrect ? (
                    <CheckCircle2 size={18} color="#10B981" strokeWidth={2} />
                  ) : (
                    <XCircle size={18} color="#EF4444" strokeWidth={2} />
                  )}
                </View>
                <Text style={[styles.reviewCardQuestion, { color: theme.text }]}>{question.question}</Text>
                {selectedOption && (
                  <View style={[styles.reviewAnswerRow, { backgroundColor: isCorrect ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', borderColor: isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }]}>
                    <Text style={[styles.reviewAnswerLabel, { color: theme.textSecondary }]}>Your answer</Text>
                    <Text style={[styles.reviewAnswerText, { color: isCorrect ? '#10B981' : '#EF4444' }]}>{selectedOption.text}</Text>
                  </View>
                )}
                {!isCorrect && correctOption && (
                  <View style={[styles.reviewAnswerRow, { backgroundColor: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.2)' }]}>
                    <Text style={[styles.reviewAnswerLabel, { color: theme.textSecondary }]}>Correct answer</Text>
                    <Text style={[styles.reviewAnswerText, { color: '#10B981' }]}>{correctOption.text}</Text>
                  </View>
                )}
                {question.explanation ? (
                  <Text style={[styles.reviewExplanation, { color: theme.textSecondary }]}>{question.explanation}</Text>
                ) : null}
              </View>
            );
          })}

          {/* Action Buttons */}
          <View style={styles.resultActions}>
            <TouchableOpacity
              style={[styles.resultBtnOutline, { borderColor: theme.cardBorder }]}
              onPress={() => { setViewMode('menu'); setCurrentQuiz(null); }}
            >
              <ArrowLeft size={16} color={theme.primary} strokeWidth={2} />
              <Text style={[styles.resultBtnOutlineText, { color: theme.primary }]}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resultBtnPrimary, { backgroundColor: theme.primary }]}
              onPress={() => {
                setCurrentQuestionIndex(0);
                setSelectedAnswers({});
                setTimeRemaining(currentQuiz.timeLimit);
                setQuizStarted(true);
                setViewMode('quiz');
              }}
            >
              <RotateCcw size={16} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.resultBtnPrimaryText}>Retake</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  welcomeCard: {
    margin: 20,
    marginBottom: 10,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  welcomeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  quizzesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  quizCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  quizCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  quizInfo: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  quizSubject: {
    fontSize: 13,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quizDescription: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  quizMeta: {
    flexDirection: 'row',
    gap: 20,
  },
  quizMetaText: {
    fontSize: 12,
  },
  quizHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  quizHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quizHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  timerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
  },
  quizContent: {
    flex: 1,
    padding: 20,
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  optionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  quizFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultsCard: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  scoreCircle: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scorePercentage: {
    fontSize: 56,
    fontWeight: '700',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  scoreMessage: {
    alignItems: 'center',
  },
  scoreTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  scoreDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  // --- New Results UI ---
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  resultHeaderBackBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  scoreHeroCard: {
    margin: 20,
    marginBottom: 16,
    padding: 28,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  scoreRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scoreHeroPercent: {
    fontSize: 32,
    fontWeight: '800',
  },
  scoreHeroTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  scoreHeroSub: {
    fontSize: 13,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statBoxValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  statBoxLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  reviewSectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  reviewCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewQBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reviewQBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reviewCardQuestion: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 10,
  },
  reviewAnswerRow: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
  },
  reviewAnswerLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  reviewAnswerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  reviewExplanation: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    fontStyle: 'italic',
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 14,
  },
  resultBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultBtnOutlineText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  resultBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reviewSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    padding: 16,
    borderBottomWidth: 1,
  },
  reviewItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewItemNumber: {
    fontSize: 12,
    fontWeight: '600',
  },
  reviewItemStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  reviewItemQuestion: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 18,
  },
  reviewItemAnswer: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  reviewItemExplanation: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default QuizSessionScreen;
