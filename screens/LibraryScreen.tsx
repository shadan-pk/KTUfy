import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LibraryScreenNavigationProp } from '../types/navigation';
import { db } from '../firebaseConfig';
import { collection, getDocs, query } from 'firebase/firestore';
import { useTheme } from '../contexts/ThemeContext';

// Types
interface Note {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'image' | 'doc' | 'ppt';
  fileUrl: string;
  uploadedDate: string;
  size?: string;
}

interface LibraryScreenProps {
  navigation: LibraryScreenNavigationProp;
}

// Library Features
const LIBRARY_FEATURES = [
  {
    id: 'syllabus',
    title: 'Syllabus Viewer',
    description: 'View complete KTU syllabus by branch and semester',
    icon: '🧾',
    color: '#6366F1',
    route: 'SyllabusViewer' as const,
  },
  {
    id: 'pyp',
    title: 'Previous Year Papers',
    description: 'Access and download solved and unsolved KTU papers',
    icon: '📄',
    color: '#F59E0B',
    route: 'PYP' as const,
  },
  {
    id: 'notes',
    title: 'Notes',
    description: 'Browse and download subject notes',
    icon: '📝',
    color: '#10B981',
    route: null,
  },
  {
    id: 'textbooks',
    title: 'Textbooks',
    description: 'Access recommended textbooks and reference materials',
    icon: '📚',
    color: '#8B5CF6',
    route: null,
  },
  {
    id: 'references',
    title: 'References',
    description: 'Additional learning resources and references',
    icon: '📖',
    color: '#EC4899',
    route: null,
  },
];

// KTU Data
const YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];

const SEMESTERS = {
  'First Year': ['S1', 'S2'],
  'Second Year': ['S3', 'S4'],
  'Third Year': ['S5', 'S6'],
  'Fourth Year': ['S7', 'S8'],
};

const BRANCHES = [
  'CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'AE', 'BT', 'CHE', 'IE'
];

