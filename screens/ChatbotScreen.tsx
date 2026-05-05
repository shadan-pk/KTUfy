import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Keyboard, Platform, Modal, Dimensions, StatusBar, Animated
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { ChatbotScreenNavigationProp, RootStackParamList } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../auth/AuthProvider';
import { getUserProfile } from '../supabaseConfig';
import { Menu, Plus, Paperclip, ArrowRight, Mic, X, Pencil, Trash2, Edit, BookOpen, Settings, Bell, Calculator, Zap, FileText, Calendar, CheckSquare, Code, Gamepad2, Library, MoreVertical, Copy, Check, Layers, Brain, Link } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import {
  sendChatMessage, getChatSessions, getChatSession, updateChatSession, deleteChatSession,
  ChatMessage as BackendChatMessage, ChatSession
} from '../services/chatService';
import { getCachedChatSessions, setCachedChatSessions, getCachedChatHistory, setCachedChatHistory } from '../services/cacheService';
import { useServerStatus } from '../hooks/useServerStatus';
import { getExamSchedule, ExamEvent } from '../services/scheduleService';

const { width, height } = Dimensions.get('window');

const FONT = { display: 39, h1: 24, h2: 20, body: 15, caption: 12, micro: 10 };

interface ToolAction {
  type: 'flashcard' | 'quiz' | 'match';
  topic: string;
  label: string;
  screen: 'Flashcards' | 'QuizGame' | 'MatchGame';
  emoji: string;
}

interface Message { id: string; text: string; isUser: boolean; timestamp: Date; action?: ToolAction; }

const CodeBlockComponent = ({ language, code }: { language: string, code: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <View style={styles.codeBlock}>
      <View style={styles.codeHeader}>
        <Text style={styles.codeLang}>{language || 'code'}</Text>
        <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
          {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} color="#888" />}
          <Text style={[styles.copyText, copied && { color: '#10B981' }]}>{copied ? 'Copied' : 'Copy'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Text style={styles.codeText}>{code}</Text>
      </ScrollView>
    </View>
  );
};

