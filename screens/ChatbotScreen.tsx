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
  ChatMessage,
  ChatSession,
} from '../services/chatService';

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
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Load chat sessions on mount
  React.useEffect(() => {
    loadChatSessions();
  }, []);

  // Load chat sessions
  const loadChatSessions = async () => {
    try {
      const sessionList = await getChatSessions();
      setSessions(sessionList);
      
      // If there are sessions, load the most recent one
      if (sessionList.length > 0) {
        const latestSession = sessionList[0];
        await loadChatSession(latestSession.id);
      } else {
        // Show welcome message if no sessions
        setMessages([
          {
            id: 'welcome',
            text: 'Hello! I\'m your AI Study Assistant. I can help you with:\n\n📚 Summarizing modules\n❓ Explaining concepts\n📝 Creating study notes\n🎯 Answering questions\n\nWhat would you like to learn today?',
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (err: any) {
      console.error('Error loading chat sessions:', err);
      setError('Failed to load chat history');
      // Show welcome message on error
      setMessages([
        {
          id: 'welcome',
          text: 'Hello! I\'m your AI Study Assistant. I can help you with:\n\n📚 Summarizing modules\n❓ Explaining concepts\n📝 Creating study notes\n🎯 Answering questions\n\nWhat would you like to learn today?',
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  };

  // Load a specific chat session
  const loadChatSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const session = await getChatSession(sessionId);
      setCurrentSessionId(sessionId);
      
      // Convert backend messages to UI format
      const convertedMessages: Message[] = session.messages.map((msg) => ({
        id: msg.id,
        text: msg.content,
        isUser: msg.role === 'user',
        timestamp: new Date(msg.created_at),
      }));
      
      setMessages(convertedMessages);
      setError(null);
    } catch (err: any) {
      console.error('Error loading chat session:', err);
      setError('Failed to load chat session');
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    'Help me understand this topic',
    'Explain a concept',
    'Create study notes',
    'Quiz me on a topic',
  ];

  const handleSend = async () => {
    if (inputText.trim() === '' || isTyping) return;

    const messageText = inputText.trim();
    
    // Create optimistic user message
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    setError(null);

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
      
      Alert.alert('Error', 'Failed to send message. Please check your connection and try again.');
    } finally {
      setIsTyping(false);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
  };

  const handleNewChat = async () => {
    try {
      const newSession = await createChatSession();
      setCurrentSessionId(newSession.id);
      setMessages([
        {
          id: 'welcome',
          text: 'Hello! I\'m your AI Study Assistant. What would you like to learn today?',
          isUser: false,
          timestamp: new Date(),
        },
      ]);
      await loadChatSessions();
    } catch (err: any) {
      console.error('Error creating new chat:', err);
      Alert.alert('Error', 'Failed to create new chat session.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <View style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>🤖</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>AI Study Assistant</Text>
            <Text style={styles.headerSubtitle}>
              {currentSessionId ? `Session: ${currentSessionId.slice(0, 8)}...` : 'No active session'}
            </Text>
          </View>
          <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
            <Text style={styles.newChatButtonText}>+ New</Text>
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

        {/* Quick Questions */}
        {messages.length <= 1 && !isLoading && (
          <View style={styles.quickQuestionsContainer}>
            <Text style={styles.quickQuestionsTitle}>Quick questions:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {quickQuestions.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickQuestionChip}
                  onPress={() => setInputText(question)}
                >
                  <Text style={styles.quickQuestionText}>{question}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Loading chat history...</Text>
          </View>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageWrapper,
                message.isUser ? styles.userMessageWrapper : styles.aiMessageWrapper,
              ]}
            >
              {!message.isUser && (
                <View style={styles.aiMessageAvatar}>
                  <Text style={styles.aiMessageAvatarText}>🤖</Text>
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  message.isUser ? styles.userMessage : styles.aiMessage,
                ]}
              >
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
                    styles.timestamp,
                    message.isUser ? styles.userTimestamp : styles.aiTimestamp,
                  ]}
                >
                  {message.timestamp.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          ))}
          
          {isTyping && (
            <View style={[styles.messageWrapper, styles.aiMessageWrapper]}>
              <View style={styles.aiMessageAvatar}>
                <Text style={styles.aiMessageAvatarText}>🤖</Text>
              </View>
              <View style={[styles.messageBubble, styles.aiMessage]}>
                <View style={styles.typingIndicator}>
                  <View style={styles.typingDot} />
                  <View style={[styles.typingDot, styles.typingDotDelay1]} />
                  <View style={[styles.typingDot, styles.typingDotDelay2]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ask me anything about your syllabus..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, inputText.trim() === '' && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={inputText.trim() === ''}
            >
              <Text style={styles.sendButtonText}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  aiAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiAvatarText: {
    fontSize: 24,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
  },
  newChatButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newChatButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FCA5A5',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    flex: 1,
  },
  errorClose: {
    color: '#DC2626',
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  quickQuestionsContainer: {
    padding: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  quickQuestionsTitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    fontWeight: '500',
  },
  quickQuestionChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  quickQuestionText: {
    color: '#6366F1',
    fontSize: 13,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  userMessageWrapper: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiMessageWrapper: {
    alignSelf: 'flex-start',
  },
  aiMessageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  aiMessageAvatarText: {
    fontSize: 16,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '100%',
  },
  userMessage: {
    backgroundColor: '#6366F1',
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: '#1A1A2E',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 6,
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: '#9CA3AF',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 2,
  },
  typingDotDelay1: {
    opacity: 0.7,
  },
  typingDotDelay2: {
    opacity: 0.4,
  },
  inputContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A2E',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ChatbotScreen;
