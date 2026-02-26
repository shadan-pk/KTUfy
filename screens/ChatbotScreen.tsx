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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ChatbotScreenNavigationProp, RootStackParamList } from '../types/navigation';
import { ArrowLeft, Menu, Plus, Paperclip, ArrowRight, X, Pencil, Trash2 } from 'lucide-react-native';
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
import {
  getCachedChatSessions,
  setCachedChatSessions,
  getCachedChatHistory,
  setCachedChatHistory,
} from '../services/cacheService';
import { useServerStatus } from '../hooks/useServerStatus';

const { width } = Dimensions.get('window');

// ─── Blue Theme ───────────────────────────────────────────────────
const C = {
  bg900: '#050816',
  bg850: '#070B1E',
  bg800: '#0A1128',
  bg700: '#0F1A3E',
  surface: '#0F1535',
  accent: '#2563EB',
  accentLight: '#3B82F6',
  accentDim: 'rgba(37, 99, 235, 0.12)',
  accentBorder: 'rgba(37, 99, 235, 0.3)',
  userBubble: '#1E3A8A',
  userBubbleBorder: 'rgba(37, 99, 235, 0.25)',
  aiBubble: '#0F1535',
  aiBubbleBorder: 'rgba(71, 85, 105, 0.25)',
  textPrimary: '#E6EDF3',
  textSecondary: '#8B949E',
  textMuted: '#484F58',
  inputBg: '#0A1128',
  inputBorder: 'rgba(71, 85, 105, 0.4)',
  headerBg: 'rgba(5, 8, 22, 0.95)',
  headerBorder: 'rgba(71, 85, 105, 0.2)',
  error: '#F87171',
  errorBg: 'rgba(248, 113, 113, 0.08)',
  white: '#FFFFFF',
  sidebarBg: '#070B1E',
  sidebarBorder: 'rgba(71, 85, 105, 0.25)',
  activeSession: 'rgba(37, 99, 235, 0.1)',
  success: '#34D399',
};

