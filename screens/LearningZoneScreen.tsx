import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Animated,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

type LearningZoneScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'LearningZone'>;
};

interface GameStats {
  memoryBestScore: number;
  quizScore: number;
  dailyStreak: number;
  totalPoints: number;
  achievements: string[];
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

const LearningZoneScreen: React.FC<LearningZoneScreenProps> = ({ navigation }) => {
  const [gameStats, setGameStats] = useState<GameStats>({
    memoryBestScore: 0,
    quizScore: 0,
    dailyStreak: 0,
    totalPoints: 0,
    achievements: [],
  });

  // Memory Game States
  const [memoryCards, setMemoryCards] = useState<string[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedCards, setMatchedCards] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryGameActive, setMemoryGameActive] = useState(false);

  // Quiz Game States
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizActive, setQuizActive] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Flashcard States
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);

  // Typing Speed Test States
  const [typingText, setTypingText] = useState('');
  const [targetText, setTargetText] = useState('The quick brown fox jumps over the lazy dog');
  const [typingStartTime, setTypingStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [typingActive, setTypingActive] = useState(false);

  const quizQuestions: QuizQuestion[] = [
    {
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctAnswer: 2,
      category: "Geography"
    },
    {
      question: "What is 15 × 8?",
      options: ["110", "120", "130", "140"],
      correctAnswer: 1,
      category: "Math"
    },
    {
      question: "Who wrote 'Romeo and Juliet'?",
      options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
      correctAnswer: 1,
      category: "Literature"
    },
    {
      question: "What is the chemical symbol for Gold?",
      options: ["Go", "Au", "Gd", "Ag"],
      correctAnswer: 1,
      category: "Science"
    },
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctAnswer: 1,
      category: "Science"
    },
  ];

  const flashcards = [
    { front: "Algorithm", back: "A step-by-step procedure for solving a problem" },
    { front: "Variable", back: "A named storage location in memory" },
    { front: "Function", back: "A reusable block of code that performs a specific task" },
    { front: "Loop", back: "A control structure that repeats a block of code" },
    { front: "Array", back: "A collection of elements stored at contiguous memory locations" },
  ];

  useEffect(() => {
    loadGameStats();
  }, []);

  const loadGameStats = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const statsDoc = await getDoc(doc(db, 'users', user.uid, 'games', 'stats'));
      if (statsDoc.exists()) {
        setGameStats(statsDoc.data() as GameStats);
      }
    } catch (error) {
      console.error('Error loading game stats:', error);
    }
  };

  const saveGameStats = async (newStats: Partial<GameStats>) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const updatedStats = { ...gameStats, ...newStats };
      await setDoc(doc(db, 'users', user.uid, 'games', 'stats'), updatedStats);
      setGameStats(updatedStats);
    } catch (error) {
      console.error('Error saving game stats:', error);
    }
  };

  // Memory Game Functions
  const startMemoryGame = () => {
    const emojis = ['🎯', '🎨', '🎭', '🎪', '🎸', '🎮', '🎲', '🎰'];
    const shuffled = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
    setMemoryCards(shuffled);
    setFlippedCards([]);
    setMatchedCards([]);
    setMemoryMoves(0);
    setMemoryGameActive(true);
  };

  const handleCardFlip = (index: number) => {
    if (flippedCards.length === 2 || flippedCards.includes(index) || matchedCards.includes(index)) {
      return;
    }

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMemoryMoves(memoryMoves + 1);
      const [first, second] = newFlipped;
      
      if (memoryCards[first] === memoryCards[second]) {
        const newMatched = [...matchedCards, first, second];
        setMatchedCards(newMatched);
        setFlippedCards([]);
        
        if (newMatched.length === memoryCards.length) {
          const score = Math.max(0, 100 - memoryMoves * 5);
          if (score > gameStats.memoryBestScore) {
            saveGameStats({ 
              memoryBestScore: score,
              totalPoints: gameStats.totalPoints + score 
            });
            Alert.alert('New Record! 🎉', `Amazing! You scored ${score} points!`);
          } else {
            Alert.alert('Game Complete! 🎊', `You finished in ${memoryMoves} moves!`);
          }
          setMemoryGameActive(false);
        }
      } else {
        setTimeout(() => setFlippedCards([]), 1000);
      }
    }
  };

  // Quiz Game Functions
  const startQuiz = () => {
    setQuizActive(true);
    setCurrentQuizQuestion(0);
    setQuizScore(0);
    setSelectedAnswer(null);
  };

  const handleQuizAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    const correct = answerIndex === quizQuestions[currentQuizQuestion].correctAnswer;
    
    if (correct) {
      setQuizScore(quizScore + 20);
    }

    setTimeout(() => {
      if (currentQuizQuestion < quizQuestions.length - 1) {
        setCurrentQuizQuestion(currentQuizQuestion + 1);
        setSelectedAnswer(null);
      } else {
        const finalScore = correct ? quizScore + 20 : quizScore;
        saveGameStats({ 
          quizScore: Math.max(gameStats.quizScore, finalScore),
          totalPoints: gameStats.totalPoints + finalScore 
        });
        Alert.alert('Quiz Complete! 🎓', `Your score: ${finalScore}/${quizQuestions.length * 20}`);
        setQuizActive(false);
      }
    }, 1000);
  };

  // Flashcard Functions
  const nextFlashcard = () => {
    setFlashcardFlipped(false);
    setFlashcardIndex((flashcardIndex + 1) % flashcards.length);
  };

  const previousFlashcard = () => {
    setFlashcardFlipped(false);
    setFlashcardIndex((flashcardIndex - 1 + flashcards.length) % flashcards.length);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎮 Learning Zone</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Stats Overview */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{gameStats.totalPoints}</Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{gameStats.dailyStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{gameStats.memoryBestScore}</Text>
              <Text style={styles.statLabel}>Memory Best</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{gameStats.quizScore}</Text>
              <Text style={styles.statLabel}>Quiz Best</Text>
            </View>
          </View>
        </View>

        {/* Memory Match Game */}
        <View style={styles.gameCard}>
          <View style={styles.gameHeader}>
            <Text style={styles.gameTitle}>🧠 Memory Match</Text>
            <Text style={styles.gameSubtitle}>Match all pairs of emojis</Text>
          </View>
          {!memoryGameActive ? (
            <TouchableOpacity style={styles.startButton} onPress={startMemoryGame}>
              <Text style={styles.startButtonText}>Start Game</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={styles.movesText}>Moves: {memoryMoves}</Text>
              <View style={styles.memoryGrid}>
                {memoryCards.map((card, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.memoryCard,
                      (flippedCards.includes(index) || matchedCards.includes(index)) && styles.memoryCardFlipped
                    ]}
                    onPress={() => handleCardFlip(index)}
                  >
                    <Text style={styles.memoryCardText}>
                      {flippedCards.includes(index) || matchedCards.includes(index) ? card : '❓'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Quick Quiz */}
        <View style={styles.gameCard}>
          <View style={styles.gameHeader}>
            <Text style={styles.gameTitle}>📝 Quick Quiz</Text>
            <Text style={styles.gameSubtitle}>Test your knowledge</Text>
          </View>
          {!quizActive ? (
            <TouchableOpacity style={styles.startButton} onPress={startQuiz}>
              <Text style={styles.startButtonText}>Start Quiz</Text>
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.quizProgress}>
                <Text style={styles.quizProgressText}>
                  Question {currentQuizQuestion + 1}/{quizQuestions.length}
                </Text>
                <Text style={styles.quizScoreText}>Score: {quizScore}</Text>
              </View>
              <View style={styles.quizCard}>
                <Text style={styles.categoryBadge}>
                  {quizQuestions[currentQuizQuestion].category}
                </Text>
                <Text style={styles.quizQuestion}>
                  {quizQuestions[currentQuizQuestion].question}
                </Text>
                {quizQuestions[currentQuizQuestion].options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.quizOption,
                      selectedAnswer === index && (
                        index === quizQuestions[currentQuizQuestion].correctAnswer
                          ? styles.quizOptionCorrect
                          : styles.quizOptionWrong
                      )
                    ]}
                    onPress={() => selectedAnswer === null && handleQuizAnswer(index)}
                    disabled={selectedAnswer !== null}
                  >
                    <Text style={[
                      styles.quizOptionText,
                      selectedAnswer === index && styles.quizOptionTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Flashcards */}
        <View style={styles.gameCard}>
          <View style={styles.gameHeader}>
            <Text style={styles.gameTitle}>🎴 Study Flashcards</Text>
            <Text style={styles.gameSubtitle}>Learn programming concepts</Text>
          </View>
          <TouchableOpacity
            style={styles.flashcard}
            onPress={() => setFlashcardFlipped(!flashcardFlipped)}
          >
            <Text style={styles.flashcardLabel}>
              {flashcardFlipped ? 'Answer' : 'Question'}
            </Text>
            <Text style={styles.flashcardText}>
              {flashcardFlipped 
                ? flashcards[flashcardIndex].back 
                : flashcards[flashcardIndex].front}
            </Text>
            <Text style={styles.flashcardHint}>Tap to flip</Text>
          </TouchableOpacity>
          <View style={styles.flashcardNav}>
            <TouchableOpacity style={styles.navButton} onPress={previousFlashcard}>
              <Text style={styles.navButtonText}>← Previous</Text>
            </TouchableOpacity>
            <Text style={styles.flashcardCounter}>
              {flashcardIndex + 1}/{flashcards.length}
            </Text>
            <TouchableOpacity style={styles.navButton} onPress={nextFlashcard}>
              <Text style={styles.navButtonText}>Next →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Word Scramble */}
        <View style={styles.gameCard}>
          <View style={styles.gameHeader}>
            <Text style={styles.gameTitle}>🔤 Word Scramble</Text>
            <Text style={styles.gameSubtitle}>Coming Soon!</Text>
          </View>
          <View style={styles.comingSoonBox}>
            <Text style={styles.comingSoonText}>🚧</Text>
            <Text style={styles.comingSoonDesc}>
              Unscramble words to test your vocabulary
            </Text>
          </View>
        </View>

        {/* Math Challenge */}
        <View style={styles.gameCard}>
          <View style={styles.gameHeader}>
            <Text style={styles.gameTitle}>➗ Math Sprint</Text>
            <Text style={styles.gameSubtitle}>Coming Soon!</Text>
          </View>
          <View style={styles.comingSoonBox}>
            <Text style={styles.comingSoonText}>🚧</Text>
            <Text style={styles.comingSoonDesc}>
              Solve math problems as fast as you can
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  scrollView: {
    flex: 1,
  },
  statsCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6366F1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  gameCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gameHeader: {
    marginBottom: 16,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  gameSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  startButton: {
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  movesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  memoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  memoryCard: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  memoryCardFlipped: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  memoryCardText: {
    fontSize: 32,
  },
  quizProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quizProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  quizScoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  quizCard: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
  },
  categoryBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  quizQuestion: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  quizOption: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  quizOptionCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#D1FAE5',
  },
  quizOptionWrong: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  quizOptionText: {
    fontSize: 16,
    color: '#1E293B',
  },
  quizOptionTextSelected: {
    fontWeight: '600',
  },
  flashcard: {
    backgroundColor: '#6366F1',
    padding: 32,
    borderRadius: 16,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  flashcardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 12,
  },
  flashcardText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  flashcardHint: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.6,
  },
  flashcardNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  flashcardCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  comingSoonBox: {
    backgroundColor: '#F8FAFC',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 48,
    marginBottom: 12,
  },
  comingSoonDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default LearningZoneScreen;
