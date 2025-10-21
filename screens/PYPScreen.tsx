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
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PYPScreenNavigationProp } from '../types/navigation';

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
const YEARS = ['2023', '2022', '2021', '2020', '2019'];
const EXAM_TYPES = ['Regular', 'Supplementary'];

// Mock PYP data structure
const PYP_DATA: { [key: string]: { [key: string]: Array<{ name: string; code: string }> } } = {
  'CSE': {
    'S3': [
      { name: 'Data Structures', code: 'CSE201' },
      { name: 'Discrete Mathematics', code: 'MAT201' },
      { name: 'Digital Electronics', code: 'CSE203' },
      { name: 'Computer Organization', code: 'CSE205' },
      { name: 'Object Oriented Programming', code: 'CSE207' },
    ],
    'S4': [
      { name: 'Database Management Systems', code: 'CSE202' },
      { name: 'Operating Systems', code: 'CSE204' },
      { name: 'Microprocessors', code: 'CSE206' },
      { name: 'Computer Networks', code: 'CSE208' },
      { name: 'Design & Analysis of Algorithms', code: 'CSE302' },
    ],
    'S5': [
      { name: 'Software Engineering', code: 'CSE301' },
      { name: 'Theory of Computation', code: 'CSE305' },
      { name: 'Compiler Design', code: 'CSE307' },
      { name: 'Web Programming', code: 'CSE309' },
    ],
    'S6': [
      { name: 'Machine Learning', code: 'CSE304' },
      { name: 'Computer Graphics', code: 'CSE306' },
      { name: 'Artificial Intelligence', code: 'CSE308' },
      { name: 'Mobile App Development', code: 'CSE310' },
    ],
  },
  // Add other branches similarly
};

interface Subject {
  name: string;
  code: string;
}

interface QuestionPaper {
  year: string;
  type: string;
  solved: boolean;
}

