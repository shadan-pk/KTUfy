import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GPACalculatorScreenNavigationProp } from '../types/navigation';

// Grade point mapping
const GRADE_POINTS: { [key: string]: number } = {
  'O': 10,
  'A+': 9,
  'A': 8.5,
  'B+': 8,
  'B': 7,
  'C': 6,
  'P': 5,
  'F': 0,
};

const GRADES = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'];

// Subject data for each semester (KTU standard subjects)
const SEMESTER_SUBJECTS: { [key: string]: Array<{ name: string; credit: number }> } = {
  'S1': [
    { name: 'Calculus', credit: 4 },
    { name: 'Physics', credit: 3 },
    { name: 'Chemistry', credit: 3 },
    { name: 'Engineering Graphics', credit: 4 },
    { name: 'Basic Electrical Engineering', credit: 3 },
    { name: 'Programming in C', credit: 3 },
  ],
  'S2': [
    { name: 'Linear Algebra', credit: 4 },
    { name: 'Physics Lab', credit: 1 },
    { name: 'Chemistry Lab', credit: 1 },
    { name: 'Engineering Mechanics', credit: 4 },
    { name: 'Basic Electronics', credit: 3 },
    { name: 'C Programming Lab', credit: 2 },
  ],
  'S3': [
    { name: 'Data Structures', credit: 4 },
    { name: 'Discrete Mathematics', credit: 4 },
    { name: 'Digital Electronics', credit: 3 },
    { name: 'Computer Organization', credit: 3 },
    { name: 'Object Oriented Programming', credit: 3 },
    { name: 'Data Structures Lab', credit: 2 },
  ],
  'S4': [
    { name: 'Database Management Systems', credit: 4 },
    { name: 'Operating Systems', credit: 4 },
    { name: 'Microprocessors', credit: 3 },
    { name: 'Computer Networks', credit: 3 },
    { name: 'Design and Analysis of Algorithms', credit: 4 },
    { name: 'DBMS Lab', credit: 2 },
  ],
  'S5': [
    { name: 'Software Engineering', credit: 3 },
    { name: 'Theory of Computation', credit: 4 },
    { name: 'Compiler Design', credit: 4 },
    { name: 'Web Programming', credit: 3 },
    { name: 'Elective I', credit: 3 },
    { name: 'Mini Project', credit: 2 },
  ],
  'S6': [
    { name: 'Machine Learning', credit: 3 },
    { name: 'Computer Graphics', credit: 3 },
    { name: 'Artificial Intelligence', credit: 4 },
    { name: 'Mobile App Development', credit: 3 },
    { name: 'Elective II', credit: 3 },
    { name: 'Project Phase I', credit: 3 },
  ],
  'S7': [
    { name: 'Big Data Analytics', credit: 3 },
    { name: 'Cloud Computing', credit: 3 },
    { name: 'Cyber Security', credit: 3 },
    { name: 'Elective III', credit: 3 },
    { name: 'Elective IV', credit: 3 },
    { name: 'Project Phase II', credit: 4 },
  ],
  'S8': [
    { name: 'Industrial Training', credit: 2 },
    { name: 'Seminar', credit: 2 },
    { name: 'Project', credit: 10 },
    { name: 'Comprehensive Exam', credit: 2 },
  ],
};

// Semester credits (total credits per semester)
const SEMESTER_CREDITS: { [key: string]: number } = {
  'S1': 20,
  'S2': 15,
  'S3': 19,
  'S4': 20,
  'S5': 19,
  'S6': 19,
  'S7': 19,
  'S8': 16,
};

interface SubjectGrade {
  name: string;
  credit: number;
  grade: string;
}

interface SemesterSGPA {
  semester: string;
  sgpa: string;
}

type TabType = 'SGPA' | 'CGPA';

