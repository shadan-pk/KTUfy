import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../auth/AuthProvider';
import supabase from '../supabaseClient';

type CodingHubScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'CodingHub'>;
};

interface CodingProblem {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  starterCode: {
    python: string;
    c: string;
    cpp: string;
    java: string;
  };
  expectedOutput: string;
  hints: string[];
}

interface UserProgress {
  completedProblems: string[];
  totalAttempts: number;
  successfulRuns: number;
}

const CodingHubScreen: React.FC<CodingHubScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'c' | 'cpp' | 'java'>('python');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<CodingProblem | null>(null);
  const [showProblemList, setShowProblemList] = useState(true);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    completedProblems: [],
    totalAttempts: 0,
    successfulRuns: 0,
  });
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('All');

  const codingProblems: CodingProblem[] = [
    {
      id: 'prob1',
      title: 'Hello World',
      description: 'Write a program that prints "Hello, World!" to the console.',
      difficulty: 'Easy',
      category: 'Basics',
      starterCode: {
        python: '# Write your code here\nprint("Hello, World!")',
        c: '#include <stdio.h>\n\nint main() {\n    // Write your code here\n    printf("Hello, World!\\n");\n    return 0;\n}',
        cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    cout << "Hello, World!" << endl;\n    return 0;\n}',
        java: 'public class Main {\n    public static void main(String[] args) {\n        // Write your code here\n        System.out.println("Hello, World!");\n    }\n}',
      },
      expectedOutput: 'Hello, World!',
      hints: ['Use the print function', 'Remember to include proper syntax'],
    },
    {
      id: 'prob2',
      title: 'Sum of Two Numbers',
      description: 'Write a program that adds two numbers (5 and 3) and prints the result.',
      difficulty: 'Easy',
      category: 'Basics',
      starterCode: {
        python: '# Add two numbers\na = 5\nb = 3\n# Write your code here\nresult = a + b\nprint(result)',
        c: '#include <stdio.h>\n\nint main() {\n    int a = 5, b = 3;\n    // Write your code here\n    int result = a + b;\n    printf("%d\\n", result);\n    return 0;\n}',
        cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a = 5, b = 3;\n    // Write your code here\n    int result = a + b;\n    cout << result << endl;\n    return 0;\n}',
        java: 'public class Main {\n    public static void main(String[] args) {\n        int a = 5, b = 3;\n        // Write your code here\n        int result = a + b;\n        System.out.println(result);\n    }\n}',
      },
      expectedOutput: '8',
      hints: ['Use the + operator', 'Store result in a variable'],
    },
    {
      id: 'prob3',
      title: 'Print Numbers 1 to 10',
      description: 'Write a program using a loop to print numbers from 1 to 10.',
      difficulty: 'Easy',
      category: 'Loops',
      starterCode: {
        python: '# Print numbers 1 to 10\nfor i in range(1, 11):\n    print(i)',
        c: '#include <stdio.h>\n\nint main() {\n    // Write your code here\n    for(int i = 1; i <= 10; i++) {\n        printf("%d\\n", i);\n    }\n    return 0;\n}',
        cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    for(int i = 1; i <= 10; i++) {\n        cout << i << endl;\n    }\n    return 0;\n}',
        java: 'public class Main {\n    public static void main(String[] args) {\n        // Write your code here\n        for(int i = 1; i <= 10; i++) {\n            System.out.println(i);\n        }\n    }\n}',
      },
      expectedOutput: '1\n2\n3\n4\n5\n6\n7\n8\n9\n10',
      hints: ['Use a for loop', 'Loop from 1 to 10'],
    },
    {
      id: 'prob4',
      title: 'Factorial Calculator',
      description: 'Write a program to calculate factorial of 5 (5! = 120).',
      difficulty: 'Medium',
      category: 'Loops',
      starterCode: {
        python: '# Calculate factorial of 5\nn = 5\nfactorial = 1\nfor i in range(1, n + 1):\n    factorial *= i\nprint(factorial)',
        c: '#include <stdio.h>\n\nint main() {\n    int n = 5, factorial = 1;\n    // Write your code here\n    for(int i = 1; i <= n; i++) {\n        factorial *= i;\n    }\n    printf("%d\\n", factorial);\n    return 0;\n}',
        cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n = 5, factorial = 1;\n    // Write your code here\n    for(int i = 1; i <= n; i++) {\n        factorial *= i;\n    }\n    cout << factorial << endl;\n    return 0;\n}',
        java: 'public class Main {\n    public static void main(String[] args) {\n        int n = 5, factorial = 1;\n        // Write your code here\n        for(int i = 1; i <= n; i++) {\n            factorial *= i;\n        }\n        System.out.println(factorial);\n    }\n}',
      },
      expectedOutput: '120',
      hints: ['Multiply numbers from 1 to n', 'Start with factorial = 1'],
    },
    {
      id: 'prob5',
      title: 'Find Maximum in Array',
      description: 'Write a program to find the maximum number in the array [3, 7, 2, 9, 1].',
      difficulty: 'Medium',
      category: 'Arrays',
      starterCode: {
        python: '# Find maximum in array\narr = [3, 7, 2, 9, 1]\nmax_num = arr[0]\nfor num in arr:\n    if num > max_num:\n        max_num = num\nprint(max_num)',
        c: '#include <stdio.h>\n\nint main() {\n    int arr[] = {3, 7, 2, 9, 1};\n    int n = 5;\n    int max = arr[0];\n    // Write your code here\n    for(int i = 1; i < n; i++) {\n        if(arr[i] > max) max = arr[i];\n    }\n    printf("%d\\n", max);\n    return 0;\n}',
        cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int arr[] = {3, 7, 2, 9, 1};\n    int n = 5;\n    int max = arr[0];\n    // Write your code here\n    for(int i = 1; i < n; i++) {\n        if(arr[i] > max) max = arr[i];\n    }\n    cout << max << endl;\n    return 0;\n}',
        java: 'public class Main {\n    public static void main(String[] args) {\n        int[] arr = {3, 7, 2, 9, 1};\n        int max = arr[0];\n        // Write your code here\n        for(int i = 1; i < arr.length; i++) {\n            if(arr[i] > max) max = arr[i];\n        }\n        System.out.println(max);\n    }\n}',
      },
      expectedOutput: '9',
      hints: ['Compare each element with current max', 'Initialize max with first element'],
    },
    {
      id: 'prob6',
      title: 'Fibonacci Sequence',
      description: 'Write a program to print the first 10 Fibonacci numbers.',
      difficulty: 'Medium',
      category: 'Recursion',
      starterCode: {
        python: '# Print first 10 Fibonacci numbers\nn = 10\na, b = 0, 1\nfor i in range(n):\n    print(a)\n    a, b = b, a + b',
        c: '#include <stdio.h>\n\nint main() {\n    int n = 10;\n    int a = 0, b = 1, next;\n    // Write your code here\n    for(int i = 0; i < n; i++) {\n        printf("%d\\n", a);\n        next = a + b;\n        a = b;\n        b = next;\n    }\n    return 0;\n}',
        cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n = 10;\n    int a = 0, b = 1, next;\n    // Write your code here\n    for(int i = 0; i < n; i++) {\n        cout << a << endl;\n        next = a + b;\n        a = b;\n        b = next;\n    }\n    return 0;\n}',
        java: 'public class Main {\n    public static void main(String[] args) {\n        int n = 10;\n        int a = 0, b = 1, next;\n        // Write your code here\n        for(int i = 0; i < n; i++) {\n            System.out.println(a);\n            next = a + b;\n            a = b;\n            b = next;\n        }\n    }\n}',
      },
      expectedOutput: '0\n1\n1\n2\n3\n5\n8\n13\n21\n34',
      hints: ['Start with 0 and 1', 'Each number is sum of previous two'],
    },
    {
      id: 'prob7',
      title: 'Reverse a String',
      description: 'Write a program to reverse the string "Hello".',
      difficulty: 'Easy',
      category: 'Strings',
      starterCode: {
        python: '# Reverse a string\ns = "Hello"\nreversed_s = s[::-1]\nprint(reversed_s)',
        c: '#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char s[] = "Hello";\n    int n = strlen(s);\n    // Write your code here\n    for(int i = n-1; i >= 0; i--) {\n        printf("%c", s[i]);\n    }\n    printf("\\n");\n    return 0;\n}',
        cpp: '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s = "Hello";\n    // Write your code here\n    for(int i = s.length()-1; i >= 0; i--) {\n        cout << s[i];\n    }\n    cout << endl;\n    return 0;\n}',
        java: 'public class Main {\n    public static void main(String[] args) {\n        String s = "Hello";\n        // Write your code here\n        for(int i = s.length()-1; i >= 0; i--) {\n            System.out.print(s.charAt(i));\n        }\n        System.out.println();\n    }\n}',
      },
      expectedOutput: 'olleH',
      hints: ['Loop from end to start', 'Or use built-in reverse methods'],
    },
    {
      id: 'prob8',
      title: 'Check Prime Number',
      description: 'Write a program to check if 17 is a prime number (should print "Prime").',
      difficulty: 'Medium',
      category: 'Math',
      starterCode: {
        python: '# Check if number is prime\nn = 17\nis_prime = True\nif n < 2:\n    is_prime = False\nelse:\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            is_prime = False\n            break\nif is_prime:\n    print("Prime")\nelse:\n    print("Not Prime")',
        c: '#include <stdio.h>\n#include <math.h>\n\nint main() {\n    int n = 17;\n    int is_prime = 1;\n    // Write your code here\n    if(n < 2) is_prime = 0;\n    for(int i = 2; i <= sqrt(n); i++) {\n        if(n % i == 0) {\n            is_prime = 0;\n            break;\n        }\n    }\n    if(is_prime) printf("Prime\\n");\n    else printf("Not Prime\\n");\n    return 0;\n}',
        cpp: '#include <iostream>\n#include <cmath>\nusing namespace std;\n\nint main() {\n    int n = 17;\n    bool is_prime = true;\n    // Write your code here\n    if(n < 2) is_prime = false;\n    for(int i = 2; i <= sqrt(n); i++) {\n        if(n % i == 0) {\n            is_prime = false;\n            break;\n        }\n    }\n    if(is_prime) cout << "Prime" << endl;\n    else cout << "Not Prime" << endl;\n    return 0;\n}',
        java: 'public class Main {\n    public static void main(String[] args) {\n        int n = 17;\n        boolean is_prime = true;\n        // Write your code here\n        if(n < 2) is_prime = false;\n        for(int i = 2; i <= Math.sqrt(n); i++) {\n            if(n % i == 0) {\n                is_prime = false;\n                break;\n            }\n        }\n        if(is_prime) System.out.println("Prime");\n        else System.out.println("Not Prime");\n    }\n}',
      },
      expectedOutput: 'Prime',
      hints: ['Check divisibility up to sqrt(n)', 'Numbers less than 2 are not prime'],
    },
  ];

  const categories = ['All', 'Basics', 'Loops', 'Arrays', 'Recursion', 'Strings', 'Math'];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  useEffect(() => {
    loadUserProgress();
  }, []);

  const loadUserProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('coding_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setUserProgress({
          completedProblems: data.completed_problems || [],
          totalAttempts: data.total_attempts || 0,
          successfulRuns: data.successful_runs || 0,
        });
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const saveProgress = async (newProgress: Partial<UserProgress>) => {
    if (!user) return;

    try {
      const updatedProgress = { ...userProgress, ...newProgress };
      
      const { error } = await supabase
        .from('coding_progress')
        .upsert({
          user_id: user.id,
          completed_problems: updatedProgress.completedProblems,
          total_attempts: updatedProgress.totalAttempts,
          successful_runs: updatedProgress.successfulRuns,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      setUserProgress(updatedProgress);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const selectProblem = (problem: CodingProblem) => {
    setSelectedProblem(problem);
    setCode(problem.starterCode[selectedLanguage]);
    setOutput('');
    setShowProblemList(false);
  };

  const changeLanguage = (lang: 'python' | 'c' | 'cpp' | 'java') => {
    setSelectedLanguage(lang);
    if (selectedProblem) {
      setCode(selectedProblem.starterCode[lang]);
    }
  };

  const runCode = () => {
    if (!selectedProblem) return;

    setIsRunning(true);
    setOutput('Running code...\n');

    // Simulate code execution (in a real app, you'd use an API or backend)
    setTimeout(() => {
      try {
        // Simple simulation - check if code contains expected patterns
        const codeLines = code.toLowerCase();
        let simulatedOutput = '';

        // Very basic simulation based on problem ID
        if (selectedProblem.id === 'prob1') {
          if (codeLines.includes('hello') && codeLines.includes('world')) {
            simulatedOutput = 'Hello, World!';
          }
        } else if (selectedProblem.id === 'prob2') {
          if (codeLines.includes('5') && codeLines.includes('3') && (codeLines.includes('+') || codeLines.includes('add'))) {
            simulatedOutput = '8';
          }
        } else if (selectedProblem.id === 'prob3') {
          simulatedOutput = '1\n2\n3\n4\n5\n6\n7\n8\n9\n10';
        } else if (selectedProblem.id === 'prob4') {
          if (codeLines.includes('factorial') || codeLines.includes('*=')) {
            simulatedOutput = '120';
          }
        } else if (selectedProblem.id === 'prob5') {
          if (codeLines.includes('max')) {
            simulatedOutput = '9';
          }
        } else if (selectedProblem.id === 'prob6') {
          simulatedOutput = '0\n1\n1\n2\n3\n5\n8\n13\n21\n34';
        } else if (selectedProblem.id === 'prob7') {
          if (codeLines.includes('reverse') || codeLines.includes('[::-1]') || codeLines.includes('i--')) {
            simulatedOutput = 'olleH';
          }
        } else if (selectedProblem.id === 'prob8') {
          if (codeLines.includes('prime')) {
            simulatedOutput = 'Prime';
          }
        }

        if (simulatedOutput === '') {
          simulatedOutput = 'Error: Check your code and try again.';
          setOutput(`❌ Output:\n${simulatedOutput}\n\nExpected:\n${selectedProblem.expectedOutput}`);
        } else {
          const isCorrect = simulatedOutput.trim() === selectedProblem.expectedOutput.trim();
          
          if (isCorrect) {
            setOutput(`✅ Success! Output:\n${simulatedOutput}\n\nCorrect! Problem solved!`);
            
            // Mark as completed
            if (!userProgress.completedProblems.includes(selectedProblem.id)) {
              const newCompleted = [...userProgress.completedProblems, selectedProblem.id];
              saveProgress({
                completedProblems: newCompleted,
                totalAttempts: userProgress.totalAttempts + 1,
                successfulRuns: userProgress.successfulRuns + 1,
              });
              
              Alert.alert('🎉 Problem Solved!', 'Great job! You can now try more problems.');
            } else {
              saveProgress({
                totalAttempts: userProgress.totalAttempts + 1,
                successfulRuns: userProgress.successfulRuns + 1,
              });
            }
          } else {
            setOutput(`⚠️ Output:\n${simulatedOutput}\n\nExpected:\n${selectedProblem.expectedOutput}\n\nTry again!`);
            saveProgress({ totalAttempts: userProgress.totalAttempts + 1 });
          }
        }
      } catch (error) {
        setOutput(`❌ Error: ${error}`);
      } finally {
        setIsRunning(false);
      }
    }, 1500);
  };

  const getRandomChallenge = () => {
    const filtered = codingProblems.filter(p => {
      const categoryMatch = filterCategory === 'All' || p.category === filterCategory;
      const difficultyMatch = filterDifficulty === 'All' || p.difficulty === filterDifficulty;
      return categoryMatch && difficultyMatch;
    });

    if (filtered.length === 0) {
      Alert.alert('No Problems', 'No problems match your filter criteria.');
      return;
    }

    const randomProblem = filtered[Math.floor(Math.random() * filtered.length)];
    selectProblem(randomProblem);
  };

  const filteredProblems = codingProblems.filter(p => {
    const categoryMatch = filterCategory === 'All' || p.category === filterCategory;
    const difficultyMatch = filterDifficulty === 'All' || p.difficulty === filterDifficulty;
    return categoryMatch && difficultyMatch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#10B981';
      case 'Medium': return '#F59E0B';
      case 'Hard': return '#EF4444';
      default: return '#64748B';
    }
  };

  if (showProblemList) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>💻 Coding Hub</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Progress Stats */}
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Your Progress</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userProgress.completedProblems.length}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{codingProblems.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userProgress.totalAttempts}</Text>
                <Text style={styles.statLabel}>Attempts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {userProgress.totalAttempts > 0
                    ? Math.round((userProgress.successfulRuns / userProgress.totalAttempts) * 100)
                    : 0}%
                </Text>
                <Text style={styles.statLabel}>Success</Text>
              </View>
            </View>
          </View>

          {/* Challenge Mode */}
          <View style={styles.challengeCard}>
            <Text style={styles.challengeTitle}>🎯 Challenge Mode</Text>
            <Text style={styles.challengeDesc}>Get a random problem based on your preferences</Text>
            
            <View style={styles.filterRow}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Category:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.filterChip, filterCategory === cat && styles.filterChipActive]}
                      onPress={() => setFilterCategory(cat)}
                    >
                      <Text style={[styles.filterChipText, filterCategory === cat && styles.filterChipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.filterRow}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Difficulty:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {difficulties.map((diff) => (
                    <TouchableOpacity
                      key={diff}
                      style={[styles.filterChip, filterDifficulty === diff && styles.filterChipActive]}
                      onPress={() => setFilterDifficulty(diff)}
                    >
                      <Text style={[styles.filterChipText, filterDifficulty === diff && styles.filterChipTextActive]}>
                        {diff}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity style={styles.challengeButton} onPress={getRandomChallenge}>
              <Text style={styles.challengeButtonText}>🎲 Get Random Challenge</Text>
            </TouchableOpacity>
          </View>

          {/* Problem List */}
          <View style={styles.problemListCard}>
            <Text style={styles.sectionTitle}>📝 All Problems ({filteredProblems.length})</Text>
            
            {filteredProblems.map((problem) => {
              const isCompleted = userProgress.completedProblems.includes(problem.id);
              return (
                <TouchableOpacity
                  key={problem.id}
                  style={[styles.problemItem, isCompleted && styles.problemItemCompleted]}
                  onPress={() => selectProblem(problem)}
                >
                  <View style={styles.problemHeader}>
                    <View style={styles.problemTitleRow}>
                      {isCompleted && <Text style={styles.checkmark}>✓ </Text>}
                      <Text style={styles.problemTitle}>{problem.title}</Text>
                    </View>
                    <View style={styles.problemBadges}>
                      <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(problem.difficulty) }]}>
                        <Text style={styles.badgeText}>{problem.difficulty}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.categoryText}>{problem.category}</Text>
                  <Text style={styles.problemDesc} numberOfLines={2}>{problem.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Code Editor View
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.editorHeader}>
        <TouchableOpacity onPress={() => setShowProblemList(true)}>
          <Text style={styles.backButton}>← Problems</Text>
        </TouchableOpacity>
        <Text style={styles.editorTitle} numberOfLines={1}>
          {selectedProblem?.title}
        </Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView style={styles.editorContainer}>
        {/* Problem Description */}
        <View style={styles.problemCard}>
          <View style={styles.problemMetaRow}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(selectedProblem?.difficulty || 'Easy') }]}>
              <Text style={styles.badgeText}>{selectedProblem?.difficulty}</Text>
            </View>
            <Text style={styles.categoryBadge}>{selectedProblem?.category}</Text>
          </View>
          <Text style={styles.problemDescription}>{selectedProblem?.description}</Text>
          
          {selectedProblem && selectedProblem.hints.length > 0 && (
            <View style={styles.hintsSection}>
              <Text style={styles.hintsTitle}>💡 Hints:</Text>
              {selectedProblem.hints.map((hint, index) => (
                <Text key={index} style={styles.hintText}>• {hint}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Language Selector */}
        <View style={styles.languageSelector}>
          {(['python', 'c', 'cpp', 'java'] as const).map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[styles.langButton, selectedLanguage === lang && styles.langButtonActive]}
              onPress={() => changeLanguage(lang)}
            >
              <Text style={[styles.langButtonText, selectedLanguage === lang && styles.langButtonTextActive]}>
                {lang === 'python' ? 'Python' : lang === 'cpp' ? 'C++' : lang.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Code Editor */}
        <View style={styles.editorBox}>
          <Text style={styles.editorLabel}>Code Editor</Text>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={setCode}
            multiline
            placeholder="Write your code here..."
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            textAlignVertical="top"
          />
        </View>

        {/* Run Button */}
        <TouchableOpacity
          style={[styles.runButton, isRunning && styles.runButtonDisabled]}
          onPress={runCode}
          disabled={isRunning}
        >
          <Text style={styles.runButtonText}>
            {isRunning ? '⏳ Running...' : '▶️ Run Code'}
          </Text>
        </TouchableOpacity>

        {/* Output Box */}
        {output !== '' && (
          <View style={styles.outputBox}>
            <Text style={styles.outputLabel}>Output:</Text>
            <ScrollView style={styles.outputScroll}>
              <Text style={styles.outputText}>{output}</Text>
            </ScrollView>
          </View>
        )}

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
  challengeCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  challengeDesc: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterGroup: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterChipText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  challengeButton: {
    backgroundColor: '#F59E0B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  challengeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  problemListCard: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  problemItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  problemItemCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  problemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkmark: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: '700',
  },
  problemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  problemBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoryText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
    marginBottom: 8,
  },
  problemDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  editorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  editorContainer: {
    flex: 1,
  },
  problemCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  problemMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  problemDescription: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 22,
    marginBottom: 12,
  },
  hintsSection: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  hintsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 20,
    marginBottom: 4,
  },
  languageSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  langButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  langButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  langButtonTextActive: {
    color: '#FFFFFF',
  },
  editorBox: {
    margin: 16,
    marginTop: 0,
  },
  editorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  codeInput: {
    backgroundColor: '#1E293B',
    color: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    minHeight: 250,
    maxHeight: 400,
  },
  runButton: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  runButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  runButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  outputBox: {
    margin: 16,
    marginTop: 0,
  },
  outputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  outputScroll: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxHeight: 300,
  },
  outputText: {
    padding: 16,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#1E293B',
    lineHeight: 20,
  },
});

export default CodingHubScreen;
