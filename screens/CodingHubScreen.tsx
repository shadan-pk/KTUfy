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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../auth/AuthProvider';
import supabase from '../supabaseClient';
import { executeCode } from '../services/codingService';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, Play, Shuffle, CheckCircle2, Circle } from 'lucide-react-native';

type CodingHubScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'CodingHub'>;
};

interface CodingProblem {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  starterCode: { python: string; c: string; cpp: string; java: string };
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
  const { theme, isDark } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'c' | 'cpp' | 'java'>('python');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<CodingProblem | null>(null);
  const [showProblemList, setShowProblemList] = useState(true);
  const [userProgress, setUserProgress] = useState<UserProgress>({ completedProblems: [], totalAttempts: 0, successfulRuns: 0 });
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('All');

  const codingProblems: CodingProblem[] = [
    { id: 'prob1', title: 'Hello World', description: 'Write a program that prints "Hello, World!" to the console.', difficulty: 'Easy', category: 'Basics', starterCode: { python: '# Write your code here\nprint("Hello, World!")', c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}', cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}', java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}' }, expectedOutput: 'Hello, World!', hints: ['Use the print function', 'Remember to include proper syntax'] },
    { id: 'prob2', title: 'Sum of Two Numbers', description: 'Write a program that adds two numbers (5 and 3) and prints the result.', difficulty: 'Easy', category: 'Basics', starterCode: { python: 'a = 5\nb = 3\nresult = a + b\nprint(result)', c: '#include <stdio.h>\n\nint main() {\n    int a = 5, b = 3;\n    printf("%d\\n", a + b);\n    return 0;\n}', cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a = 5, b = 3;\n    cout << a + b << endl;\n    return 0;\n}', java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println(5 + 3);\n    }\n}' }, expectedOutput: '8', hints: ['Use the + operator', 'Store result in a variable'] },
    { id: 'prob3', title: 'Print Numbers 1 to 10', description: 'Write a program using a loop to print numbers from 1 to 10.', difficulty: 'Easy', category: 'Loops', starterCode: { python: 'for i in range(1, 11):\n    print(i)', c: '#include <stdio.h>\n\nint main() {\n    for(int i = 1; i <= 10; i++) printf("%d\\n", i);\n    return 0;\n}', cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    for(int i = 1; i <= 10; i++) cout << i << endl;\n    return 0;\n}', java: 'public class Main {\n    public static void main(String[] args) {\n        for(int i = 1; i <= 10; i++) System.out.println(i);\n    }\n}' }, expectedOutput: '1\n2\n3\n4\n5\n6\n7\n8\n9\n10', hints: ['Use a for loop', 'Loop from 1 to 10'] },
    { id: 'prob4', title: 'Factorial Calculator', description: 'Write a program to calculate factorial of 5 (5! = 120).', difficulty: 'Medium', category: 'Loops', starterCode: { python: 'n = 5\nfactorial = 1\nfor i in range(1, n + 1):\n    factorial *= i\nprint(factorial)', c: '#include <stdio.h>\n\nint main() {\n    int n = 5, f = 1;\n    for(int i = 1; i <= n; i++) f *= i;\n    printf("%d\\n", f);\n    return 0;\n}', cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n = 5, f = 1;\n    for(int i = 1; i <= n; i++) f *= i;\n    cout << f << endl;\n    return 0;\n}', java: 'public class Main {\n    public static void main(String[] args) {\n        int n = 5, f = 1;\n        for(int i = 1; i <= n; i++) f *= i;\n        System.out.println(f);\n    }\n}' }, expectedOutput: '120', hints: ['Multiply numbers from 1 to n', 'Start with factorial = 1'] },
    { id: 'prob5', title: 'Find Maximum in Array', description: 'Find the maximum number in [3, 7, 2, 9, 1].', difficulty: 'Medium', category: 'Arrays', starterCode: { python: 'arr = [3, 7, 2, 9, 1]\nprint(max(arr))', c: '#include <stdio.h>\n\nint main() {\n    int arr[] = {3,7,2,9,1}, max = arr[0];\n    for(int i = 1; i < 5; i++) if(arr[i] > max) max = arr[i];\n    printf("%d\\n", max);\n    return 0;\n}', cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int arr[] = {3,7,2,9,1}, max = arr[0];\n    for(int i = 1; i < 5; i++) if(arr[i] > max) max = arr[i];\n    cout << max << endl;\n    return 0;\n}', java: 'public class Main {\n    public static void main(String[] args) {\n        int[] arr = {3,7,2,9,1};\n        int max = arr[0];\n        for(int i = 1; i < arr.length; i++) if(arr[i] > max) max = arr[i];\n        System.out.println(max);\n    }\n}' }, expectedOutput: '9', hints: ['Compare each element with current max', 'Initialize max with first element'] },
    { id: 'prob6', title: 'Fibonacci Sequence', description: 'Print the first 10 Fibonacci numbers.', difficulty: 'Medium', category: 'Recursion', starterCode: { python: 'a, b = 0, 1\nfor _ in range(10):\n    print(a)\n    a, b = b, a + b', c: '#include <stdio.h>\n\nint main() {\n    int a = 0, b = 1, next;\n    for(int i = 0; i < 10; i++) {\n        printf("%d\\n", a);\n        next = a + b; a = b; b = next;\n    }\n    return 0;\n}', cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a = 0, b = 1, next;\n    for(int i = 0; i < 10; i++) {\n        cout << a << endl;\n        next = a + b; a = b; b = next;\n    }\n    return 0;\n}', java: 'public class Main {\n    public static void main(String[] args) {\n        int a = 0, b = 1;\n        for(int i = 0; i < 10; i++) {\n            System.out.println(a);\n            int next = a + b; a = b; b = next;\n        }\n    }\n}' }, expectedOutput: '0\n1\n1\n2\n3\n5\n8\n13\n21\n34', hints: ['Start with 0 and 1', 'Each number is sum of previous two'] },
    { id: 'prob7', title: 'Reverse a String', description: 'Print the reverse of "Hello".', difficulty: 'Easy', category: 'Strings', starterCode: { python: 's = "Hello"\nprint(s[::-1])', c: '#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char s[] = "Hello";\n    int n = strlen(s);\n    for(int i = n-1; i >= 0; i--) printf("%c", s[i]);\n    printf("\\n");\n    return 0;\n}', cpp: '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s = "Hello";\n    for(int i = s.length()-1; i >= 0; i--) cout << s[i];\n    cout << endl;\n    return 0;\n}', java: 'public class Main {\n    public static void main(String[] args) {\n        String s = "Hello";\n        for(int i = s.length()-1; i >= 0; i--) System.out.print(s.charAt(i));\n        System.out.println();\n    }\n}' }, expectedOutput: 'olleH', hints: ['Loop from end to start', 'Or use built-in reverse methods'] },
    { id: 'prob8', title: 'Check Prime Number', description: 'Check if 17 is a prime number (print "Prime").', difficulty: 'Medium', category: 'Math', starterCode: { python: 'n = 17\nis_prime = n >= 2 and all(n % i != 0 for i in range(2, int(n**0.5)+1))\nprint("Prime" if is_prime else "Not Prime")', c: '#include <stdio.h>\n#include <math.h>\n\nint main() {\n    int n = 17, p = 1;\n    for(int i = 2; i <= sqrt(n); i++) if(n%i==0){p=0;break;}\n    printf(p ? "Prime\\n" : "Not Prime\\n");\n    return 0;\n}', cpp: '#include <iostream>\n#include <cmath>\nusing namespace std;\n\nint main() {\n    int n = 17;\n    bool p = true;\n    for(int i = 2; i <= sqrt(n); i++) if(n%i==0){p=false;break;}\n    cout << (p ? "Prime" : "Not Prime") << endl;\n    return 0;\n}', java: 'public class Main {\n    public static void main(String[] args) {\n        int n = 17;\n        boolean p = true;\n        for(int i = 2; i <= Math.sqrt(n); i++) if(n%i==0){p=false;break;}\n        System.out.println(p ? "Prime" : "Not Prime");\n    }\n}' }, expectedOutput: 'Prime', hints: ['Check divisibility up to sqrt(n)', 'Numbers less than 2 are not prime'] },
  ];

  const categories = ['All', 'Basics', 'Loops', 'Arrays', 'Recursion', 'Strings', 'Math'];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  useEffect(() => { loadUserProgress(); }, []);

  const loadUserProgress = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('coding_progress').select('*').eq('user_id', user.id).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) setUserProgress({ completedProblems: data.completed_problems || [], totalAttempts: data.total_attempts || 0, successfulRuns: data.successful_runs || 0 });
    } catch (error) { console.error('Error loading progress:', error); }
  };

