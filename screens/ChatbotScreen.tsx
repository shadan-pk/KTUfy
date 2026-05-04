import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert, Dimensions, StatusBar, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ChatbotScreenNavigationProp, RootStackParamList } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../auth/AuthProvider';
import { getUserProfile } from '../supabaseConfig';
import { Menu, Plus, Paperclip, ArrowRight, Mic, X, Pencil, Trash2, Edit, BookOpen, Settings, Bell, Calculator, Zap, FileText, Calendar, CheckSquare, Code, Gamepad2, Library } from 'lucide-react-native';
import {
  sendChatMessage, getChatSessions, getChatSession, updateChatSession, deleteChatSession,
  ChatMessage as BackendChatMessage, ChatSession
} from '../services/chatService';
import { getCachedChatSessions, setCachedChatSessions, getCachedChatHistory, setCachedChatHistory } from '../services/cacheService';
import { useServerStatus } from '../hooks/useServerStatus';
import { getExamSchedule, ExamEvent } from '../services/scheduleService';

const { width, height } = Dimensions.get('window');

const FONT = { display: 39, h1: 24, h2: 20, body: 15, caption: 12, micro: 10 };

interface Message { id: string; text: string; isUser: boolean; timestamp: Date; }

const ChatbotScreen: React.FC<{ navigation: ChatbotScreenNavigationProp }> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
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
  
  // FAB state
  const [isFabOpen, setIsFabOpen] = useState(false);
  const fabAnim = useRef(new Animated.Value(0)).current;

  const streamingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const { serverOnline } = useServerStatus();

  // Sidebar animation
  const sidebarAnim = useRef(new Animated.Value(-width * 0.85)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

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
    ]).start(() => setShowSidebar(false));
  };

  const toggleFab = () => {
    const toValue = isFabOpen ? 0 : 1;
    setIsFabOpen(!isFabOpen);
    Animated.spring(fabAnim, {
      toValue, friction: 5, tension: 40, useNativeDriver: true
    }).start();
  };

  useEffect(() => { loadChatSessions(); }, []);

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

  const loadChatSessions = async () => {
    try {
      setIsLoading(true);
      const cached = await getCachedChatSessions();
      if (cached && cached.length > 0) setSessions(cached);
      try {
        if (serverOnline) {
          const sessionList = await getChatSessions();
          setSessions(sessionList);
          await setCachedChatSessions(sessionList);
        }
      } catch (e) {}
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
    }
  };

  const loadChatSession = async (sessionId: string) => {
    try {
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
    closeSidebar();
  };

  const refreshSessionList = async () => {
    try {
      if (serverOnline) {
        const sessionList = await getChatSessions();
        setSessions(sessionList);
        await setCachedChatSessions(sessionList);
      }
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

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isTyping) return;
    setError(null);
    const userMsg: Message = { id: `user-${Date.now()}`, text: messageText.trim(), isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      if (!serverOnline) throw new Error('Offline');
      const response = await sendChatMessage(messageText, currentSessionId || undefined);
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
    } catch {
      setTimeout(() => {
        const aiMsg: Message = { id: `ai-${Date.now()}`, text: "⚠️ I am offline right now. Please check your connection.", isUser: false, timestamp: new Date() };
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
    sendMessage(text);
  };

  const handleDeleteSession = (sessionId: string) => {
    Alert.alert('Delete Chat', 'Delete this chat?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteChatSession(sessionId);
            if (currentSessionId === sessionId) handleNewChat();
            await loadChatSessions();
          } catch {}
      }}
    ]);
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

  const renderFormattedText = (text: string, color: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <Text key={i} style={{ fontWeight: '700', color }}>{part.slice(2, -2)}</Text>;
      }
      return <Text key={i}>{part}</Text>;
    });
  };

  // FAB items
  const fabItems = [
    { icon: BookOpen, label: 'Syllabus', route: 'SyllabusViewer', color: '#8B5CF6' },
    { icon: Calendar, label: 'Exams', route: 'Schedule', color: '#F43F5E' },
    { icon: Zap, label: 'Flashcards', route: 'Flashcards', color: '#F59E0B' },
    { icon: FileText, label: 'PDF Tools', route: 'PdfTools', color: '#10B981' },
  ];

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

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.mainArea}>
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
              {['📖 S4 CSE syllabus', '⚡ Generate flashcards', '📅 Upcoming exams'].map((chip, i) => (
                <TouchableOpacity key={i} style={[styles.chipCard, { backgroundColor: theme.backgroundSecondary }]} onPress={() => sendMessage(chip.substring(3))}>
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
                  <View style={styles.aiAvatarMsg}>
                     <LinearGradient colors={['#3B82F6', '#10B981']} style={styles.aiAvatarMsgInner} />
                  </View>
                )}
                <View style={[styles.bubble, m.isUser ? [styles.userBubble, { backgroundColor: theme.backgroundSecondary }] : [styles.aiBubble, { backgroundColor: 'transparent' }]]}>
                  {(() => {
                    const displayText = m.id === streamingMsgId ? streamingText : m.text;
                    const textColor = theme.text;
                    return <Text style={[styles.msgText, { color: textColor }]}>{m.isUser ? displayText : renderFormattedText(displayText, textColor)}</Text>;
                  })()}
                </View>
              </View>
            ))}
            {isTyping && (
               <View style={[styles.msgRow, styles.aiRow]}>
                 <View style={styles.aiAvatarMsg}>
                     <LinearGradient colors={['#3B82F6', '#10B981']} style={styles.aiAvatarMsgInner} />
                 </View>
                 <View style={[styles.bubble, styles.aiBubble, { backgroundColor: 'transparent' }]}>
                   <Text style={{color: theme.textSecondary}}>Typing...</Text>
                 </View>
               </View>
            )}
          </ScrollView>
        )}

        {/* Bottom Input */}
        <View style={[styles.inputArea, { backgroundColor: theme.background }]}>
          <View style={[styles.inputWrap, { backgroundColor: theme.backgroundSecondary }]}>
            <TouchableOpacity style={styles.attachBtn}>
              <Paperclip size={20} color={theme.textSecondary} />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { color: theme.text }]} placeholder="Ask KTUfy anything..."
              placeholderTextColor={theme.textTertiary} value={inputText}
              onChangeText={setInputText} multiline editable={!isTyping}
            />
            {inputText.trim().length > 0 ? (
              <TouchableOpacity onPress={handleSend} disabled={isTyping}>
                <LinearGradient colors={['#3B82F6', '#10B981']} style={styles.sendBtnGradient}>
                  <ArrowRight size={18} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.micBtn}>
                <Mic size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.disclaimer, { color: theme.textTertiary }]}>KTUfy can make mistakes. Verify important info.</Text>
        </View>
      </KeyboardAvoidingView>

      {/* FAB Menu Overlay */}
      {isFabOpen && (
        <TouchableOpacity style={[StyleSheet.absoluteFillObject, { zIndex: 40 }]} activeOpacity={1} onPress={toggleFab} />
      )}
      <View style={styles.fabContainer} pointerEvents="box-none">
        {fabItems.map((item, index) => {
          const translateY = fabAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -60 * (index + 1)]
          });
          const scale = fabAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.5, 1]
          });
          return (
            <Animated.View key={index} pointerEvents={isFabOpen ? 'auto' : 'none'} style={[styles.fabItemWrap, { transform: [{ translateY }, { scale }], opacity: fabAnim }]}>
              <View style={[styles.fabLabelWrap, { backgroundColor: theme.backgroundSecondary }]}>
                <Text style={[styles.fabLabel, { color: theme.text }]}>{item.label}</Text>
              </View>
              <TouchableOpacity style={[styles.fabItem, { backgroundColor: theme.backgroundSecondary }]} onPress={() => { toggleFab(); navigation.navigate(item.route as any); }}>
                <item.icon size={20} color={theme.text} />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
        
        {/* Main FAB */}
        <Animated.View style={[styles.mainFabWrap, {
          transform: [{ rotate: fabAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }]
        }]}>
          <TouchableOpacity onPress={toggleFab} activeOpacity={0.8}>
            <LinearGradient colors={['#3B82F6', '#10B981']} style={styles.mainFab}>
              <Plus size={24} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Sidebar Overlay */}
      {showSidebar && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none" zIndex={100}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={closeSidebar} />
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

              <View style={[styles.sbSearch, { backgroundColor: theme.backgroundTertiary }]}>
                <Text style={{ color: theme.textTertiary }}>Search chats...</Text>
              </View>

              <ScrollView style={styles.sbScroll} showsVerticalScrollIndicator={false}>
                {/* Notifications / Exams */}
                {upcomingExams.length > 0 && (
                  <View style={styles.sbSection}>
                    <Text style={[styles.sbSectionTitle, { color: theme.textTertiary }]}>UPCOMING EXAMS</Text>
                    {upcomingExams.map((ex, i) => (
                      <View key={i} style={styles.sbExamItem}>
                        <Bell size={16} color={theme.error} />
                        <Text style={[styles.sbExamText, { color: theme.text }]} numberOfLines={1}>{ex.title}</Text>
                      </View>
                    ))}
                  </View>
                )}

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
                          <TouchableOpacity key={s.id} style={styles.sbChatItem} onPress={() => loadChatSession(s.id)}>
                            <FileText size={16} color={theme.textTertiary} />
                            <Text style={[styles.sbChatText, { color: theme.text }]} numberOfLines={1}>{s.title}</Text>
                          </TouchableOpacity>
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
      )}
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
  chipCard: { width: 140, height: 180, borderRadius: 20, padding: 16, justifyContent: 'flex-end', borderWidth: 1, borderColor: '#1A1A24' },
  chipText: { fontSize: FONT.body, fontWeight: '600' },
  msgList: { flex: 1 },
  msgContent: { padding: 16, paddingBottom: 100 },
  msgRow: { flexDirection: 'row', marginBottom: 20 },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },
  aiAvatarMsg: { width: 28, height: 28, borderRadius: 14, marginRight: 12, marginTop: 4 },
  aiAvatarMsgInner: { width: '100%', height: '100%', borderRadius: 14 },
  bubble: { maxWidth: '80%', borderRadius: 20, padding: 14 },
  userBubble: { borderBottomRightRadius: 4 },
  aiBubble: { paddingLeft: 0 },
  msgText: { fontSize: FONT.body, lineHeight: 24 },
  inputArea: { paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 30 : 16, paddingTop: 10 },
  inputWrap: { flexDirection: 'row', alignItems: 'flex-end', borderRadius: 24, paddingHorizontal: 12, paddingVertical: 8, minHeight: 56 },
  attachBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  input: { flex: 1, maxHeight: 120, minHeight: 40, fontSize: FONT.body, paddingTop: 10, paddingBottom: 10 },
  micBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  sendBtnGradient: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  disclaimer: { textAlign: 'center', fontSize: FONT.micro, marginTop: 10 },
  
  // FAB
  fabContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? 110 : 90, right: 20, alignItems: 'flex-end', zIndex: 50 },
  mainFabWrap: { zIndex: 2 },
  mainFab: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabItemWrap: { position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center' },
  fabItem: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  fabLabelWrap: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 12 },
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
  sbChatItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8 },
  sbChatText: { fontSize: 14, marginLeft: 12 },
  sbGroupTitle: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, marginBottom: 4, letterSpacing: 0.5 },
  sbExamItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8 },
  sbExamText: { fontSize: 14, marginLeft: 12 },
  sbFooter: { padding: 20, borderTopWidth: 1 },
  sbFooterBtn: { flexDirection: 'row', alignItems: 'center' },
  sbFooterText: { fontSize: 15, fontWeight: '600', marginLeft: 12 }
});

export default ChatbotScreen;
