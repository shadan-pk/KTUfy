import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { LoginScreenNavigationProp } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

type LoginMode = 'initial' | 'email';

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<LoginMode>('initial');

  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      // Navigation will be handled by the main App component
    } catch (error: any) {
      Alert.alert('Login Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.gradientHalo} />

        <View style={styles.contentWrapper}>
          <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <Text style={[styles.appName, { color: theme.primary }]}>KTUfy</Text>
            <Text style={[styles.title, { color: theme.text }]}>
              Dive back into your study flow
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Sign in to sync your timetable, resources and progress.
            </Text>

            {mode === 'initial' && (
              <View style={styles.actionGroup}>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                  activeOpacity={0.9}
                >
                  <Text style={styles.primaryButtonText}>Continue with Google</Text>
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                  <Text style={[styles.dividerLabel, { color: theme.textTertiary }]}>or</Text>
                  <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                </View>

                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.backgroundSecondary }]}
                  activeOpacity={0.9}
                  onPress={() => setMode('email')}
                >
                  <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
                    Continue with email
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {mode === 'email' && (
              <View style={styles.form}>
                <View style={styles.stepHeader}>
                  <TouchableOpacity onPress={() => setMode('initial')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={[styles.backLink, { color: theme.textSecondary }]}>‹ All sign-in options</Text>
                  </TouchableOpacity>
                  <Text style={[styles.stepPill, { backgroundColor: theme.primaryLight, color: theme.primaryDark }]}>
                    1 / 1
                  </Text>
                </View>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>Sign in with email</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                  Use the email and password you registered with.
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Email"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Password"
                  placeholderTextColor={theme.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { backgroundColor: theme.primary },
                    (loading || !email || !password) && styles.primaryButtonDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={loading || !email || !password}
                  activeOpacity={0.9}
                >
                  <Text style={styles.primaryButtonText}>
                    {loading ? 'Signing you in…' : 'Continue'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                New to KTUfy?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={[styles.linkText, { color: theme.primary }]}>Create an account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  gradientHalo: {
    position: 'absolute',
    top: -120,
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  contentWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  card: {
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 12,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionGroup: {
    marginTop: 8,
    marginBottom: 24,
  },
  primaryButton: {
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerLabel: {
    marginHorizontal: 10,
    fontSize: 12,
  },
  form: {
    marginTop: 8,
    marginBottom: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backLink: {
    fontSize: 13,
  },
  stepPill: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  input: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    borderWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