  const saveProgress = async (newProgress: Partial<UserProgress>) => {
    if (!user) return;
    try {
      const updated = { ...userProgress, ...newProgress };
      await supabase.from('coding_progress').upsert({ user_id: user.id, completed_problems: updated.completedProblems, total_attempts: updated.totalAttempts, successful_runs: updated.successfulRuns, updated_at: new Date().toISOString() });
      setUserProgress(updated);
    } catch (error) { console.error('Error saving progress:', error); }
  };

  const selectProblem = (problem: CodingProblem) => {
    setSelectedProblem(problem);
    setCode(problem.starterCode[selectedLanguage]);
    setOutput('');
    setShowProblemList(false);
  };

  const changeLanguage = (lang: 'python' | 'c' | 'cpp' | 'java') => {
    setSelectedLanguage(lang);
    if (selectedProblem) setCode(selectedProblem.starterCode[lang]);
  };

  const runCode = async () => {
    if (!selectedProblem) return;
    setIsRunning(true);
    setOutput('');
    try {
      const result = await executeCode(code, selectedLanguage);
      if (result.compile_output) { setOutput(`Compilation Error:\n${result.compile_output}`); saveProgress({ totalAttempts: userProgress.totalAttempts + 1 }); return; }
      if (result.stderr) { setOutput(`Runtime Error:\n${result.stderr}`); saveProgress({ totalAttempts: userProgress.totalAttempts + 1 }); return; }
      if (result.status && result.status.id !== 3) { setOutput(`${result.status.description}\n${result.stderr || result.compile_output || ''}`); saveProgress({ totalAttempts: userProgress.totalAttempts + 1 }); return; }
      const actual = (result.stdout || '').trim();
      const expected = selectedProblem.expectedOutput.trim();
      const isCorrect = actual === expected;
      if (isCorrect) {
        setOutput(`Correct!\n\n${actual}`);
        if (!userProgress.completedProblems.includes(selectedProblem.id)) {
          const newCompleted = [...userProgress.completedProblems, selectedProblem.id];
          saveProgress({ completedProblems: newCompleted, totalAttempts: userProgress.totalAttempts + 1, successfulRuns: userProgress.successfulRuns + 1 });
          Alert.alert('Problem Solved!', 'Great job! You can now try more problems.');
        } else {
          saveProgress({ totalAttempts: userProgress.totalAttempts + 1, successfulRuns: userProgress.successfulRuns + 1 });
        }
      } else {
        setOutput(`Output:\n${actual}\n\nExpected:\n${expected}`);
        saveProgress({ totalAttempts: userProgress.totalAttempts + 1 });
      }
    } catch (error: any) {
      setOutput(`Error: ${error?.message || 'Failed to execute. Check your connection.'}`);
    } finally { setIsRunning(false); }
  };

