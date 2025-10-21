import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SyllabusViewerScreenNavigationProp } from '../types/navigation';

// KTU Branches
const BRANCHES = [
  { code: 'CSE', name: 'Computer Science & Engineering', icon: '💻' },
  { code: 'ECE', name: 'Electronics & Communication', icon: '📡' },
  { code: 'EEE', name: 'Electrical & Electronics', icon: '⚡' },
  { code: 'ME', name: 'Mechanical Engineering', icon: '⚙️' },
  { code: 'CE', name: 'Civil Engineering', icon: '🏗️' },
  { code: 'IT', name: 'Information Technology', icon: '🖥️' },
  { code: 'AE', name: 'Applied Electronics', icon: '🔌' },
  { code: 'BT', name: 'Biotechnology', icon: '🧬' },
  { code: 'CHE', name: 'Chemical Engineering', icon: '⚗️' },
  { code: 'IE', name: 'Industrial Engineering', icon: '🏭' },
];

const SEMESTERS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

// Mock subject data structure (replace with Firestore data)
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
  // Add other branches similarly (for demo, using same structure)
  'ECE': {
    'S1': [
      { name: 'Calculus', code: 'MAT101', credits: 4 },
      { name: 'Engineering Physics', code: 'PHY100', credits: 3 },
      { name: 'Engineering Chemistry', code: 'CHE100', credits: 3 },
      { name: 'Engineering Graphics', code: 'GE100', credits: 4 },
      { name: 'Basic Electrical Engineering', code: 'EE100', credits: 3 },
      { name: 'Programming in C', code: 'CSE101', credits: 3 },
    ],
    // ... other semesters
  },
};

interface Subject {
  name: string;
  code: string;
  credits: number;
}

export default function SyllabusViewerScreen() {
  const navigation = useNavigation<SyllabusViewerScreenNavigationProp>();
  
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const handleBranchSelect = (branchCode: string) => {
    setSelectedBranch(branchCode);
  };

  const handleSemesterSelect = (semester: string) => {
    setSelectedSemester(semester);
    // Load subjects for the selected branch and semester
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
            // In production, replace with actual PDF URL from Firestore
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Syllabus Viewer</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Breadcrumb */}
      <View style={styles.breadcrumbContainer}>
        <Text style={styles.breadcrumbText}>{getBreadcrumb()}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!selectedBranch ? (
          /* Step 1: Select Branch */
          <View>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>📖 View Complete KTU Syllabus</Text>
              <Text style={styles.infoDescription}>
                Access syllabus for all subjects by branch and semester
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Select Your Branch</Text>
            {BRANCHES.map((branch) => (
              <TouchableOpacity
                key={branch.code}
                style={styles.card}
                onPress={() => handleBranchSelect(branch.code)}
                activeOpacity={0.7}
              >
                <View style={styles.cardIcon}>
                  <Text style={styles.cardEmoji}>{branch.icon}</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{branch.code}</Text>
                  <Text style={styles.cardSubtitle}>{branch.name}</Text>
                </View>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : !selectedSemester ? (
          /* Step 2: Select Semester */
          <View>
            <Text style={styles.sectionTitle}>Select Semester</Text>
            <View style={styles.semesterGrid}>
              {SEMESTERS.map((semester) => (
                <TouchableOpacity
                  key={semester}
                  style={styles.semesterCard}
                  onPress={() => handleSemesterSelect(semester)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.semesterText}>{semester}</Text>
                  <Text style={styles.semesterSubtext}>Semester {semester.replace('S', '')}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          /* Step 3: Display Subjects */
          <View>
            <Text style={styles.sectionTitle}>Subjects</Text>
            {subjects.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📚</Text>
                <Text style={styles.emptyStateText}>No subjects found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Syllabus data will be loaded from Firestore
                </Text>
              </View>
            ) : (
              subjects.map((subject, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.subjectCard}
                  onPress={() => handleViewSyllabus(subject)}
                  activeOpacity={0.7}
                >
                  <View style={styles.subjectLeft}>
                    <Text style={styles.subjectIcon}>📄</Text>
                    <View style={styles.subjectInfo}>
                      <Text style={styles.subjectName}>{subject.name}</Text>
                      <Text style={styles.subjectCode}>
                        {subject.code} • {subject.credits} Credits
                      </Text>
                    </View>
                  </View>
                  <View style={styles.subjectActions}>
                    <TouchableOpacity style={styles.actionIcon}>
                      <Text style={styles.actionIconText}>👁️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon}>
                      <Text style={styles.actionIconText}>⬇️</Text>
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
  breadcrumbContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  infoCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    marginTop: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardEmoji: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  cardArrow: {
    fontSize: 24,
    color: '#CBD5E1',
    fontWeight: '300',
  },
  semesterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  semesterCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  semesterText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366F1',
    marginBottom: 4,
  },
  semesterSubtext: {
    fontSize: 12,
    color: '#64748B',
  },
  subjectCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subjectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subjectIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  subjectCode: {
    fontSize: 12,
    color: '#64748B',
  },
  subjectActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconText: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
