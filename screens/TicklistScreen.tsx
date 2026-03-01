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
import { useTheme } from '../contexts/ThemeContext';
import { Trash2, Plus, ArrowLeft } from 'lucide-react-native';

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
  const { theme, isDark } = useTheme();
  const [supabaseUser, setSupabaseUser] = React.useState<any | undefined>(undefined);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'completed'>('all');
  const [loading, setLoading] = React.useState(true);

  // Modal states
  const [showAddSubjectModal, setShowAddSubjectModal] = React.useState(false);
  const [showAddItemModal, setShowAddItemModal] = React.useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

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
        setSupabaseUser(null);
      }
    })();
  }, []);

  // Load subjects from cache first, then refresh from Supabase
  React.useEffect(() => {
    if (supabaseUser === undefined) {
      // Still loading auth
      return;
    }
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

    setShowAddSubjectModal(false);
    setSubjectName('');
    setSubjectCode('');

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

    setShowAddItemModal(false);
    setItemTitle('');

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
      setSubjects(subjects);
      setCachedTicklists(subjects);
      Alert.alert('Error', 'Failed to add item. Please try again.');
    }
  };

  const deleteSubject = (subjectId: string) => {
    setDeleteConfirmId(subjectId);
  };

  const confirmDeleteSubject = async () => {
    if (!deleteConfirmId || !supabaseUser) {
      setDeleteConfirmId(null);
      return;
    }
    const updatedSubjects = subjects.filter(s => s.id !== deleteConfirmId);
    setSubjects(updatedSubjects);
    setCachedTicklists(updatedSubjects);
    setDeleteConfirmId(null);
    try {
      await deleteTicklist(deleteConfirmId, supabaseUser.id);
    } catch (error) {
      console.error('Error deleting subject:', error);
      setSubjects(subjects);
      setCachedTicklists(subjects);
      Alert.alert('Error', 'Failed to delete subject. Please try again.');
    }
  };

  const deleteItem = async (subjectId: string, itemId: string) => {
    if (!supabaseUser) return;

    try {
      const subject = subjects.find(s => s.id === subjectId);
      if (!subject) return;

      const updatedItems = subject.items.filter(item => item.id !== itemId);

      await upsertTicklist({
        id: subjectId,
        user_id: supabaseUser.id,
        subject_name: subject.name,
        code: subject.code,
        color: subject.color,
        items: updatedItems,
      });

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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
        {/* Header */}
        <View style={[styles.screenHeader, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
            <ArrowLeft size={20} color={theme.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[styles.screenHeaderTitle, { color: theme.text }]}>Study Checklist</Text>
          <View style={{ width: 40 }} />
        </View>
        <TicklistScreenSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      {/* Header */}
      <View style={[styles.screenHeader, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
          <ArrowLeft size={20} color={theme.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.screenHeaderTitle, { color: theme.text }]}>Study Checklist</Text>
        <View style={{ width: 40 }} />
      </View>
      {/* Header Stats */}
      <View style={styles.headerStats}>
        {[
          { value: `${totalProgress.percentage}%`, label: 'Complete' },
          { value: `${totalProgress.completed}/${totalProgress.total}`, label: 'Modules' },
          { value: subjects.length, label: 'Subjects' },
        ].map((stat, i) => (
          <View key={i} style={[styles.statCard, {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            shadowColor: theme.shadow,
          }]}>
            <Text style={[styles.statValue, { color: theme.primary }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Overall Progress */}
      <View style={[styles.overallProgress, {
        backgroundColor: theme.card,
        borderColor: theme.cardBorder,
        shadowColor: theme.shadow,
      }]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressTitle, { color: theme.text }]}>Overall Progress</Text>
          <Text style={[styles.progressPercent, { color: theme.primary }]}>{totalProgress.percentage}%</Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: theme.backgroundTertiary }]}>
          <View style={[styles.progressFill, {
            width: `${totalProgress.percentage}%`,
            backgroundColor: theme.primary,
          }]} />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: theme.backgroundSecondary }]}>
        {(['all', 'pending', 'completed'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterTab,
              filter === f && { backgroundColor: theme.primary },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text style={[
              styles.filterText,
              { color: theme.textSecondary },
              filter === f && { color: '#FFFFFF' },
            ]}>
              {f === 'all' ? `All (${subjects.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Subjects List */}
      <ScrollView
        style={styles.subjectsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {subjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Subjects Added Yet</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Start by adding your subjects and modules to track your study progress.
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }]}
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

            if (displayItems.length === 0 && filter !== 'all') return null;

            return (
              <View key={subject.id} style={[styles.subjectCard, {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                shadowColor: theme.shadow,
              }]}>
                <View style={styles.subjectHeader}>
                  <View style={[styles.subjectColorBar, { backgroundColor: subject.color }]} />
                  <View style={styles.subjectInfo}>
                    <Text style={[styles.subjectName, { color: theme.text }]}>{subject.name}</Text>
                    <Text style={[styles.subjectCode, { color: theme.textSecondary }]}>{subject.code}</Text>
                  </View>
                  <View style={styles.subjectProgress}>
                    <Text style={[styles.subjectProgressText, { color: theme.textSecondary }]}>
                      {progress.completed}/{progress.total}
                    </Text>
                    <Text style={[styles.subjectProgressPercent, { color: subject.color }]}>
                      {progress.percentage}%
                    </Text>
                  </View>
                </View>

                <View style={[styles.progressBar, { backgroundColor: theme.backgroundTertiary }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progress.percentage}%`, backgroundColor: subject.color },
                    ]}
                  />
                </View>

                <View style={styles.itemsList}>
                  {displayItems.length === 0 && filter === 'all' ? (
                    <View style={[styles.noItemsContainer, { backgroundColor: theme.backgroundSecondary }]}>
                      <Text style={[styles.noItemsText, { color: theme.textSecondary }]}>
                        No modules added yet. Tap below to add your first module!
                      </Text>
                    </View>
                  ) : (
                    displayItems.map(item => (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.tickItem, { borderBottomColor: theme.divider }]}
                        onPress={() => toggleItem(subject.id, item.id)}
                        onLongPress={() => deleteItem(subject.id, item.id)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            { borderColor: theme.border },
                            item.completed && { backgroundColor: subject.color, borderColor: subject.color },
                          ]}
                        >
                          {item.completed && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <View style={styles.itemContent}>
                          <Text
                            style={[
                              styles.itemText,
                              { color: theme.text },
                              item.completed && { textDecorationLine: 'line-through', color: theme.textTertiary },
                            ]}
                          >
                            {item.title}
                          </Text>
                          {item.isTrending && (
                            <View style={[styles.trendingBadge, {
                              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                            }]}>
                              <Text style={[styles.trendingText, { color: theme.error }]}>🔥 Trending</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))
                  )}

                  {/* Add Item Button */}
                  <TouchableOpacity
                    style={[styles.addItemButton, {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.border,
                    }]}
                    onPress={() => {
                      setSelectedSubjectId(subject.id);
                      setShowAddItemModal(true);
                    }}
                  >
                    <Text style={[styles.addItemButtonText, { color: theme.primary }]}>+ Add Module/Topic</Text>
                  </TouchableOpacity>
                </View>

                {/* Delete Subject Button */}
                <TouchableOpacity
                  style={styles.deleteSubjectButton}
                  onPress={() => deleteSubject(subject.id)}
                >
                  <Text style={[styles.deleteSubjectButtonText, { color: theme.error }]}>Delete Subject</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Floating Add Subject Button */}
      {subjects.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.primary, shadowColor: theme.shadow }]}
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
          <View style={[styles.modalContent, {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
          }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add New Subject</Text>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setShowAddSubjectModal(false)}
              >
                <Text style={[styles.modalClose, { color: theme.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Subject Name</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                }]}
                placeholder="e.g., Computer Networks"
                value={subjectName}
                onChangeText={setSubjectName}
                placeholderTextColor={theme.textTertiary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Subject Code</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                }]}
                placeholder="e.g., CST401"
                value={subjectCode}
                onChangeText={setSubjectCode}
                placeholderTextColor={theme.textTertiary}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButtonCancel, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => {
                  setShowAddSubjectModal(false);
                  setSubjectName('');
                  setSubjectCode('');
                }}
              >
                <Text style={[styles.modalButtonCancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButtonAdd, { backgroundColor: theme.primary }]}
                onPress={addSubject}
              >
                <Text style={styles.modalButtonAddText}>Add Subject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        visible={!!deleteConfirmId}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteConfirmId(null)}
      >
        <View style={styles.deleteOverlay}>
          <View style={[styles.deleteBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.deleteTitle, { color: theme.text }]}>Delete subject?</Text>
            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={[styles.deleteBtn, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setDeleteConfirmId(null)}
              >
                <Text style={[styles.deleteBtnText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteBtn, { backgroundColor: theme.error || '#EF4444' }]}
                onPress={confirmDeleteSubject}
              >
                <Text style={[styles.deleteBtnText, { color: '#fff' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
          <View style={[styles.modalContent, {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
          }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add Module/Topic</Text>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setShowAddItemModal(false)}
              >
                <Text style={[styles.modalClose, { color: theme.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Module/Topic Title</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                }]}
                placeholder="e.g., Module 1: Introduction to Networks"
                value={itemTitle}
                onChangeText={setItemTitle}
                placeholderTextColor={theme.textTertiary}
                multiline
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButtonCancel, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => {
                  setShowAddItemModal(false);
                  setItemTitle('');
                }}
              >
                <Text style={[styles.modalButtonCancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButtonAdd, { backgroundColor: theme.primary }]}
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
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 50 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  headerStats: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  overallProgress: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  subjectsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  subjectCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
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
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  subjectCode: {
    fontSize: 12,
    fontWeight: '500',
  },
  subjectProgress: {
    alignItems: 'flex-end',
  },
  subjectProgressText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  subjectProgressPercent: {
    fontSize: 12,
    fontWeight: '700',
  },
  itemsList: {
    marginTop: 12,
  },
  tickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 14,
    flex: 1,
  },
  trendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  trendingText: {
    fontSize: 11,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  addButton: {
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
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addItemButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteSubjectButton: {
    marginTop: 12,
    padding: 8,
    alignItems: 'center',
  },
  deleteSubjectButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  deleteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  deleteBox: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  deleteTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 20,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 30,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    minHeight: 300,
    borderTopWidth: 1,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButtonCancel: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonAdd: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonAddText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noItemsContainer: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  noItemsText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default TicklistScreen;
