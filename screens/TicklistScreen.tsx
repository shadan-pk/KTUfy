import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TicklistScreenNavigationProp } from '../types/navigation';
import { useAuth } from '../auth/AuthProvider';
import { getTicklistsForUser, upsertTicklist, deleteTicklist } from '../supabaseConfig';
import supabase from '../supabaseClient';
import { getCachedTicklists, setCachedTicklists } from '../services/cacheService';
import { TicklistScreenSkeleton } from '../components/SkeletonLoader';

interface TicklistItem {
  id: string;
  title: string;
  completed: boolean;
  isTrending?: boolean;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
  items: TicklistItem[];
}

interface TicklistScreenProps {
  navigation: TicklistScreenNavigationProp;
}

const TicklistScreen: React.FC<TicklistScreenProps> = ({ navigation }) => {
  const { user: authUser } = useAuth();
  const [supabaseUser, setSupabaseUser] = React.useState<any | null>(null);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'completed'>('all');
  const [loading, setLoading] = React.useState(true);

  // Modal states
  const [showAddSubjectModal, setShowAddSubjectModal] = React.useState(false);
  const [showAddItemModal, setShowAddItemModal] = React.useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<string>('');

  // Form states
  const [subjectName, setSubjectName] = React.useState('');
  const [subjectCode, setSubjectCode] = React.useState('');
  const [itemTitle, setItemTitle] = React.useState('');

  // Color palette for subjects
  const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

  React.useEffect(() => {
    (async () => {
      try {
        const { data: userRes, error } = await supabase.auth.getUser();
        if (error) throw error;
        setSupabaseUser(userRes?.user ?? null);
      } catch (err) {
        console.error('Error getting supabase user:', err);
      }
    })();
  }, []);

  // Load subjects from cache first, then refresh from Supabase
  React.useEffect(() => {
    if (!supabaseUser) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        // 1. Try cache first for instant UI
        const cached = await getCachedTicklists();
        if (cached && cached.length > 0) {
          setSubjects(cached);
          setLoading(false);
        }

        // 2. Refresh from Supabase in background
        const lists = await getTicklistsForUser(supabaseUser.id);
        const loadedSubjects: Subject[] = (lists || []).map((r: any) => ({
          id: r.id,
          name: r.subject_name,
          code: r.code,
          color: r.color,
          items: r.items || [],
        }));
        setSubjects(loadedSubjects);
        await setCachedTicklists(loadedSubjects);
      } catch (error) {
        console.error('Error loading ticklist:', error);
        if (!subjects.length) {
          Alert.alert('Error', 'Failed to load checklist. Please check your connection.');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [supabaseUser]);

  const addSubject = async () => {
    if (!subjectName.trim() || !subjectCode.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!supabaseUser) {
      Alert.alert('Error', 'You must be logged in to add subjects');
      return;
    }

    const newSubjectId = Date.now().toString();
    const newSubject: Subject = {
      id: newSubjectId,
      name: subjectName.trim(),
      code: subjectCode.trim().toUpperCase(),
      color: colors[subjects.length % colors.length],
      items: [],
    };

    // Close modal and clear form immediately
    setShowAddSubjectModal(false);
    setSubjectName('');
    setSubjectCode('');

    // Optimistic update — show in UI immediately
    const updatedSubjects = [...subjects, newSubject];
    setSubjects(updatedSubjects);
    setCachedTicklists(updatedSubjects);

    try {
      await upsertTicklist({
        id: newSubjectId,
        user_id: supabaseUser.id,
        subject_name: newSubject.name,
        code: newSubject.code,
        color: newSubject.color,
        items: newSubject.items,
      });
    } catch (error) {
      console.error('Error adding subject:', error);
      // Revert optimistic update on failure
      setSubjects(subjects);
      setCachedTicklists(subjects);
      Alert.alert('Error', 'Failed to add subject. Please try again.');
    }
  };

  const addItem = async () => {
    if (!itemTitle.trim()) {
      Alert.alert('Error', 'Please enter a module/topic title');
      return;
    }

    if (!supabaseUser) {
      Alert.alert('Error', 'You must be logged in to add items');
      return;
    }

    const newItem: TicklistItem = {
      id: Date.now().toString(),
      title: itemTitle.trim(),
      completed: false,
    };

    const subject = subjects.find(s => s.id === selectedSubjectId);
    if (!subject) return;

    // Close modal and clear form immediately
    setShowAddItemModal(false);
    setItemTitle('');

    // Optimistic update — show in UI immediately
    const updatedItems = [...subject.items, newItem];
    const updatedSubjects = subjects.map(s =>
      s.id === selectedSubjectId ? { ...s, items: updatedItems } : s
    );
    setSubjects(updatedSubjects);
    setCachedTicklists(updatedSubjects);

    try {
      await upsertTicklist({
        id: selectedSubjectId,
        user_id: supabaseUser.id,
        subject_name: subject.name,
        code: subject.code,
        color: subject.color,
        items: updatedItems,
      });
    } catch (error) {
      console.error('Error adding item:', error);
      // Revert optimistic update
      setSubjects(subjects);
      setCachedTicklists(subjects);
      Alert.alert('Error', 'Failed to add item. Please try again.');
    }
  };

  const deleteSubject = (subjectId: string) => {
    Alert.alert(
      'Delete Subject',
      'Are you sure you want to delete this subject and all its items?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!supabaseUser) return;
            // Optimistic update
            const updatedSubjects = subjects.filter(s => s.id !== subjectId);
            setSubjects(updatedSubjects);
            setCachedTicklists(updatedSubjects);
            try {
              await deleteTicklist(subjectId, supabaseUser.id);
            } catch (error) {
              console.error('Error deleting subject:', error);
              // Revert on failure
              setSubjects(subjects);
              setCachedTicklists(subjects);
              Alert.alert('Error', 'Failed to delete subject. Please try again.');
            }
          },
        },
      ]
    );
  };

  const deleteItem = async (subjectId: string, itemId: string) => {
    if (!supabaseUser) return;

    try {
      const subject = subjects.find(s => s.id === subjectId);
      if (!subject) return;

      const updatedItems = subject.items.filter(item => item.id !== itemId);

      // Persist the updated items to Supabase
      await upsertTicklist({
        id: subjectId,
        user_id: supabaseUser.id,
        subject_name: subject.name,
        code: subject.code,
        color: subject.color,
        items: updatedItems,
      });

      // Update local state for immediate UI feedback
      setSubjects(prev => prev.map(s => (s.id === subjectId ? { ...s, items: updatedItems } : s)));
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item. Please try again.');
    }
  };

  const toggleItem = async (subjectId: string, itemId: string) => {
    if (!supabaseUser) return;

    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const updatedItems = subject.items.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    // Optimistic update
    const updatedSubjects = subjects.map(s =>
      s.id === subjectId ? { ...s, items: updatedItems } : s
    );
    setSubjects(updatedSubjects);
    setCachedTicklists(updatedSubjects);

    try {
      await upsertTicklist({
        id: subjectId,
        user_id: supabaseUser.id,
        subject_name: subject.name,
        code: subject.code,
        color: subject.color,
        items: updatedItems,
      });
    } catch (error) {
      console.error('Error toggling item:', error);
      // Revert on failure
      setSubjects(subjects);
      setCachedTicklists(subjects);
      Alert.alert('Error', 'Failed to update item. Please try again.');
    }
  };

  const getSubjectProgress = (subject: Subject) => {
    const completed = subject.items.filter(item => item.completed).length;
    const total = subject.items.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const getFilteredSubjects = () => {
    if (filter === 'all') return subjects;
    return subjects.filter(subject => {
      const hasItems = subject.items.some(item =>
        filter === 'pending' ? !item.completed : item.completed
      );
      return hasItems;
    });
  };

  const getTotalProgress = () => {
    const totalItems = subjects.reduce((sum, subject) => sum + subject.items.length, 0);
    const completedItems = subjects.reduce(
      (sum, subject) => sum + subject.items.filter(item => item.completed).length,
      0
    );
    const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    return {
      completed: completedItems,
      total: totalItems,
      percentage,
    };
  };

  const totalProgress = getTotalProgress();

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <TicklistScreenSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header Stats */}
      <View style={styles.headerStats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalProgress.percentage}%</Text>
          <Text style={styles.statLabel}>Complete</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalProgress.completed}/{totalProgress.total}</Text>
          <Text style={styles.statLabel}>Modules</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{subjects.length}</Text>
          <Text style={styles.statLabel}>Subjects</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.overallProgress}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Overall Progress</Text>
          <Text style={styles.progressPercent}>{totalProgress.percentage}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${totalProgress.percentage}%` }]} />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({subjects.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'completed' && styles.filterTabActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Subjects List */}
      <ScrollView style={styles.subjectsList} showsVerticalScrollIndicator={false}>
        {subjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>No Subjects Added Yet</Text>
            <Text style={styles.emptyText}>
              Start by adding your subjects and modules to track your study progress.
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddSubjectModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add Subject</Text>
            </TouchableOpacity>
          </View>
        ) : (
          getFilteredSubjects().map(subject => {
            const progress = getSubjectProgress(subject);
            const displayItems =
              filter === 'all'
                ? subject.items
                : subject.items.filter(item =>
                  filter === 'pending' ? !item.completed : item.completed
                );

            // Show subjects even if they have no items yet (when filter is 'all')
            if (displayItems.length === 0 && filter !== 'all') return null;

            return (
              <View key={subject.id} style={styles.subjectCard}>
                <View style={styles.subjectHeader}>
                  <View style={[styles.subjectColorBar, { backgroundColor: subject.color }]} />
                  <View style={styles.subjectInfo}>
                    <Text style={styles.subjectName}>{subject.name}</Text>
                    <Text style={styles.subjectCode}>{subject.code}</Text>
                  </View>
                  <View style={styles.subjectProgress}>
                    <Text style={styles.subjectProgressText}>
                      {progress.completed}/{progress.total}
                    </Text>
                    <Text style={styles.subjectProgressPercent}>{progress.percentage}%</Text>
                  </View>
                </View>

                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progress.percentage}%`, backgroundColor: subject.color },
                    ]}
                  />
                </View>

                <View style={styles.itemsList}>
                  {displayItems.length === 0 && filter === 'all' ? (
                    <View style={styles.noItemsContainer}>
                      <Text style={styles.noItemsText}>No modules added yet. Tap below to add your first module!</Text>
                    </View>
                  ) : (
                    displayItems.map(item => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.tickItem}
                        onPress={() => toggleItem(subject.id, item.id)}
                        onLongPress={() => deleteItem(subject.id, item.id)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            item.completed && [styles.checkboxChecked, { backgroundColor: subject.color }],
                          ]}
                        >
                          {item.completed && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <View style={styles.itemContent}>
                          <Text
                            style={[styles.itemText, item.completed && styles.itemTextCompleted]}
                          >
                            {item.title}
                          </Text>
                          {item.isTrending && (
                            <View style={styles.trendingBadge}>
                              <Text style={styles.trendingText}>🔥 Trending</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))
                  )}

                  {/* Add Item Button */}
                  <TouchableOpacity
                    style={styles.addItemButton}
                    onPress={() => {
                      setSelectedSubjectId(subject.id);
                      setShowAddItemModal(true);
                    }}
                  >
                    <Text style={styles.addItemButtonText}>+ Add Module/Topic</Text>
                  </TouchableOpacity>
                </View>

                {/* Delete Subject Button */}
                <TouchableOpacity
                  style={styles.deleteSubjectButton}
                  onPress={() => deleteSubject(subject.id)}
                >
                  <Text style={styles.deleteSubjectButtonText}>Delete Subject</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Floating Add Subject Button */}
      {subjects.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAddSubjectModal(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Add Subject Modal */}
      <Modal
        visible={showAddSubjectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddSubjectModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Subject</Text>
              <TouchableOpacity onPress={() => setShowAddSubjectModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Subject Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Computer Networks"
                value={subjectName}
                onChangeText={setSubjectName}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Subject Code</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., CST401"
                value={subjectCode}
                onChangeText={setSubjectCode}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowAddSubjectModal(false);
                  setSubjectName('');
                  setSubjectCode('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonAdd}
                onPress={addSubject}
              >
                <Text style={styles.modalButtonAddText}>Add Subject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Item Modal */}
      <Modal
        visible={showAddItemModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddItemModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Module/Topic</Text>
              <TouchableOpacity onPress={() => setShowAddItemModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Module/Topic Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Module 1: Introduction to Networks"
                value={itemTitle}
                onChangeText={setItemTitle}
                placeholderTextColor="#9CA3AF"
                multiline
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowAddItemModal(false);
                  setItemTitle('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonAdd}
                onPress={addItem}
              >
                <Text style={styles.modalButtonAddText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  headerStats: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366F1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  overallProgress: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  progressPercent: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6366F1',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#6366F1',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  subjectsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectColorBar: {
    width: 4,
    height: 48,
    borderRadius: 2,
    marginRight: 12,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  subjectCode: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  subjectProgress: {
    alignItems: 'flex-end',
  },
  subjectProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 2,
  },
  subjectProgressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
  },
  itemsList: {
    marginTop: 12,
  },
  tickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: 'transparent',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 15,
    color: '#4B5563',
    flex: 1,
  },
  itemTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  trendingBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  trendingText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  addButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  addItemButton: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  addItemButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteSubjectButton: {
    marginTop: 12,
    padding: 10,
    alignItems: 'center',
  },
  deleteSubjectButtonText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  modalClose: {
    fontSize: 28,
    color: '#6B7280',
    fontWeight: '300',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  modalButtonCancel: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalButtonAdd: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
  },
  modalButtonAddText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noItemsContainer: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    marginBottom: 8,
  },
  noItemsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default TicklistScreen;
