import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { auth, db } from '../firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  query,
  where,
  getDocs,
  addDoc,
} from 'firebase/firestore';

type GroupStudyScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'GroupStudy'>;
};

interface StudyGroup {
  id: string;
  name: string;
  subject: string;
  code: string;
  createdBy: string;
  creatorName: string;
  members: GroupMember[];
  checklist: ChecklistItem[];
  createdAt: any;
  nextSession?: {
    date: string;
    time: string;
    topic: string;
  };
}

interface GroupMember {
  uid: string;
  name: string;
  joinedAt: any;
}

interface ChecklistItem {
  id: string;
  topic: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: any;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: any;
}

const GroupStudyScreen: React.FC<GroupStudyScreenProps> = ({ navigation }) => {
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);

  // Create Group Form
  const [groupName, setGroupName] = useState('');
  const [groupSubject, setGroupSubject] = useState('');

  // Join Group Form
  const [joinCode, setJoinCode] = useState('');

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const user = auth.currentUser;
  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Electronics', 'English', 'Other'];

  useEffect(() => {
    loadMyGroups();
  }, [user]);

  const loadMyGroups = () => {
    if (!user) return;

    const groupsRef = collection(db, 'studyGroups');
    const unsubscribe = onSnapshot(groupsRef, (snapshot) => {
      const groups: StudyGroup[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as StudyGroup;
        // Check if current user is a member
        if (data.members.some(m => m.uid === user.uid)) {
          groups.push({ id: doc.id, ...data });
        }
      });
      setMyGroups(groups.sort((a, b) => b.createdAt - a.createdAt));
    });

    return unsubscribe;
  };

  const generateGroupCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createGroup = async () => {
    if (!groupName.trim() || !groupSubject.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userName = userDoc.exists() ? userDoc.data().name : user.displayName || 'Anonymous';

      const groupCode = generateGroupCode();
      const newGroup: Omit<StudyGroup, 'id'> = {
        name: groupName,
        subject: groupSubject,
        code: groupCode,
        createdBy: user.uid,
        creatorName: userName,
        members: [{
          uid: user.uid,
          name: userName,
          joinedAt: serverTimestamp(),
        }],
        checklist: [
          { id: '1', topic: 'Introduction & Basics', completed: false },
          { id: '2', topic: 'Core Concepts', completed: false },
          { id: '3', topic: 'Advanced Topics', completed: false },
          { id: '4', topic: 'Practice Problems', completed: false },
          { id: '5', topic: 'Revision & Summary', completed: false },
        ],
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'studyGroups'), newGroup);

      Alert.alert('Success! 🎉', `Group created!\nShare this code with friends:\n\n${groupCode}`, [
        { text: 'Share Code', onPress: () => shareGroupCode(groupCode) },
        { text: 'OK' }
      ]);

      setGroupName('');
      setGroupSubject('');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    }
  };

  const joinGroup = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter a group code');
      return;
    }

    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userName = userDoc.exists() ? userDoc.data().name : user.displayName || 'Anonymous';

      const groupsRef = collection(db, 'studyGroups');
      const q = query(groupsRef, where('code', '==', joinCode.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert('Error', 'Invalid group code. Please check and try again.');
        return;
      }

      const groupDoc = querySnapshot.docs[0];
      const groupData = groupDoc.data() as StudyGroup;

      // Check if already a member
      if (groupData.members.some(m => m.uid === user.uid)) {
        Alert.alert('Info', 'You are already a member of this group!');
        setShowJoinModal(false);
        return;
      }

      // Add user to group
      await updateDoc(doc(db, 'studyGroups', groupDoc.id), {
        members: arrayUnion({
          uid: user.uid,
          name: userName,
          joinedAt: serverTimestamp(),
        }),
      });

      Alert.alert('Success! 🎉', `You joined "${groupData.name}"!`);
      setJoinCode('');
      setShowJoinModal(false);
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'Failed to join group. Please try again.');
    }
  };

  const shareGroupCode = async (code: string) => {
    try {
      await Share.share({
        message: `Join my study group on KTUfy!\n\nGroup Code: ${code}\n\nOpen KTUfy app → Group Study → Join with Code`,
      });
    } catch (error) {
      console.error('Error sharing code:', error);
    }
  };

  const leaveGroup = async (groupId: string, groupName: string) => {
    if (!user) return;

    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${groupName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const groupRef = doc(db, 'studyGroups', groupId);
              const groupDoc = await getDoc(groupRef);
              const groupData = groupDoc.data() as StudyGroup;

              const updatedMembers = groupData.members.filter(m => m.uid !== user.uid);

              await updateDoc(groupRef, {
                members: updatedMembers,
              });

              Alert.alert('Success', 'You left the group');
            } catch (error) {
              console.error('Error leaving group:', error);
              Alert.alert('Error', 'Failed to leave group');
            }
          },
        },
      ]
    );
  };

  const toggleChecklistItem = async (groupId: string, itemId: string) => {
    if (!user) return;

    try {
      const groupRef = doc(db, 'studyGroups', groupId);
      const groupDoc = await getDoc(groupRef);
      const groupData = groupDoc.data() as StudyGroup;

      const updatedChecklist = groupData.checklist.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            completed: !item.completed,
            completedBy: !item.completed ? user.uid : undefined,
            completedAt: !item.completed ? serverTimestamp() : undefined,
          };
        }
        return item;
      });

      await updateDoc(groupRef, {
        checklist: updatedChecklist,
      });
    } catch (error) {
      console.error('Error updating checklist:', error);
    }
  };

  const openChat = (group: StudyGroup) => {
    setSelectedGroup(group);
    setShowChatModal(true);
    loadChatMessages(group.id);
  };

  const loadChatMessages = (groupId: string) => {
    const chatRef = collection(db, 'studyGroups', groupId, 'chat');
    const unsubscribe = onSnapshot(chatRef, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setChatMessages(messages.sort((a, b) => a.timestamp - b.timestamp));
    });

    return unsubscribe;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedGroup || !user) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userName = userDoc.exists() ? userDoc.data().name : user.displayName || 'Anonymous';

      const chatRef = collection(db, 'studyGroups', selectedGroup.id, 'chat');
      await addDoc(chatRef, {
        senderId: user.uid,
        senderName: userName,
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getChecklistProgress = (checklist: ChecklistItem[]) => {
    const completed = checklist.filter(item => item.completed).length;
    const total = checklist.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👥 Group Study</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.createButtonText}>➕ Create Group</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => setShowJoinModal(true)}
          >
            <Text style={styles.joinButtonText}>🔗 Join with Code</Text>
          </TouchableOpacity>
        </View>

        {/* My Groups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Study Groups ({myGroups.length})</Text>

          {myGroups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📚</Text>
              <Text style={styles.emptyStateText}>No study groups yet</Text>
              <Text style={styles.emptyStateDesc}>Create or join a group to start collaborative learning!</Text>
            </View>
          ) : (
            myGroups.map((group) => {
              const progress = getChecklistProgress(group.checklist);
              return (
                <View key={group.id} style={styles.groupCard}>
                  <View style={styles.groupHeader}>
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <Text style={styles.groupSubject}>{group.subject}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.shareButton}
                      onPress={() => shareGroupCode(group.code)}
                    >
                      <Text style={styles.shareButtonText}>📤</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.groupMeta}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Code:</Text>
                      <Text style={styles.metaValue}>{group.code}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Members:</Text>
                      <Text style={styles.metaValue}>{group.members.length}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Progress:</Text>
                      <Text style={styles.metaValue}>{progress.percentage}%</Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress.percentage}%` }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {progress.completed}/{progress.total} topics completed
                  </Text>

                  {/* Checklist Preview */}
                  <View style={styles.checklistPreview}>
                    {group.checklist.slice(0, 3).map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.checklistItem}
                        onPress={() => toggleChecklistItem(group.id, item.id)}
                      >
                        <Text style={styles.checkbox}>
                          {item.completed ? '✅' : '⬜'}
                        </Text>
                        <Text style={[styles.checklistText, item.completed && styles.checklistTextCompleted]}>
                          {item.topic}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {group.checklist.length > 3 && (
                      <Text style={styles.moreItems}>+{group.checklist.length - 3} more items</Text>
                    )}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.groupActions}>
                    <TouchableOpacity
                      style={styles.chatButton}
                      onPress={() => openChat(group)}
                    >
                      <Text style={styles.chatButtonText}>💬 Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.leaveButton}
                      onPress={() => leaveGroup(group.id, group.name)}
                    >
                      <Text style={styles.leaveButtonText}>Leave</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Next Session */}
                  {group.nextSession && (
                    <View style={styles.sessionCard}>
                      <Text style={styles.sessionTitle}>📅 Next Session</Text>
                      <Text style={styles.sessionText}>
                        {group.nextSession.date} at {group.nextSession.time}
                      </Text>
                      <Text style={styles.sessionTopic}>Topic: {group.nextSession.topic}</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Group Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Study Group</Text>

            <Text style={styles.inputLabel}>Group Name</Text>
            <TextInput
              style={styles.input}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="e.g., Data Structures Study Group"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Subject</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectScroll}>
              {subjects.map((subject) => (
                <TouchableOpacity
                  key={subject}
                  style={[styles.subjectChip, groupSubject === subject && styles.subjectChipActive]}
                  onPress={() => setGroupSubject(subject)}
                >
                  <Text style={[styles.subjectChipText, groupSubject === subject && styles.subjectChipTextActive]}>
                    {subject}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCreateButton}
                onPress={createGroup}
              >
                <Text style={styles.modalCreateButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Group Modal */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join Study Group</Text>

            <Text style={styles.inputLabel}>Enter Group Code</Text>
            <TextInput
              style={styles.input}
              value={joinCode}
              onChangeText={setJoinCode}
              placeholder="e.g., ABC123"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              maxLength={6}
            />

            <Text style={styles.hintText}>
              Ask your friend for the 6-character group code
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowJoinModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCreateButton}
                onPress={joinGroup}
              >
                <Text style={styles.modalCreateButtonText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Chat Modal */}
      <Modal
        visible={showChatModal}
        animationType="slide"
        onRequestClose={() => setShowChatModal(false)}
      >
        <SafeAreaView style={styles.chatContainer} edges={['top', 'bottom']}>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setShowChatModal(false)}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatHeaderTitle}>{selectedGroup?.name}</Text>
              <Text style={styles.chatHeaderSubtitle}>
                {selectedGroup?.members.length} members
              </Text>
            </View>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.chatMessages}>
            {chatMessages.length === 0 ? (
              <View style={styles.emptyChatState}>
                <Text style={styles.emptyChatIcon}>💬</Text>
                <Text style={styles.emptyChatText}>No messages yet</Text>
                <Text style={styles.emptyChatDesc}>Start the conversation!</Text>
              </View>
            ) : (
              chatMessages.map((msg) => {
                const isMyMessage = msg.senderId === user?.uid;
                return (
                  <View
                    key={msg.id}
                    style={[styles.messageContainer, isMyMessage && styles.myMessageContainer]}
                  >
                    <View style={[styles.messageBubble, isMyMessage && styles.myMessageBubble]}>
                      {!isMyMessage && (
                        <Text style={styles.messageSender}>{msg.senderName}</Text>
                      )}
                      <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
                        {msg.message}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          <View style={styles.chatInput}>
            <TextInput
              style={styles.chatInputField}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!newMessage.trim()}
            >
              <Text style={styles.sendButtonText}>➤</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  scrollView: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  createButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  joinButton: {
    flex: 1,
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#F8FAFC',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyStateDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  groupCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  groupSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  shareButton: {
    backgroundColor: '#E0E7FF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 20,
  },
  groupMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  checklistPreview: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    fontSize: 18,
    marginRight: 8,
  },
  checklistText: {
    fontSize: 14,
    color: '#1E293B',
    flex: 1,
  },
  checklistTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  moreItems: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
    marginTop: 4,
  },
  groupActions: {
    flexDirection: 'row',
    gap: 8,
  },
  chatButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  leaveButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  leaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  sessionCard: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  sessionText: {
    fontSize: 13,
    color: '#78350F',
    marginBottom: 2,
  },
  sessionTopic: {
    fontSize: 13,
    color: '#78350F',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 16,
  },
  subjectScroll: {
    marginBottom: 20,
  },
  subjectChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subjectChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  subjectChipText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  subjectChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  modalCreateButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
  },
  modalCreateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  chatHeaderInfo: {
    flex: 1,
    alignItems: 'center',
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  chatHeaderSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  chatMessages: {
    flex: 1,
    padding: 16,
  },
  emptyChatState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyChatIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyChatText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyChatDesc: {
    fontSize: 14,
    color: '#64748B',
  },
  messageContainer: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  myMessageBubble: {
    backgroundColor: '#6366F1',
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  chatInput: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
    alignItems: 'flex-end',
  },
  chatInputField: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#6366F1',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  sendButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
});

export default GroupStudyScreen;
