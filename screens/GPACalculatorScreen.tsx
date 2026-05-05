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
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { GPACalculatorScreenNavigationProp } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, X, RotateCcw, BookmarkCheck, ChevronDown, Check, Plus, Minus, Info, Trophy } from 'lucide-react-native';
import { SUBJECTS_BY_DEPT, DEPARTMENTS, Department, Subject } from '../constants/subjects';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Grade point mapping (KTU 2019 Scheme)
const GRADE_POINTS: { [key: string]: number } = {
  'S': 10, 'A+': 9, 'A': 8.5, 'B+': 8, 'B': 7, 'C': 6, 'P': 5, 'F': 0,
};

const GRADES = ['S', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'];

interface SubjectGrade { name: string; credit: number; grade: string; isManual?: boolean; }
interface SemesterSGPA { semester: string; sgpa: string; }
type TabType = 'SGPA' | 'CGPA';
type ModeType = 'Department' | 'Manual';

export default function GPACalculatorScreen() {
  const navigation = useNavigation<GPACalculatorScreenNavigationProp>();
  const { theme, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<TabType>('SGPA');
  const [calcMode, setCalcMode] = useState<ModeType>('Department');
  const [selectedDept, setSelectedDept] = useState<Department>('CSE');
  const [selectedSemester, setSelectedSemester] = useState<string>('S1');
  const [subjectGrades, setSubjectGrades] = useState<SubjectGrade[]>([]);
  
  // Picker States
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [showSemesterPicker, setShowSemesterPicker] = useState(false);
  const [showGradePicker, setShowGradePicker] = useState(false);
  const [showCreditPicker, setShowCreditPicker] = useState(false);
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState<number>(0);

  // CGPA States
  const [selectedSemesters, setSelectedSemesters] = useState<number>(1);
  const [semesterSGPAs, setSemesterSGPAs] = useState<SemesterSGPA[]>([{ semester: 'S1', sgpa: '' }]);
  const [showSemesterCountPicker, setShowSemesterCountPicker] = useState(false);

  // Result States
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultValue, setResultValue] = useState<number | null>(null);
  const [resultType, setResultType] = useState<'SGPA' | 'CGPA'>('SGPA');
  const [calculationBreakdown, setCalculationBreakdown] = useState<any[]>([]);

  // Initialize subjects when Dept or Semester changes (only for Department mode)
  useEffect(() => {
    if (calcMode === 'Department') {
      const subjects = SUBJECTS_BY_DEPT[selectedDept][selectedSemester].map(s => ({ ...s, grade: '' }));
      setSubjectGrades(subjects);
    }
  }, [selectedDept, selectedSemester, calcMode]);

  // Initialize manual subjects
  useEffect(() => {
    if (calcMode === 'Manual' && subjectGrades.length === 0) {
      setSubjectGrades([
        { name: 'Subject 1', credit: 4, grade: '', isManual: true },
        { name: 'Subject 2', credit: 4, grade: '', isManual: true },
        { name: 'Subject 3', credit: 4, grade: '', isManual: true },
      ]);
    }
  }, [calcMode]);

  // Handle semester count change for CGPA
  useEffect(() => {
    const semesters: SemesterSGPA[] = [];
    for (let i = 1; i <= selectedSemesters; i++) {
      const existing = semesterSGPAs.find(s => s.semester === `S${i}`);
      semesters.push({ semester: `S${i}`, sgpa: existing ? existing.sgpa : '' });
    }
    setSemesterSGPAs(semesters);
  }, [selectedSemesters]);

  const addManualSubject = () => {
    setSubjectGrades([...subjectGrades, { name: `Subject ${subjectGrades.length + 1}`, credit: 4, grade: '', isManual: true }]);
  };

  const removeManualSubject = (index: number) => {
    if (subjectGrades.length <= 1) return;
    const updated = [...subjectGrades];
    updated.splice(index, 1);
    setSubjectGrades(updated);
  };

  const calculateSGPA = () => {
    if (!subjectGrades.every(s => s.grade !== '')) {
      Alert.alert('Incomplete', 'Please select grades for all subjects.');
      return;
    }

    let totalGP = 0;
    let totalCr = 0;
    const breakdown: any[] = [];

    subjectGrades.forEach(s => {
      const gp = GRADE_POINTS[s.grade];
      const earned = s.credit * gp;
      totalGP += earned;
      totalCr += s.credit;
      breakdown.push({
        name: s.name,
        credit: s.credit,
        grade: s.grade,
        point: gp,
        earned: earned.toFixed(2)
      });
    });

    const sgpa = totalCr > 0 ? parseFloat((totalGP / totalCr).toFixed(2)) : 0;
    setResultValue(sgpa);
    setResultType('SGPA');
    setCalculationBreakdown(breakdown);
    setShowResultModal(true);
  };

  const calculateCGPA = () => {
    if (!semesterSGPAs.every(s => s.sgpa !== '' && !isNaN(parseFloat(s.sgpa)))) {
      Alert.alert('Incomplete', 'Please enter valid SGPA for all semesters.');
      return;
    }

    let totalW = 0;
    let totalCr = 0;
    const breakdown: any[] = [];

    semesterSGPAs.forEach(s => {
      // For CGPA calculation, we ideally need the credits of each semester.
      // Since credits vary by department and semester, we use the credits from the selected department if in Department mode,
      // or default to a standard credit (e.g., 20) if in Manual mode.
      const semCredits = calcMode === 'Department' 
        ? SUBJECTS_BY_DEPT[selectedDept][s.semester].reduce((acc, curr) => acc + curr.credit, 0)
        : 20; // Default average credit
      
      const sgpa = parseFloat(s.sgpa);
      const weighted = sgpa * semCredits;
      totalW += weighted;
      totalCr += semCredits;
      
      breakdown.push({
        name: `Semester ${s.semester.replace('S', '')}`,
        credit: semCredits,
        grade: sgpa.toFixed(2),
        point: sgpa,
        earned: weighted.toFixed(2)
      });
    });

    const cgpa = totalCr > 0 ? parseFloat((totalW / totalCr).toFixed(2)) : 0;
    setResultValue(cgpa);
    setResultType('CGPA');
    setCalculationBreakdown(breakdown);
    setShowResultModal(true);
  };

  const getResultColor = (gpa: number) => gpa >= 8.5 ? theme.success : gpa >= 7.0 ? theme.primary : gpa >= 5.0 ? theme.warning : theme.error;

  const getResultLabel = (gpa: number): { label: string; desc: string } => {
    if (gpa >= 9.0) return { label: 'OUTSTANDING', desc: 'Top-tier academic excellence' };
    if (gpa >= 8.0) return { label: 'EXCELLENT', desc: 'Very strong academic performance' };
    if (gpa >= 7.0) return { label: 'VERY GOOD', desc: 'Consistently above average' };
    if (gpa >= 6.0) return { label: 'GOOD', desc: 'Decent performance, keep pushing' };
    if (gpa >= 5.0) return { label: 'PASS', desc: 'Minimum requirements met' };
    return { label: 'NEEDS IMPROVEMENT', desc: 'Focus on core concepts' };
  };

  const updateSubjectGrade = (index: number, grade: string) => {
    const updated = [...subjectGrades];
    updated[index].grade = grade;
    setSubjectGrades(updated);
  };

  const updateSubjectCredit = (index: number, credit: number) => {
    const updated = [...subjectGrades];
    updated[index].credit = credit;
    setSubjectGrades(updated);
  };

  const updateSubjectName = (index: number, name: string) => {
    const updated = [...subjectGrades];
    updated[index].name = name;
    setSubjectGrades(updated);
  };

  const updateSemesterSGPA = (index: number, sgpa: string) => {
    const updated = [...semesterSGPAs];
    updated[index].sgpa = sgpa;
    setSemesterSGPAs(updated);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#020409ff', '#0c0c0cff'] : ['#F8FAFC', '#F1F5F9']}
        style={[styles.header, { borderBottomColor: theme.border }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>GPA Calculator</Text>
        <TouchableOpacity onPress={() => setCalcMode(calcMode === 'Department' ? 'Manual' : 'Department')}>
          <View style={[styles.modeBadge, { backgroundColor: theme.primary + '20' }]}>
            <Text style={[styles.modeBadgeText, { color: theme.primary }]}>{calcMode === 'Department' ? 'KTU Scheme' : 'Manual'}</Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'SGPA' && { backgroundColor: theme.primary }]} 
          onPress={() => setActiveTab('SGPA')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'SGPA' ? '#FFF' : theme.textSecondary }]}>SGPA</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'CGPA' && { backgroundColor: theme.primary }]} 
          onPress={() => setActiveTab('CGPA')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'CGPA' ? '#FFF' : theme.textSecondary }]}>CGPA</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'SGPA' ? (
          <View>
            {calcMode === 'Department' && (
              <View style={styles.selectorsRow}>
                {/* Dept Picker */}
                <TouchableOpacity 
                  style={[styles.miniSelector, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => setShowDeptPicker(true)}
                >
                  <Text style={[styles.miniLabel, { color: theme.textSecondary }]}>Dept</Text>
                  <View style={styles.miniValRow}>
                    <Text style={[styles.miniValue, { color: theme.text }]}>{selectedDept}</Text>
                    <ChevronDown size={14} color={theme.textSecondary} />
                  </View>
                </TouchableOpacity>

                {/* Sem Picker */}
                <TouchableOpacity 
                  style={[styles.miniSelector, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => setShowSemesterPicker(true)}
                >
                  <Text style={[styles.miniLabel, { color: theme.textSecondary }]}>Sem</Text>
                  <View style={styles.miniValRow}>
                    <Text style={[styles.miniValue, { color: theme.text }]}>{selectedSemester}</Text>
                    <ChevronDown size={14} color={theme.textSecondary} />
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Subjects List */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.cardHeader}>
                <BookmarkCheck size={18} color={theme.primary} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  {calcMode === 'Department' ? `${selectedDept} - ${selectedSemester}` : 'Manual Subjects'}
                </Text>
              </View>

              {subjectGrades.map((subject, index) => (
                <View key={index} style={[styles.subjectRow, { borderBottomColor: theme.divider }]}>
                  {calcMode === 'Manual' ? (
                    <View style={styles.manualInputs}>
                      <TextInput
                        style={[styles.manualNameInput, { color: theme.text, backgroundColor: theme.backgroundSecondary }]}
                        value={subject.name}
                        onChangeText={(t) => updateSubjectName(index, t)}
                        placeholder="Subject name"
                        placeholderTextColor={theme.textTertiary}
                      />
                      <View style={styles.manualRight}>
                        <TouchableOpacity 
                          style={[styles.creditBox, { backgroundColor: theme.backgroundSecondary }]}
                          onPress={() => { setSelectedSubjectIndex(index); setShowCreditPicker(true); }}
                        >
                          <Text style={[styles.creditText, { color: theme.text }]}>{subject.credit}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.gradeBox, { backgroundColor: subject.grade ? theme.primary + '20' : theme.backgroundSecondary }]}
                          onPress={() => { setSelectedSubjectIndex(index); setShowGradePicker(true); }}
                        >
                          <Text style={[styles.gradeText, { color: subject.grade ? theme.primary : theme.textTertiary }]}>
                            {subject.grade || '—'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeManualSubject(index)} style={styles.removeBtn}>
                          <Minus size={16} color={theme.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.deptSubjectRow}>
                      <View style={styles.subjectMeta}>
                        <Text style={[styles.subjectNameText, { color: theme.text }]} numberOfLines={2}>{subject.name}</Text>
                        <View style={[styles.creditBadge, { backgroundColor: theme.backgroundSecondary }]}>
                          <Text style={[styles.creditBadgeText, { color: theme.textTertiary }]}>{subject.credit} Credits</Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={[styles.gradeSelector, { backgroundColor: subject.grade ? theme.primary + '20' : theme.backgroundSecondary }]}
                        onPress={() => { setSelectedSubjectIndex(index); setShowGradePicker(true); }}
                      >
                        <Text style={[styles.gradeSelectorText, { color: subject.grade ? theme.primary : theme.textTertiary }]}>
                          {subject.grade || 'Grade'}
                        </Text>
                        <ChevronDown size={14} color={subject.grade ? theme.primary : theme.textTertiary} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}

              {calcMode === 'Manual' && (
                <TouchableOpacity style={styles.addBtn} onPress={addManualSubject}>
                  <Plus size={18} color={theme.primary} />
                  <Text style={[styles.addBtnText, { color: theme.primary }]}>Add Subject</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.calculateBtn, { backgroundColor: theme.primary }]} 
              onPress={calculateSGPA}
            >
              <Text style={styles.calculateBtnText}>Calculate SGPA</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <TouchableOpacity 
              style={[styles.dropdownRow, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setShowSemesterCountPicker(true)}
            >
              <View>
                <Text style={[styles.dropdownLabel, { color: theme.textSecondary }]}>Semesters Completed</Text>
                <Text style={[styles.dropdownValue, { color: theme.text }]}>{selectedSemesters} Semester{selectedSemesters > 1 ? 's' : ''}</Text>
              </View>
              <ChevronDown size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.cardHeader}>
                <Trophy size={18} color={theme.primary} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>Enter SGPA per Semester</Text>
              </View>
              {semesterSGPAs.map((sem, index) => (
                <View key={index} style={[styles.semRow, { borderBottomColor: theme.divider }]}>
                  <Text style={[styles.semLabel, { color: theme.text }]}>{sem.semester}</Text>
                  <TextInput
                    style={[styles.sgpaInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                    value={sem.sgpa}
                    onChangeText={(t) => updateSemesterSGPA(index, t)}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={theme.textTertiary}
                    maxLength={4}
                  />
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.calculateBtn, { backgroundColor: theme.primary }]} 
              onPress={calculateCGPA}
            >
              <Text style={styles.calculateBtnText}>Calculate CGPA</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Result Modal */}
      <Modal visible={showResultModal} transparent animationType="slide" onRequestClose={() => setShowResultModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.resultModalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Calculation Results</Text>
              <TouchableOpacity onPress={() => setShowResultModal(false)}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {resultValue !== null && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.resultSummary}>
                  <Text style={[styles.resultLabelText, { color: theme.textSecondary }]}>Your {resultType} is</Text>
                  <Text style={[styles.resultValueText, { color: getResultColor(resultValue) }]}>{resultValue.toFixed(2)}</Text>
                  
                  <View style={[styles.resultBadgeLarge, { backgroundColor: getResultColor(resultValue) + '20', borderColor: getResultColor(resultValue) }]}>
                    <Text style={[styles.resultBadgeTextLarge, { color: getResultColor(resultValue) }]}>{getResultLabel(resultValue).label}</Text>
                  </View>
                  <Text style={[styles.resultDescText, { color: theme.textSecondary }]}>{getResultLabel(resultValue).desc}</Text>
                </View>

                {/* Calculation Table */}
                <View style={[styles.breakdownTable, { backgroundColor: theme.backgroundSecondary }]}>
                  <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.tableHeaderText, { flex: 2, color: theme.textTertiary }]}>Subject</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center', color: theme.textTertiary }]}>Credit</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center', color: theme.textTertiary }]}>Grade</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right', color: theme.textTertiary }]}>Earned</Text>
                  </View>
                  {calculationBreakdown.map((item, idx) => (
                    <View key={idx} style={[styles.tableRow, { borderBottomColor: theme.divider }]}>
                      <Text style={[styles.tableRowText, { flex: 2, color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[styles.tableRowText, { flex: 1, textAlign: 'center', color: theme.textSecondary }]}>{item.credit}</Text>
                      <Text style={[styles.tableRowText, { flex: 1, textAlign: 'center', color: theme.textSecondary }]}>{item.grade}</Text>
                      <Text style={[styles.tableRowText, { flex: 1.5, textAlign: 'right', fontWeight: '700', color: theme.text }]}>{item.earned}</Text>
                    </View>
                  ))}
                  <View style={styles.tableFooter}>
                    <View style={styles.footerCol}>
                      <Text style={[styles.footerVal, { color: theme.text }]}>{calculationBreakdown.reduce((acc, c) => acc + c.credit, 0)}</Text>
                      <Text style={[styles.footerLabel, { color: theme.textTertiary }]}>Total Credits</Text>
                    </View>
                    <View style={[styles.footerCol, { alignItems: 'flex-end' }]}>
                      <Text style={[styles.footerVal, { color: theme.primary }]}>{calculationBreakdown.reduce((acc, c) => acc + parseFloat(c.earned), 0).toFixed(2)}</Text>
                      <Text style={[styles.footerLabel, { color: theme.textTertiary }]}>Total Grade Points</Text>
                    </View>
                  </View>
                  <View style={styles.formulaRow}>
                    <Text style={[styles.formulaText, { color: theme.textSecondary }]}>
                      {resultType} = {calculationBreakdown.reduce((acc, c) => acc + parseFloat(c.earned), 0).toFixed(2)} / {calculationBreakdown.reduce((acc, c) => acc + c.credit, 0)} = <Text style={{ fontWeight: '800', color: theme.primary }}>{resultValue.toFixed(2)}</Text>
                    </Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.recalcBtn, { backgroundColor: theme.primary }]} 
                  onPress={() => setShowResultModal(false)}
                >
                  <RotateCcw size={18} color="#FFF" />
                  <Text style={styles.recalcBtnText}>Back to Calculator</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Dept Picker Modal */}
      <Modal visible={showDeptPicker} transparent animationType="fade" onRequestClose={() => setShowDeptPicker(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowDeptPicker(false)}>
          <View style={[styles.pickerContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.pickerHeader, { color: theme.text }]}>Select Department</Text>
            {DEPARTMENTS.map(dept => (
              <TouchableOpacity 
                key={dept} 
                style={[styles.pickerItem, { borderBottomColor: theme.divider }]}
                onPress={() => { setSelectedDept(dept); setShowDeptPicker(false); }}
              >
                <Text style={[styles.pickerItemText, { color: selectedDept === dept ? theme.primary : theme.text }]}>{dept}</Text>
                {selectedDept === dept && <Check size={18} color={theme.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Semester Picker Modal */}
      <Modal visible={showSemesterPicker} transparent animationType="fade" onRequestClose={() => setShowSemesterPicker(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowSemesterPicker(false)}>
          <View style={[styles.pickerContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.pickerHeader, { color: theme.text }]}>Select Semester</Text>
            {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map(sem => (
              <TouchableOpacity 
                key={sem} 
                style={[styles.pickerItem, { borderBottomColor: theme.divider }]}
                onPress={() => { setSelectedSemester(sem); setShowSemesterPicker(false); }}
              >
                <Text style={[styles.pickerItemText, { color: selectedSemester === sem ? theme.primary : theme.text }]}>{sem}</Text>
                {selectedSemester === sem && <Check size={18} color={theme.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Grade Picker Modal */}
      <Modal visible={showGradePicker} transparent animationType="fade" onRequestClose={() => setShowGradePicker(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowGradePicker(false)}>
          <View style={[styles.pickerContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.pickerHeader, { color: theme.text }]}>Select Grade</Text>
            <View style={styles.gradeGrid}>
              {GRADES.map(grade => (
                <TouchableOpacity 
                  key={grade} 
                  style={[
                    styles.gradeGridItem, 
                    { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
                    subjectGrades[selectedSubjectIndex]?.grade === grade && { backgroundColor: theme.primary + '20', borderColor: theme.primary }
                  ]}
                  onPress={() => { updateSubjectGrade(selectedSubjectIndex, grade); setShowGradePicker(false); }}
                >
                  <Text style={[styles.gradeGridText, { color: subjectGrades[selectedSubjectIndex]?.grade === grade ? theme.primary : theme.text }]}>{grade}</Text>
                  <Text style={[styles.gradeGridPoints, { color: theme.textTertiary }]}>{GRADE_POINTS[grade]} pts</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Credit Picker Modal */}
      <Modal visible={showCreditPicker} transparent animationType="fade" onRequestClose={() => setShowCreditPicker(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowCreditPicker(false)}>
          <View style={[styles.pickerContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.pickerHeader, { color: theme.text }]}>Select Credits</Text>
            <View style={styles.gradeGrid}>
              {[1, 2, 3, 4, 5, 10].map(cr => (
                <TouchableOpacity 
                  key={cr} 
                  style={[
                    styles.gradeGridItem, 
                    { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
                    subjectGrades[selectedSubjectIndex]?.credit === cr && { backgroundColor: theme.primary + '20', borderColor: theme.primary }
                  ]}
                  onPress={() => { updateSubjectCredit(selectedSubjectIndex, cr); setShowCreditPicker(false); }}
                >
                  <Text style={[styles.gradeGridText, { color: subjectGrades[selectedSubjectIndex]?.credit === cr ? theme.primary : theme.text }]}>{cr}</Text>
                  <Text style={[styles.gradeGridPoints, { color: theme.textTertiary }]}>Credit{cr > 1 ? 's' : ''}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Semester Count Picker Modal */}
      <Modal visible={showSemesterCountPicker} transparent animationType="fade" onRequestClose={() => setShowSemesterCountPicker(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowSemesterCountPicker(false)}>
          <View style={[styles.pickerContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.pickerHeader, { color: theme.text }]}>Semesters Completed</Text>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(count => (
              <TouchableOpacity 
                key={count} 
                style={[styles.pickerItem, { borderBottomColor: theme.divider }]}
                onPress={() => { setSelectedSemesters(count); setShowSemesterCountPicker(false); }}
              >
                <Text style={[styles.pickerItemText, { color: selectedSemesters === count ? theme.primary : theme.text }]}>{count} Semester{count > 1 ? 's' : ''}</Text>
                {selectedSemesters === count && <Check size={18} color={theme.primary} />}
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
    paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1,
  },
  headerIconBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  modeBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  modeBadgeText: { fontSize: 12, fontWeight: '700' },

  tabContainer: {
    flexDirection: 'row', marginHorizontal: 20, marginTop: 20, marginBottom: 15,
    backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 15, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  tabText: { fontSize: 14, fontWeight: '700' },

  content: { flex: 1, paddingHorizontal: 20 },
  
  selectorsRow: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  miniSelector: { flex: 1, borderRadius: 15, padding: 12, borderWidth: 1.5 },
  miniLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' },
  miniValRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  miniValue: { fontSize: 14, fontWeight: '700' },

  dropdownRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 1.5,
  },
  dropdownLabel: { fontSize: 12, fontWeight: '700' },
  dropdownValue: { fontSize: 16, fontWeight: '800', marginTop: 2 },

  card: { borderRadius: 20, padding: 20, borderWidth: 1.5, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  
  subjectRow: { paddingVertical: 12, borderBottomWidth: 1 },
  deptSubjectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subjectMeta: { flex: 1, marginRight: 15 },
  subjectNameText: { fontSize: 14, fontWeight: '600', lineHeight: 20, marginBottom: 4 },
  creditBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  creditBadgeText: { fontSize: 10, fontWeight: '700' },
  gradeSelector: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, 
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, minWidth: 85, justifyContent: 'center'
  },
  gradeSelectorText: { fontSize: 13, fontWeight: '700' },

  manualInputs: { flexDirection: 'row', alignItems: 'center' },
  manualNameInput: { flex: 1, height: 40, borderRadius: 10, paddingHorizontal: 12, fontSize: 14, fontWeight: '600', marginRight: 10 },
  manualRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  creditBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  creditText: { fontSize: 14, fontWeight: '800' },
  gradeBox: { width: 44, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  gradeText: { fontSize: 13, fontWeight: '800' },
  removeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 15, paddingVertical: 10 },
  addBtnText: { fontSize: 14, fontWeight: '700' },

  calculateBtn: { borderRadius: 15, paddingVertical: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  calculateBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },

  semRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1 },
  semLabel: { fontSize: 15, fontWeight: '700' },
  sgpaInput: { width: 80, height: 44, borderRadius: 10, textAlign: 'center', fontSize: 16, fontWeight: '800', borderWidth: 1.5 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  resultModalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  resultSummary: { alignItems: 'center', marginBottom: 30 },
  resultLabelText: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  resultValueText: { fontSize: 64, fontWeight: '900', marginBottom: 15 },
  resultBadgeLarge: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 25, borderWidth: 2, marginBottom: 12 },
  resultBadgeTextLarge: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  resultDescText: { fontSize: 13, fontWeight: '500', textAlign: 'center' },

  breakdownTable: { borderRadius: 20, padding: 15, marginBottom: 25 },
  tableHeader: { flexDirection: 'row', paddingBottom: 10, borderBottomWidth: 1 },
  tableHeaderText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1 },
  tableRowText: { fontSize: 13, fontWeight: '600' },
  tableFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 15 },
  footerCol: { gap: 4 },
  footerVal: { fontSize: 20, fontWeight: '900' },
  footerLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  formulaRow: { marginTop: 20, alignItems: 'center', padding: 10, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.03)' },
  formulaText: { fontSize: 12, fontWeight: '600' },

  recalcBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 15 },
  recalcBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },

  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  pickerContent: { width: '100%', maxWidth: 350, borderRadius: 25, padding: 20, maxHeight: '80%' },
  pickerHeader: { fontSize: 18, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1 },
  pickerItemText: { fontSize: 16, fontWeight: '600' },

  gradeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  gradeGridItem: { width: (width - 120) / 3, paddingVertical: 15, borderRadius: 15, alignItems: 'center', borderWidth: 2 },
  gradeGridText: { fontSize: 18, fontWeight: '800' },
  gradeGridPoints: { fontSize: 10, fontWeight: '700', marginTop: 4 },
});