export default function PYPScreen() {
  const navigation = useNavigation<PYPScreenNavigationProp>();
  
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  // Filters
  const [showYearFilter, setShowYearFilter] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');

  const handleBranchSelect = (branchCode: string) => {
    setSelectedBranch(branchCode);
  };

  const handleSemesterSelect = (semester: string) => {
    setSelectedSemester(semester);
    // Load subjects for the selected branch and semester
    const branchSubjects = PYP_DATA[selectedBranch!]?.[semester] || [];
    setSubjects(branchSubjects);
  };

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
  };

  // Mock question papers data
  const getQuestionPapers = (): QuestionPaper[] => {
    const papers: QuestionPaper[] = [];
    YEARS.forEach(year => {
      EXAM_TYPES.forEach(type => {
        papers.push(
          { year, type, solved: true },
          { year, type, solved: false }
        );
      });
    });
    return papers;
  };

  const getFilteredPapers = () => {
    let papers = getQuestionPapers();
    
    if (selectedYear !== 'All') {
      papers = papers.filter(p => p.year === selectedYear);
    }
    
    if (selectedType !== 'All') {
      papers = papers.filter(p => p.type === selectedType);
    }
    
    return papers;
  };

  const handleViewPaper = (paper: QuestionPaper) => {
    const paperType = paper.solved ? 'Solved' : 'Unsolved';
    Alert.alert(
      `${paperType} Question Paper`,
      `Subject: ${selectedSubject?.name}\nYear: ${paper.year}\nType: ${paper.type}\n\nQuestion paper PDF will be displayed here.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View PDF',
          onPress: () => {
            // In production, replace with actual PDF URL from Firestore
            const mockPdfUrl = `https://ktu.edu.in/pyp/${selectedSubject?.code}_${paper.year}_${paper.type}.pdf`;
            Linking.openURL(mockPdfUrl).catch(() => {
              Alert.alert('Info', 'Question paper PDF viewer will open here.\n\nIn production, this will load the actual document.');
            });
          },
        },
        {
          text: 'Download',
          onPress: () => {
            Alert.alert('Success', `Downloading ${paperType.toLowerCase()} paper...`);
          },
        },
      ]
    );
  };

  const handleBack = () => {
    if (selectedSubject) {
      setSelectedSubject(null);
    } else if (selectedSemester) {
      setSelectedSemester(null);
      setSubjects([]);
    } else if (selectedBranch) {
      setSelectedBranch(null);
    } else {
      navigation.goBack();
    }
  };

  const getBreadcrumb = () => {
    const parts = ['Question Papers'];
    if (selectedBranch) {
      const branch = BRANCHES.find(b => b.code === selectedBranch);
      parts.push(branch?.code || selectedBranch);
    }
    if (selectedSemester) parts.push(selectedSemester);
    if (selectedSubject) parts.push(selectedSubject.name);
    return parts.join(' → ');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Previous Year Papers</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Breadcrumb */}
      <View style={styles.breadcrumbContainer}>
        <Text style={styles.breadcrumbText}>{getBreadcrumb()}</Text>
      </View>

      {/* Filters (only show when subject is selected) */}
      {selectedSubject && (
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowYearFilter(true)}
          >
            <Text style={styles.filterButtonText}>
              📅 {selectedYear === 'All' ? 'Year' : selectedYear}
            </Text>
            <Text style={styles.filterArrow}>▼</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowTypeFilter(true)}
          >
            <Text style={styles.filterButtonText}>
              📋 {selectedType === 'All' ? 'Type' : selectedType}
            </Text>
            <Text style={styles.filterArrow}>▼</Text>
          </TouchableOpacity>

          {(selectedYear !== 'All' || selectedType !== 'All') && (
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={() => {
                setSelectedYear('All');
                setSelectedType('All');
              }}
            >
              <Text style={styles.clearFilterText}>✕ Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!selectedBranch ? (
          /* Step 1: Select Branch */
          <View>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>📄 Access KTU Question Papers</Text>
              <Text style={styles.infoDescription}>
                Download solved and unsolved previous year papers
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
        ) : !selectedSubject ? (
          /* Step 3: Select Subject */
          <View>
            <Text style={styles.sectionTitle}>Select Subject</Text>
            {subjects.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📚</Text>
                <Text style={styles.emptyStateText}>No subjects found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Question paper data will be loaded from Firestore
                </Text>
              </View>
            ) : (
              subjects.map((subject, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.subjectCard}
                  onPress={() => handleSubjectSelect(subject)}
                  activeOpacity={0.7}
                >
                  <View style={styles.subjectLeft}>
                    <Text style={styles.subjectIcon}>📄</Text>
                    <View style={styles.subjectInfo}>
                      <Text style={styles.subjectName}>{subject.name}</Text>
                      <Text style={styles.subjectCode}>{subject.code}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardArrow}>›</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          /* Step 4: Display Question Papers */
          <View>
            <Text style={styles.sectionTitle}>
              {selectedSubject.name} - Question Papers
            </Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{getFilteredPapers().length}</Text>
                <Text style={styles.statLabel}>Papers</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{YEARS.length}</Text>
                <Text style={styles.statLabel}>Years</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{getFilteredPapers().filter(p => p.solved).length}</Text>
                <Text style={styles.statLabel}>Solved</Text>
              </View>
            </View>

            {getFilteredPapers().map((paper, index) => (
              <TouchableOpacity
                key={index}
                style={styles.paperCard}
                onPress={() => handleViewPaper(paper)}
                activeOpacity={0.7}
              >
                <View style={styles.paperLeft}>
                  <Text style={styles.paperIcon}>
                    {paper.solved ? '✅' : '📝'}
                  </Text>
                  <View style={styles.paperInfo}>
                    <Text style={styles.paperTitle}>
                      {paper.year} - {paper.type}
                    </Text>
                    <Text style={styles.paperType}>
                      {paper.solved ? 'Solved Paper' : 'Question Paper'}
                    </Text>
                  </View>
                </View>
                <View style={styles.paperActions}>
                  <TouchableOpacity style={styles.actionIcon}>
                    <Text style={styles.actionIconText}>👁️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionIcon}>
                    <Text style={styles.actionIconText}>⬇️</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Year Filter Modal */}
      <Modal
        visible={showYearFilter}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowYearFilter(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearFilter(false)}
        >
          <View style={styles.filterModal}>
            <Text style={styles.filterModalTitle}>Select Year</Text>
            <TouchableOpacity
              style={styles.filterOption}
              onPress={() => {
                setSelectedYear('All');
                setShowYearFilter(false);
              }}
            >
              <Text style={styles.filterOptionText}>All Years</Text>
              {selectedYear === 'All' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            {YEARS.map(year => (
              <TouchableOpacity
                key={year}
                style={styles.filterOption}
                onPress={() => {
                  setSelectedYear(year);
                  setShowYearFilter(false);
                }}
              >
                <Text style={styles.filterOptionText}>{year}</Text>
                {selectedYear === year && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Type Filter Modal */}
      <Modal
        visible={showTypeFilter}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTypeFilter(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTypeFilter(false)}
        >
          <View style={styles.filterModal}>
            <Text style={styles.filterModalTitle}>Select Type</Text>
            <TouchableOpacity
              style={styles.filterOption}
              onPress={() => {
                setSelectedType('All');
                setShowTypeFilter(false);
              }}
            >
              <Text style={styles.filterOptionText}>All Types</Text>
              {selectedType === 'All' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            {EXAM_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={styles.filterOption}
                onPress={() => {
                  setSelectedType(type);
                  setShowTypeFilter(false);
                }}
              >
                <Text style={styles.filterOptionText}>{type}</Text>
                {selectedType === type && <Text style={styles.checkmark}>✓</Text>}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  filterArrow: {
    fontSize: 10,
    color: '#64748B',
  },
  clearFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  infoCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
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
    color: '#F59E0B',
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  paperCard: {
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
  paperLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paperIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  paperInfo: {
    flex: 1,
  },
  paperTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  paperType: {
    fontSize: 12,
    color: '#64748B',
  },
  paperActions: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  checkmark: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: '700',
  },
});