  const getRandomChallenge = () => {
    const filtered = codingProblems.filter(p => (filterCategory === 'All' || p.category === filterCategory) && (filterDifficulty === 'All' || p.difficulty === filterDifficulty));
    if (filtered.length === 0) { Alert.alert('No Problems', 'No problems match your filters.'); return; }
    selectProblem(filtered[Math.floor(Math.random() * filtered.length)]);
  };

  const filteredProblems = codingProblems.filter(p => (filterCategory === 'All' || p.category === filterCategory) && (filterDifficulty === 'All' || p.difficulty === filterDifficulty));

  const getDifficultyColor = (d: string) => d === 'Easy' ? theme.success : d === 'Medium' ? theme.warning : theme.error;

  const getOutputState = (): 'success' | 'error' | 'neutral' => {
    if (output.startsWith('Correct!')) return 'success';
    if (output.startsWith('Compilation') || output.startsWith('Runtime') || output.startsWith('Error')) return 'error';
    return 'neutral';
  };

  const outputState = getOutputState();
  const outputBg = outputState === 'success'
    ? isDark ? 'rgba(52,211,153,0.1)' : 'rgba(16,185,129,0.07)'
    : outputState === 'error'
      ? isDark ? 'rgba(248,113,113,0.1)' : 'rgba(239,68,68,0.07)'
      : theme.backgroundSecondary;
  const outputBorder = outputState === 'success' ? theme.success + '50'
    : outputState === 'error' ? theme.error + '50'
      : theme.border;

  const solvedCount = userProgress.completedProblems.length;
  const total = codingProblems.length;
  const successRate = userProgress.totalAttempts > 0 ? Math.round((userProgress.successfulRuns / userProgress.totalAttempts) * 100) : 0;

