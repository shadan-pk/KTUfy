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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ChatbotScreenNavigationProp, RootStackParamList } from '../types/navigation';
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

// ─── Theme Variables ──────────────────────────────────────────────
const COLORS = {
  bgPrimary: '#0A0A1A',
  bgSecondary: '#0D1117',
  bgTertiary: '#161B22',
  surface: '#1C2333',
  surfaceLight: '#21283B',
  accent: '#818CF8',
  accentDim: 'rgba(129, 140, 248, 0.15)',
  accentBorder: 'rgba(129, 140, 248, 0.3)',
  userBubble: '#2D3A8C',
  userBubbleBorder: 'rgba(129, 140, 248, 0.2)',
  aiBubble: '#161B22',
  aiBubbleBorder: 'rgba(71, 85, 105, 0.3)',
  textPrimary: '#E6EDF3',
  textSecondary: '#8B949E',
  textMuted: '#484F58',
  inputBg: '#161B22',
  inputBorder: 'rgba(71, 85, 105, 0.4)',
  headerBg: 'rgba(10, 10, 26, 0.95)',
  headerBorder: 'rgba(71, 85, 105, 0.2)',
  error: '#F87171',
  errorBg: 'rgba(248, 113, 113, 0.1)',
  white: '#FFFFFF',
  sidebarBg: '#0D1117',
  sidebarBorder: 'rgba(71, 85, 105, 0.3)',
  activeSession: 'rgba(129, 140, 248, 0.1)',
};

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
  const route = useRoute<RouteProp<RootStackParamList, 'Chatbot'>>();
  const initialPrompt = route.params?.initialPrompt;

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
  const [initialPromptSent, setInitialPromptSent] = React.useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Load chat sessions on mount
  React.useEffect(() => {
    loadChatSessions();
  }, []);

  // Handle initial prompt from HomeScreen
  React.useEffect(() => {
    if (initialPrompt && !initialPromptSent && !isLoading) {
      setInitialPromptSent(true);
      // Small delay to let the UI render first
      setTimeout(() => {
        sendMessage(initialPrompt);
      }, 500);
    }
  }, [initialPrompt, initialPromptSent, isLoading]);

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const showWelcomeMessage = () => {
    const backendStatus = process.env.API_BASE_URL && process.env.API_BASE_URL !== 'undefined' ?
      '' : ' (Currently in offline mode)';

    setMessages([
      {
        id: 'welcome',
        text: `Hello! 👋 I'm your AI Study Assistant${backendStatus}.\n\nI can help you with:\n\n📚 Study guidance and tips\n❓ Explaining academic concepts\n📝 Creating study plans\n💡 Answering educational questions\n🎯 Exam preparation strategies\n💻 Programming and technical topics\n📊 KTU university guidance\n\nWhat would you like to learn about today?`,
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  };

  const loadChatSessions = async () => {
    try {
      setIsLoading(true);
      if (process.env.API_BASE_URL && process.env.API_BASE_URL !== 'undefined') {
        const sessionList = await getChatSessions();
        setSessions(sessionList);
        if (sessionList.length > 0 && !initialPrompt) {
          const latestSession = sessionList[0];
          await loadChatSession(latestSession.id);
        } else {
          showWelcomeMessage();
        }
      } else {
        showWelcomeMessage();
      }
    } catch (err: any) {
      console.error('Error loading chat sessions:', err);
      showWelcomeMessage();
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const session = await getChatSession(sessionId);
      setCurrentSessionId(sessionId);
      const convertedMessages: Message[] = session.messages.map((msg) => ({
        id: msg.id,
        text: msg.content,
        isUser: msg.role === 'user',
        timestamp: new Date(msg.created_at),
      }));
      setMessages(convertedMessages.length > 0 ? convertedMessages : []);
      setShowSidebar(false);
    } catch (err: any) {
      console.error('Error loading chat session:', err);
      setError('Failed to load chat session');
    } finally {
      setIsLoading(false);
    }
  };

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

  // Local fallback chatbot responses
  const generateLocalResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! 👋 I'm your AI Study Assistant. I'm currently running in offline mode. I can still help you with study questions, explanations, and academic guidance. What would you like to learn about today?";
    }
    if (lowerMessage.includes('ktu') || lowerMessage.includes('university')) {
      return "I can help you with KTU (Kerala Technological University) related queries! This includes syllabus questions, exam patterns, study materials, and academic guidance. What specific topic would you like to explore?";
    }
    if (lowerMessage.includes('exam') || lowerMessage.includes('test')) {
      return "📝 For exam preparation, I recommend:\n\n• Review your syllabus thoroughly\n• Practice previous year questions\n• Create summary notes\n• Form study groups\n• Take regular breaks\n\nWhat subject are you preparing for?";
    }
    if (lowerMessage.includes('study') || lowerMessage.includes('learn')) {
      return "📚 Here are some effective study techniques:\n\n• Active recall - Test yourself frequently\n• Spaced repetition - Review at intervals\n• Pomodoro technique - 25min focused study sessions\n• Mind mapping - Visual organization of concepts\n• Teaching others - Explain concepts to solidify understanding\n\nWhich technique interests you most?";
    }
    if (lowerMessage.includes('programming') || lowerMessage.includes('coding')) {
      return "💻 For programming success:\n\n• Practice coding daily\n• Understand concepts before memorizing syntax\n• Work on projects to apply knowledge\n• Debug systematically\n• Read others' code for learning\n\nWhat programming language are you learning?";
    }
    if (lowerMessage.includes('math') || lowerMessage.includes('mathematics')) {
      return "🔢 Mathematics study tips:\n\n• Practice problems daily\n• Understand the 'why' behind formulas\n• Work step by step\n• Check your answers\n• Learn from mistakes\n\nWhich math topic are you working on?";
    }
    if (lowerMessage.includes('time management') || lowerMessage.includes('schedule')) {
      return "⏰ Time management for students:\n\n• Create a daily schedule\n• Prioritize important tasks\n• Break large tasks into smaller ones\n• Use time-blocking\n• Include breaks and relaxation\n\nWould you like help creating a study schedule?";
    }
    return `I understand you're asking about "${userMessage}". While I'm currently in offline mode, I can offer some general guidance:\n\n• Break down complex topics into smaller parts\n• Use multiple learning resources\n• Practice regularly\n• Ask specific questions\n• Connect concepts to real-world examples\n\nCould you provide more details about what specific help you need?`;
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isTyping) return;
    setError(null);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: messageText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      if (process.env.API_BASE_URL && process.env.API_BASE_URL !== 'undefined') {
        const response = await sendChatMessage(messageText, currentSessionId || undefined);
        if (!currentSessionId && response.session_id) {
          setCurrentSessionId(response.session_id);
          loadChatSessions();
        }
        const aiMessage: Message = {
          id: response.assistant_message.id,
          text: response.assistant_message.content,
          isUser: false,
          timestamp: new Date(response.assistant_message.created_at),
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Backend not available');
      }
    } catch (err: any) {
      console.error('Backend error, using local fallback:', err);
      setTimeout(() => {
        const aiResponse = generateLocalResponse(messageText);
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          text: aiResponse,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(false);
      }, 1000);
      return;
    }
    setIsTyping(false);
  };

  const handleSend = async () => {
    if (!inputText.trim() || isTyping) return;
    const messageText = inputText.trim();
    setInputText('');
    await sendMessage(messageText);
  };

  const handleDeleteSession = async (sessionId: string) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChatSession(sessionId);
              if (currentSessionId === sessionId) handleNewChat();
              await loadChatSessions();
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete chat');
            }
          },
        },
      ]
    );
  };

  const startEditingTitle = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const saveSessionTitle = async (sessionId: string) => {
    if (!editingTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    try {
      await updateChatSession(sessionId, editingTitle.trim());
      setSessions(prev =>
        prev.map(s => (s.id === sessionId ? { ...s, title: editingTitle.trim() } : s))
      );
      setEditingSessionId(null);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update chat title');
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatSessionDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) delete groups[key];
    });
    return groups;
  }, [sessions]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />

      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.headerButtonIcon}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSidebar(true)}
          >
            <Text style={styles.headerButtonIcon}>☰</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>KTUfy AI</Text>
            <View style={styles.statusDot} />
          </View>

          <TouchableOpacity style={styles.headerButton} onPress={handleNewChat}>
            <Text style={styles.headerButtonIcon}>+</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠ {error}</Text>
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
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.loadingText}>Loading chat...</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageRow,
                  message.isUser ? styles.userMessageRow : styles.aiMessageRow,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    message.isUser ? styles.userBubble : styles.aiBubble,
                  ]}
                >
                  {!message.isUser && (
                    <View style={styles.aiLabel}>
                      <View style={styles.aiDot} />
                      <Text style={styles.aiLabelText}>KTUfy AI</Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      message.isUser ? styles.userMessageText : styles.aiMessageText,
                    ]}
                  >
                    {message.text}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      message.isUser ? styles.userTimeText : styles.aiTimeText,
                    ]}
                  >
                    {formatTime(message.timestamp)}
                  </Text>
                </View>
              </View>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <View style={[styles.messageRow, styles.aiMessageRow]}>
                <View style={[styles.messageBubble, styles.aiBubble]}>
                  <View style={styles.aiLabel}>
                    <View style={styles.aiDot} />
                    <Text style={styles.aiLabelText}>KTUfy AI</Text>
                  </View>
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
            <TouchableOpacity style={styles.attachButton}>
              <Text style={styles.attachIcon}>📎</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Message KTUfy AI..."
              placeholderTextColor={COLORS.textMuted}
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
            <TouchableOpacity style={styles.sidebarNewChat} onPress={handleNewChat}>
              <Text style={styles.sidebarNewChatIcon}>+</Text>
              <Text style={styles.sidebarNewChatText}>New Chat</Text>
            </TouchableOpacity>

            {/* Sessions List */}
            <ScrollView style={styles.sessionsList} showsVerticalScrollIndicator={false}>
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
                              currentSessionId === session.id && styles.sessionButtonActive,
                            ]}
                            onPress={() => loadChatSession(session.id)}
                          >
                            <Text
                              style={[
                                styles.sessionTitle,
                                currentSessionId === session.id && styles.sessionTitleActive,
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
                              <Text style={styles.sessionActionIcon}>✎</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.sessionActionButton}
                              onPress={() => handleDeleteSession(session.id)}
                            >
                              <Text style={[styles.sessionActionIcon, { color: COLORS.error }]}>✕</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  // Header
  headerSafe: {
    backgroundColor: COLORS.headerBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.headerBorder,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  headerButtonIcon: {
    fontSize: 20,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#34D399',
    marginLeft: 8,
  },
  // Error
  errorBanner: {
    backgroundColor: COLORS.errorBg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    flex: 1,
  },
  errorClose: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: 'bold',
    paddingLeft: 12,
  },
  // Chat
  chatContainer: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  // Messages
  messageRow: {
    marginBottom: 12,
  },
  userMessageRow: {
    alignItems: 'flex-end',
  },
  aiMessageRow: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: COLORS.userBubble,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.userBubbleBorder,
  },
  aiBubble: {
    backgroundColor: COLORS.aiBubble,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.aiBubbleBorder,
  },
  aiLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  aiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    marginRight: 6,
  },
  aiLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent,
    letterSpacing: 0.3,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: COLORS.white,
  },
  aiMessageText: {
    color: COLORS.textPrimary,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 6,
  },
  userTimeText: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'right',
  },
  aiTimeText: {
    color: COLORS.textMuted,
  },
  // Typing indicator
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginRight: 5,
    opacity: 0.4,
  },
  typingDotDelay1: {
    opacity: 0.6,
  },
  typingDotDelay2: {
    opacity: 0.9,
  },
  // Input
  inputContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.headerBorder,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.inputBg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 6,
    paddingVertical: 4,
    maxHeight: 120,
  },
  attachButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  attachIcon: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    maxHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.surfaceLight,
  },
  sendButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  // Sidebar
  sidebarOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebarBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.78,
    backgroundColor: COLORS.sidebarBg,
    borderRightWidth: 1,
    borderRightColor: COLORS.sidebarBorder,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.sidebarBorder,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sidebarClose: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  sidebarNewChat: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    backgroundColor: COLORS.accentDim,
  },
  sidebarNewChatIcon: {
    fontSize: 18,
    color: COLORS.accent,
    marginRight: 10,
    fontWeight: '600',
  },
  sidebarNewChatText: {
    fontSize: 15,
    color: COLORS.accent,
    fontWeight: '600',
  },
  sessionsList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  sessionGroup: {
    marginBottom: 16,
  },
  sessionGroupTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 8,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
  },
  sessionButtonActive: {
    backgroundColor: COLORS.activeSession,
  },
  sessionTitle: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  sessionTitleActive: {
    color: COLORS.accent,
  },
  sessionDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sessionActions: {
    flexDirection: 'row',
  },
  sessionActionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  sessionActionIcon: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  sessionEditContainer: {
    flex: 1,
    padding: 4,
  },
  sessionEditInput: {
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ChatbotScreen;
