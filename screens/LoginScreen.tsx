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
  const [error, setError] = useState<string | null>(null);

  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      // Navigation will be handled by the main App component
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please check your email and password.';
      setError(errorMessage);
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
        <View style={styles.logoContainer}>
          <Text
            style={[
              styles.logoText,
              { color: theme.primaryLight },
            ]}
          >
            KTUfy
          </Text>
        </View>

        <View style={styles.bottomSheetWrapper}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: '#050816',
                shadowColor: theme.shadow,
              },
            ]}
          >
            <Text style={[styles.title, { color: '#E5E7EB' }]}>
              Welcome back
            </Text>

            {mode === 'initial' && (
              <View style={styles.actionGroup}>
                <TouchableOpacity
                  style={styles.googleButton}
                  activeOpacity={0.85}
                >
                  <View style={styles.googleContent}>
                    <Text style={styles.googleLabel}>Sign in with Google</Text>
                  </View>
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
                    <Text style={[styles.backLink, { color: theme.primary }]}>← All sign-in options</Text>
                  </TouchableOpacity>
                  <Text style={[styles.stepPill, { backgroundColor: '#1E293B', color: '#E5E7EB' }]}>
                    1 / 1
                  </Text>
                </View>

                <Text style={[styles.sectionTitle, { color: '#E5E7EB' }]}>Sign in with email</Text>

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorMessage}>{error}</Text>
                  </View>
                )}

                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: error ? '#EF4444' : theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Email"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: error ? '#EF4444' : theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Password"
                  placeholderTextColor={theme.textSecondary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError(null);
                  }}
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
              <Text style={[styles.footerText, { color: '#9CA3AF' }]}>
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
    justifyContent: 'flex-end',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 24,
  },
  logoText: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: 10,
    opacity: 1,
    textTransform: 'uppercase',
  },
  bottomSheetWrapper: {
    paddingHorizontal: 0,
  },
  card: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  actionGroup: {
    marginTop: 8,
    marginBottom: 20,
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
  googleButton: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogoCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  googleLogoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F3F4F6',
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
    marginTop: 12,
    marginBottom: 20,
  },
  errorContainer: {
    marginBottom: 12,
  },
  errorMessage: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '500',
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
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 18,
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