  // ── Problem List View ──
  if (showProblemList) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <ArrowLeft size={20} color={theme.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Coding Hub</Text>
          <TouchableOpacity onPress={getRandomChallenge} style={styles.iconBtn}>
            <Shuffle size={18} color={theme.codingHub} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Compact Stats Row */}
          <View style={[styles.statsRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {[
              { label: 'Solved', value: `${solvedCount}/${total}`, color: theme.success },
              { label: 'Attempts', value: userProgress.totalAttempts, color: theme.primary },
              { label: 'Success', value: `${successRate}%`, color: theme.codingHub },
            ].map((s, i) => (
              <View key={i} style={[styles.statCell, i > 0 && { borderLeftWidth: 1, borderLeftColor: theme.divider }]}>
                <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
                <Text style={[styles.statLbl, { color: theme.textTertiary }]}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Filters */}
          <View style={[styles.filtersCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterGroupLabel, { color: theme.textTertiary }]}>CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }, filterCategory === cat && { backgroundColor: theme.codingHub + '20', borderColor: theme.codingHub }]}
                    onPress={() => setFilterCategory(cat)}
                  >
                    <Text style={[styles.chipText, { color: filterCategory === cat ? theme.codingHub : theme.textSecondary }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={[styles.filterDivider, { backgroundColor: theme.divider }]} />
            <View style={styles.filterGroup}>
              <Text style={[styles.filterGroupLabel, { color: theme.textTertiary }]}>DIFFICULTY</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {difficulties.map((diff) => (
                  <TouchableOpacity
                    key={diff}
                    style={[styles.chip, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }, filterDifficulty === diff && { backgroundColor: getDifficultyColor(diff) + '20', borderColor: getDifficultyColor(diff) }]}
                    onPress={() => setFilterDifficulty(diff)}
                  >
                    <Text style={[styles.chipText, { color: filterDifficulty === diff ? getDifficultyColor(diff) : theme.textSecondary }]}>{diff}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Problem List */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              {filteredProblems.length} problem{filteredProblems.length !== 1 ? 's' : ''}
            </Text>
            {filteredProblems.map((problem) => {
              const isCompleted = userProgress.completedProblems.includes(problem.id);
              const diffColor = getDifficultyColor(problem.difficulty);
              return (
                <TouchableOpacity
                  key={problem.id}
                  style={[styles.problemRow, { backgroundColor: theme.card, borderColor: isCompleted ? theme.success + '40' : theme.cardBorder }]}
                  onPress={() => selectProblem(problem)}
                  activeOpacity={0.7}
                >
                  {isCompleted
                    ? <CheckCircle2 size={18} color={theme.success} strokeWidth={2} style={{ marginRight: 10 }} />
                    : <Circle size={18} color={theme.border} strokeWidth={2} style={{ marginRight: 10 }} />
                  }
                  <View style={styles.problemRowInfo}>
                    <Text style={[styles.problemRowTitle, { color: theme.text }]}>{problem.title}</Text>
                    <Text style={[styles.problemRowMeta, { color: theme.textTertiary }]}>{problem.category}</Text>
                  </View>
                  <View style={[styles.diffDot, { backgroundColor: diffColor }]} />
                  <Text style={[styles.diffLabel, { color: diffColor }]}>{problem.difficulty}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Code Editor View ──
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Editor Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => setShowProblemList(true)} style={styles.iconBtn}>
          <ArrowLeft size={20} color={theme.text} strokeWidth={2} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 8 }}>
          <Text style={[styles.editorTitle, { color: theme.text }]} numberOfLines={1}>
            {selectedProblem?.title}
          </Text>
          {selectedProblem && (
            <View style={styles.editorMeta}>
              <View style={[styles.diffDot, { backgroundColor: getDifficultyColor(selectedProblem.difficulty) }]} />
              <Text style={[styles.editorMetaText, { color: theme.textTertiary }]}>
                {selectedProblem.difficulty} · {selectedProblem.category}
              </Text>
            </View>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Problem Description */}
        <View style={[styles.descCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.descText, { color: theme.text }]}>{selectedProblem?.description}</Text>
          {selectedProblem && selectedProblem.hints.length > 0 && (
            <View style={[styles.hintsRow, { borderTopColor: theme.divider }]}>
              <Text style={[styles.hintsLabel, { color: theme.textTertiary }]}>HINTS</Text>
              {selectedProblem.hints.map((hint, i) => (
                <Text key={i} style={[styles.hintText, { color: theme.textSecondary }]}>· {hint}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Language Tabs */}
        <View style={[styles.langTabs, { backgroundColor: theme.backgroundSecondary }]}>
          {(['python', 'c', 'cpp', 'java'] as const).map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[styles.langTab, selectedLanguage === lang && { backgroundColor: theme.card }]}
              onPress={() => changeLanguage(lang)}
            >
              <Text style={[styles.langTabText, { color: selectedLanguage === lang ? theme.codingHub : theme.textTertiary }]}>
                {lang === 'python' ? 'Python' : lang === 'cpp' ? 'C++' : lang.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Code Input */}
        <View style={styles.editorWrap}>
          <TextInput
            style={[styles.codeInput, { backgroundColor: isDark ? '#0D1117' : '#1A1F35' }]}
            value={code}
            onChangeText={setCode}
            multiline
            placeholder="Write your code here..."
            placeholderTextColor="#4A5568"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            textAlignVertical="top"
          />
        </View>

        {/* Run Button */}
        <TouchableOpacity
          style={[styles.runBtn, { backgroundColor: isRunning ? theme.textTertiary : theme.codingHub }]}
          onPress={runCode}
          disabled={isRunning}
        >
          <Play size={16} color="#FFFFFF" strokeWidth={2.5} fill="#FFFFFF" />
          <Text style={styles.runBtnText}>{isRunning ? 'Running...' : 'Run Code'}</Text>
        </TouchableOpacity>

        {/* Output */}
        {output !== '' && (
          <View style={[styles.outputCard, { backgroundColor: outputBg, borderColor: outputBorder }]}>
            <Text style={[styles.outputLabel, { color: outputState === 'success' ? theme.success : outputState === 'error' ? theme.error : theme.textSecondary }]}>
              {outputState === 'success' ? 'Output · Correct' : outputState === 'error' ? 'Error' : 'Output'}
            </Text>
            <Text style={[styles.outputText, { color: theme.text }]}>{output}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
  scrollView: { flex: 1 },
  // Stats row
  statsRow: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 14,
    borderRadius: 12, borderWidth: 1, overflow: 'hidden',
  },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statVal: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  statLbl: { fontSize: 11, fontWeight: '500' },
  // Filters
  filtersCard: {
    marginHorizontal: 16, marginTop: 12,
    borderRadius: 12, borderWidth: 1, overflow: 'hidden',
  },
  filterGroup: { padding: 12 },
  filterGroupLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8 },
  filterDivider: { height: 1, marginHorizontal: 12 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 16, borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  // Section
  section: { marginHorizontal: 16, marginTop: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '600', marginBottom: 10 },
  // Problem row
  problemRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, padding: 13, marginBottom: 8, borderWidth: 1,
  },
  problemRowInfo: { flex: 1 },
  problemRowTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  problemRowMeta: { fontSize: 11 },
  diffDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  diffLabel: { fontSize: 12, fontWeight: '700' },
  // Editor view
  editorTitle: { fontSize: 15, fontWeight: '700' },
  editorMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  editorMetaText: { fontSize: 11 },
  descCard: {
    marginHorizontal: 16, marginTop: 12,
    borderRadius: 12, borderWidth: 1, overflow: 'hidden',
    padding: 14,
  },
  descText: { fontSize: 13, lineHeight: 20 },
  hintsRow: { marginTop: 12, paddingTop: 10, borderTopWidth: 1 },
  hintsLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, marginBottom: 6 },
  hintText: { fontSize: 12, lineHeight: 18 },
  // Language tabs
  langTabs: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 12,
    borderRadius: 10, padding: 3,
  },
  langTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  langTabText: { fontSize: 12, fontWeight: '600' },
  // Code editor
  editorWrap: { marginHorizontal: 16, marginTop: 10 },
  codeInput: {
    color: '#E2E8F0', padding: 14, borderRadius: 12,
    fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    minHeight: 240, lineHeight: 19,
  },
  // Run button
  runBtn: {
    marginHorizontal: 16, marginTop: 10, padding: 14,
    borderRadius: 12, alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 8,
  },
  runBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  // Output
  outputCard: {
    marginHorizontal: 16, marginTop: 10,
    borderRadius: 12, borderWidth: 1, padding: 14,
  },
  outputLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase' },
  outputText: {
    fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', lineHeight: 19,
  },
});

export default CodingHubScreen;
