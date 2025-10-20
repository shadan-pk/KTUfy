import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { HomeScreenNavigationProp } from '../types/navigation';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

interface GradeItem {
  subject: string;
  credit: string;
  grade: string;
}

interface SemesterItem {
  name: string;
  sgpa: string;
  credits: string;
}

interface UserData {
  name?: string;
  registrationNumber?: string;
  college?: string;
  branch?: string;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorType, setCalculatorType] = useState<'sgpa' | 'cgpa'>('sgpa');
  const [grades, setGrades] = useState<GradeItem[]>([{ subject: '', credit: '', grade: '' }]);
  const [semesters, setSemesters] = useState<SemesterItem[]>([{ name: '', sgpa: '', credits: '' }]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    });

    return unsubscribe;
  }, []);

  const addGradeRow = () => {
    setGrades([...grades, { subject: '', credit: '', grade: '' }]);
  };

  const removeGradeRow = (index: number) => {
    const newGrades = grades.filter((_, i) => i !== index);
    setGrades(newGrades);
  };

  const updateGrade = (index: number, field: keyof GradeItem, value: string) => {
    const newGrades = [...grades];
    newGrades[index][field] = value;
    setGrades(newGrades);
  };

  const addSemesterRow = () => {
    setSemesters([...semesters, { name: '', sgpa: '', credits: '' }]);
  };

  const removeSemesterRow = (index: number) => {
    const newSemesters = semesters.filter((_, i) => i !== index);
    setSemesters(newSemesters);
  };

  const updateSemester = (index: number, field: keyof SemesterItem, value: string) => {
    const newSemesters = [...semesters];
    newSemesters[index][field] = value;
    setSemesters(newSemesters);
  };

  const gradeToPoint = (grade: string): number => {
    const gradeMap: { [key: string]: number } = {
      'S': 10, 'A+': 9, 'A': 8.5, 'B+': 8, 'B': 7, 'C': 6, 'P': 5, 'F': 0
    };
    return gradeMap[grade] || 0;
  };

  const calculateSGPA = (): string => {
    let totalCredits = 0;
    let totalPoints = 0;

    grades.forEach(item => {
      const credit = parseFloat(item.credit);
      const gradePoint = gradeToPoint(item.grade);
      if (!isNaN(credit) && gradePoint !== undefined) {
        totalCredits += credit;
        totalPoints += credit * gradePoint;
      }
    });

    if (totalCredits === 0) return '0.00';
    return (totalPoints / totalCredits).toFixed(2);
  };

  const calculateCGPA = (): string => {
    let totalPoints = 0;
    let totalCredits = 0;

    semesters.forEach(item => {
      const sgpa = parseFloat(item.sgpa);
      const credits = parseFloat(item.credits);
      if (!isNaN(sgpa) && !isNaN(credits)) {
        totalPoints += sgpa * credits;
        totalCredits += credits;
      }
    });

    if (totalCredits === 0) return '0.00';
    return (totalPoints / totalCredits).toFixed(2);
  };

  const resetCalculator = () => {
    if (calculatorType === 'sgpa') {
      setGrades([{ subject: '', credit: '', grade: '' }]);
    } else {
      setSemesters([{ name: '', sgpa: '', credits: '' }]);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              // Navigation will be handled by the main App component
            } catch (error: any) {
              Alert.alert('Logout Error', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Greeting */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {getGreeting()}, {user?.displayName || userData?.name || 'Student'}! 👋
          </Text>
          <Text style={styles.date}>{getFormattedDate()}</Text>
        </View>

        {/* User Info Card */}
        {userData?.registrationNumber && (
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>📚 Student Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Registration No:</Text>
              <Text style={styles.infoValue}>{userData.registrationNumber}</Text>
            </View>
            {userData.college && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>College:</Text>
                <Text style={styles.infoValue}>{userData.college}</Text>
              </View>
            )}
            {userData.branch && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Branch:</Text>
                <Text style={styles.infoValue}>{userData.branch}</Text>
              </View>
            )}
          </View>
        )}

        {/* SGPA/CGPA Calculator */}
        <View style={styles.calculatorCard}>
          <TouchableOpacity
            style={styles.calculatorHeader}
            onPress={() => setShowCalculator(!showCalculator)}
            activeOpacity={0.7}
          >
            <Text style={styles.calculatorTitle}>📊 SGPA / CGPA Calculator</Text>
            <View style={styles.expandButton}>
              <Text style={styles.expandButtonText}>{showCalculator ? '−' : '+'}</Text>
            </View>
          </TouchableOpacity>

          {showCalculator && (
            <View style={styles.calculatorContent}>
              {/* Toggle between SGPA and CGPA */}
              <View style={styles.calculatorToggle}>
                <TouchableOpacity
                  style={[styles.toggleButton, calculatorType === 'sgpa' && styles.toggleButtonActive]}
                  onPress={() => setCalculatorType('sgpa')}
                >
                  <Text style={[styles.toggleButtonText, calculatorType === 'sgpa' && styles.toggleButtonTextActive]}>
                    SGPA
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, calculatorType === 'cgpa' && styles.toggleButtonActive]}
                  onPress={() => setCalculatorType('cgpa')}
                >
                  <Text style={[styles.toggleButtonText, calculatorType === 'cgpa' && styles.toggleButtonTextActive]}>
                    CGPA
                  </Text>
                </TouchableOpacity>
              </View>

              {calculatorType === 'sgpa' ? (
                <View>
                  {grades.map((item, index) => (
                    <View key={index} style={styles.gradeRow}>
                      <View style={styles.gradeInputs}>
                        <TextInput
                          style={[styles.input, styles.subjectInput]}
                          placeholder="Subject"
                          placeholderTextColor="#64748B"
                          value={item.subject}
                          onChangeText={(text) => updateGrade(index, 'subject', text)}
                        />
                        <TextInput
                          style={[styles.input, styles.creditInput]}
                          placeholder="Credit"
                          placeholderTextColor="#64748B"
                          keyboardType="numeric"
                          value={item.credit}
                          onChangeText={(text) => updateGrade(index, 'credit', text)}
                        />
                        <TouchableOpacity
                          style={styles.gradeButton}
                          onPress={() => {
                            Alert.alert(
                              'Select Grade',
                              '',
                              [
                                { text: 'S (10)', onPress: () => updateGrade(index, 'grade', 'S') },
                                { text: 'A+ (9)', onPress: () => updateGrade(index, 'grade', 'A+') },
                                { text: 'A (8.5)', onPress: () => updateGrade(index, 'grade', 'A') },
                                { text: 'B+ (8)', onPress: () => updateGrade(index, 'grade', 'B+') },
                                { text: 'B (7)', onPress: () => updateGrade(index, 'grade', 'B') },
                                { text: 'C (6)', onPress: () => updateGrade(index, 'grade', 'C') },
                                { text: 'P (5)', onPress: () => updateGrade(index, 'grade', 'P') },
                                { text: 'F (0)', onPress: () => updateGrade(index, 'grade', 'F') },
                                { text: 'Cancel', style: 'cancel' },
                              ]
                            );
                          }}
                        >
                          <Text style={styles.gradeButtonText}>{item.grade || 'Grade'}</Text>
                        </TouchableOpacity>
                      </View>
                      {grades.length > 1 && (
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removeGradeRow(index)}
                        >
                          <Text style={styles.removeButtonText}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addButton} onPress={addGradeRow}>
                    <Text style={styles.addButtonText}>+ Add Subject</Text>
                  </TouchableOpacity>
                  {grades.some(g => g.credit && g.grade) && (
                    <View style={styles.resultCard}>
                      <Text style={styles.resultLabel}>YOUR SGPA</Text>
                      <Text style={styles.resultValue}>{calculateSGPA()}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View>
                  {semesters.map((item, index) => (
                    <View key={index} style={styles.gradeRow}>
                      <View style={styles.gradeInputs}>
                        <TextInput
                          style={[styles.input, styles.subjectInput]}
                          placeholder="Semester"
                          placeholderTextColor="#64748B"
                          value={item.name}
                          onChangeText={(text) => updateSemester(index, 'name', text)}
                        />
                        <TextInput
                          style={[styles.input, styles.creditInput]}
                          placeholder="SGPA"
                          placeholderTextColor="#64748B"
                          keyboardType="numeric"
                          value={item.sgpa}
                          onChangeText={(text) => updateSemester(index, 'sgpa', text)}
                        />
                        <TextInput
                          style={[styles.input, styles.creditInput]}
                          placeholder="Credits"
                          placeholderTextColor="#64748B"
                          keyboardType="numeric"
                          value={item.credits}
                          onChangeText={(text) => updateSemester(index, 'credits', text)}
                        />
                      </View>
                      {semesters.length > 1 && (
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removeSemesterRow(index)}
                        >
                          <Text style={styles.removeButtonText}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addButton} onPress={addSemesterRow}>
                    <Text style={styles.addButtonText}>+ Add Semester</Text>
                  </TouchableOpacity>
                  {semesters.some(s => s.sgpa && s.credits) && (
                    <View style={styles.resultCard}>
                      <Text style={styles.resultLabel}>YOUR CGPA</Text>
                      <Text style={styles.resultValue}>{calculateCGPA()}</Text>
                    </View>
                  )}
                </View>
              )}
              <TouchableOpacity style={styles.resetButton} onPress={resetCalculator}>
                <Text style={styles.resetButtonText}>Reset Calculator</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.grid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>👤</Text>
              </View>
              <Text style={styles.actionText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Schedule')}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>📅</Text>
              </View>
              <Text style={styles.actionText}>Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Library')}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>📚</Text>
              </View>
              <Text style={styles.actionText}>Library</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Ticklist')}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>✓</Text>
              </View>
              <Text style={styles.actionText}>Ticklist</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Chatbot')}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>🤖</Text>
              </View>
              <Text style={styles.actionText}>AI Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Settings')}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>⚙️</Text>
              </View>
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Help')}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>💡</Text>
              </View>
              <Text style={styles.actionText}>Help</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handleLogout}>
              <View style={[styles.actionIcon, { backgroundColor: '#EF4444' }]}>
                <Text style={styles.actionEmoji}>🚪</Text>
              </View>
              <Text style={styles.actionText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );

        {/* SGPA/CGPA Calculator Card */}
        <View style={styles.calculatorCard}>
          <TouchableOpacity 
            style={styles.calculatorHeader}
            onPress={() => setShowCalculator(!showCalculator)}
            activeOpacity={0.7}
          >
            <Text style={styles.calculatorTitle}>📊 SGPA / CGPA Calculator</Text>
            <View style={styles.expandButton}>
              <Text style={styles.expandButtonText}>{showCalculator ? '−' : '+'}</Text>
            </View>
          </TouchableOpacity>

          {showCalculator && (
            <View style={styles.calculatorContent}>
              {/* Toggle between SGPA and CGPA */}
              <View style={styles.calculatorToggle}>
                <TouchableOpacity
                  style={[styles.toggleButton, calculatorType === 'sgpa' && styles.toggleButtonActive]}
                  onPress={() => setCalculatorType('sgpa')}
                >
                  <Text style={[styles.toggleButtonText, calculatorType === 'sgpa' && styles.toggleButtonTextActive]}>
                    SGPA
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, calculatorType === 'cgpa' && styles.toggleButtonActive]}
                  onPress={() => setCalculatorType('cgpa')}
                >
                  <Text style={[styles.toggleButtonText, calculatorType === 'cgpa' && styles.toggleButtonTextActive]}>
                    CGPA
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.calculatorScroll} nestedScrollEnabled>
                {calculatorType === 'sgpa' ? (
                  <View>
                    <Text style={styles.calculatorInstructions}>
                      Enter subject details and grades to calculate your SGPA
                    </Text>

                    {/* Grade Reference */}
                    <View style={styles.gradeReference}>
                      <Text style={styles.gradeReferenceTitle}>Grade Points:</Text>
                      <Text style={styles.gradeReferenceText}>S=10, A+=9, A=8.5, B+=8, B=7, C=6, P=5, F=0</Text>
                    </View>

                    {/* SGPA Input Fields */}
                    {grades.map((item, index) => (
                      <View key={index} style={styles.subjectContainer}>
                        <View style={styles.calculatorItemHeader}>
                          <Text style={styles.calculatorItemNumber}>Subject {index + 1}</Text>
                          {grades.length > 1 && (
                            <TouchableOpacity
                              style={styles.removeButtonSmall}
                              onPress={() => removeGradeRow(index)}
                            >
                              <Text style={styles.removeButtonTextSmall}>×</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* Subject Name */}
                        <View style={styles.subjectNameRow}>
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Subject Name (Optional)</Text>
                            <View style={styles.inputContainer}>
                              <Text style={styles.inputIcon}>📖</Text>
                              <TextInput
                                style={styles.input}
                                placeholder="e.g., Mathematics"
                                placeholderTextColor="#9CA3AF"
                                value={item.subject}
                                onChangeText={(text) => updateGrade(index, 'subject', text)}
                              />
                            </View>
                          </View>
                        </View>

                        <View style={styles.inputRow}>
                          {/* Credits */}
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Credits</Text>
                            <View style={styles.inputContainer}>
                              <Text style={styles.inputIcon}>📚</Text>
                              <TextInput
                                style={styles.input}
                                placeholder="4"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                                value={item.credit}
                                onChangeText={(text) => updateGrade(index, 'credit', text)}
                              />
                            </View>
                          </View>

                          {/* Grade */}
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Grade</Text>
                            <TouchableOpacity
                              style={styles.inputContainer}
                              onPress={() => {
                                Alert.alert(
                                  'Select Grade',
                                  'Choose your grade',
                                  [
                                    { text: 'S (10)', onPress: () => updateGrade(index, 'grade', 'S') },
                                    { text: 'A+ (9)', onPress: () => updateGrade(index, 'grade', 'A+') },
                                    { text: 'A (8.5)', onPress: () => updateGrade(index, 'grade', 'A') },
                                    { text: 'B+ (8)', onPress: () => updateGrade(index, 'grade', 'B+') },
                                    { text: 'B (7)', onPress: () => updateGrade(index, 'grade', 'B') },
                                    { text: 'C (6)', onPress: () => updateGrade(index, 'grade', 'C') },
                                    { text: 'P (5)', onPress: () => updateGrade(index, 'grade', 'P') },
                                    { text: 'F (0)', onPress: () => updateGrade(index, 'grade', 'F') },
                                    { text: 'Cancel', style: 'cancel' }
                                  ]
                                );
                              }}
                            >
                              <Text style={styles.inputIcon}>🎯</Text>
                              <Text style={[styles.input, !item.grade && styles.inputPlaceholder]}>
                                {item.grade || 'Select'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}

                    {/* Add Subject Button */}
                    <TouchableOpacity style={styles.addButton} onPress={addGradeRow}>
                      <Text style={styles.addButtonText}>+ Add Subject</Text>
                    </TouchableOpacity>

                    {/* SGPA Result */}
                    {grades.some(g => g.credit && g.grade) && (
                      <View style={styles.resultCard}>
                        <Text style={styles.resultLabel}>Your SGPA</Text>
                        <Text style={styles.resultValue}>{calculateSGPA()}</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View>
                    <Text style={styles.calculatorInstructions}>
                      Enter semester-wise SGPA and credits to calculate your CGPA
                    </Text>

                    {/* CGPA Input Fields */}
                    {semesters.map((item, index) => (
                      <View key={index} style={styles.subjectContainer}>
                        <View style={styles.calculatorItemHeader}>
                          <Text style={styles.calculatorItemNumber}>Semester {index + 1}</Text>
                          {semesters.length > 1 && (
                            <TouchableOpacity
                              style={styles.removeButtonSmall}
                              onPress={() => removeSemesterRow(index)}
                            >
                              <Text style={styles.removeButtonTextSmall}>×</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* Semester Name */}
                        <View style={styles.subjectNameRow}>
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Semester Name (Optional)</Text>
                            <View style={styles.inputContainer}>
                              <Text style={styles.inputIcon}>📅</Text>
                              <TextInput
                                style={styles.input}
                                placeholder="e.g., S1, S2"
                                placeholderTextColor="#9CA3AF"
                                value={item.name}
                                onChangeText={(text) => updateSemester(index, 'name', text)}
                              />
                            </View>
                          </View>
                        </View>

                        <View style={styles.inputRow}>
                          {/* SGPA */}
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>SGPA</Text>
                            <View style={styles.inputContainer}>
                              <Text style={styles.inputIcon}>📊</Text>
                              <TextInput
                                style={styles.input}
                                placeholder="8.5"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="decimal-pad"
                                value={item.sgpa}
                                onChangeText={(text) => updateSemester(index, 'sgpa', text)}
                              />
                            </View>
                          </View>

                          {/* Credits */}
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Credits</Text>
                            <View style={styles.inputContainer}>
                              <Text style={styles.inputIcon}>📚</Text>
                              <TextInput
                                style={styles.input}
                                placeholder="20"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                                value={item.credits}
                                onChangeText={(text) => updateSemester(index, 'credits', text)}
                              />
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}

                    {/* Add Semester Button */}
                    <TouchableOpacity style={styles.addButton} onPress={addSemesterRow}>
                      <Text style={styles.addButtonText}>+ Add Semester</Text>
                    </TouchableOpacity>

                    {/* CGPA Result */}
                    {semesters.some(s => s.sgpa && s.credits) && (
                      <View style={styles.resultCard}>
                        <Text style={styles.resultLabel}>Your CGPA</Text>
                        <Text style={styles.resultValue}>{calculateCGPA()}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Reset Button */}
                <TouchableOpacity style={styles.resetButton} onPress={resetCalculator}>
                  <Text style={styles.resetButtonText}>🔄 Reset</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.actionIcon}>👤</Text>
              <Text style={styles.actionText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Schedule')}
            >
              <Text style={styles.actionIcon}>📅</Text>
              <Text style={styles.actionText}>Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Library')}
            >
              <Text style={styles.actionIcon}>📚</Text>
              <Text style={styles.actionText}>Library</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Ticklist')}
            >
              <Text style={styles.actionIcon}>✓</Text>
              <Text style={styles.actionText}>Ticklist</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Chatbot')}
            >
              <Text style={styles.actionIcon}>🤖</Text>
              <Text style={styles.actionText}>AI Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.actionIcon}>⚙️</Text>
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 24,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  infoCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
  },
  infoLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  calculatorCard: {
    backgroundColor: '#1E293B',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  calculatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0F172A',
  },
  calculatorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  expandButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667EEA',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  expandButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  calculatorContent: {
    padding: 24,
    backgroundColor: '#1E293B',
  },
  calculatorToggle: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 6,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#667EEA',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  gradeRow: {
    marginBottom: 16,
  },
  gradeInputs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#334155',
    fontWeight: '600',
  },
  subjectInput: {
    flex: 2,
  },
  creditInput: {
    flex: 1,
  },
  gradeButton: {
    flex: 1,
    backgroundColor: '#667EEA',
    borderRadius: 14,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  gradeButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  removeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  removeButtonText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#667EEA',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#667EEA',
  },
  resultCard: {
    backgroundColor: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    borderRadius: 20,
    padding: 28,
    marginTop: 24,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  resultLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  resultValue: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  resetButton: {
    backgroundColor: '#334155',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#475569',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#94A3B8',
  },
  section: {
    padding: 20,
    paddingTop: 28,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
    paddingLeft: 4,
    letterSpacing: -0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  actionCard: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#667EEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  actionEmoji: {
    fontSize: 30,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
  },
});
});

export default HomeScreen;
