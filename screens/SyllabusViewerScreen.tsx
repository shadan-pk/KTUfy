import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { SyllabusViewerScreenNavigationProp } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, Eye, Download } from 'lucide-react-native';

// KTU Branches
const BRANCHES = [
  { code: 'CSE', name: 'Computer Science & Engineering', icon: '💻', color: '#2563EB' },
  { code: 'ECE', name: 'Electronics & Communication', icon: '📡', color: '#7C3AED' },
  { code: 'EEE', name: 'Electrical & Electronics', icon: '⚡', color: '#D97706' },
  { code: 'ME', name: 'Mechanical Engineering', icon: '⚙️', color: '#059669' },
  { code: 'CE', name: 'Civil Engineering', icon: '🏗️', color: '#DC2626' },
  { code: 'IT', name: 'Information Technology', icon: '🖥️', color: '#0891B2' },
  { code: 'AE', name: 'Applied Electronics', icon: '🔌', color: '#7C3AED' },
  { code: 'BT', name: 'Biotechnology', icon: '🧬', color: '#059669' },
  { code: 'CHE', name: 'Chemical Engineering', icon: '⚗️', color: '#B45309' },
  { code: 'IE', name: 'Industrial Engineering', icon: '🏭', color: '#6D28D9' },
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
      { name: 'Programming in C', code: 'CSE101', credits: 3 },
    ],
    'S2': [
      { name: 'Linear Algebra', code: 'MAT102', credits: 4 },
      { name: 'Physics Lab', code: 'PHY110', credits: 1 },
      { name: 'Chemistry Lab', code: 'CHE110', credits: 1 },
      { name: 'Engineering Mechanics', code: 'CE100', credits: 4 },
      { name: 'Basic Electronics', code: 'EC100', credits: 3 },
      { name: 'C Programming Lab', code: 'CSE110', credits: 2 },
    ],
    'S3': [
      { name: 'Data Structures', code: 'CSE201', credits: 4 },
      { name: 'Discrete Mathematics', code: 'MAT201', credits: 4 },
      { name: 'Digital Electronics', code: 'CSE203', credits: 3 },
      { name: 'Computer Organization', code: 'CSE205', credits: 3 },
      { name: 'Object Oriented Programming', code: 'CSE207', credits: 3 },
      { name: 'Data Structures Lab', code: 'CSE231', credits: 2 },
    ],
    'S4': [
      { name: 'Database Management Systems', code: 'CSE202', credits: 4 },
      { name: 'Operating Systems', code: 'CSE204', credits: 4 },
      { name: 'Microprocessors & Microcontrollers', code: 'CSE206', credits: 3 },
      { name: 'Computer Networks', code: 'CSE208', credits: 3 },
      { name: 'Design & Analysis of Algorithms', code: 'CSE302', credits: 4 },
      { name: 'DBMS Lab', code: 'CSE232', credits: 2 },
    ],
    'S5': [
      { name: 'Software Engineering', code: 'CSE301', credits: 3 },
      { name: 'Theory of Computation', code: 'CSE305', credits: 4 },
      { name: 'Compiler Design', code: 'CSE307', credits: 4 },
      { name: 'Web Programming', code: 'CSE309', credits: 3 },
      { name: 'Elective I', code: 'CSE3XX', credits: 3 },
      { name: 'Mini Project', code: 'CSE333', credits: 2 },
    ],
    'S6': [
      { name: 'Machine Learning', code: 'CSE304', credits: 3 },
      { name: 'Computer Graphics', code: 'CSE306', credits: 3 },
      { name: 'Artificial Intelligence', code: 'CSE308', credits: 4 },
      { name: 'Mobile App Development', code: 'CSE310', credits: 3 },
      { name: 'Elective II', code: 'CSE3XX', credits: 3 },
      { name: 'Project Phase I', code: 'CSE334', credits: 3 },
    ],
    'S7': [
      { name: 'Big Data Analytics', code: 'CSE401', credits: 3 },
      { name: 'Cloud Computing', code: 'CSE403', credits: 3 },
      { name: 'Cyber Security', code: 'CSE405', credits: 3 },
      { name: 'Elective III', code: 'CSE4XX', credits: 3 },
      { name: 'Elective IV', code: 'CSE4XX', credits: 3 },
      { name: 'Project Phase II', code: 'CSE432', credits: 4 },
    ],
    'S8': [
      { name: 'Industrial Training', code: 'CSE498', credits: 2 },
      { name: 'Seminar', code: 'CSE499', credits: 2 },
      { name: 'Project', code: 'CSE434', credits: 10 },
      { name: 'Comprehensive Exam', code: 'CSE497', credits: 2 },
    ],
  },
  'ECE': {
    'S1': [
      { name: 'Calculus', code: 'MAT101', credits: 4 },
      { name: 'Engineering Physics', code: 'PHY100', credits: 3 },
      { name: 'Engineering Chemistry', code: 'CHE100', credits: 3 },
      { name: 'Engineering Graphics', code: 'GE100', credits: 4 },
      { name: 'Basic Electrical Engineering', code: 'EE100', credits: 3 },
      { name: 'Programming in C', code: 'CSE101', credits: 3 },
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

  const handleBranchSelect = (branchCode: string) => {
    setSelectedBranch(branchCode);
  };

  const handleSemesterSelect = (semester: string) => {
    setSelectedSemester(semester);
    const branchSubjects = SUBJECTS_DATA[selectedBranch!]?.[semester] || [];
    setSubjects(branchSubjects);
  };

  const handleViewSyllabus = (subject: Subject) => {
    Alert.alert(
      subject.name,
      `Subject Code: ${subject.code}\nCredits: ${subject.credits}\n\nSyllabus PDF will be displayed here.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View PDF',
          onPress: () => {
            const mockPdfUrl = `https://ktu.edu.in/syllabus/${subject.code}.pdf`;
            Linking.openURL(mockPdfUrl).catch(() => {
              Alert.alert('Info', 'Syllabus PDF viewer will open here.\n\nIn production, this will load the actual syllabus document.');
            });
          },
        },
        {
          text: 'Download',
          onPress: () => {
            Alert.alert('Success', `Downloading syllabus for ${subject.name}...`);
          },
        },
      ]
    );
  };

  const handleBack = () => {
    if (selectedSemester) {
      setSelectedSemester(null);
      setSubjects([]);
    } else if (selectedBranch) {
      setSelectedBranch(null);
    } else {
      navigation.goBack();
    }
  };

  const getBreadcrumb = () => {
    const parts = ['Syllabus'];
    if (selectedBranch) {
      const branch = BRANCHES.find(b => b.code === selectedBranch);
      parts.push(branch?.code || selectedBranch);
    }
    if (selectedSemester) parts.push(selectedSemester);
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
            {selectedSemester
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
                  <Text style={styles.cardEmoji}>{branch.icon}</Text>
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
                <Text style={styles.branchBannerIcon}>{selectedBranchData.icon}</Text>
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
        ) : (
          /* Step 3: Display Subjects */
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Subjects</Text>
            {subjects.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📚</Text>
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
                  onPress={() => handleViewSyllabus(subject)}
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
                  <View style={styles.subjectActions}>
                    <TouchableOpacity
                      style={[styles.actionIconBtn, { backgroundColor: theme.backgroundSecondary }]}
                      onPress={() => handleViewSyllabus(subject)}
                    >
                      <Eye size={15} color={theme.textSecondary} strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionIconBtn, { backgroundColor: theme.backgroundSecondary }]}
                      onPress={() => Alert.alert('Download', `Downloading ${subject.name} syllabus...`)}
                    >
                      <Download size={15} color={theme.textSecondary} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
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
  cardEmoji: {
    fontSize: 22,
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
  branchBannerIcon: {
    fontSize: 36,
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
  subjectActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconText: {
    fontSize: 15,
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
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: 16,
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