// ─── Golden Ratio Typography ─────────────────────────────────────
const FONT = { display: 39, h1: 24, h2: 20, body: 15, caption: 12, micro: 10 };

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

  const { serverOnline } = useServerStatus();

  // Sidebar slide animation (left to right)
  const sidebarAnim = React.useRef(new Animated.Value(-width * 0.78)).current;
  const backdropOpacity = React.useRef(new Animated.Value(0)).current;

  const openSidebar = () => {
    setShowSidebar(true);
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: -width * 0.78,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setShowSidebar(false));
  };

  // Load chat sessions on mount (cache first)
  React.useEffect(() => {
    loadChatSessions();
  }, []);

  // Handle initial prompt from HomeScreen
  React.useEffect(() => {
    if (initialPrompt && !initialPromptSent && !isLoading) {
      setInitialPromptSent(true);
      setTimeout(() => sendMessage(initialPrompt), 500);
    }
  }, [initialPrompt, initialPromptSent, isLoading]);

  // Auto-scroll
  React.useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const showWelcomeMessage = () => {
    const offline = !(process.env.API_BASE_URL && process.env.API_BASE_URL !== 'undefined');
    setMessages([{
      id: 'welcome',
      text: `Hello! 👋 I'm your AI Study Assistant${offline ? ' (offline mode)' : ''}.\n\nI can help you with:\n\n📚 Study guidance and tips\n❓ Explaining academic concepts\n📝 Creating study plans\n💡 Answering educational questions\n🎯 Exam preparation strategies\n💻 Programming and technical topics\n📊 KTU university guidance\n\nWhat would you like to learn about today?`,
      isUser: false,
      timestamp: new Date(),
    }]);
  };

  const loadChatSessions = async () => {
    try {
      setIsLoading(true);
      // Try cache first — show immediately
      const cached = await getCachedChatSessions();
      if (cached && cached.length > 0) {
        setSessions(cached);
        // Show cached last session if no initial prompt
        if (!initialPrompt) {
          const cachedMsgs = await getCachedChatHistory(cached[0].id);
          if (cachedMsgs && cachedMsgs.length > 0) {
            setCurrentSessionId(cached[0].id);
            setMessages(cachedMsgs.map((m: any) => ({
              ...m, timestamp: new Date(m.timestamp),
            })));
            setIsLoading(false);
          } else {
            showWelcomeMessage();
            setIsLoading(false);
          }
        } else {
          showWelcomeMessage();
          setIsLoading(false);
        }
      } else {
        // No cache — show welcome immediately
        showWelcomeMessage();
        setIsLoading(false);
      }

      // Background refresh from network (won't block UI)
      try {
        if (process.env.API_BASE_URL && process.env.API_BASE_URL !== 'undefined') {
          const sessionList = await getChatSessions();
          setSessions(sessionList);
          await setCachedChatSessions(sessionList);

          // Only auto-load latest session if we didn't already show cached data
          // and there's no initial prompt
          if (sessionList.length > 0 && !initialPrompt && (!cached || cached.length === 0)) {
            await loadChatSession(sessionList[0].id);
          }
        }
      } catch (networkErr: any) {
        console.log('[Chat] Network unavailable, using cached data:', networkErr.message);
        // Already showing cached data or welcome — no need to block
      }
    } catch (err: any) {
      console.error('Error loading chat sessions:', err);
      showWelcomeMessage();
      setIsLoading(false);
    }
  };

  const loadChatSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Try cache first
      const cachedMsgs = await getCachedChatHistory(sessionId);
      if (cachedMsgs && cachedMsgs.length > 0) {
        setCurrentSessionId(sessionId);
        setMessages(cachedMsgs.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })));
      }

      const session = await getChatSession(sessionId);
      setCurrentSessionId(sessionId);
      const converted: Message[] = session.messages.map((msg) => ({
        id: msg.id,
        text: msg.content,
        isUser: msg.role === 'user',
        timestamp: new Date(msg.created_at),
      }));
      setMessages(converted.length > 0 ? converted : []);
      // Cache the loaded messages
      await setCachedChatHistory(sessionId, converted);
      closeSidebar();
    } catch (err: any) {
      console.error('Error loading chat session:', err);
      setError('Failed to load chat session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    setCurrentSessionId(null);
    setMessages([]);
    showWelcomeMessage();
    closeSidebar();
  };

  const generateLocalResponse = (userMessage: string): string => {
    if (!serverOnline) {
      return "⚠️ Our server is currently offline.\n\nPlease check your internet connection or try again later when the server is back online.";
    }
    const lm = userMessage.toLowerCase();
    if (lm.includes('hello') || lm.includes('hi'))
      return "Hello! 👋 I'm your AI Study Assistant (offline mode). What would you like to learn about?";
    if (lm.includes('ktu') || lm.includes('university'))
      return "I can help with KTU queries! Syllabus, exam patterns, study materials, and guidance. What topic?";
    if (lm.includes('exam') || lm.includes('test'))
      return "📝 Exam prep tips:\n\n• Review syllabus thoroughly\n• Practice previous year questions\n• Create summary notes\n• Form study groups\n• Take breaks\n\nWhat subject?";
    if (lm.includes('study') || lm.includes('learn'))
      return "📚 Study techniques:\n\n• Active recall\n• Spaced repetition\n• Pomodoro technique (25min)\n• Mind mapping\n• Teach others\n\nWhich interests you?";
    if (lm.includes('programming') || lm.includes('coding'))
      return "💻 Programming tips:\n\n• Practice daily\n• Understand concepts first\n• Build projects\n• Debug systematically\n• Read others' code\n\nWhat language?";
    return `I understand you're asking about "${userMessage}". I'm offline, but here's general guidance:\n\n• Break topics into smaller parts\n• Use multiple resources\n• Practice regularly\n• Ask specific questions\n\nCould you provide more details?`;
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isTyping) return;
    setError(null);
    const userMsg: Message = {
      id: `user-${Date.now()}`, text: messageText.trim(),
      isUser: true, timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      if (process.env.API_BASE_URL && process.env.API_BASE_URL !== 'undefined') {
        const response = await sendChatMessage(messageText, currentSessionId || undefined);
        if (!currentSessionId && response.session_id) {
          setCurrentSessionId(response.session_id);
          loadChatSessions();
        }
        const aiMsg: Message = {
          id: response.assistant_message.id,
          text: response.assistant_message.content,
          isUser: false,
          timestamp: new Date(response.assistant_message.created_at),
        };
        setMessages(prev => {
          const updated = [...prev, aiMsg];
          if (currentSessionId) setCachedChatHistory(currentSessionId, updated);
          return updated;
        });
      } else {
        throw new Error('Backend not available');
      }
    } catch {
      setTimeout(() => {
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          text: generateLocalResponse(messageText),
          isUser: false, timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
      }, 1000);
      return;
    }
    setIsTyping(false);
  };

  const handleSend = () => {
    if (!inputText.trim() || isTyping) return;
    const text = inputText.trim();
    setInputText('');
    sendMessage(text);
  };

  const handleDeleteSession = (sessionId: string) => {
    Alert.alert('Delete Chat', 'Delete this chat?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteChatSession(sessionId);
            if (currentSessionId === sessionId) handleNewChat();
            await loadChatSessions();
          } catch { Alert.alert('Error', 'Failed to delete'); }
        },
      },
    ]);
  };

  const startEditingTitle = (s: ChatSession) => {
    setEditingSessionId(s.id);
    setEditingTitle(s.title);
  };

  const saveSessionTitle = async (sid: string) => {
    if (!editingTitle.trim()) { setEditingSessionId(null); return; }
    try {
      await updateChatSession(sid, editingTitle.trim());
      setSessions(prev => prev.map(s => s.id === sid ? { ...s, title: editingTitle.trim() } : s));
      setEditingSessionId(null);
    } catch { Alert.alert('Error', 'Failed to update'); }
  };

  const formatTime = (d: Date) =>
    `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

  const formatSessionDate = (ds: string) => {
    const d = new Date(ds);
    const diff = Math.floor(Math.abs(Date.now() - d.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const groupedSessions = React.useMemo(() => {
    const g: { [k: string]: ChatSession[] } = {};
    sessions.forEach(s => {
      const diff = Math.floor(Math.abs(Date.now() - new Date(s.created_at).getTime()) / 86400000);
      const key = diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : diff < 7 ? 'This Week' : diff < 30 ? 'This Month' : 'Older';
      (g[key] = g[key] || []).push(s);
    });
    return g;
  }, [sessions]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg900} />

      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.hBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color={C.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.hBtn} onPress={openSidebar}>
            <Menu size={22} color={C.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.hTitleWrap}>
            <Text style={styles.hTitle}>KTUfy AI</Text>
            <View style={[styles.statusDot, !serverOnline && { backgroundColor: C.error }]} />
          </View>
          <TouchableOpacity style={styles.hBtn} onPress={handleNewChat}>
            <Plus size={22} color={C.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Error */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠ {error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={styles.errorClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Chat */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.chatArea}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading && messages.length === 0 ? (
          <View style={styles.loadWrap}>
            <ActivityIndicator size="large" color={C.accent} />
            <Text style={styles.loadText}>Loading chat...</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef} style={styles.msgList}
            contentContainerStyle={styles.msgContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map(m => (
              <View key={m.id} style={[styles.msgRow, m.isUser ? styles.userRow : styles.aiRow]}>
                <View style={[styles.bubble, m.isUser ? styles.userBubble : styles.aiBubble]}>
                  {!m.isUser && (
                    <View style={styles.aiLabel}>
                      <View style={styles.aiDot} />
                      <Text style={styles.aiLabelText}>KTUfy AI</Text>
                    </View>
                  )}
                  <Text style={[styles.msgText, m.isUser ? styles.userText : styles.aiText]}>
                    {m.text}
                  </Text>
                  <Text style={[styles.msgTime, m.isUser ? styles.userTime : styles.aiTime]}>
                    {formatTime(m.timestamp)}
                  </Text>
                </View>
              </View>
            ))}
            {isTyping && (
              <View style={[styles.msgRow, styles.aiRow]}>
                <View style={[styles.bubble, styles.aiBubble]}>
                  <View style={styles.aiLabel}>
                    <View style={styles.aiDot} />
                    <Text style={styles.aiLabelText}>KTUfy AI</Text>
                  </View>
                  <View style={styles.typing}>
                    <View style={styles.dot} />
                    <View style={[styles.dot, { opacity: 0.6 }]} />
                    <View style={[styles.dot, { opacity: 0.9 }]} />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* Input */}
        <View style={styles.inputArea}>
          <View style={styles.inputWrap}>
            <TouchableOpacity style={styles.attachBtn}>
              <Paperclip size={20} color={C.textMuted} strokeWidth={1.8} />
            </TouchableOpacity>
            <TextInput
              style={styles.input} placeholder="Message KTUfy AI..."
              placeholderTextColor={C.textMuted} value={inputText}
              onChangeText={setInputText} multiline maxLength={2000} editable={!isTyping}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || isTyping) && styles.sendBtnOff]}
              onPress={handleSend} disabled={!inputText.trim() || isTyping}
            >
              <ArrowRight size={20} color={C.white} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Sidebar — slide from left */}
      {
        showSidebar && (
          <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
            <Animated.View
              style={[styles.backdrop, { opacity: backdropOpacity }]}
            >
              <TouchableOpacity
                style={StyleSheet.absoluteFillObject}
                activeOpacity={1}
                onPress={closeSidebar}
              />
            </Animated.View>

            <Animated.View
              style={[styles.sidebar, { transform: [{ translateX: sidebarAnim }] }]}
            >
              <View style={styles.sbHeader}>
                <Text style={styles.sbTitle}>Chat History</Text>
                <TouchableOpacity onPress={closeSidebar}>
                  <X size={20} color={C.textSecondary} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.sbNew} onPress={handleNewChat}>
                <Plus size={18} color={C.accent} strokeWidth={2} />
                <Text style={styles.sbNewText}>New Chat</Text>
              </TouchableOpacity>
              <ScrollView style={styles.sbList} showsVerticalScrollIndicator={false}>
                {Object.entries(groupedSessions).map(([group, gSessions]) => (
                  <View key={group} style={styles.sbGroup}>
                    <Text style={styles.sbGroupTitle}>{group}</Text>
                    {gSessions.map(s => (
                      <View key={s.id} style={styles.sbItem}>
                        {editingSessionId === s.id ? (
                          <TextInput
                            style={styles.sbEditInput} value={editingTitle}
                            onChangeText={setEditingTitle}
                            onBlur={() => saveSessionTitle(s.id)}
                            onSubmitEditing={() => saveSessionTitle(s.id)}
                            autoFocus
                          />
                        ) : (
                          <>
                            <TouchableOpacity
                              style={[styles.sbBtn, currentSessionId === s.id && styles.sbBtnActive]}
                              onPress={() => loadChatSession(s.id)}
                            >
                              <Text style={[styles.sbBtnTitle, currentSessionId === s.id && { color: C.accent }]} numberOfLines={1}>
                                {s.title}
                              </Text>
                              <Text style={styles.sbDate}>{formatSessionDate(s.created_at)}</Text>
                            </TouchableOpacity>
                            <View style={styles.sbActions}>
                              <TouchableOpacity style={styles.sbActBtn} onPress={() => startEditingTitle(s)}>
                                <Pencil size={14} color={C.textMuted} strokeWidth={1.8} />
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.sbActBtn} onPress={() => handleDeleteSession(s.id)}>
                                <Trash2 size={14} color={C.error} strokeWidth={1.8} />
                              </TouchableOpacity>
                            </View>
                          </>
                        )}
                      </View>
                    ))}
                  </View>
                ))}
                {sessions.length === 0 && (
                  <View style={styles.sbEmpty}>
                    <Text style={styles.sbEmptyText}>No history yet.{'\n'}Start a conversation!</Text>
                  </View>
                )}
              </ScrollView>
            </Animated.View>
          </View>
        )
      }
    </View >
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg900 },
  // Header
  headerSafe: { backgroundColor: C.headerBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.headerBorder,
  },
  hBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  hBtnIcon: { fontSize: 20, color: C.textPrimary, fontWeight: '500' },
  hTitleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  hTitle: { fontSize: FONT.body, fontWeight: '700', color: C.textPrimary, letterSpacing: 0.5 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.success, marginLeft: 8 },
  // Error
  errorBanner: {
    backgroundColor: C.errorBg, borderLeftWidth: 3, borderLeftColor: C.error,
    paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  errorText: { color: C.error, fontSize: FONT.caption, flex: 1 },
  errorClose: { color: C.error, fontSize: 16, fontWeight: 'bold', paddingLeft: 12 },
  // Chat
  chatArea: { flex: 1, backgroundColor: C.bg900 },
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadText: { marginTop: 12, color: C.textSecondary, fontSize: FONT.caption },
  msgList: { flex: 1 },
  msgContent: { paddingVertical: 16, paddingHorizontal: 12 },
  // Messages
  msgRow: { marginBottom: 12 },
  userRow: { alignItems: 'flex-end' },
  aiRow: { alignItems: 'flex-start' },
  bubble: { maxWidth: '85%', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12 },
  userBubble: {
    backgroundColor: C.userBubble, borderBottomRightRadius: 4,
    borderWidth: 1, borderColor: C.userBubbleBorder,
  },
  aiBubble: {
    backgroundColor: C.aiBubble, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: C.aiBubbleBorder,
  },
  aiLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  aiDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent, marginRight: 6 },
  aiLabelText: { fontSize: FONT.micro, fontWeight: '600', color: C.accent, letterSpacing: 0.3 },
  msgText: { fontSize: FONT.body, lineHeight: 22 },
  userText: { color: C.white },
  aiText: { color: C.textPrimary },
  msgTime: { fontSize: FONT.micro, marginTop: 6 },
  userTime: { color: 'rgba(255,255,255,0.5)', textAlign: 'right' },
  aiTime: { color: C.textMuted },
  // Typing
  typing: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent, marginRight: 5, opacity: 0.4 },
  // Input
  inputArea: {
    paddingHorizontal: 12, paddingVertical: 10,
    // backgroundColor: C.bg850, 
    // borderTopWidth: 1, borderTopColor: C.headerBorder,
  },
  inputWrap: {
    marginBottom: Platform.OS === 'android' ? 10 : 4,
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: C.inputBg,
    borderRadius: 22,
    borderWidth: 1, borderColor: C.inputBorder,
    paddingHorizontal: 6, paddingVertical: 4, maxHeight: 120,
  },
  attachBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 18 },
  attachIcon: { fontSize: 18 },
  input: { flex: 1, fontSize: FONT.body, color: C.textPrimary, maxHeight: 100, paddingVertical: 8, paddingHorizontal: 6 },
  sendBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: C.accent,
    justifyContent: 'center', alignItems: 'center', marginLeft: 4,
  },
  sendBtnOff: { backgroundColor: 'rgba(37, 99, 235, 0.25)' },
  sendIcon: { color: C.white, fontSize: 18, fontWeight: '700' },
  // Sidebar (slides from left)
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sidebar: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: width * 0.78,
    backgroundColor: C.sidebarBg,
    borderRightWidth: 1, borderRightColor: C.sidebarBorder,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  sbHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.sidebarBorder, paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  sbTitle: { fontSize: FONT.h2, fontWeight: '700', color: C.textPrimary, },
  sbClose: { fontSize: 18, color: C.textSecondary, fontWeight: '600' },
  sbNew: {
    flexDirection: 'row', alignItems: 'center', margin: 16, padding: 12,
    borderRadius: 12, borderWidth: 1, borderColor: C.accentBorder, backgroundColor: C.accentDim,
  },
  sbNewIcon: { fontSize: 18, color: C.accent, marginRight: 10, fontWeight: '600' },
  sbNewText: { fontSize: FONT.body, color: C.accent, fontWeight: '600' },
  sbList: { flex: 1, paddingHorizontal: 12 },
  sbGroup: { marginBottom: 16 },
  sbGroupTitle: {
    fontSize: FONT.micro, fontWeight: '700', color: C.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginLeft: 8,
  },
  sbItem: { flexDirection: 'row', alignItems: 'center' },
  sbBtn: { flex: 1, padding: 12, borderRadius: 10 },
  sbBtnActive: { backgroundColor: C.activeSession },
  sbBtnTitle: { fontSize: FONT.caption, color: C.textPrimary, fontWeight: '500' },
  sbDate: { fontSize: FONT.micro, color: C.textMuted, marginTop: 2 },
  sbActions: { flexDirection: 'row' },
  sbActBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  sbActIcon: { fontSize: FONT.caption, color: C.textSecondary },
  sbEditInput: {
    flex: 1, fontSize: FONT.caption, color: C.textPrimary,
    backgroundColor: C.surface, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: C.accentBorder,
  },
  sbEmpty: { padding: 32, alignItems: 'center' },
  sbEmptyText: { fontSize: FONT.caption, color: C.textMuted, textAlign: 'center', lineHeight: 22 },
});

export default ChatbotScreen;