export default function GPACalculatorScreen() {
  const navigation = useNavigation<GPACalculatorScreenNavigationProp>();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('SGPA');
  
  // SGPA Calculator state
  const [selectedSemester, setSelectedSemester] = useState<string>('S1');
  const [subjectGrades, setSubjectGrades] = useState<SubjectGrade[]>([]);
  const [calculatedSGPA, setCalculatedSGPA] = useState<number | null>(null);
  const [showSemesterPicker, setShowSemesterPicker] = useState(false);
  const [showGradePicker, setShowGradePicker] = useState(false);
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState<number>(0);
  
  // CGPA Calculator state
  const [selectedSemesters, setSelectedSemesters] = useState<number>(1);
  const [semesterSGPAs, setSemesterSGPAs] = useState<SemesterSGPA[]>([
    { semester: 'S1', sgpa: '' }
  ]);
  const [calculatedCGPA, setCalculatedCGPA] = useState<number | null>(null);
  const [showSemesterCountPicker, setShowSemesterCountPicker] = useState(false);

  // Initialize subjects when semester changes
  useEffect(() => {
    const subjects = SEMESTER_SUBJECTS[selectedSemester].map(subject => ({
      ...subject,
      grade: '',
    }));
    setSubjectGrades(subjects);
    setCalculatedSGPA(null);
  }, [selectedSemester]);

  // Initialize semester SGPAs when count changes
  useEffect(() => {
    const semesters: SemesterSGPA[] = [];
    for (let i = 1; i <= selectedSemesters; i++) {
      semesters.push({ semester: `S${i}`, sgpa: '' });
    }
    setSemesterSGPAs(semesters);
    setCalculatedCGPA(null);
  }, [selectedSemesters]);

  // SGPA Calculation
  const calculateSGPA = () => {
    const allGradesEntered = subjectGrades.every(subject => subject.grade !== '');
    
    if (!allGradesEntered) {
      Alert.alert('Incomplete Data', 'Please select grades for all subjects.');
      return;
    }

    let totalGradePoints = 0;
    let totalCredits = 0;

    subjectGrades.forEach(subject => {
      const gradePoint = GRADE_POINTS[subject.grade];
      totalGradePoints += subject.credit * gradePoint;
      totalCredits += subject.credit;
    });

    const sgpa = totalGradePoints / totalCredits;
    setCalculatedSGPA(parseFloat(sgpa.toFixed(2)));
  };

  // CGPA Calculation
  const calculateCGPA = () => {
    const allSGPAsEntered = semesterSGPAs.every(sem => sem.sgpa !== '');
    
    if (!allSGPAsEntered) {
      Alert.alert('Incomplete Data', 'Please enter SGPA for all selected semesters.');
      return;
    }

    let totalWeightedSGPA = 0;
    let totalCredits = 0;

    semesterSGPAs.forEach(sem => {
      const sgpa = parseFloat(sem.sgpa);
      const credits = SEMESTER_CREDITS[sem.semester];
      totalWeightedSGPA += sgpa * credits;
      totalCredits += credits;
    });

    const cgpa = totalWeightedSGPA / totalCredits;
    setCalculatedCGPA(parseFloat(cgpa.toFixed(2)));
  };

  // Get result color based on GPA
  const getResultColor = (gpa: number): string => {
    if (gpa >= 8.0) return '#10B981'; // Green
    if (gpa >= 6.0) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  // Get result indicator
  const getResultIndicator = (gpa: number): string => {
    if (gpa >= 8.0) return '🟢 Excellent';
    if (gpa >= 6.0) return '🟡 Average';
    return '🔴 Needs Improvement';
  };

  // Reset SGPA Calculator
  const resetSGPA = () => {
    const subjects = SEMESTER_SUBJECTS[selectedSemester].map(subject => ({
      ...subject,
      grade: '',
    }));
    setSubjectGrades(subjects);
    setCalculatedSGPA(null);
  };

  // Reset CGPA Calculator
  const resetCGPA = () => {
    const semesters: SemesterSGPA[] = [];
    for (let i = 1; i <= selectedSemesters; i++) {
      semesters.push({ semester: `S${i}`, sgpa: '' });
    }
    setSemesterSGPAs(semesters);
    setCalculatedCGPA(null);
  };

  // Update subject grade
  const updateSubjectGrade = (index: number, grade: string) => {
    const updated = [...subjectGrades];
    updated[index].grade = grade;
    setSubjectGrades(updated);
    setCalculatedSGPA(null); // Reset result when grade changes
  };

  // Update semester SGPA
  const updateSemesterSGPA = (index: number, sgpa: string) => {
    const updated = [...semesterSGPAs];
    updated[index].sgpa = sgpa;
    setSemesterSGPAs(updated);
    setCalculatedCGPA(null); // Reset result when SGPA changes
  };

  // Save result
  const saveResult = () => {
    if (activeTab === 'SGPA' && calculatedSGPA !== null) {
      Alert.alert(
        'Result Saved',
        `${selectedSemester} SGPA: ${calculatedSGPA} saved successfully!`
      );
    } else if (activeTab === 'CGPA' && calculatedCGPA !== null) {
      Alert.alert(
        'Result Saved',
        `CGPA: ${calculatedCGPA} saved successfully!`
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GPA Calculator</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'SGPA' && styles.activeTab]}
          onPress={() => setActiveTab('SGPA')}
        >
          <Text style={[styles.tabText, activeTab === 'SGPA' && styles.activeTabText]}>
            SGPA Calculator
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'CGPA' && styles.activeTab]}
          onPress={() => setActiveTab('CGPA')}
        >
          <Text style={[styles.tabText, activeTab === 'CGPA' && styles.activeTabText]}>
            CGPA Calculator
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'SGPA' ? (
          // SGPA Calculator
          <View>
            {/* Semester Selector */}
            <View style={styles.selectorCard}>
              <Text style={styles.selectorLabel}>Select Semester</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowSemesterPicker(true)}
              >
                <Text style={styles.dropdownText}>{selectedSemester}</Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Subjects List */}
            <View style={styles.subjectsCard}>
              <Text style={styles.cardTitle}>Subjects & Grades</Text>
              {subjectGrades.map((subject, index) => (
                <View key={index} style={styles.subjectRow}>
                  <View style={styles.subjectInfo}>
                    <Text style={styles.subjectName}>{subject.name}</Text>
                    <Text style={styles.subjectCredit}>{subject.credit} Credits</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.gradeButton,
                      subject.grade && { backgroundColor: '#6366F1' }
                    ]}
                    onPress={() => {
                      setSelectedSubjectIndex(index);
                      setShowGradePicker(true);
                    }}
                  >
                    <Text style={[
                      styles.gradeButtonText,
                      subject.grade && { color: '#FFFFFF' }
                    ]}>
                      {subject.grade || 'Select Grade'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Calculate Button */}
            <TouchableOpacity style={styles.calculateButton} onPress={calculateSGPA}>
              <Text style={styles.calculateButtonText}>Calculate SGPA</Text>
            </TouchableOpacity>

            {/* Result Card */}
            {calculatedSGPA !== null && (
              <View style={[styles.resultCard, { borderColor: getResultColor(calculatedSGPA) }]}>
                <Text style={styles.resultLabel}>Your SGPA</Text>
                <Text style={[styles.resultValue, { color: getResultColor(calculatedSGPA) }]}>
                  {calculatedSGPA.toFixed(2)}
                </Text>
                <Text style={styles.resultIndicator}>
                  {getResultIndicator(calculatedSGPA)}
                </Text>
                <View style={styles.resultActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={resetSGPA}>
                    <Text style={styles.actionButtonText}>🔄 Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={saveResult}
                  >
                    <Text style={[styles.actionButtonText, styles.saveButtonText]}>
                      💾 Save
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ) : (
          // CGPA Calculator
          <View>
            {/* Semester Count Selector */}
            <View style={styles.selectorCard}>
              <Text style={styles.selectorLabel}>Select Completed Semesters</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowSemesterCountPicker(true)}
              >
                <Text style={styles.dropdownText}>{selectedSemesters} Semester{selectedSemesters > 1 ? 's' : ''}</Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* SGPA Inputs */}
            <View style={styles.subjectsCard}>
              <Text style={styles.cardTitle}>Enter SGPA for Each Semester</Text>
              {semesterSGPAs.map((sem, index) => (
                <View key={index} style={styles.sgpaRow}>
                  <View style={styles.semesterInfo}>
                    <Text style={styles.semesterName}>{sem.semester}</Text>
                    <Text style={styles.semesterCredit}>
                      {SEMESTER_CREDITS[sem.semester]} Credits
                    </Text>
                  </View>
                  <TextInput
                    style={styles.sgpaInput}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={sem.sgpa}
                    onChangeText={(text) => updateSemesterSGPA(index, text)}
                    maxLength={5}
                  />
                </View>
              ))}
            </View>

            {/* Calculate Button */}
            <TouchableOpacity style={styles.calculateButton} onPress={calculateCGPA}>
              <Text style={styles.calculateButtonText}>Calculate CGPA</Text>
            </TouchableOpacity>

            {/* Result Card */}
            {calculatedCGPA !== null && (
              <View style={[styles.resultCard, { borderColor: getResultColor(calculatedCGPA) }]}>
                <Text style={styles.resultLabel}>Your CGPA</Text>
                <Text style={[styles.resultValue, { color: getResultColor(calculatedCGPA) }]}>
                  {calculatedCGPA.toFixed(2)}
                </Text>
                <Text style={styles.resultIndicator}>
                  {getResultIndicator(calculatedCGPA)}
                </Text>
                <View style={styles.resultActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={resetCGPA}>
                    <Text style={styles.actionButtonText}>🔄 Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={saveResult}
                  >
                    <Text style={[styles.actionButtonText, styles.saveButtonText]}>
                      💾 Save
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Semester Picker Modal */}
      <Modal
        visible={showSemesterPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSemesterPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSemesterPicker(false)}
        >
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select Semester</Text>
            {Object.keys(SEMESTER_SUBJECTS).map((semester) => (
              <TouchableOpacity
                key={semester}
                style={styles.pickerOption}
                onPress={() => {
                  setSelectedSemester(semester);
                  setShowSemesterPicker(false);
                }}
              >
                <Text style={styles.pickerOptionText}>{semester}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Grade Picker Modal */}
      <Modal
        visible={showGradePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGradePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGradePicker(false)}
        >
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select Grade</Text>
            {GRADES.map((grade) => (
              <TouchableOpacity
                key={grade}
                style={styles.pickerOption}
                onPress={() => {
                  updateSubjectGrade(selectedSubjectIndex, grade);
                  setShowGradePicker(false);
                }}
              >
                <View style={styles.gradeOption}>
                  <Text style={styles.pickerOptionText}>{grade}</Text>
                  <Text style={styles.gradePoint}>{GRADE_POINTS[grade]} Points</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Semester Count Picker Modal */}
      <Modal
        visible={showSemesterCountPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSemesterCountPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSemesterCountPicker(false)}
        >
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select Completed Semesters</Text>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
              <TouchableOpacity
                key={count}
                style={styles.pickerOption}
                onPress={() => {
                  setSelectedSemesters(count);
                  setShowSemesterCountPicker(false);
                }}
              >
                <Text style={styles.pickerOptionText}>
                  {count} Semester{count > 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    fontSize: 28,
    color: '#1F2937',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#6366F1',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  selectorCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#64748B',
  },
  subjectsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  subjectCredit: {
    fontSize: 12,
    color: '#64748B',
  },
  gradeButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  gradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  sgpaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  semesterInfo: {
    flex: 1,
  },
  semesterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  semesterCredit: {
    fontSize: 12,
    color: '#64748B',
  },
  sgpaInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 80,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calculateButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  calculateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 48,
    fontWeight: '800',
    marginBottom: 8,
  },
  resultIndicator: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 20,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#6366F1',
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  gradeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradePoint: {
    fontSize: 14,
    color: '#64748B',
  },
});
