import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LibraryScreenNavigationProp } from '../types/navigation';
import { useAuth } from '../auth/AuthProvider';
import { useTheme } from '../contexts/ThemeContext';
import supabase from '../supabaseClient';
import { LibraryScreenSkeleton } from '../components/SkeletonLoader';

interface Note {
  id: string;
  title: string;
  content: string;
  subject?: string;
  created_at: string;
  updated_at: string;
}

interface Bookmark {
  id: string;
  title: string;
  url: string;
  subject?: string;
  created_at: string;
}

interface LibraryScreenProps {
  navigation: LibraryScreenNavigationProp;
}

const LibraryScreen: React.FC<LibraryScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'notes' | 'bookmarks'>('notes');
  const [notes, setNotes] = useState<Note[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Note modal
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSubject, setNoteSubject] = useState('');

  // Bookmark modal
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [bookmarkTitle, setBookmarkTitle] = useState('');
  const [bookmarkUrl, setBookmarkUrl] = useState('');
  const [bookmarkSubject, setBookmarkSubject] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      // Load notes
      const { data: notesData } = await supabase
        .from('user_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (notesData) setNotes(notesData);

      // Load bookmarks
      const { data: bookmarksData } = await supabase
        .from('user_bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (bookmarksData) setBookmarks(bookmarksData);
    } catch (err) {
      // Tables may not exist yet — silent fail
    } finally {
      setIsLoading(false);
    }
  };

  const saveNote = async () => {
    if (!noteTitle.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!user) return;

    const noteData = {
      user_id: user.id,
      title: noteTitle.trim(),
      content: noteContent.trim(),
      subject: noteSubject.trim() || undefined,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingNote) {
        // Update
        await supabase.from('user_notes').update(noteData).eq('id', editingNote.id);
        setNotes(prev => prev.map(n =>
          n.id === editingNote.id ? { ...n, ...noteData } : n
        ));
      } else {
        // Insert
        const newNote: Note = { ...noteData, id: Date.now().toString(), created_at: new Date().toISOString() };
        const { error } = await supabase.from('user_notes').insert(newNote);
        if (!error) setNotes(prev => [newNote as Note, ...prev]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to save note');
    }

    setShowNoteModal(false);
    resetNoteForm();
  };

  const deleteNote = (id: string) => {
    Alert.alert('Delete Note', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setNotes(prev => prev.filter(n => n.id !== id));
          try { await supabase.from('user_notes').delete().eq('id', id); } catch { }
        },
      },
    ]);
  };

  const saveBookmark = async () => {
    if (!bookmarkTitle.trim() || !bookmarkUrl.trim()) {
      Alert.alert('Error', 'Please fill title and URL');
      return;
    }
    if (!user) return;

    const bm = {
      id: Date.now().toString(),
      user_id: user.id,
      title: bookmarkTitle.trim(),
      url: bookmarkUrl.trim(),
      subject: bookmarkSubject.trim() || null,
      created_at: new Date().toISOString(),
    };

    setBookmarks(prev => [bm as Bookmark, ...prev]);
    setShowBookmarkModal(false);
    resetBookmarkForm();

    try {
      await supabase.from('user_bookmarks').insert(bm);
    } catch {
      setBookmarks(prev => prev.filter(b => b.id !== bm.id));
    }
  };

  const deleteBookmark = (id: string) => {
    Alert.alert('Delete Bookmark', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setBookmarks(prev => prev.filter(b => b.id !== id));
          try { await supabase.from('user_bookmarks').delete().eq('id', id); } catch { }
        },
      },
    ]);
  };

  const resetNoteForm = () => {
    setNoteTitle(''); setNoteContent(''); setNoteSubject(''); setEditingNote(null);
  };

  const resetBookmarkForm = () => {
    setBookmarkTitle(''); setBookmarkUrl(''); setBookmarkSubject('');
  };

  const openEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteSubject(note.subject || '');
    setShowNoteModal(true);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.background }}>
        <View style={[styles.header, { borderBottomColor: theme.divider }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>📚 My Library</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      {/* Tabs */}
      <View style={[styles.tabRow, { backgroundColor: theme.backgroundSecondary }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notes' && [styles.tabActive, { borderBottomColor: theme.primary }]]}
          onPress={() => setActiveTab('notes')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'notes' ? theme.primary : theme.textSecondary }]}>
            📝 Notes ({notes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bookmarks' && [styles.tabActive, { borderBottomColor: theme.primary }]]}
          onPress={() => setActiveTab('bookmarks')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'bookmarks' ? theme.primary : theme.textSecondary }]}>
            🔗 Bookmarks ({bookmarks.length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LibraryScreenSkeleton />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {activeTab === 'notes' ? (
            notes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📝</Text>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Notes Yet</Text>
                <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                  Save your study notes and quick thoughts here
                </Text>
              </View>
            ) : (
              notes.map(note => (
                <TouchableOpacity
                  key={note.id}
                  style={[styles.noteCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                  onPress={() => openEditNote(note)}
                  onLongPress={() => deleteNote(note.id)}
                >
                  <View style={styles.noteHeader}>
                    <Text style={[styles.noteTitle, { color: theme.text }]}>{note.title}</Text>
                    <Text style={[styles.noteDate, { color: theme.textTertiary }]}>{formatDate(note.updated_at)}</Text>
                  </View>
                  {note.content ? (
                    <Text style={[styles.notePreview, { color: theme.textSecondary }]} numberOfLines={2}>
                      {note.content}
                    </Text>
                  ) : null}
                  {note.subject ? (
                    <View style={[styles.subjectBadge, { backgroundColor: theme.primary + '14' }]}>
                      <Text style={[styles.subjectBadgeText, { color: theme.primary }]}>{note.subject}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))
            )
          ) : (
            bookmarks.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔗</Text>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Bookmarks Yet</Text>
                <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                  Save useful links and resources here
                </Text>
              </View>
            ) : (
              bookmarks.map(bm => (
                <TouchableOpacity
                  key={bm.id}
                  style={[styles.noteCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                  onPress={() => Linking.openURL(bm.url)}
                  onLongPress={() => deleteBookmark(bm.id)}
                >
                  <View style={styles.noteHeader}>
                    <Text style={[styles.noteTitle, { color: theme.text }]}>{bm.title}</Text>
                    <Text style={[styles.noteDate, { color: theme.textTertiary }]}>{formatDate(bm.created_at)}</Text>
                  </View>
                  <Text style={[styles.notePreview, { color: theme.primary }]} numberOfLines={1}>
                    🌐 {bm.url}
                  </Text>
                  {bm.subject ? (
                    <View style={[styles.subjectBadge, { backgroundColor: theme.primary + '14' }]}>
                      <Text style={[styles.subjectBadgeText, { color: theme.primary }]}>{bm.subject}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))
            )
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => {
          if (activeTab === 'notes') {
            resetNoteForm();
            setShowNoteModal(true);
          } else {
            resetBookmarkForm();
            setShowBookmarkModal(true);
          }
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Note Modal */}
      <Modal visible={showNoteModal} animationType="slide" transparent onRequestClose={() => setShowNoteModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{editingNote ? 'Edit Note' : 'New Note'}</Text>
              <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                <Text style={[styles.modalClose, { color: theme.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.modalInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
              placeholder="Note title"
              placeholderTextColor={theme.textTertiary}
              value={noteTitle}
              onChangeText={setNoteTitle}
            />
            <TextInput
              style={[styles.modalInput, styles.modalTextArea, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
              placeholder="Write your note..."
              placeholderTextColor={theme.textTertiary}
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
              textAlignVertical="top"
            />
            <TextInput
              style={[styles.modalInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
              placeholder="Subject (optional)"
              placeholderTextColor={theme.textTertiary}
              value={noteSubject}
              onChangeText={setNoteSubject}
            />
            <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: theme.primary }]} onPress={saveNote}>
              <Text style={styles.modalSaveBtnText}>{editingNote ? 'Update' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bookmark Modal */}
      <Modal visible={showBookmarkModal} animationType="slide" transparent onRequestClose={() => setShowBookmarkModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add Bookmark</Text>
              <TouchableOpacity onPress={() => setShowBookmarkModal(false)}>
                <Text style={[styles.modalClose, { color: theme.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.modalInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
              placeholder="Title"
              placeholderTextColor={theme.textTertiary}
              value={bookmarkTitle}
              onChangeText={setBookmarkTitle}
            />
            <TextInput
              style={[styles.modalInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
              placeholder="URL (https://...)"
              placeholderTextColor={theme.textTertiary}
              value={bookmarkUrl}
              onChangeText={setBookmarkUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <TextInput
              style={[styles.modalInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
              placeholder="Subject (optional)"
              placeholderTextColor={theme.textTertiary}
              value={bookmarkSubject}
              onChangeText={setBookmarkSubject}
            />
            <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: theme.primary }]} onPress={saveBookmark}>
              <Text style={styles.modalSaveBtnText}>Save Bookmark</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backIcon: { fontSize: 22, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  tabRow: { flexDirection: 'row' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  noteCard: { borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 12 },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  noteTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  noteDate: { fontSize: 11, marginLeft: 8 },
  notePreview: { fontSize: 13, lineHeight: 19 },
  subjectBadge: { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  subjectBadgeText: { fontSize: 11, fontWeight: '600' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  fabText: { fontSize: 28, color: '#FFF', fontWeight: '300', marginTop: -2 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalClose: { fontSize: 20, padding: 4 },
  modalInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 12 },
  modalTextArea: { minHeight: 100, maxHeight: 200 },
  modalSaveBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  modalSaveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});

export default LibraryScreen;
