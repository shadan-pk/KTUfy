import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { GPACalculatorScreenNavigationProp } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, X, RotateCcw, BookmarkCheck, ChevronDown, Check } from 'lucide-react-native';

// Grade point mapping
const GRADE_POINTS: { [key: string]: number } = {
  'O': 10, 'A+': 9, 'A': 8.5, 'B+': 8, 'B': 7, 'C': 6, 'P': 5, 'F': 0,
};

const GRADES = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'];

const SEMESTER_SUBJECTS: { [key: string]: Array<{ name: string; credit: number }> } = {
  'S1': [
    { name: 'Calculus', credit: 4 }, { name: 'Physics', credit: 3 },
    { name: 'Chemistry', credit: 3 }, { name: 'Engineering Graphics', credit: 4 },
    { name: 'Basic Electrical Engineering', credit: 3 }, { name: 'Programming in C', credit: 3 },
  ],
  'S2': [
    { name: 'Linear Algebra', credit: 4 }, { name: 'Physics Lab', credit: 1 },
    { name: 'Chemistry Lab', credit: 1 }, { name: 'Engineering Mechanics', credit: 4 },
    { name: 'Basic Electronics', credit: 3 }, { name: 'C Programming Lab', credit: 2 },
  ],
  'S3': [
    { name: 'Data Structures', credit: 4 }, { name: 'Discrete Mathematics', credit: 4 },
    { name: 'Digital Electronics', credit: 3 }, { name: 'Computer Organization', credit: 3 },
    { name: 'Object Oriented Programming', credit: 3 }, { name: 'Data Structures Lab', credit: 2 },
  ],
  'S4': [
    { name: 'Database Management Systems', credit: 4 }, { name: 'Operating Systems', credit: 4 },
    { name: 'Microprocessors', credit: 3 }, { name: 'Computer Networks', credit: 3 },
    { name: 'Design and Analysis of Algorithms', credit: 4 }, { name: 'DBMS Lab', credit: 2 },
  ],
  'S5': [
    { name: 'Software Engineering', credit: 3 }, { name: 'Theory of Computation', credit: 4 },
    { name: 'Compiler Design', credit: 4 }, { name: 'Web Programming', credit: 3 },
    { name: 'Elective I', credit: 3 }, { name: 'Mini Project', credit: 2 },
  ],
  'S6': [
    { name: 'Machine Learning', credit: 3 }, { name: 'Computer Graphics', credit: 3 },
    { name: 'Artificial Intelligence', credit: 4 }, { name: 'Mobile App Development', credit: 3 },
    { name: 'Elective II', credit: 3 }, { name: 'Project Phase I', credit: 3 },
  ],
  'S7': [
    { name: 'Big Data Analytics', credit: 3 }, { name: 'Cloud Computing', credit: 3 },
    { name: 'Cyber Security', credit: 3 }, { name: 'Elective III', credit: 3 },
    { name: 'Elective IV', credit: 3 }, { name: 'Project Phase II', credit: 4 },
  ],
  'S8': [
    { name: 'Industrial Training', credit: 2 }, { name: 'Seminar', credit: 2 },
    { name: 'Project', credit: 10 }, { name: 'Comprehensive Exam', credit: 2 },
  ],
};

const SEMESTER_CREDITS: { [key: string]: number } = {
  'S1': 20, 'S2': 15, 'S3': 19, 'S4': 20,
  'S5': 19, 'S6': 19, 'S7': 19, 'S8': 16,
};

interface SubjectGrade { name: string; credit: number; grade: string; }
interface SemesterSGPA { semester: string; sgpa: string; }
type TabType = 'SGPA' | 'CGPA';