const ChatbotScreen: React.FC<{ navigation: ChatbotScreenNavigationProp }> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<RootStackParamList, 'Chatbot'>>();
  const initialPrompt = route.params?.initialPrompt;
  const { user: authUser } = useAuth();
  
  const [userData, setUserData] = useState<any>(null);
  const [upcomingExams, setUpcomingExams] = useState<ExamEvent[]>([]);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [initialPromptSent, setInitialPromptSent] = useState(false);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [menuSessionId, setMenuSessionId] = useState<string | null>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Typing...');
  
  // Tool picker state (+ button → chip in input)
  const [showToolPicker, setShowToolPicker] = useState(false);
  const [activeTool, setActiveTool] = useState<{ type: string; screen: 'Flashcards' | 'QuizGame' | 'MatchGame'; label: string; icon: any } | null>(null);
  
  // FAB state
  const [isFabOpen, setIsFabOpen] = useState(false);
  const fabAnimation = useRef(new Animated.Value(0)).current;

  const streamingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const { serverOnline } = useServerStatus();

  // Sidebar animation
  const sidebarAnim = useRef(new Animated.Value(-width * 0.85)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [inputAreaHeight, setInputAreaHeight] = useState(90);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Load user profile & upcoming exams
  useEffect(() => {
    (async () => {
      if (authUser) {
        const profile = await getUserProfile(authUser.id);
        setUserData(profile);
      }
    })();
  }, [authUser]);

  useEffect(() => {
    (async () => {
      try {
        const sem = userData?.semester || undefined;
        const branch = userData?.branch || undefined;
        const data = await getExamSchedule({ semester: sem, branch, forceRefresh: true });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = data.filter((e: ExamEvent) => {
            const d = new Date(e.date + 'T00:00:00');
            d.setHours(0, 0, 0, 0);
            return d >= today && e.type === 'exam';
        }).sort((a: ExamEvent, b: ExamEvent) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setUpcomingExams(upcoming.slice(0, 3));
      } catch (e) {}
    })();
  }, [userData]);

  const openSidebar = () => {
    setShowSidebar(true);
    Animated.parallel([
      Animated.timing(sidebarAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(sidebarAnim, { toValue: -width * 0.85, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setShowSidebar(false);
      setMenuSessionId(null);
    });
  };

  const toggleFab = () => {
    const toValue = isFabOpen ? 0 : 1;
    setIsFabOpen(!isFabOpen);
    Animated.spring(fabAnimation, {
      toValue, friction: 5, tension: 40, useNativeDriver: false
    }).start();
  };

  useFocusEffect(
    useCallback(() => {
      loadChatSessions();
    }, [])
  );

  useEffect(() => {
    if (serverOnline) {
      refreshSessionList();
    }
  }, [serverOnline]);

  useEffect(() => {
    if (initialPrompt && !initialPromptSent && !isLoading) {
      setInitialPromptSent(true);
      setTimeout(() => sendMessage(initialPrompt), 500);
    }
  }, [initialPrompt, initialPromptSent, isLoading]);

  useEffect(() => {
    if (scrollViewRef.current && isTyping) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [isTyping, messages]);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => setKeyboardHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  const loadChatSessions = async () => {
    try {
      setIsLoading(true);
      const cached = await getCachedChatSessions();
      if (cached && cached.length > 0) setSessions(cached);
      try {
        const sessionList = await getChatSessions();
        setSessions(sessionList);
        await setCachedChatSessions(sessionList);
      } catch (e) {}
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
    }
  };

  const loadChatSession = async (sessionId: string) => {
    try {
      setMenuSessionId(null);
      setIsLoading(true);
      setError(null);
      const cachedMsgs = await getCachedChatHistory(sessionId);
      if (cachedMsgs && cachedMsgs.length > 0) {
        setCurrentSessionId(sessionId);
        setMessages(cachedMsgs.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      }
      const session = await getChatSession(sessionId);
      setCurrentSessionId(sessionId);
      const converted: Message[] = session.messages.map((msg: any) => ({
        id: msg.id, text: msg.content, isUser: msg.role === 'user', timestamp: new Date(msg.created_at)
      }));
      setMessages(converted.length > 0 ? converted : []);
      await setCachedChatHistory(sessionId, converted);
      closeSidebar();
    } catch (err) {
      setError('Failed to load chat session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setMenuSessionId(null);
    closeSidebar();
  };

  const refreshSessionList = async () => {
    try {
      const sessionList = await getChatSessions();
      setSessions(sessionList);
      await setCachedChatSessions(sessionList);
    } catch (err) {}
  };

  const typewriteMessage = (msgId: string, fullText: string, onDone?: () => void) => {
    if (streamingRef.current) clearTimeout(streamingRef.current);
    let idx = 0;
    const step = () => {
      if (idx < fullText.length) {
        idx += Math.min(3, fullText.length - idx);
        setStreamingText(fullText.slice(0, idx));
        streamingRef.current = setTimeout(step, 18);
      } else {
        setStreamingMsgId(null);
        setStreamingText('');
        streamingRef.current = null;
        onDone?.();
      }
    };
    step();
  };

  // Detect if the user message is asking for a tool (flashcard, quiz, match)
  const detectToolIntent = (text: string): ToolAction | null => {
    const lower = text.toLowerCase().trim();
    // Flashcard patterns
    const flashcardPatterns = [
      /(?:create|generate|make|show|give)\s+(?:me\s+)?(?:a\s+)?flashcards?\s+(?:for|on|about)\s+(.+)/i,
      /flashcards?\s+(?:for|on|about)\s+(.+)/i,
      /flashcards?\s+(.+)/i,
      /(.+?)\s+flashcards?/i,
    ];
    for (const pattern of flashcardPatterns) {
      const match = lower.match(pattern);
      if (match && match[1]) {
        const topic = match[1].replace(/[.?!]+$/, '').trim();
        if (topic.length > 1 && topic.length < 100) {
          return { type: 'flashcard', topic, label: `${topic} Flashcards`, screen: 'Flashcards', emoji: '🎴' };
        }
      }
    }
    // Quiz patterns
    const quizPatterns = [
      /(?:create|generate|make|start|give)\s+(?:me\s+)?(?:a\s+)?quiz\s+(?:for|on|about)\s+(.+)/i,
      /quiz\s+(?:for|on|about)\s+(.+)/i,
      /quiz\s+(.+)/i,
      /(.+?)\s+quiz/i,
    ];
    for (const pattern of quizPatterns) {
      const match = lower.match(pattern);
      if (match && match[1]) {
        const topic = match[1].replace(/[.?!]+$/, '').trim();
        if (topic.length > 1 && topic.length < 100) {
          return { type: 'quiz', topic, label: `${topic} Quiz`, screen: 'QuizGame', emoji: '🧠' };
        }
      }
    }
    // Match game patterns
    const matchPatterns = [
      /(?:create|generate|make|start|give)\s+(?:me\s+)?(?:a\s+)?match\s+(?:the\s+following\s+)?(?:for|on|about)\s+(.+)/i,
      /match\s+(?:the\s+following\s+)?(?:for|on|about)\s+(.+)/i,
      /match\s+(?:the\s+following\s+)?(?:game\s+)?(.+)/i,
    ];
    for (const pattern of matchPatterns) {
      const match = lower.match(pattern);
      if (match && match[1]) {
        const topic = match[1].replace(/[.?!]+$/, '').trim();
        if (topic.length > 1 && topic.length < 100) {
          return { type: 'match', topic, label: `${topic} Match Game`, screen: 'MatchGame', emoji: '🔗' };
        }
      }
    }
    return null;
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isTyping) return;
    setError(null);
    const userMsg: Message = { id: `user-${Date.now()}`, text: messageText.trim(), isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    // Check for tool intent before hitting the backend
    const toolAction = detectToolIntent(messageText);
    if (toolAction) {
      const aiMsg: Message = {
        id: `ai-tool-${Date.now()}`,
        text: `I can generate ${toolAction.type === 'flashcard' ? 'flashcards' : toolAction.type === 'quiz' ? 'a quiz' : 'a match game'} on "${toolAction.topic}" for you!`,
        isUser: false,
        timestamp: new Date(),
        action: toolAction,
      };
      setMessages(prev => [...prev, aiMsg]);
      return;
    }

    setIsTyping(true);

    try {
      if (!serverOnline) throw new Error('Offline');
      
      // Status message cycling
      const statusInterval = setInterval(() => {
        setStatusMessage(prev => {
          if (prev.includes('Searching')) return '📊 Analyzing Knowledge Graph...';
          if (prev.includes('Analyzing')) return '📄 Reading Syllabus...';
          if (prev.includes('Reading')) return '✍️ Thinking...';
          return '🔍 Searching syllabus...';
        });
      }, 3000);
      setStatusMessage('🔍 Searching syllabus...');

      const response = await sendChatMessage(messageText, currentSessionId || undefined);
      clearInterval(statusInterval);

      if (!currentSessionId && response.session_id) {
        setCurrentSessionId(response.session_id);
        refreshSessionList();
      }
      const aiMsg: Message = { id: response.assistant_message.id, text: response.assistant_message.content, isUser: false, timestamp: new Date(response.assistant_message.created_at) };
      setStreamingMsgId(aiMsg.id);
      setStreamingText('');
      setMessages(prev => [...prev, { ...aiMsg, text: '' }]);
      setIsTyping(false);
      typewriteMessage(aiMsg.id, aiMsg.text, () => {
        setMessages(prev => {
          const updated = prev.map(m => m.id === aiMsg.id ? aiMsg : m);
          if (currentSessionId) setCachedChatHistory(currentSessionId, updated);
          return updated;
        });
      });
    } catch (err: any) {
      setTimeout(() => {
        let errorText = "⚠️ I am offline right now. Please check your connection.";
        if (err?.message && err.message !== 'Offline') {
            errorText = `⚠️ ${err.message}`;
        }
        
        const aiMsg: Message = { id: `ai-${Date.now()}`, text: errorText, isUser: false, timestamp: new Date() };
        setStreamingMsgId(aiMsg.id);
        setStreamingText('');
        setMessages(prev => [...prev, { ...aiMsg, text: '' }]);
        setIsTyping(false);
        typewriteMessage(aiMsg.id, aiMsg.text, () => {
          setMessages(prev => prev.map(m => m.id === aiMsg.id ? aiMsg : m));
        });
      }, 1000);
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || isTyping) return;
    const text = inputText.trim();
    setInputText('');

    // If a tool chip is active, navigate to that screen instead of sending to AI
    if (activeTool) {
      const tool = activeTool;
      setActiveTool(null);
      if (tool.screen === 'Flashcards') {
        navigation.navigate('Flashcards', { topic: text });
      } else {
        navigation.navigate(tool.screen, { topic: text });
      }
      return;
    }

    sendMessage(text);
  };

  const handleDeleteSession = (sessionId: string) => {
    setDeleteSessionId(sessionId);
    setShowDeleteModal(true);
  };

  const confirmDeleteSession = async () => {
    const sessionId = deleteSessionId;
    if (!sessionId) return;
    try {
      await deleteChatSession(sessionId);
      if (currentSessionId === sessionId) handleNewChat();
      await loadChatSessions();
    } catch {}
    setShowDeleteModal(false);
    setDeleteSessionId(null);
  };

  const formatSessionDate = (ds: string) => {
    const diff = Math.floor(Math.abs(Date.now() - new Date(ds).getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff}d ago`;
    return new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  const parseInline = (text: string, baseColor: string) => {
    const parts = text.split(/(`[^`]+`|\*\*.*?\*\*)/g); 
    return parts.map((part, pIdx) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return <Text key={`ic-${pIdx}`} style={styles.inlineCode}>{part.slice(1, -1)}</Text>;
      } else if (part.startsWith('**') && part.endsWith('**')) {
        return <Text key={`bd-${pIdx}`} style={{ fontWeight: '700', color: baseColor }}>{part.slice(2, -2)}</Text>;
      } else {
        return <Text key={`tx-${pIdx}`} style={{ color: baseColor }}>{part}</Text>;
      }
    });
  };

  const parseMarkdown = (text: string, baseColor: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      // Code block detection
      if (line.startsWith('```')) {
        const language = line.slice(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        elements.push(
          <CodeBlockComponent key={`cb-${i}`} language={language} code={codeLines.join('\n')} />
        );
        i++; // skip closing ```
        continue;
      }
      // Table detection (at least two pipes)
      if (line.includes('|')) {
        const tableRows = [line];
        i++;
        while (i < lines.length && lines[i].includes('|')) {
          tableRows.push(lines[i]);
          i++;
        }
        elements.push(
          <ScrollView horizontal key={`tbl-${i}`} style={styles.tableWrapper}>
            <View style={styles.table}>
              {tableRows.map((row, idx) => {
                const isHeader = idx === 0;
                const isSeparator = row.includes('---');
                if (isSeparator) return null;
                return (
                  <View key={`tr-${idx}`} style={styles.tableRow}>
                    {row.split('|').filter((cell, index, arr) => !(index === 0 && cell.trim() === '') && !(index === arr.length - 1 && cell.trim() === '')).map((cell, cIdx) => (
                      <Text key={`td-${cIdx}`} style={[styles.tableCell, isHeader && styles.tableHeaderCell, { color: baseColor }]}>
                        {parseInline(cell.trim(), baseColor)}
                      </Text>
                    ))}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        );
        continue;
      }
      // Inline code and bold text detection
      elements.push(
        <Text key={`p-${i}`} style={[styles.msgText, { color: baseColor }]}>{parseInline(line, baseColor)}</Text>
      );
      i++;
    }
    return elements;
  };

  // FAB items
  const fabItems = [
    { icon: BookOpen, label: 'Syllabus', route: 'SyllabusViewer', color: '#8B5CF6' },
    { icon: Calendar, label: 'Exams', route: 'Schedule', color: '#F43F5E' },
    { icon: Zap, label: 'Flashcards', route: 'Flashcards', color: '#F59E0B' },
    { icon: FileText, label: 'PDF Tools', route: 'PdfTools', color: '#10B981' },
  ];
   const fabItemSpacing = Math.min(80, height * 0.1);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />

      {/* Top App Bar */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.background, zIndex: 10 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={openSidebar} style={styles.hBtn}>
            <Menu size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.hTitleWrap}>
            <View style={[styles.hBrandDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={[styles.hTitle, { color: theme.text }]}>KTUfy</Text>
          </View>
          <TouchableOpacity onPress={handleNewChat} style={styles.hBtn}>
            <Edit size={22} color={theme.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      style={styles.mainArea}>
        {messages.length === 0 ? (
          /* Greeting State */
          <ScrollView contentContainerStyle={styles.greetingScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.greetingCenter}>
              <View style={styles.avatarContainer}>
                <LinearGradient colors={['#3B82F6', '#10B981']} style={styles.avatarRing}>
                  <View style={styles.avatarInner}>
                    <Text style={{fontSize: 30}}>🌍</Text>
                  </View>
                </LinearGradient>
              </View>
              <Text style={[styles.greetName, { color: theme.textSecondary }]}>Hi, {userData?.name?.split(' ')[0] || 'Student'}</Text>
              <Text style={[styles.greetHeadline, { color: theme.text }]}>
                What do you want to <Text style={{ color: '#10B981' }}>learn today?</Text>
              </Text>
              <Text style={[styles.greetSub, { color: theme.textTertiary }]}>
                Ask anything from your KTU syllabus — I'll pull it up.
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
              {['S4 CSE syllabus', 'Generate flashcards', 'Upcoming exams'].map((chip, i) => (
                <TouchableOpacity key={i} style={[styles.chipCard, { backgroundColor: theme.backgroundSecondary }]} onPress={() => sendMessage(chip)}>
                  <Text style={[styles.chipText, { color: theme.textSecondary }]}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ScrollView>
        ) : (
          /* Chat State */
          <ScrollView ref={scrollViewRef} style={styles.msgList} contentContainerStyle={styles.msgContent}>
            {messages.map(m => (
              <View key={m.id} style={[styles.msgRow, m.isUser ? styles.userRow : styles.aiRow]}>
                {!m.isUser && (
                  <View style={[styles.aiLine, { backgroundColor: '#3B82F6' }]} />
                )}
                <View style={[styles.bubble, m.isUser ? [styles.userBubble, { backgroundColor: theme.backgroundSecondary }] : [styles.aiBubble, { backgroundColor: 'transparent' }]]}>
                  {(() => {
                    const displayText = m.id === streamingMsgId ? streamingText : m.text;
                    const textColor = theme.text;
                    return m.isUser ? (
                      <Text style={[styles.msgText, { color: textColor }]}>{displayText}</Text>
                    ) : (
                      <View style={styles.markdownContainer}>
                        {parseMarkdown(displayText, textColor)}
                        {m.action && (
                          <TouchableOpacity
                            style={[styles.toolActionCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.primary + '40' }]}
                            activeOpacity={0.7}
                            onPress={() => {
                              if (m.action!.screen === 'Flashcards') {
                                navigation.navigate('Flashcards', { topic: m.action!.topic });
                              } else {
                                navigation.navigate(m.action!.screen, { topic: m.action!.topic });
                              }
                            }}
                          >
                            <View style={styles.toolActionLeft}>
                              <Text style={styles.toolActionEmoji}>{m.action.emoji}</Text>
                              <View>
                                <Text style={[styles.toolActionTitle, { color: theme.text }]}>{m.action.label}</Text>
                                <Text style={[styles.toolActionSub, { color: theme.textTertiary }]}>Tap to generate</Text>
                              </View>
                            </View>
                            <View style={[styles.toolActionBtn, { backgroundColor: theme.primary }]}>
                              <Text style={styles.toolActionBtnText}>Generate</Text>
                            </View>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })()}
                </View>
              </View>
            ))}
            {isTyping && (
               <View style={[styles.msgRow, styles.aiRow]}>
                 <View style={[styles.aiLine, { backgroundColor: '#3B82F6' }]} />
                 <View style={[styles.bubble, styles.aiBubble, { backgroundColor: 'transparent' }]}>
                   <Text style={{color: theme.textSecondary}}>{statusMessage}</Text>
                 </View>
               </View>
            )}
          </ScrollView>
        )}

        {/* Bottom Input */}
          <View
            onLayout={e => setInputAreaHeight(e.nativeEvent.layout.height)}
            style={[styles.inputArea, { backgroundColor: theme.background }]}>

          {/* Tool Picker Menu */}
          {showToolPicker && (
            <View style={[styles.toolPickerPopover, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
              {[
                { type: 'flashcard', screen: 'Flashcards' as const, label: 'Flashcards', icon: Layers },
                { type: 'quiz', screen: 'QuizGame' as const, label: 'Quizzes', icon: Brain },
                { type: 'match', screen: 'MatchGame' as const, label: 'Match Game', icon: Link },
              ].map((tool, i, arr) => (
                <TouchableOpacity
                  key={tool.type}
                  style={[styles.toolPickerItem, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
                  onPress={() => {
                    setActiveTool(tool);
                    setShowToolPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <tool.icon size={18} color={theme.textSecondary} style={styles.toolPickerEmoji} />
                  <Text style={[styles.toolPickerLabel, { color: theme.textSecondary }]}>{tool.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={[styles.inputWrap, { backgroundColor: theme.backgroundSecondary }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder={activeTool ? `Enter topic for ${activeTool.label}...` : 'Ask anything...'}
              placeholderTextColor={theme.textTertiary} value={inputText}
              onChangeText={setInputText} multiline editable={!isTyping}
              onFocus={() => setShowToolPicker(false)}
            />
            
            <View style={styles.inputBottomRow}>
              <View style={styles.inputBottomLeft}>
                <TouchableOpacity style={styles.plusBtn} onPress={() => { setShowToolPicker(!showToolPicker); if (activeTool) { setActiveTool(null); setShowToolPicker(false); } }}>
                  <Plus size={20} color={showToolPicker ? theme.primary : theme.textSecondary} />
                </TouchableOpacity>

                {/* Active tool chip */}
                {activeTool && (
                  <View style={[styles.toolChip, { backgroundColor: theme.backgroundTertiary, borderColor: theme.border }]}>
                    <activeTool.icon size={14} color={theme.textSecondary} />
                    <Text style={[styles.toolChipText, { color: theme.textSecondary }]}>{activeTool.label}</Text>
                    <TouchableOpacity onPress={() => setActiveTool(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <X size={14} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {(inputText.trim().length > 0 || activeTool) ? (
                <TouchableOpacity onPress={handleSend} disabled={isTyping || !inputText.trim()}>
                  <View style={[styles.sendBtnSolid, { backgroundColor: inputText.trim() ? theme.text : theme.backgroundTertiary }]}>
                    <ArrowRight size={18} color={inputText.trim() ? theme.background : theme.textSecondary} />
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.micBtn}>
                  <Mic size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Text style={[styles.disclaimer, { color: theme.textTertiary }]}>KTUfy can make mistakes. Verify important info.</Text>
        </View>
      </KeyboardAvoidingView>

      {/* FAB Menu Overlay */}
      {isFabOpen && (
        <Animated.View 
          style={[
            StyleSheet.absoluteFillObject, 
            { 
              backgroundColor: 'rgba(0,0,0,0.8)', 
              zIndex: 40,
              opacity: fabAnimation,  // fades in/out with the FAB animation
            }
          ]}
          pointerEvents="none"  // let touches pass through to the TouchableOpacity below
        />
      )}
      {isFabOpen && (
        <TouchableOpacity 
          style={[StyleSheet.absoluteFillObject, { zIndex: 41 }]} 
          activeOpacity={1} 
          onPress={toggleFab} 
        />
      )}
      <View
          style={[
            styles.fabContainer,
            {
                  bottom: (keyboardHeight > 0
                            ? keyboardHeight        // keyboard open: sit above it
                            : insets.bottom         // keyboard closed: respect safe area
                          ) + inputAreaHeight + 8,
              right: insets.right + 16,
              pointerEvents: 'box-none',
            },
          ]}
        >
        {fabItems.map((item, index) => {
          const translateY = fabAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -fabItemSpacing * (index + 1)]
          });
          const scale = fabAnimation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.5, 1]
          });
          return (
            <Animated.View key={index} pointerEvents={isFabOpen ? 'auto' : 'none'} style={[styles.fabItemWrap, { transform: [{ translateY }, { scale }], opacity: fabAnimation }]}>
              <View style={[styles.fabLabelWrap, { backgroundColor: theme.backgroundSecondary }]}>
                <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.fabLabel, { color: theme.text }]}>{item.label}</Text>
              </View>
              <TouchableOpacity style={[styles.fabItem, { backgroundColor: theme.backgroundSecondary }]} onPress={() => { toggleFab(); navigation.navigate(item.route as any); }}>
                <item.icon size={20} color={theme.text} />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
        
        {/* Main FAB */}
        <Animated.View style={[styles.mainFabWrap, {
          transform: [{ rotate: fabAnimation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }]
        }]}>
          <TouchableOpacity onPress={toggleFab} activeOpacity={0.8}>
            <LinearGradient colors={['#3B82F6', '#10B981']} style={styles.mainFab}>
              <Plus size={24} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Sidebar Overlay */}
      <View style={[StyleSheet.absoluteFillObject, { zIndex: 100, pointerEvents: showSidebar ? 'box-none' : 'none' }]}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={closeSidebar} disabled={!showSidebar} />
          </Animated.View>

          <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnim }], backgroundColor: theme.backgroundSecondary }]}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
              <View style={styles.sbHeader}>
                <TouchableOpacity style={styles.sbProfile} onPress={() => { closeSidebar(); navigation.navigate('Profile'); }}>
                  <View style={styles.sbAvatar}>
                    <Text style={{color:'#fff', fontWeight:'bold'}}>{userData?.name?.[0] || 'A'}</Text>
                    <View style={styles.onlineDot} />
                  </View>
                  <View style={styles.sbProfileText}>
                    <Text style={[styles.sbName, { color: theme.text }]}>{userData?.name || 'Student'}</Text>
                    <Text style={[styles.sbCourse, { color: theme.textSecondary }]}>{userData?.semester || 'S4'} · {userData?.branch || 'CSE'} · KTU</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={closeSidebar}><X size={24} color={theme.textSecondary} /></TouchableOpacity>
              </View>

              <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
                {upcomingExams.length === 0 ? (
                  <View style={[styles.sbSearch, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.backgroundTertiary, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginHorizontal: 0, paddingVertical: 16 }]}>
                    <Text style={{ color: theme.textTertiary, fontSize: 12 }}>No new notifications</Text>
                  </View>
                ) : (
                  upcomingExams.map((ex, i) => (
                    <View key={i} style={[styles.sbSearch, { backgroundColor: theme.backgroundTertiary, flexDirection: 'row', alignItems: 'center', marginHorizontal: 0, padding: 12, marginBottom: 8 }]}>
                      <Bell size={16} color={theme.error} />
                      <Text style={[styles.sbExamText, { color: theme.text, flex: 1 }]} numberOfLines={1}>{ex.title}</Text>
                      <TouchableOpacity onPress={() => setUpcomingExams(prev => prev.filter((_, idx) => idx !== i))}>
                        <X size={16} color={theme.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>

              <ScrollView style={styles.sbScroll} showsVerticalScrollIndicator={false}>

                {/* AI Tools */}
                <View style={styles.sbSection}>
                  <Text style={[styles.sbSectionTitle, { color: theme.textTertiary }]}>AI TOOLS</Text>
                  <TouchableOpacity style={styles.sbToolItem} onPress={() => { closeSidebar(); navigation.navigate('SyllabusViewer'); }}>
                    <BookOpen size={20} color={'#3B82F6'} />
                    <Text style={[styles.sbToolText, { color: theme.text }]}>Syllabus Viewer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sbToolItem} onPress={() => { closeSidebar(); navigation.navigate('GPACalculator'); }}>
                    <Calculator size={20} color={'#10B981'} />
                    <Text style={[styles.sbToolText, { color: theme.text }]}>GPA Calculator</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sbToolItem} onPress={() => { closeSidebar(); navigation.navigate('Flashcards'); }}>
                    <Zap size={20} color={'#F59E0B'} />
                    <Text style={[styles.sbToolText, { color: theme.text }]}>Flashcard Generator</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sbToolItem} onPress={() => { closeSidebar(); navigation.navigate('Ticklist'); }}>
                    <CheckSquare size={20} color={'#FB923C'} />
                    <Text style={[styles.sbToolText, { color: theme.text }]}>Study Checklist</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sbToolItem} onPress={() => { closeSidebar(); navigation.navigate('CodingHub'); }}>
                    <Code size={20} color={'#34D399'} />
                    <Text style={[styles.sbToolText, { color: theme.text }]}>Coding Hub</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sbToolItem} onPress={() => { closeSidebar(); navigation.navigate('LearningZone'); }}>
                    <Gamepad2 size={20} color={'#F472B6'} />
                    <Text style={[styles.sbToolText, { color: theme.text }]}>Learning Zone</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sbToolItem} onPress={() => { closeSidebar(); navigation.navigate('Library'); }}>
                    <Library size={20} color={'#38BDF8'} />
                    <Text style={[styles.sbToolText, { color: theme.text }]}>Library</Text>
                  </TouchableOpacity>
                </View>

                {/* Recent Chats */}
                <View style={styles.sbSection}>
                  <Text style={[styles.sbSectionTitle, { color: theme.textTertiary }]}>RECENT</Text>
                  {Object.entries(groupedSessions).length === 0 ? (
                    <Text style={{ color: theme.textTertiary, paddingHorizontal: 12, fontSize: 13 }}>No recent chats.</Text>
                  ) : (
                    Object.entries(groupedSessions).map(([group, gSessions]) => (
                      <React.Fragment key={group}>
                        <Text style={[styles.sbGroupTitle, { color: theme.textTertiary, marginTop: 8 }]}>{group}</Text>
                        {gSessions.map(s => (
                          <View key={s.id} style={styles.sbChatRow}>
                            <TouchableOpacity style={styles.sbChatItem} onPress={() => loadChatSession(s.id)}>
                              <FileText size={16} color={theme.textTertiary} />
                              <Text style={[styles.sbChatText, { color: theme.text }]} numberOfLines={1}>{s.title}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.sbMenuBtn, { backgroundColor: theme.backgroundTertiary }]}
                              onPress={() => setMenuSessionId(prev => (prev === s.id ? null : s.id))}
                            >
                              <MoreVertical size={16} color={theme.textSecondary} />
                            </TouchableOpacity>
                            {menuSessionId === s.id && (
                              <View style={[styles.sbMenu, { backgroundColor: theme.backgroundSecondary, borderColor: theme.backgroundTertiary }]}
                                pointerEvents="box-none"
                              >
                                <TouchableOpacity
                                  style={styles.sbMenuItem}
                                  onPress={() => {
                                    setMenuSessionId(null);
                                    handleDeleteSession(s.id);
                                  }}
                                >
                                  <Trash2 size={16} color={theme.error} />
                                  <Text style={[styles.sbMenuText, { color: theme.error }]}>Delete</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        ))}
                      </React.Fragment>
                    ))
                  )}
                </View>
              </ScrollView>

              <View style={[styles.sbFooter, { borderTopColor: theme.backgroundTertiary }]}>
                <TouchableOpacity style={styles.sbFooterBtn} onPress={() => { closeSidebar(); navigation.navigate('Settings'); }}>
                  <Settings size={20} color={theme.textSecondary} />
                  <Text style={[styles.sbFooterText, { color: theme.text }]}>Settings & Profile</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Animated.View>
      </View>

      {/* Delete Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.backgroundTertiary }]}
            >
            <Text style={[styles.modalTitle, { color: theme.text }]}>Delete chat</Text>
            <Text style={[styles.modalBody, { color: theme.textSecondary }]}>This will permanently remove the chat history.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnGhost, { borderColor: theme.backgroundTertiary }]} onPress={() => setShowDeleteModal(false)}>
                <Text style={[styles.modalBtnText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnDanger]} onPress={confirmDeleteSession}>
                <Text style={styles.modalBtnTextDanger}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  hBtn: { padding: 8 },
  hTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  hBrandDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  hTitle: { fontSize: 18, fontWeight: '800' },
  mainArea: { flex: 1 },
  greetingScroll: { flexGrow: 1, paddingBottom: 100 },
  greetingCenter: { alignItems: 'center', marginTop: height * 0.1, paddingHorizontal: 24, marginBottom: 40 },
  avatarContainer: { marginBottom: 20 },
  avatarRing: { width: 80, height: 80, borderRadius: 40, padding: 3, justifyContent: 'center', alignItems: 'center' },
  avatarInner: { width: '100%', height: '100%', borderRadius: 40, backgroundColor: '#121218', justifyContent: 'center', alignItems: 'center' },
  greetName: { fontSize: FONT.h2, marginBottom: 8, fontWeight: '500' },
  greetHeadline: { fontSize: FONT.display - 5, fontWeight: '800', textAlign: 'center', marginBottom: 12, lineHeight: 40 },
  greetSub: { fontSize: FONT.body, textAlign: 'center', lineHeight: 22 },
  chipsScroll: { paddingHorizontal: 20, gap: 12 },
  chipCard: {
    minWidth: 150,
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#252533'
  },
  chipText: { fontSize: FONT.body, fontWeight: '600', letterSpacing: 0.2 },
  msgList: { flex: 1 },
  msgContent: { paddingHorizontal: 6, paddingTop: 16, paddingBottom: 100 },
  msgRow: { flexDirection: 'row', marginBottom: 12, marginHorizontal: 4 },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },
  aiLine: { width: 4, height: 20, borderRadius: 2, marginRight: 8, marginTop: 14 },
  bubble: { maxWidth: '94%', borderRadius: 20, padding: 12 },
  userBubble: { borderBottomRightRadius: 4 },
  aiBubble: { paddingLeft: 0, paddingVertical: 4 },
  msgText: { fontSize: FONT.body, lineHeight: 24 },
  markdownContainer: { flexShrink: 1, gap: 4 },
  codeBlock: { backgroundColor: '#111111', borderRadius: 10, padding: 12, marginVertical: 8, borderWidth: 1, borderColor: '#333', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4 },
  codeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 6 },
  codeLang: { color: '#AAA', fontSize: FONT.micro + 1, fontWeight: '600', textTransform: 'uppercase' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 4, backgroundColor: '#222', borderRadius: 6 },
  copyText: { color: '#888', fontSize: FONT.micro, fontWeight: '600' },
  codeText: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: FONT.body - 2, color: '#E4E4E4' },
  inlineCode: { backgroundColor: '#2D2D2D', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: FONT.body - 1, color: '#E06C75', paddingHorizontal: 4, borderRadius: 4 },
  tableWrapper: { marginVertical: 6, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#333', maxWidth: width - 50 },
  table: { minWidth: '100%' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#333' },
  tableCell: { padding: 8, fontSize: FONT.body - 1, borderRightWidth: 1, borderRightColor: '#333', width: 140 },
  tableHeaderCell: { fontWeight: '700', backgroundColor: '#222' },
  inputArea: { paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 30 : 16, paddingTop: 10, position: 'relative' },
  inputWrap: { flexDirection: 'column', borderRadius: 24, paddingHorizontal: 6, paddingVertical: 6, minHeight: 56 },
  plusBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  input: { maxHeight: 120, minHeight: 40, fontSize: FONT.body, paddingHorizontal: 10, paddingTop: 10, paddingBottom: 6 },
  inputBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inputBottomLeft: { flexDirection: 'row', alignItems: 'center' },
  micBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  sendBtnGradient: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  sendBtnSolid: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  disclaimer: { textAlign: 'center', fontSize: FONT.micro, marginTop: 10 },
  
  // Tool Picker & Chip
  toolPickerPopover: {
    position: 'absolute',
    bottom: '100%',
    left: 16,
    width: 220,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  toolPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  toolPickerEmoji: {
    marginRight: 12,
  },
  toolPickerLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  toolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginLeft: 4,
    gap: 6,
  },
  toolChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  
  // FAB
// In StyleSheet.create:
fabContainer: { 
  position: 'absolute', 
  alignItems: 'flex-end', 
  zIndex: 50,
  width: width * 0.75,
},
mainFabWrap: { zIndex: 2 },
mainFab: { 
  width: 56, height: 56, borderRadius: 28, 
  justifyContent: 'center', alignItems: 'center', 
  shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, 
  shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 
},
fabItemWrap: { 
  position: 'absolute', 
  bottom: 8, 
  right: 0,           // anchors to right edge of container
  flexDirection: 'row', 
  alignItems: 'center',
},
fabItem: { 
  width: 44, height: 44, borderRadius: 22, 
  justifyContent: 'center', alignItems: 'center', 
  shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, 
  shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 
},
fabLabelWrap: { 
  paddingHorizontal: 12, paddingVertical: 6, 
  borderRadius: 8, marginRight: 10,
  maxWidth: width - 100,   // ← key fix: never wider than screen minus icon+margin
},
fabLabel: { fontSize: 13, fontWeight: '600' },

  // Sidebar
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sidebar: { position: 'absolute', top: 0, bottom: 0, left: 0, width: width * 0.85 },
  sbHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  sbProfile: { flexDirection: 'row', alignItems: 'center' },
  sbAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#121218' },
  sbProfileText: { marginLeft: 12 },
  sbName: { fontSize: 16, fontWeight: '700' },
  sbCourse: { fontSize: 12, marginTop: 2 },
  sbSearch: { marginHorizontal: 20, padding: 12, borderRadius: 12, marginBottom: 20 },
  sbScroll: { flex: 1, paddingHorizontal: 20 },
  sbSection: { marginBottom: 24 },
  sbSectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  sbToolItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4 },
  sbToolText: { fontSize: 15, fontWeight: '600', marginLeft: 16 },
  sbChatRow: { position: 'relative', flexDirection: 'row', alignItems: 'center' },
  sbChatItem: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8 },
  sbChatText: { fontSize: 14, marginLeft: 12 },
  sbMenuBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
  sbMenu: {
    position: 'absolute',
    right: 0,
    top: 36,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 6,
    minWidth: 120,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10
  },
  sbMenuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
  sbMenuText: { fontSize: 14, fontWeight: '600', marginLeft: 10 },
  sbGroupTitle: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, marginBottom: 4, letterSpacing: 0.5 },
  sbExamItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8 },
  sbExamText: { fontSize: 14, marginLeft: 12 },
  sbFooter: { padding: 20, borderTopWidth: 1 },
  sbFooterBtn: { flexDirection: 'row', alignItems: 'center' },
  sbFooterText: { fontSize: 15, fontWeight: '600', marginLeft: 12 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 24 },
  modalCard: { borderRadius: 16, padding: 18, borderWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  modalBody: { fontSize: 14, lineHeight: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 10 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  modalBtnGhost: { borderWidth: 1 },
  modalBtnDanger: { backgroundColor: '#EF4444' },
  modalBtnText: { fontSize: 14, fontWeight: '600' },
  modalBtnTextDanger: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // Tool Action Cards (Flashcard/Quiz/Match in chat)
  toolActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  },
  toolActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toolActionEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  toolActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  toolActionSub: {
    fontSize: 12,
  },
  toolActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 10,
  },
  toolActionBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ChatbotScreen;
