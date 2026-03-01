import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { SyllabusViewerScreenNavigationProp } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, Download, ChevronDown, ChevronRight, BookOpen, Monitor, Radio, Zap, Cog, Building2, Laptop, Plug, Dna, FlaskConical, Factory, BookX, AlertTriangle, GraduationCap } from 'lucide-react-native';
import { getSubjectSyllabus, syllabusToText, SubjectSyllabus } from '../services/syllabusService';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// KTU Branches
const BRANCHES = [
  { code: 'CSE', name: 'Computer Science & Engineering', icon: Monitor, color: '#2563EB' },
  { code: 'ECE', name: 'Electronics & Communication', icon: Radio, color: '#7C3AED' },
  { code: 'EEE', name: 'Electrical & Electronics', icon: Zap, color: '#D97706' },
  { code: 'ME', name: 'Mechanical Engineering', icon: Cog, color: '#059669' },
  { code: 'CE', name: 'Civil Engineering', icon: Building2, color: '#DC2626' },
  { code: 'IT', name: 'Information Technology', icon: Laptop, color: '#0891B2' },
  { code: 'AE', name: 'Applied Electronics', icon: Plug, color: '#7C3AED' },
  { code: 'BT', name: 'Biotechnology', icon: Dna, color: '#059669' },
  { code: 'CHE', name: 'Chemical Engineering', icon: FlaskConical, color: '#B45309' },
  { code: 'IE', name: 'Industrial Engineering', icon: Factory, color: '#6D28D9' },
];

const SEMESTERS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

const SUBJECTS_DATA: { [key: string]: { [key: string]: Array<{ name: string; code: string; credits: number }> } } = {
  'CSE': {
    'S1': [
      { name: 'Calculus', code: 'MAT101', credits: 4 },
      { name: 'Engineering Physics', code: 'PHY100', credits: 3 },
      { name: 'Engineering Chemistry', code: 'CHE100', credits: 3 },
      { name: 'Engineering Graphics', code: 'GE100', credits: 4 },
      { name: 'Basic Electrical Engineering', code: 'EE100', credits: 3 },
      { name: 'Programming in C', code: 'CST101', credits: 3 },
    ],
    'S2': [
      { name: 'Linear Algebra', code: 'MAT102', credits: 4 },
      { name: 'Physics Lab', code: 'PHY110', credits: 1 },
      { name: 'Chemistry Lab', code: 'CHE110', credits: 1 },
      { name: 'Engineering Mechanics', code: 'CE100', credits: 4 },
      { name: 'Basic Electronics', code: 'EC100', credits: 3 },
      { name: 'C Programming Lab', code: 'CST110', credits: 2 },
    ],
    'S3': [
      { name: 'Data Structures', code: 'CST201', credits: 4 },
      { name: 'Discrete Mathematics', code: 'MAT201', credits: 4 },
      { name: 'Digital Electronics', code: 'CST203', credits: 3 },
      { name: 'Computer Organization', code: 'CST205', credits: 3 },
      { name: 'Object Oriented Programming', code: 'CST207', credits: 3 },
      { name: 'Data Structures Lab', code: 'CST231', credits: 2 },
    ],
    'S4': [
      { name: 'Database Management Systems', code: 'CST202', credits: 4 },
      { name: 'Operating Systems', code: 'CST204', credits: 4 },
      { name: 'Microprocessors & Microcontrollers', code: 'CST206', credits: 3 },
      { name: 'Computer Networks', code: 'CST208', credits: 3 },
      { name: 'Design & Analysis of Algorithms', code: 'CST302', credits: 4 },
      { name: 'DBMS Lab', code: 'CST232', credits: 2 },
    ],
    'S5': [
      { name: 'Software Engineering', code: 'CST301', credits: 3 },
      { name: 'Theory of Computation', code: 'CST305', credits: 4 },
      { name: 'Compiler Design', code: 'CST307', credits: 4 },
      { name: 'Web Programming', code: 'CST309', credits: 3 },
      { name: 'Elective I', code: 'CST3XX', credits: 3 },
      { name: 'Mini Project', code: 'CST333', credits: 2 },
    ],
    'S6': [
      { name: 'Machine Learning', code: 'CST304', credits: 3 },
      { name: 'Computer Graphics', code: 'CST306', credits: 3 },
      { name: 'Artificial Intelligence', code: 'CST308', credits: 4 },
      { name: 'Mobile App Development', code: 'CST310', credits: 3 },
      { name: 'Elective II', code: 'CST3XX', credits: 3 },
      { name: 'Project Phase I', code: 'CST334', credits: 3 },
    ],
    'S7': [
      { name: 'Big Data Analytics', code: 'CST401', credits: 3 },
      { name: 'Cloud Computing', code: 'CST403', credits: 3 },
      { name: 'Cyber Security', code: 'CST405', credits: 3 },
      { name: 'Elective III', code: 'CST4XX', credits: 3 },
      { name: 'Elective IV', code: 'CST4XX', credits: 3 },
      { name: 'Project Phase II', code: 'CST432', credits: 4 },
    ],
    'S8': [
      { name: 'Industrial Training', code: 'CST498', credits: 2 },
      { name: 'Seminar', code: 'CST499', credits: 2 },
      { name: 'Project', code: 'CST434', credits: 10 },
      { name: 'Comprehensive Exam', code: 'CST497', credits: 2 },
    ],
  },
  'ECE': {
    'S1': [
      { name: 'Calculus', code: 'MAT101', credits: 4 },
      { name: 'Engineering Physics', code: 'PHY100', credits: 3 },
      { name: 'Engineering Chemistry', code: 'CHE100', credits: 3 },
      { name: 'Engineering Graphics', code: 'GE100', credits: 4 },
      { name: 'Basic Electrical Engineering', code: 'EE100', credits: 3 },
      { name: 'Programming in C', code: 'CST101', credits: 3 },
    ],
  },
};