const LibraryScreen: React.FC<LibraryScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  
  // View Mode State ('menu' or 'notes')
  const [viewMode, setViewMode] = useState<'menu' | 'notes'>('menu');
  
  // Navigation State
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Data State
  const [subjects, setSubjects] = useState<string[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFeatureSelect = (feature: typeof LIBRARY_FEATURES[0]) => {
    if (feature.route) {
      // @ts-ignore - Navigation types will be updated
      navigation.navigate(feature.route);
    } else if (feature.id === 'notes') {
      setViewMode('notes');
    } else {
      Alert.alert(
        feature.title,
        `${feature.description}\n\nThis feature will be available soon!`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleBackToMenu = () => {
    setViewMode('menu');
    setSelectedYear(null);
    setSelectedSemester(null);
    setSelectedBranch(null);
    setSelectedSubject(null);
    setSubjects([]);
    setNotes([]);
  };

  // Fetch subjects when branch is selected
  useEffect(() => {
    if (selectedYear && selectedSemester && selectedBranch) {
      fetchSubjects();
    }
  }, [selectedYear, selectedSemester, selectedBranch]);

  // Fetch notes when subject is selected
  useEffect(() => {
    if (selectedYear && selectedSemester && selectedBranch && selectedSubject) {
      fetchNotes();
    }
  }, [selectedSubject]);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const yearNum = YEARS.indexOf(selectedYear!) + 1;
      const semNum = selectedSemester!.replace('S', '');
      const path = `Library/Year_${yearNum}/Sem_${semNum}/${selectedBranch}`;
      
      // For demo, using mock data. Replace with actual Firestore query:
      // const subjectsRef = collection(db, path);
      // const snapshot = await getDocs(subjectsRef);
      // const subjectsList = snapshot.docs.map(doc => doc.id);
      
      // Mock subjects for demonstration
      const mockSubjects = ['Artificial Intelligence', 'Machine Learning', 'Data Science', 'Computer Networks'];
      setSubjects(mockSubjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      Alert.alert('Error', 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const yearNum = YEARS.indexOf(selectedYear!) + 1;
      const semNum = selectedSemester!.replace('S', '');
      const path = `Library/Year_${yearNum}/Sem_${semNum}/${selectedBranch}/${selectedSubject}/notes`;
      
      // For demo, using mock data. Replace with actual Firestore query:
      // const notesRef = collection(db, path);
      // const snapshot = await getDocs(notesRef);
      // const notesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      
      // Mock notes for demonstration
      const mockNotes: Note[] = [
        {
          id: '1',
          fileName: 'Introduction to AI.pdf',
          fileType: 'pdf',
          fileUrl: 'https://example.com/note1.pdf',
          uploadedDate: '2025-10-15',
          size: '2.3 MB',
        },
        {
          id: '2',
          fileName: 'Neural Networks Basics.pdf',
          fileType: 'pdf',
          fileUrl: 'https://example.com/note2.pdf',
          uploadedDate: '2025-10-10',
          size: '1.8 MB',
        },
        {
          id: '3',
          fileName: 'AI Algorithms Diagram.png',
          fileType: 'image',
          fileUrl: 'https://example.com/diagram.png',
          uploadedDate: '2025-10-12',
          size: '456 KB',
        },
      ];
      setNotes(mockNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      Alert.alert('Error', 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return '📄';
      case 'image':
        return '🖼️';
      case 'doc':
        return '📝';
      case 'ppt':
        return '📊';
      default:
        return '📁';
    }
  };

  const handleNoteOpen = (note: Note) => {
    Alert.alert(
      note.fileName,
      `Type: ${note.fileType.toUpperCase()}\n${note.size ? `Size: ${note.size}\n` : ''}Uploaded: ${new Date(note.uploadedDate).toLocaleDateString()}\n\nOpen this file?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'View', 
          onPress: () => {
            // Open URL in browser or viewer
            Linking.openURL(note.fileUrl).catch(() => {
              Alert.alert('Error', 'Cannot open this file');
            });
          }
        },
      ]
    );
  };

  const handleBack = () => {
    if (selectedSubject) {
      setSelectedSubject(null);
      setNotes([]);
    } else if (selectedBranch) {
      setSelectedBranch(null);
      setSubjects([]);
    } else if (selectedSemester) {
      setSelectedSemester(null);
    } else if (selectedYear) {
      setSelectedYear(null);
    } else if (viewMode === 'notes') {
      handleBackToMenu();
    }
  };

  const getBreadcrumb = () => {
    const parts = [];
    if (selectedYear) parts.push(selectedYear);
    if (selectedSemester) parts.push(selectedSemester);
    if (selectedBranch) parts.push(selectedBranch);
    if (selectedSubject) parts.push(selectedSubject);
    return parts.join(' → ');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      {/* Header with Breadcrumb */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>📚 Library</Text>
          {(viewMode === 'notes' || selectedYear || selectedSemester || selectedBranch || selectedSubject) && (
            <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.primaryLight }]} onPress={handleBack}>
              <Text style={[styles.backButtonText, { color: theme.primary }]}>← Back</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {getBreadcrumb() && (
          <View style={[styles.breadcrumbContainer, { backgroundColor: theme.primaryLight }]}>
            <Text style={[styles.breadcrumbText, { color: theme.primary }]}>{getBreadcrumb()}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {viewMode === 'menu' ? (
          /* Main Library Menu */
          <View>
            <View style={[styles.welcomeCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.welcomeTitle, { color: theme.text }]}>📚 Welcome to KTU Library</Text>
              <Text style={[styles.welcomeDescription, { color: theme.textSecondary }]}>
                Access syllabus, question papers, notes, and study materials
              </Text>
            </View>

            <Text style={[styles.menuSectionTitle, { color: theme.text }]}>Library Resources</Text>

            {LIBRARY_FEATURES.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                style={[styles.featureCard, { backgroundColor: theme.card, borderLeftColor: feature.color, borderColor: theme.cardBorder }]}
                onPress={() => handleFeatureSelect(feature)}
                activeOpacity={0.7}
              >
                <View style={[styles.featureIconContainer, { backgroundColor: feature.color + '20' }]}>
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: theme.text }]}>{feature.title}</Text>
                  <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>{feature.description}</Text>
                </View>
                <Text style={[styles.featureArrow, { color: theme.textSecondary }]}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
          </View>
        ) : !selectedYear ? (
          /* Step 1: Select Year */
          <View style={styles.selectionContainer}>
            <Text style={styles.selectionTitle}>Select Year</Text>
            <Text style={styles.selectionSubtitle}>Choose your academic year</Text>
            
            {YEARS.map((year, index) => (
              <TouchableOpacity
                key={year}
                style={styles.selectionCard}
                onPress={() => setSelectedYear(year)}
                activeOpacity={0.7}
              >
                <View style={styles.selectionCardIcon}>
                  <Text style={styles.selectionCardEmoji}>📖</Text>
                </View>
                <View style={styles.selectionCardContent}>
                  <Text style={styles.selectionCardTitle}>{year}</Text>
                  <Text style={styles.selectionCardSubtitle}>
                    Year {index + 1} • {SEMESTERS[year as keyof typeof SEMESTERS].join(', ')}
                  </Text>
                </View>
                <Text style={styles.selectionCardArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : !selectedSemester ? (
          /* Step 2: Select Semester */
          <View style={styles.selectionContainer}>
            <Text style={styles.selectionTitle}>Select Semester</Text>
            <Text style={styles.selectionSubtitle}>Choose your current semester</Text>
            
            {SEMESTERS[selectedYear as keyof typeof SEMESTERS].map((semester) => (
              <TouchableOpacity
                key={semester}
                style={styles.selectionCard}
                onPress={() => setSelectedSemester(semester)}
                activeOpacity={0.7}
              >
                <View style={styles.selectionCardIcon}>
                  <Text style={styles.selectionCardEmoji}>📅</Text>
                </View>
                <View style={styles.selectionCardContent}>
                  <Text style={styles.selectionCardTitle}>Semester {semester.replace('S', '')}</Text>
                  <Text style={styles.selectionCardSubtitle}>{semester}</Text>
                </View>
                <Text style={styles.selectionCardArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : !selectedBranch ? (
          /* Step 3: Select Branch */
          <View style={styles.selectionContainer}>
            <Text style={styles.selectionTitle}>Select Branch</Text>
            <Text style={styles.selectionSubtitle}>Choose your engineering branch</Text>
            
            <View style={styles.branchGrid}>
              {BRANCHES.map((branch) => (
                <TouchableOpacity
                  key={branch}
                  style={styles.branchCard}
                  onPress={() => setSelectedBranch(branch)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.branchCardText}>{branch}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : !selectedSubject ? (
          /* Step 4: Select Subject */
          <View style={styles.selectionContainer}>
            <Text style={styles.selectionTitle}>Select Subject</Text>
            <Text style={styles.selectionSubtitle}>Choose a subject to view notes</Text>
            
            {subjects.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📚</Text>
                <Text style={styles.emptyTitle}>No subjects available</Text>
                <Text style={styles.emptyText}>
                  Subjects for this branch are being added
                </Text>
              </View>
            ) : (
              subjects.map((subject) => (
                <TouchableOpacity
                  key={subject}
                  style={styles.selectionCard}
                  onPress={() => setSelectedSubject(subject)}
                  activeOpacity={0.7}
                >
                  <View style={styles.selectionCardIcon}>
                    <Text style={styles.selectionCardEmoji}>📘</Text>
                  </View>
                  <View style={styles.selectionCardContent}>
                    <Text style={styles.selectionCardTitle}>{subject}</Text>
                    <Text style={styles.selectionCardSubtitle}>{selectedBranch} • {selectedSemester}</Text>
                  </View>
                  <Text style={styles.selectionCardArrow}>›</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          /* Step 5: Display Notes */
          <View style={styles.notesContainer}>
            <View style={styles.notesHeader}>
              <Text style={styles.notesTitle}>📄 Available Notes</Text>
              <Text style={styles.notesCount}>{notes.length} file{notes.length !== 1 ? 's' : ''}</Text>
            </View>
            
            {notes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyTitle}>No notes available</Text>
                <Text style={styles.emptyText}>
                  Notes for {selectedSubject} will be added soon
                </Text>
              </View>
            ) : (
              notes.map((note) => (
                <TouchableOpacity
                  key={note.id}
                  style={styles.noteCard}
                  onPress={() => handleNoteOpen(note)}
                  activeOpacity={0.7}
                >
                  <View style={styles.noteIconContainer}>
                    <Text style={styles.noteIcon}>{getFileTypeIcon(note.fileType)}</Text>
                  </View>
                  
                  <View style={styles.noteInfo}>
                    <Text style={styles.noteFileName} numberOfLines={2}>
                      {note.fileName}
                    </Text>
                    <View style={styles.noteMeta}>
                      <Text style={styles.noteMetaText}>
                        {note.fileType.toUpperCase()}
                      </Text>
                      {note.size && (
                        <>
                          <Text style={styles.noteMetaDot}>•</Text>
                          <Text style={styles.noteMetaText}>{note.size}</Text>
                        </>
                      )}
                      <Text style={styles.noteMetaDot}>•</Text>
                      <Text style={styles.noteMetaText}>
                        {new Date(note.uploadedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.downloadButton}
                    onPress={() => handleNoteOpen(note)}
                  >
                    <Text style={styles.downloadButtonText}>View</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
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
    backgroundColor: '#F8F9FD',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  backButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  breadcrumbContainer: {
    marginTop: 12,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  breadcrumbText: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  selectionContainer: {
    padding: 20,
  },
  selectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  selectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  selectionCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  selectionCardEmoji: {
    fontSize: 24,
  },
  selectionCardContent: {
    flex: 1,
  },
  selectionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  selectionCardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  selectionCardArrow: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  branchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  branchCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  branchCardText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366F1',
  },
  notesContainer: {
    padding: 20,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  notesCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  noteIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  noteIcon: {
    fontSize: 28,
  },
  noteInfo: {
    flex: 1,
    marginRight: 12,
  },
  noteFileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  noteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  noteMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  noteMetaDot: {
    fontSize: 12,
    color: '#D1D5DB',
    marginHorizontal: 6,
  },
  downloadButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  welcomeCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  welcomeDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  menuSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureIcon: {
    fontSize: 28,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  featureArrow: {
    fontSize: 24,
    color: '#CBD5E1',
    fontWeight: '300',
  },
});

export default LibraryScreen;
