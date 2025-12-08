import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatbotScreenNavigationProp } from '../types/navigation';
import {
  sendChatMessage,
  getChatSessions,
  getChatSession,
  createChatSession,
  updateChatSession,
  deleteChatSession,
  ChatMessage as BackendChatMessage,
  ChatSession,
} from '../services/chatService';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatbotScreenProps {
  navigation: ChatbotScreenNavigationProp;
}

const ChatbotScreen: React.FC<ChatbotScreenProps> = ({ navigation }) => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputText, setInputText] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentSessionId, setCurrentSessionId] = React.useState<string | null>(null);
  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [showSidebar, setShowSidebar] = React.useState(false);
  const [editingSessionId, setEditingSessionId] = React.useState<string | null>(null);
  const [editingTitle, setEditingTitle] = React.useState('');
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Load chat sessions on mount
  React.useEffect(() => {
    loadChatSessions();
  }, []);

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Show welcome message
  const showWelcomeMessage = () => {
    setMessages([
      {
        id: 'welcome',
        text: 'Hello! 👋 I\'m your AI Study Assistant powered by advanced AI.\n\nI can help you with:\n\n📚 Summarizing study modules\n❓ Explaining complex concepts\n📝 Creating study notes\n💡 Answering questions\n🎯 Exam preparation\n\nWhat would you like to learn today?',
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  };

  // Load all chat sessions
  const loadChatSessions = async () => {
    try {
      setIsLoading(true);
      const sessionList = await getChatSessions();
      setSessions(sessionList);
      
      // If there are sessions, load the most recent one
      if (sessionList.length > 0) {
        const latestSession = sessionList[0];
        await loadChatSession(latestSession.id);
      } else {
        // Show welcome message if no sessions
        showWelcomeMessage();
      }
    } catch (err: any) {
      console.error('Error loading chat sessions:', err);
      showWelcomeMessage();
    } finally {
      setIsLoading(false);
    }
  };

  // Load a specific chat session
  const loadChatSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const session = await getChatSession(sessionId);
      setCurrentSessionId(sessionId);
      
      // Convert backend messages to UI format
      const convertedMessages: Message[] = session.messages.map((msg) => ({
        id: msg.id,
        text: msg.content,
        isUser: msg.role === 'user',
        timestamp: new Date(msg.created_at),
      }));
      
      setMessages(convertedMessages.length > 0 ? convertedMessages : []);
      setShowSidebar(false); // Close sidebar after selecting session
    } catch (err: any) {
      console.error('Error loading chat session:', err);
      setError('Failed to load chat session');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new chat
  const handleNewChat = async () => {
    try {
      setCurrentSessionId(null);
      setMessages([]);
      showWelcomeMessage();
      setShowSidebar(false);
    } catch (err: any) {
      console.error('Error creating new chat:', err);
      Alert.alert('Error', 'Failed to create new chat');
    }
  };

  // Send message
  const handleSend = async () => {
    if (!inputText.trim() || isTyping) return;

    const messageText = inputText.trim();
    setInputText('');
    setError(null);

    // Add user message immediately (optimistic update)
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Send message to backend
      const response = await sendChatMessage(messageText, currentSessionId || undefined);
      
      // Update session ID if it's a new session
      if (!currentSessionId && response.session_id) {
        setCurrentSessionId(response.session_id);
        // Reload sessions to include the new one
        loadChatSessions();
      }

      // Remove the temporary user message and add real messages from backend
      setMessages(prev => {
        // Remove temp message
        const withoutTemp = prev.filter(m => m.id !== userMessage.id);
        
        // Add real user message and AI response
        return [
          ...withoutTemp,
          {
            id: response.message.id,
            text: response.message.content,
            isUser: true,
            timestamp: new Date(response.message.created_at),
          },
          {
            id: response.assistant_message.id,
            text: response.assistant_message.content,
            isUser: false,
            timestamp: new Date(response.assistant_message.created_at),
          },
        ];
      });

    } catch (err: any) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      
      // Remove the temporary message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      
      // Restore input text so user can retry
      setInputText(messageText);
    } finally {
      setIsTyping(false);
    }
  };

  // Delete session
  const handleDeleteSession = async (sessionId: string) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChatSession(sessionId);
              
              // If we're deleting the current session, create a new one
              if (currentSessionId === sessionId) {
                handleNewChat();
              }
              
              // Reload sessions
              await loadChatSessions();
            } catch (err: any) {
              console.error('Error deleting session:', err);
              Alert.alert('Error', 'Failed to delete chat');
            }
          },
        },
      ]
    );
  };

  // Start editing session title
  const startEditingTitle = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  // Save session title
  const saveSessionTitle = async (sessionId: string) => {
    if (!editingTitle.trim()) {
      setEditingSessionId(null);
      return;
    }

    try {
      await updateChatSession(sessionId, editingTitle.trim());
      
      // Update local sessions list
      setSessions(prev =>
        prev.map(s => (s.id === sessionId ? { ...s, title: editingTitle.trim() } : s))
      );
      
      setEditingSessionId(null);
    } catch (err: any) {
      console.error('Error updating session title:', err);
      Alert.alert('Error', 'Failed to update chat title');
    }
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Format session date
  const formatSessionDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Group sessions by date
  const groupedSessions = React.useMemo(() => {
    const groups: { [key: string]: ChatSession[] } = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      'Previous 30 Days': [],
      Older: [],
    };

    sessions.forEach(session => {
      const date = new Date(session.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) groups.Today.push(session);
      else if (diffDays === 1) groups.Yesterday.push(session);
      else if (diffDays < 7) groups['Previous 7 Days'].push(session);
      else if (diffDays < 30) groups['Previous 30 Days'].push(session);
      else groups.Older.push(session);
    });

    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) delete groups[key];
    });

    return groups;
  }, [sessions]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowSidebar(true)}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {/* Removed title text to match ChatGPT */}
        </View>
        <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
          <Text style={styles.newChatIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={styles.errorClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messages Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading && messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#19C37D" />
            <Text style={styles.loadingText}>Loading chat history...</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message, index) => (
              <View
                key={message.id}
                style={[
                  styles.messageRow,
                  message.isUser ? styles.userMessageRow : styles.aiMessageRow,
                ]}
              >
                {/* Avatar */}
                <View
                  style={[
                    styles.avatar,
                    message.isUser ? styles.userAvatar : styles.aiAvatar,
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {message.isUser ? '👤' : '🤖'}
                  </Text>
                </View>

                {/* Message Content */}
                <View style={styles.messageContent}>
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageSender}>
                      {message.isUser ? 'You' : 'AI Assistant'}
                    </Text>
                    <Text style={styles.messageTime}>
                      {formatTime(message.timestamp)}
                    </Text>
                  </View>
                  <Text style={styles.messageText}>{message.text}</Text>
                </View>
              </View>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <View style={[styles.messageRow, styles.aiMessageRow]}>
                <View style={[styles.avatar, styles.aiAvatar]}>
                  <Text style={styles.avatarText}>🤖</Text>
                </View>
                <View style={styles.messageContent}>
                  <View style={styles.typingIndicator}>
                    <View style={styles.typingDot} />
                    <View style={[styles.typingDot, styles.typingDotDelay1]} />
                    <View style={[styles.typingDot, styles.typingDotDelay2]} />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Send a message..."
              placeholderTextColor="#8e8ea0"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
              editable={!isTyping}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isTyping) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isTyping}
            >
              <Text style={styles.sendButtonText}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Sidebar Modal */}
      <Modal
        visible={showSidebar}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSidebar(false)}
      >
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity
            style={styles.sidebarBackdrop}
            activeOpacity={1}
            onPress={() => setShowSidebar(false)}
          />
          <View style={styles.sidebar}>
            {/* Sidebar Header */}
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Chat History</Text>
              <TouchableOpacity onPress={() => setShowSidebar(false)}>
                <Text style={styles.sidebarClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* New Chat Button */}
            <TouchableOpacity
              style={styles.sidebarNewChat}
              onPress={handleNewChat}
            >
              <Text style={styles.sidebarNewChatIcon}>+</Text>
              <Text style={styles.sidebarNewChatText}>New Chat</Text>
            </TouchableOpacity>

            {/* Sessions List */}
            <ScrollView
              style={styles.sessionsList}
              showsVerticalScrollIndicator={false}
            >
              {Object.entries(groupedSessions).map(([group, groupSessions]) => (
                <View key={group} style={styles.sessionGroup}>
                  <Text style={styles.sessionGroupTitle}>{group}</Text>
                  {groupSessions.map(session => (
                    <View key={session.id} style={styles.sessionItem}>
                      {editingSessionId === session.id ? (
                        <View style={styles.sessionEditContainer}>
                          <TextInput
                            style={styles.sessionEditInput}
                            value={editingTitle}
                            onChangeText={setEditingTitle}
                            onBlur={() => saveSessionTitle(session.id)}
                            onSubmitEditing={() => saveSessionTitle(session.id)}
                            autoFocus
                          />
                        </View>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={[
                              styles.sessionButton,
                              currentSessionId === session.id &&
                                styles.sessionButtonActive,
                            ]}
                            onPress={() => loadChatSession(session.id)}
                          >
                            <Text
                              style={[
                                styles.sessionTitle,
                                currentSessionId === session.id &&
                                  styles.sessionTitleActive,
                              ]}
                              numberOfLines={1}
                            >
                              {session.title}
                            </Text>
                            <Text style={styles.sessionDate}>
                              {formatSessionDate(session.created_at)}
                            </Text>
                          </TouchableOpacity>
                          <View style={styles.sessionActions}>
                            <TouchableOpacity
                              style={styles.sessionActionButton}
                              onPress={() => startEditingTitle(session)}
                            >
                              <Text style={styles.sessionActionIcon}>✏️</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.sessionActionButton}
                              onPress={() => handleDeleteSession(session.id)}
                            >
                              <Text style={styles.sessionActionIcon}>🗑️</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </View>
                  ))}
                </View>
              ))}

              {sessions.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No chat history yet.{'\n'}Start a conversation!
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#ececf1',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  menuIcon: {
    fontSize: 20,
    color: '#2d2d2d',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  newChatButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  newChatIcon: {
    fontSize: 18,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#991b1b',
    fontSize: 14,
    flex: 1,
  },
  errorClose: {
    color: '#991b1b',
    fontSize: 18,
    fontWeight: 'bold',
    paddingLeft: 12,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b6b7b',
    fontSize: 14,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'flex-start',
  },
  userMessageRow: {
    backgroundColor: '#ffffff',
  },
  aiMessageRow: {
    backgroundColor: '#f7f7f8',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userAvatar: {
    backgroundColor: '#19c37d',
  },
  aiAvatar: {
    backgroundColor: '#ab68ff',
  },
  avatarText: {
    fontSize: 16,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d2d2d',
  },
  messageTime: {
    fontSize: 12,
    color: '#8e8ea0',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#2d2d2d',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8e8ea0',
    marginRight: 6,
    opacity: 0.4,
  },
  typingDotDelay1: {
    opacity: 0.6,
  },
  typingDotDelay2: {
    opacity: 0.8,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#ececf1',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f4f4f4',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#2d2d2d',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2d2d2d',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d1d6',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sidebarOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebarBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sidebar: {
    width: width * 0.8,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ececf1',
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d2d2d',
  },
  sidebarClose: {
    fontSize: 24,
    color: '#6b6b7b',
  },
  sidebarNewChat: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#ececf1',
  },
  sidebarNewChatIcon: {
    fontSize: 20,
    color: '#2d2d2d',
    marginRight: 12,
  },
  sidebarNewChatText: {
    fontSize: 15,
    color: '#2d2d2d',
    fontWeight: '500',
  },
  sessionsList: {
    flex: 1,
  },
  sessionGroup: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  sessionGroupTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8e8ea0',
    paddingHorizontal: 20,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  sessionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  sessionButtonActive: {
    backgroundColor: '#ececf1',
  },
  sessionTitle: {
    fontSize: 14,
    color: '#2d2d2d',
    marginBottom: 2,
  },
  sessionTitleActive: {
    fontWeight: '500',
  },
  sessionDate: {
    fontSize: 12,
    color: '#8e8ea0',0
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 4,
  },
  sessionActionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  sessionActionIcon: {
    fontSize: 14,
  },
  sessionEditContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  sessionEditInput: {
    fontSize: 14,
    color: '#2d2d2d',
    backgroundColor: '#f4f4f4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#19c37d',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8e8ea0',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ChatbotScreen;