interface Subject {
  name: string;
  code: string;
  credits: number;
}

export default function SyllabusViewerScreen() {
  const navigation = useNavigation<SyllabusViewerScreenNavigationProp>();
  const { theme, isDark } = useTheme();

  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Detail view state
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [syllabusDetail, setSyllabusDetail] = useState<SubjectSyllabus | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

  const handleBranchSelect = (branchCode: string) => {
    setSelectedBranch(branchCode);
  };

  const handleSemesterSelect = (semester: string) => {
    setSelectedSemester(semester);
    const branchSubjects = SUBJECTS_DATA[selectedBranch!]?.[semester] || [];
    setSubjects(branchSubjects);
  };

  const handleSubjectPress = async (subject: Subject) => {
    setSelectedSubject(subject);
    setSyllabusDetail(null);
    setDetailError(null);
    setLoadingDetail(true);
    setExpandedModules(new Set());

    try {
      const data = await getSubjectSyllabus(subject.code);
      setSyllabusDetail(data);
    } catch (err: any) {
      console.error('Failed to load syllabus:', err);
      setDetailError(err?.message || 'Failed to load syllabus');
    } finally {
      setLoadingDetail(false);
    }
  };

  const toggleModule = (moduleNumber: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleNumber)) {
        next.delete(moduleNumber);
      } else {
        next.add(moduleNumber);
      }
      return next;
    });
  };

  const handleDownloadText = async () => {
    if (!syllabusDetail) return;

    const text = syllabusToText(syllabusDetail);
    const fileName = `${syllabusDetail.subject_code}_syllabus.txt`;

    if (Platform.OS === 'web') {
      // Web: Blob download
      try {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        Alert.alert('Error', 'Failed to download file');
      }
    } else {
      // Native: write to file and share
      try {
        const file = new File(Paths.cache, fileName);
        file.write(text);
        const fileUri = file.uri;

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/plain',
            dialogTitle: `${syllabusDetail.subject_name} Syllabus`,
          });
        } else {
          Alert.alert('Saved', `File saved to ${fileUri}`);
        }
      } catch {
        Alert.alert('Error', 'Failed to save file');
      }
    }
  };

  const handleBack = useCallback(() => {
    if (selectedSubject) {
      setSelectedSubject(null);
      setSyllabusDetail(null);
      setDetailError(null);
    } else if (selectedSemester) {
      setSelectedSemester(null);
      setSubjects([]);
    } else if (selectedBranch) {
      setSelectedBranch(null);
    } else {
      navigation.goBack();
      return false;
    }
    return true;
  }, [selectedSubject, selectedSemester, selectedBranch, navigation]);

  // Intercept hardware/swipe back to navigate within screen hierarchy
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => backHandler.remove();
  }, [handleBack]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (selectedBranch || selectedSemester || selectedSubject) {
        e.preventDefault();
        handleBack();
      }
    });
    return unsubscribe;
  }, [navigation, selectedBranch, selectedSemester, selectedSubject, handleBack]);

  const getBreadcrumb = () => {
    const parts = ['Syllabus'];
    if (selectedBranch) {
      const branch = BRANCHES.find(b => b.code === selectedBranch);
      parts.push(branch?.code || selectedBranch);
    }
    if (selectedSemester) parts.push(selectedSemester);
    if (selectedSubject) parts.push(selectedSubject.code);
    return parts.join(' → ');
  };

  const selectedBranchData = BRANCHES.find(b => b.code === selectedBranch);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerIconBtn}>
          <ArrowLeft size={20} color={theme.text} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {selectedSubject
              ? selectedSubject.code
              : selectedSemester
                ? `${selectedBranch} · ${selectedSemester}`
                : selectedBranch
                  ? selectedBranch
                  : 'Syllabus'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Breadcrumb */}
      <View style={[styles.breadcrumbContainer, { backgroundColor: theme.backgroundSecondary, borderBottomColor: theme.border }]}>
        <Text style={[styles.breadcrumbText, { color: theme.textSecondary }]}>{getBreadcrumb()}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {!selectedBranch ? (
          /* Step 1: Select Branch */
          <View>
            <View style={[styles.infoCard, {
              backgroundColor: isDark ? 'rgba(37, 99, 235, 0.12)' : '#EEF2FF',
              borderLeftColor: theme.primary,
            }]}>
              <Text style={[styles.infoTitle, { color: theme.text }]}>Browse KTU Syllabus</Text>
              <Text style={[styles.infoDescription, { color: theme.textSecondary }]}>
                Access syllabus for all subjects by branch and semester
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Your Branch</Text>
            {BRANCHES.map((branch) => (
              <TouchableOpacity
                key={branch.code}
                style={[styles.branchCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={() => handleBranchSelect(branch.code)}
                activeOpacity={0.7}
              >
                <View style={[styles.branchIconCircle, { backgroundColor: `${branch.color}18` }]}>
                  <branch.icon size={22} color={branch.color} strokeWidth={2} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.branchCode, { color: theme.text }]}>{branch.code}</Text>
                  <Text style={[styles.branchName, { color: theme.textSecondary }]}>{branch.name}</Text>
                </View>
                <View style={[styles.arrowCircle, { backgroundColor: theme.backgroundSecondary }]}>
                  <Text style={[styles.cardArrow, { color: theme.textTertiary }]}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : !selectedSemester ? (
          /* Step 2: Select Semester */
          <View>
            {selectedBranchData && (
              <View style={[styles.branchBanner, {
                backgroundColor: `${selectedBranchData.color}18`,
                borderColor: `${selectedBranchData.color}40`,
              }]}>
                <View style={styles.branchBannerIconWrap}>
                  <selectedBranchData.icon size={32} color={selectedBranchData.color} strokeWidth={2} />
                </View>
                <View>
                  <Text style={[styles.branchBannerCode, { color: selectedBranchData.color }]}>
                    {selectedBranchData.code}
                  </Text>
                  <Text style={[styles.branchBannerName, { color: theme.textSecondary }]}>
                    {selectedBranchData.name}
                  </Text>
                </View>
              </View>
            )}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Semester</Text>
            <View style={styles.semesterGrid}>
              {SEMESTERS.map((semester) => (
                <TouchableOpacity
                  key={semester}
                  style={[styles.semesterCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  onPress={() => handleSemesterSelect(semester)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.semesterText, { color: theme.primary }]}>{semester}</Text>
                  <Text style={[styles.semesterSubtext, { color: theme.textSecondary }]}>
                    Semester {semester.replace('S', '')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : !selectedSubject ? (
          /* Step 3: Subject List — simple tappable cards */
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Subjects</Text>
            {subjects.length === 0 ? (
              <View style={styles.emptyState}>
                <GraduationCap size={56} color={theme.textTertiary} strokeWidth={1.5} />
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>No subjects found</Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.textTertiary }]}>
                  Syllabus data will be loaded from the server
                </Text>
              </View>
            ) : (
              subjects.map((subject, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.subjectCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  onPress={() => handleSubjectPress(subject)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.subjectIndexBadge, { backgroundColor: theme.primary + '20' }]}>
                    <Text style={[styles.subjectIndex, { color: theme.primary }]}>{index + 1}</Text>
                  </View>
                  <View style={styles.subjectInfo}>
                    <Text style={[styles.subjectName, { color: theme.text }]}>{subject.name}</Text>
                    <Text style={[styles.subjectCode, { color: theme.textSecondary }]}>
                      {subject.code} • {subject.credits} Credits
                    </Text>
                  </View>
                  <View style={[styles.arrowCircle, { backgroundColor: theme.backgroundSecondary }]}>
                    <ChevronRight size={16} color={theme.textTertiary} strokeWidth={2} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          /* Step 4: Subject Detail — modules, topics, outcomes */
          <View>
            {loadingDetail ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Loading syllabus…
                </Text>
              </View>
            ) : detailError ? (
              <View style={styles.emptyState}>
                <AlertTriangle size={56} color={theme.textTertiary} strokeWidth={1.5} />
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                  Couldn't load syllabus
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.textTertiary }]}>
                  {detailError}
                </Text>
                <TouchableOpacity
                  style={[styles.retryBtn, { backgroundColor: theme.primary }]}
                  onPress={() => handleSubjectPress(selectedSubject!)}
                >
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : syllabusDetail ? (
              <View>
                {/* Subject header card */}
                <View style={[styles.detailHeaderCard, {
                  backgroundColor: isDark ? 'rgba(37, 99, 235, 0.12)' : '#EEF2FF',
                  borderLeftColor: theme.primary,
                }]}>
                  <Text style={[styles.detailSubjectName, { color: theme.text }]}>
                    {syllabusDetail.subject_name}
                  </Text>
                  <Text style={[styles.detailSubjectMeta, { color: theme.textSecondary }]}>
                    {syllabusDetail.subject_code} • {syllabusDetail.credits} Credits
                    {syllabusDetail.modules?.length ? ` • ${syllabusDetail.modules.length} Modules` : ''}
                  </Text>
                </View>

                {/* Modules */}
                {syllabusDetail.modules?.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Modules</Text>
                    {syllabusDetail.modules.map((mod) => (
                      <View key={mod.module_number} style={{ marginBottom: 10 }}>
                        <TouchableOpacity
                          style={[styles.moduleHeader, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                          onPress={() => toggleModule(mod.module_number)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.moduleBadge, { backgroundColor: theme.primary + '20' }]}>
                            <Text style={[styles.moduleBadgeText, { color: theme.primary }]}>
                              M{mod.module_number}
                            </Text>
                          </View>
                          <View style={styles.moduleInfo}>
                            <Text style={[styles.moduleTitle, { color: theme.text }]}>{mod.title}</Text>
                            <Text style={[styles.moduleHours, { color: theme.textTertiary }]}>
                              {mod.hours} hrs • {mod.topics.length} topics
                            </Text>
                          </View>
                          {expandedModules.has(mod.module_number) ? (
                            <ChevronDown size={18} color={theme.textTertiary} strokeWidth={2} />
                          ) : (
                            <ChevronRight size={18} color={theme.textTertiary} strokeWidth={2} />
                          )}
                        </TouchableOpacity>

                        {expandedModules.has(mod.module_number) && (
                          <View style={[styles.topicList, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                            {mod.topics.map((topic, ti) => (
                              <View key={ti} style={styles.topicRow}>
                                <View style={[styles.topicDot, { backgroundColor: theme.primary }]} />
                                <Text style={[styles.topicText, { color: theme.text }]}>{topic}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Course Outcomes */}
                {syllabusDetail.course_outcomes && syllabusDetail.course_outcomes.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Course Outcomes</Text>
                    <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                      {syllabusDetail.course_outcomes.map((co, i) => (
                        <View key={i} style={styles.listItem}>
                          <View style={[styles.coBadge, { backgroundColor: theme.primary + '20' }]}>
                            <Text style={[styles.coBadgeText, { color: theme.primary }]}>CO{i + 1}</Text>
                          </View>
                          <Text style={[styles.listItemText, { color: theme.text }]}>{co}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Textbooks */}
                {syllabusDetail.textbooks && syllabusDetail.textbooks.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Textbooks</Text>
                    <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                      {syllabusDetail.textbooks.map((tb, i) => (
                        <View key={i} style={styles.listItem}>
                          <BookOpen size={14} color={theme.textTertiary} strokeWidth={2} style={{ marginRight: 10, marginTop: 2 }} />
                          <Text style={[styles.listItemText, { color: theme.text }]}>{tb}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* References */}
                {syllabusDetail.references && syllabusDetail.references.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>References</Text>
                    <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                      {syllabusDetail.references.map((ref, i) => (
                        <View key={i} style={styles.listItem}>
                          <Text style={[styles.refNumber, { color: theme.textTertiary }]}>{i + 1}.</Text>
                          <Text style={[styles.listItemText, { color: theme.text }]}>{ref}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Download as Text button */}
                <TouchableOpacity
                  style={[styles.downloadBtn, { backgroundColor: theme.primary }]}
                  onPress={handleDownloadText}
                  activeOpacity={0.8}
                >
                  <Download size={18} color="#fff" strokeWidth={2} />
                  <Text style={styles.downloadBtnText}>Download as Text</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  breadcrumbContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  breadcrumbText: {
    fontSize: 13,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  infoCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  infoDescription: {
    fontSize: 13,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
    marginTop: 4,
  },
  branchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  branchIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  branchCode: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  branchName: {
    fontSize: 12,
    lineHeight: 16,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardArrow: {
    fontSize: 22,
    fontWeight: '400',
    marginTop: -2,
  },
  branchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    gap: 14,
  },
  branchBannerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchBannerCode: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  branchBannerName: {
    fontSize: 13,
  },
  semesterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  semesterCard: {
    width: '47%',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  semesterText: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  semesterSubtext: {
    fontSize: 12,
    fontWeight: '500',
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  subjectIndexBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subjectIndex: {
    fontSize: 14,
    fontWeight: '700',
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  subjectCode: {
    fontSize: 12,
  },
  // Detail view styles
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
  },
  detailHeaderCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  detailSubjectName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  detailSubjectMeta: {
    fontSize: 13,
    fontWeight: '500',
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  moduleBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  moduleBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  moduleHours: {
    fontSize: 12,
  },
  topicList: {
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
    marginLeft: 20,
    borderWidth: 1,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  topicDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 10,
  },
  topicText: {
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  listCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  listItemText: {
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  coBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 10,
    marginTop: 1,
  },
  coBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  refNumber: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
    marginTop: 1,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 20,
    gap: 8,
  },
  downloadBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
});
