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
import { ChatbotScreenNavigationProp, ChatbotScreenRouteProp } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import {
  sendChatMessage,
  getChatSessions,
  getChatSession,
  updateChatSession,
  deleteChatSession,
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
  route: ChatbotScreenRouteProp;
}

interface ColorTokens {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  muted: string;
  primary: string;
  error: string;
  inputBackground: string;
  inputBorder: string;
  overlay: string;
  sidebarBackground: string;
  userBubble: string;
  aiBubble: string;
  userText: string;
  aiText: string;
  timestamp: string;
}

const ChatbotScreen: React.FC<ChatbotScreenProps> = ({ navigation, route }) => {
  const { theme, isDark } = useTheme();
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
  const initialPromptRef = React.useRef<string | null>(null);

  const colors = React.useMemo<ColorTokens>(() => {
    const cardBase = isDark ? '#050816' : theme.backgroundSecondary;
    return {
      background: theme.background,
      card: cardBase,
      cardBorder: isDark ? '#0F172A' : theme.border,
      text: isDark ? '#E5E7EB' : theme.text,
      muted: isDark ? '#94A3B8' : theme.textSecondary,
      primary: theme.primary,
      error: theme.error,
      inputBackground: isDark ? '#0F172A' : theme.background,
      inputBorder: isDark ? '#1F2937' : theme.border,
      overlay: theme.overlay,
      sidebarBackground: isDark ? '#0B1224' : theme.background,
      userBubble: theme.primary,
      aiBubble: isDark ? '#0F172A' : theme.backgroundSecondary,
      userText: '#FFFFFF',
      aiText: isDark ? '#E5E7EB' : theme.text,
      timestamp: isDark ? '#94A3B8' : theme.textTertiary,
    };
  }, [theme, isDark]);

  const styles = React.useMemo(() => createStyles(colors), [colors]);

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

  // Load all chat sessions
  const loadChatSessions = async () => {
    try {
      setIsLoading(true);
      
      // Only try to load sessions if backend is available
      if (process.env.API_BASE_URL && process.env.API_BASE_URL !== 'undefined') {
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
      } else {
        // Backend not available, just show welcome message
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
  // Local fallback chatbot responses
  const generateLocalResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Academic responses
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
    
    // Default helpful response
    return `I understand you're asking about "${userMessage}". While I'm currently in offline mode, I can offer some general guidance:\n\n• Break down complex topics into smaller parts\n• Use multiple learning resources\n• Practice regularly\n• Ask specific questions\n• Connect concepts to real-world examples\n\nCould you provide more details about what specific help you need?`;
  };

  const submitPrompt = React.useCallback(async (rawText: string) => {
    const messageText = rawText.trim();
    if (!messageText || isTyping) return;

    setInputText('');
    setError(null);

    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Try to send to backend first
      if (process.env.API_BASE_URL && process.env.API_BASE_URL !== 'undefined') {
        const response = await sendChatMessage(messageText, currentSessionId || undefined);
        
        // Update session ID if it's a new session
        if (!currentSessionId && response.session_id) {
          setCurrentSessionId(response.session_id);
          loadChatSessions();
        }

        // Add AI response
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
      
      // Use local fallback response
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
      }, 1000); // Simulate thinking time
      
      return; // Don't set isTyping to false yet, let setTimeout handle it
    }

    setIsTyping(false);
  }, [currentSessionId, isTyping]);

  const handleSend = () => {
    submitPrompt(inputText);
  };

  React.useEffect(() => {
    const initialPrompt = route.params?.initialPrompt?.trim();
    if (!initialPrompt) return;
    if (initialPromptRef.current === initialPrompt) return;
    initialPromptRef.current = initialPrompt;
    submitPrompt(initialPrompt);
  }, [route.params?.initialPrompt, submitPrompt]);

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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowSidebar(true)}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>KTUfy AI</Text>
          <Text style={styles.headerSubtitle}>KG-RAG assistant</Text>
        </View>
        <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
          <Text style={styles.newChatIcon}>＋</Text>
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
            <ActivityIndicator size="large" color={colors.primary} />
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
                <View
                  style={[
                    styles.messageBubble,
                    message.isUser ? styles.userBubble : styles.aiBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      message.isUser ? styles.userText : styles.aiText,
                    ]}
                  >
                    {message.text}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      message.isUser ? styles.userTime : styles.aiTime,
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
              placeholder="Message KG-RAG..."
              placeholderTextColor={colors.muted}
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
              <Text style={styles.sendButtonText}>↗</Text>
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

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    menuButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    menuIcon: {
      fontSize: 18,
      color: colors.text,
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: colors.muted,
      marginTop: 2,
    },
    newChatButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    newChatIcon: {
      fontSize: 18,
      color: colors.text,
    },
    errorBanner: {
      backgroundColor: colors.card,
      borderLeftWidth: 3,
      borderLeftColor: colors.error,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    errorText: {
      color: colors.error,
      fontSize: 13,
      flex: 1,
    },
    errorClose: {
      color: colors.error,
      fontSize: 18,
      fontWeight: 'bold',
      paddingLeft: 12,
    },
    chatContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 12,
      color: colors.muted,
      fontSize: 13,
    },
    messagesContainer: {
      flex: 1,
    },
    messagesContent: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    messageRow: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    userMessageRow: {
      justifyContent: 'flex-end',
    },
    aiMessageRow: {
      justifyContent: 'flex-start',
    },
    messageBubble: {
      maxWidth: '86%',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 16,
    },
    userBubble: {
      backgroundColor: colors.userBubble,
      borderTopRightRadius: 4,
    },
    aiBubble: {
      backgroundColor: colors.aiBubble,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderTopLeftRadius: 4,
    },
    messageText: {
      fontSize: 14,
      lineHeight: 20,
    },
    userText: {
      color: colors.userText,
    },
    aiText: {
      color: colors.aiText,
    },
    messageTime: {
      fontSize: 11,
      marginTop: 6,
    },
    userTime: {
      color: 'rgba(255, 255, 255, 0.7)',
      textAlign: 'right',
    },
    aiTime: {
      color: colors.timestamp,
    },
    typingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    typingDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.muted,
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
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: colors.inputBackground,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      maxHeight: 140,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      maxHeight: 120,
      paddingVertical: 6,
    },
    sendButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    sendButtonDisabled: {
      backgroundColor: colors.inputBorder,
    },
    sendButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    sidebarOverlay: {
      flex: 1,
      flexDirection: 'row',
    },
    sidebarBackdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
    },
    sidebar: {
      width: width * 0.82,
      backgroundColor: colors.sidebarBackground,
      shadowColor: '#000',
      shadowOffset: { width: -2, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 6,
      borderLeftWidth: 1,
      borderLeftColor: colors.cardBorder,
    },
    sidebarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    sidebarTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    sidebarClose: {
      fontSize: 22,
      color: colors.muted,
    },
    sidebarNewChat: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    sidebarNewChatIcon: {
      fontSize: 18,
      color: colors.text,
      marginRight: 12,
    },
    sidebarNewChatText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600',
    },
    sessionsList: {
      flex: 1,
    },
    sessionGroup: {
      paddingTop: 16,
      paddingBottom: 8,
    },
    sessionGroupTitle: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.muted,
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
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    sessionButtonActive: {
      backgroundColor: colors.card,
      borderColor: colors.cardBorder,
    },
    sessionTitle: {
      fontSize: 13,
      color: colors.text,
      marginBottom: 2,
    },
    sessionTitleActive: {
      fontWeight: '600',
    },
    sessionDate: {
      fontSize: 11,
      color: colors.muted,
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
      fontSize: 13,
      color: colors.text,
      backgroundColor: colors.inputBackground,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: 13,
      color: colors.muted,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

export default ChatbotScreen;