export default function GPACalculatorScreen() {
  const navigation = useNavigation<GPACalculatorScreenNavigationProp>();
  const { theme, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<TabType>('SGPA');
  const [selectedSemester, setSelectedSemester] = useState<string>('S1');
  const [subjectGrades, setSubjectGrades] = useState<SubjectGrade[]>([]);
  const [calculatedSGPA, setCalculatedSGPA] = useState<number | null>(null);
  const [showSemesterPicker, setShowSemesterPicker] = useState(false);
  const [showGradePicker, setShowGradePicker] = useState(false);
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState<number>(0);

  const [selectedSemesters, setSelectedSemesters] = useState<number>(1);
  const [semesterSGPAs, setSemesterSGPAs] = useState<SemesterSGPA[]>([{ semester: 'S1', sgpa: '' }]);
  const [calculatedCGPA, setCalculatedCGPA] = useState<number | null>(null);
  const [showSemesterCountPicker, setShowSemesterCountPicker] = useState(false);

  const [showResultModal, setShowResultModal] = useState(false);
  const [resultValue, setResultValue] = useState<number | null>(null);
  const [resultType, setResultType] = useState<'SGPA' | 'CGPA'>('SGPA');

  useEffect(() => {
    const subjects = SEMESTER_SUBJECTS[selectedSemester].map(s => ({ ...s, grade: '' }));
    setSubjectGrades(subjects);
    setCalculatedSGPA(null);
  }, [selectedSemester]);

  useEffect(() => {
    const semesters: SemesterSGPA[] = [];
    for (let i = 1; i <= selectedSemesters; i++) semesters.push({ semester: `S${i}`, sgpa: '' });
    setSemesterSGPAs(semesters);
    setCalculatedCGPA(null);
  }, [selectedSemesters]);

  const calculateSGPA = () => {
    if (!subjectGrades.every(s => s.grade !== '')) {
      Alert.alert('Incomplete', 'Please select grades for all subjects.');
      return;
    }
    let totalGP = 0, totalCr = 0;
    subjectGrades.forEach(s => { totalGP += s.credit * GRADE_POINTS[s.grade]; totalCr += s.credit; });
    const sgpa = parseFloat((totalGP / totalCr).toFixed(2));
    setCalculatedSGPA(sgpa); setResultValue(sgpa); setResultType('SGPA'); setShowResultModal(true);
  };

  const calculateCGPA = () => {
    if (!semesterSGPAs.every(s => s.sgpa !== '')) {
      Alert.alert('Incomplete', 'Please enter SGPA for all selected semesters.');
      return;
    }
    let totalW = 0, totalCr = 0;
    semesterSGPAs.forEach(s => {
      totalW += parseFloat(s.sgpa) * SEMESTER_CREDITS[s.semester];
      totalCr += SEMESTER_CREDITS[s.semester];
    });
    const cgpa = parseFloat((totalW / totalCr).toFixed(2));
    setCalculatedCGPA(cgpa); setResultValue(cgpa); setResultType('CGPA'); setShowResultModal(true);
  };

  const getResultColor = (gpa: number) => gpa >= 8.0 ? theme.success : gpa >= 6.0 ? theme.warning : theme.error;

  const getResultLabel = (gpa: number): { label: string; desc: string } => {
    if (gpa >= 9.0) return { label: 'Outstanding', desc: 'Top-tier academic performance' };
    if (gpa >= 8.0) return { label: 'Excellent', desc: 'Strong academic performance' };
    if (gpa >= 7.0) return { label: 'Good', desc: 'Above average performance' };
    if (gpa >= 6.0) return { label: 'Average', desc: 'Room to improve' };
    return { label: 'Needs Improvement', desc: 'Focus and keep going' };
  };

  const resetSGPA = () => {
    setSubjectGrades(SEMESTER_SUBJECTS[selectedSemester].map(s => ({ ...s, grade: '' })));
    setCalculatedSGPA(null); setShowResultModal(false);
  };

  const resetCGPA = () => {
    setSemesterSGPAs(Array.from({ length: selectedSemesters }, (_, i) => ({ semester: `S${i + 1}`, sgpa: '' })));
    setCalculatedCGPA(null); setShowResultModal(false);
  };

  const updateSubjectGrade = (index: number, grade: string) => {
    const updated = [...subjectGrades];
    updated[index].grade = grade;
    setSubjectGrades(updated);
    setCalculatedSGPA(null);
  };

  const updateSemesterSGPA = (index: number, sgpa: string) => {
    const updated = [...semesterSGPAs];
    updated[index].sgpa = sgpa;
    setSemesterSGPAs(updated);
    setCalculatedCGPA(null);
  };

  const iconColor = theme.text;
  const iconSize = 20;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
          <ArrowLeft size={iconSize} color={iconColor} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>GPA Calculator</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab */}
      <View style={[styles.tabContainer, { backgroundColor: theme.backgroundSecondary }]}>
        {(['SGPA', 'CGPA'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { backgroundColor: theme.card }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? theme.primary : theme.textSecondary }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'SGPA' ? (
          <View>
            {/* Semester selector */}
            <TouchableOpacity
              style={[styles.dropdownRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={() => setShowSemesterPicker(true)}
            >
              <Text style={[styles.dropdownLabel, { color: theme.textSecondary }]}>Semester</Text>
              <View style={styles.dropdownRight}>
                <Text style={[styles.dropdownValue, { color: theme.text }]}>{selectedSemester}</Text>
                <ChevronDown size={16} color={theme.textSecondary} strokeWidth={2} />
              </View>
            </TouchableOpacity>

            {/* Subjects */}
            <View style={[styles.subjectsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>SUBJECTS & GRADES</Text>
              {subjectGrades.map((subject, index) => (
                <View key={index} style={[styles.subjectRow, { borderBottomColor: theme.divider }]}>
                  <View style={styles.subjectInfo}>
                    <Text style={[styles.subjectName, { color: theme.text }]}>{subject.name}</Text>
                    <Text style={[styles.subjectCredit, { color: theme.textTertiary }]}>{subject.credit} cr</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.gradeBtn,
                      { borderColor: subject.grade ? theme.gpaCalculator : theme.border },
                      subject.grade ? { backgroundColor: theme.gpaCalculator + '18' } : { backgroundColor: theme.backgroundSecondary },
                    ]}
                    onPress={() => { setSelectedSubjectIndex(index); setShowGradePicker(true); }}
                  >
                    <Text style={[styles.gradeBtnText, { color: subject.grade ? theme.gpaCalculator : theme.textTertiary }]}>
                      {subject.grade || '—'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity style={[styles.calcBtn, { backgroundColor: theme.gpaCalculator }]} onPress={calculateSGPA}>
              <Text style={styles.calcBtnText}>Calculate SGPA</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {/* Semester count selector */}
            <TouchableOpacity
              style={[styles.dropdownRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={() => setShowSemesterCountPicker(true)}
            >
              <Text style={[styles.dropdownLabel, { color: theme.textSecondary }]}>Semesters Completed</Text>
              <View style={styles.dropdownRight}>
                <Text style={[styles.dropdownValue, { color: theme.text }]}>
                  {selectedSemesters} Sem{selectedSemesters > 1 ? 's' : ''}
                </Text>
                <ChevronDown size={16} color={theme.textSecondary} strokeWidth={2} />
              </View>
            </TouchableOpacity>

            {/* SGPA inputs */}
            <View style={[styles.subjectsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>SGPA PER SEMESTER</Text>
              {semesterSGPAs.map((sem, index) => (
                <View key={index} style={[styles.subjectRow, { borderBottomColor: theme.divider }]}>
                  <View style={styles.subjectInfo}>
                    <Text style={[styles.subjectName, { color: theme.text }]}>{sem.semester}</Text>
                    <Text style={[styles.subjectCredit, { color: theme.textTertiary }]}>{SEMESTER_CREDITS[sem.semester]} credits</Text>
                  </View>
                  <TextInput
                    style={[styles.sgpaInput, {
                      backgroundColor: theme.backgroundSecondary,
                      color: theme.text,
                      borderColor: theme.border,
                    }]}
                    placeholder="—"
                    placeholderTextColor={theme.textTertiary}
                    keyboardType="decimal-pad"
                    value={sem.sgpa}
                    onChangeText={(t) => updateSemesterSGPA(index, t)}
                    maxLength={5}
                  />
                </View>
              ))}
            </View>

            <TouchableOpacity style={[styles.calcBtn, { backgroundColor: theme.gpaCalculator }]} onPress={calculateCGPA}>
              <Text style={styles.calcBtnText}>Calculate CGPA</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── Result Modal ── */}
      <Modal visible={showResultModal} transparent animationType="fade" onRequestClose={() => setShowResultModal(false)}>
        <View style={styles.resultOverlay}>
          <View style={[styles.resultModal, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {/* Close */}
            <TouchableOpacity
              style={[styles.resultCloseBtn, { backgroundColor: theme.backgroundSecondary }]}
              onPress={() => setShowResultModal(false)}
            >
              <X size={16} color={theme.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>

            {resultValue !== null && (() => {
              const color = getResultColor(resultValue);
              const { label, desc } = getResultLabel(resultValue);
              return (
                <>
                  {/* Type label */}
                  <Text style={[styles.resultTypeText, { color: theme.textSecondary }]}>
                    {resultType}{resultType === 'SGPA' ? ` · ${selectedSemester}` : ''}
                  </Text>

                  {/* GPA value */}
                  <Text style={[styles.resultGPA, { color }]}>{resultValue.toFixed(2)}</Text>

                  {/* Grade badge */}
                  <View style={[styles.resultBadge, { backgroundColor: color + '18', borderColor: color + '40' }]}>
                    <Text style={[styles.resultBadgeText, { color }]}>{label}</Text>
                  </View>

                  {/* Description */}
                  <Text style={[styles.resultDesc, { color: theme.textSecondary }]}>{desc}</Text>

                  {/* Scale bar */}
                  <View style={styles.scaleWrap}>
                    <View style={[styles.scaleTrack, { backgroundColor: theme.backgroundTertiary }]}>
                      <View style={[styles.scaleFill, { width: `${Math.min((resultValue / 10) * 100, 100)}%`, backgroundColor: color }]} />
                    </View>
                    <View style={styles.scaleEnds}>
                      <Text style={[styles.scaleEndText, { color: theme.textTertiary }]}>0</Text>
                      <Text style={[styles.scaleEndText, { color: theme.textTertiary }]}>10</Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.resultActions}>
                    <TouchableOpacity
                      style={[styles.resultActionBtn, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                      onPress={() => { setShowResultModal(false); if (resultType === 'SGPA') resetSGPA(); else resetCGPA(); }}
                    >
                      <RotateCcw size={15} color={theme.textSecondary} strokeWidth={2} />
                      <Text style={[styles.resultActionText, { color: theme.textSecondary }]}>Recalculate</Text>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* ── Semester Picker ── */}
      <Modal visible={showSemesterPicker} transparent animationType="fade" onRequestClose={() => setShowSemesterPicker(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowSemesterPicker(false)}>
          <View style={[styles.pickerSheet, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.pickerTitle, { color: theme.text }]}>Select Semester</Text>
            {Object.keys(SEMESTER_SUBJECTS).map((sem) => (
              <TouchableOpacity
                key={sem}
                style={[styles.pickerItem, { borderBottomColor: theme.divider }]}
                onPress={() => { setSelectedSemester(sem); setShowSemesterPicker(false); }}
              >
                <Text style={[styles.pickerItemText, { color: selectedSemester === sem ? theme.gpaCalculator : theme.text, fontWeight: selectedSemester === sem ? '700' : '400' }]}>
                  {sem}
                </Text>
                {selectedSemester === sem && <Check size={16} color={theme.gpaCalculator} strokeWidth={2.5} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Grade Picker ── */}
      <Modal visible={showGradePicker} transparent animationType="fade" onRequestClose={() => setShowGradePicker(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowGradePicker(false)}>
          <View style={[styles.pickerSheet, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.pickerTitle, { color: theme.text }]}>Select Grade</Text>
            {GRADES.map((grade) => {
              const selected = subjectGrades[selectedSubjectIndex]?.grade === grade;
              return (
                <TouchableOpacity
                  key={grade}
                  style={[styles.pickerItem, { borderBottomColor: theme.divider }]}
                  onPress={() => { updateSubjectGrade(selectedSubjectIndex, grade); setShowGradePicker(false); }}
                >
                  <Text style={[styles.pickerItemText, { color: selected ? theme.gpaCalculator : theme.text, fontWeight: selected ? '700' : '400' }]}>
                    {grade}
                  </Text>
                  <Text style={[styles.gradePointText, { color: theme.textTertiary }]}>{GRADE_POINTS[grade]} pts</Text>
                  {selected && <Check size={16} color={theme.gpaCalculator} strokeWidth={2.5} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Semester Count Picker ── */}
      <Modal visible={showSemesterCountPicker} transparent animationType="fade" onRequestClose={() => setShowSemesterCountPicker(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowSemesterCountPicker(false)}>
          <View style={[styles.pickerSheet, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.pickerTitle, { color: theme.text }]}>Semesters Completed</Text>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
              <TouchableOpacity
                key={count}
                style={[styles.pickerItem, { borderBottomColor: theme.divider }]}
                onPress={() => { setSelectedSemesters(count); setShowSemesterCountPicker(false); }}
              >
                <Text style={[styles.pickerItemText, { color: selectedSemesters === count ? theme.gpaCalculator : theme.text, fontWeight: selectedSemesters === count ? '700' : '400' }]}>
                  {count} Semester{count > 1 ? 's' : ''}
                </Text>
                {selectedSemesters === count && <Check size={16} color={theme.gpaCalculator} strokeWidth={2.5} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  headerIconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  tabContainer: {
    flexDirection: 'row', margin: 16, borderRadius: 12, padding: 3,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabText: { fontSize: 14, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16 },
  dropdownRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1,
  },
  dropdownLabel: { fontSize: 13, fontWeight: '500' },
  dropdownRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dropdownValue: { fontSize: 14, fontWeight: '700' },
  subjectsCard: {
    borderRadius: 12, marginBottom: 14, borderWidth: 1, overflow: 'hidden',
  },
  cardLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 0.8,
    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 8,
  },
  subjectRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1,
  },
  subjectInfo: { flex: 1 },
  subjectName: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  subjectCredit: { fontSize: 11 },
  gradeBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
    minWidth: 52, alignItems: 'center', borderWidth: 1,
  },
  gradeBtnText: { fontSize: 13, fontWeight: '700' },
  sgpaInput: {
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 14, fontWeight: '700', minWidth: 70, textAlign: 'center', borderWidth: 1,
  },
  calcBtn: { borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 16 },
  calcBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  // Result modal
  resultOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  resultModal: {
    width: '100%', maxWidth: 340, borderRadius: 20, padding: 24,
    alignItems: 'center', borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 12,
  },
  resultCloseBtn: {
    position: 'absolute', top: 14, right: 14,
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  resultTypeText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  resultGPA: { fontSize: 64, fontWeight: '800', lineHeight: 72, marginBottom: 12 },
  resultBadge: {
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, marginBottom: 8,
  },
  resultBadgeText: { fontSize: 13, fontWeight: '700' },
  resultDesc: { fontSize: 12, marginBottom: 20, textAlign: 'center' },
  scaleWrap: { width: '100%', marginBottom: 20 },
  scaleTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  scaleFill: { height: '100%', borderRadius: 3 },
  scaleEnds: { flexDirection: 'row', justifyContent: 'space-between' },
  scaleEndText: { fontSize: 10, fontWeight: '500' },
  resultActions: { flexDirection: 'row', gap: 10, width: '100%' },
  resultActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 10, borderWidth: 1,
  },
  resultActionText: { fontSize: 13, fontWeight: '700' },
  // Pickers
  pickerOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  pickerSheet: {
    width: '100%', maxWidth: 320, borderRadius: 16,
    overflow: 'hidden', borderWidth: 1,
  },
  pickerTitle: {
    fontSize: 15, fontWeight: '700',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1,
  },
  pickerItemText: { fontSize: 14, flex: 1 },
  gradePointText: { fontSize: 12, marginRight: 10 },
});
