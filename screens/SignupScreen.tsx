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
import { SignupScreenNavigationProp } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';

interface SignupScreenProps {
  navigation: SignupScreenNavigationProp;
}

interface ParsedRegistration {
  college: string;
  yearJoined: number;
  yearEnding: number;
  branch: string;
  rollNumber: string;
  isValid: boolean;
}

type SignupStep = 1 | 2 | 3 | 4 | 5;

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedInfo, setParsedInfo] = useState<ParsedRegistration | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [step, setStep] = useState<SignupStep>(1);

  // Parse registration number format: MEA22CS051
  const parseRegistrationNumber = (regNum: string): ParsedRegistration => {
    const upperRegNum = regNum.trim().toUpperCase();

    // Pattern: 3 letters (college) + 2 digits (year) + 2 letters (branch) + digits (roll number)
    const pattern = /^([A-Z]{3})(\d{2})([A-Z]{2})(\d+)$/;
    const match = upperRegNum.match(pattern);

    if (!match) {
      return {
        college: '',
        yearJoined: 0,
        yearEnding: 0,
        branch: '',
        rollNumber: '',
        isValid: false,
      };
    }

    const [, college, yearCode, branch, rollNum] = match;
    const yearJoined = 2000 + parseInt(yearCode, 10);
    const yearEnding = yearJoined + 4;

    return {
      college,
      yearJoined,
      yearEnding,
      branch,
      rollNumber: rollNum,
      isValid: true,
    };
  };

  // Handle registration number change (parse on continue instead)
  const handleRegistrationChange = (text: string) => {
    setRegistrationNumber(text);
    setParsedInfo(null);
    setRegistrationError(null);
  };

  const handleRegistrationContinue = () => {
    const parsed = parseRegistrationNumber(registrationNumber);

    if (!parsed.isValid) {
      setParsedInfo(parsed);
      setRegistrationError('Invalid format. Use something like MEA22CS051.');
      return;
    }

    setParsedInfo(parsed);
    setRegistrationError(null);
    setStep(3);
  };

  const { signUp } = useAuth();

  const handleSignup = async () => {
    if (!name || !registrationNumber || !email || !password || !confirmPassword) {
      setSignupError('Please fill in all fields');
      return;
    }

    const parsed = parseRegistrationNumber(registrationNumber);
    if (!parsed.isValid) {
      setSignupError('Invalid registration number. Use format like MEA22CS051');
      return;
    }

    if (password !== confirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setSignupError('Password must be at least 6 characters long');
      return;
    }

    setSignupError(null);
    setLoading(true);
    try {
      // Build metadata object with parsed registration details.
      // This gets stored in auth.users.raw_user_meta_data, and the
      // on_auth_user_created trigger automatically creates the public.users row from it.
      const metadata = {
        name,
        registration_number: registrationNumber.toUpperCase(),
        college: parsed.college,
        branch: parsed.branch,
        year_joined: parsed.yearJoined,
        year_ending: parsed.yearEnding,
        roll_number: parsed.rollNumber,
      };

      // Pass metadata to signUp so auth.users.user_metadata is populated server-side.
      // The DB trigger on_auth_user_created handles creating the public.users profile row.
      await signUp(email, password, metadata);

      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error: any) {
      const errorMessage = error.message || 'Signup failed. Please try again.';
      setSignupError(errorMessage);
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
            <View style={styles.headerRow}>
              <Text style={[styles.appName, { color: '#E5E7EB' }]}>Create account</Text>
              <View style={styles.stepperPills}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <View
                    key={s}
                    style={[
                      styles.stepDot,
                      s <= step
                        ? { backgroundColor: theme.primary }
                        : { backgroundColor: theme.divider },
                    ]}
                  />
                ))}
              </View>
            </View>

            <Text style={[styles.title, { color: '#E5E7EB' }]}>
              Tell us about you
            </Text>

            {step === 1 && (
              <View style={styles.form}>
                <Text style={[styles.sectionTitle, { color: '#E5E7EB' }]}>
                  What should we call you?
                </Text>
                <Text style={[styles.sectionSubtitle, { color: '#9CA3AF' }]}>
                  This helps us greet you across the app.
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
                  placeholder="Full name"
                  placeholderTextColor={theme.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { backgroundColor: theme.primary },
                    (!name || loading) && styles.primaryButtonDisabled,
                  ]}
                  disabled={!name || loading}
                  onPress={() => setStep(2)}
                  activeOpacity={0.9}
                >
                  <Text style={styles.primaryButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 2 && (
              <View style={styles.form}>
                <TouchableOpacity
                  onPress={() => setStep(1)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={[styles.backLink, { color: theme.primary }]}>← Back</Text>
                </TouchableOpacity>

                <Text style={[styles.sectionTitle, { color: '#E5E7EB' }]}>
                  What’s your register number?
                </Text>
                <Text style={[styles.sectionSubtitle, { color: '#9CA3AF' }]}>
                  Format: COL (3 letters) + YY (year) + BR (branch) + roll.
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
                  placeholder="Registration number (e.g., MEA22CS051)"
                  placeholderTextColor={theme.textSecondary}
                  value={registrationNumber}
                  onChangeText={handleRegistrationChange}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />

                {registrationError && registrationNumber.length > 0 && (
                  <View
                    style={[
                      styles.errorInfo,
                      {
                        backgroundColor: theme.error + '20',
                        borderColor: theme.error,
                      },
                    ]}
                  >
                    <Text style={[styles.errorText, { color: theme.error }]}>{registrationError}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { backgroundColor: theme.primary },
                    (!registrationNumber || loading) &&
                      styles.primaryButtonDisabled,
                  ]}
                  disabled={!registrationNumber || loading}
                  onPress={handleRegistrationContinue}
                  activeOpacity={0.9}
                >
                  <Text style={styles.primaryButtonText}>Looks good</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 3 && parsedInfo && parsedInfo.isValid && (
              <View style={styles.form}>
                <TouchableOpacity
                  onPress={() => setStep(2)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={[styles.backLink, { color: theme.primary }]}>← Edit details</Text>
                </TouchableOpacity>

                <Text style={[styles.sectionTitle, { color: '#E5E7EB' }]}>
                  Does this look correct?
                </Text>
                <Text style={[styles.sectionSubtitle, { color: '#9CA3AF' }]}>
                  We’ll use this to tailor notes, schedules and resources just for you.
                </Text>

                <View
                  style={[
                    styles.reviewCard,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>
                    Name
                  </Text>
                  <Text style={[styles.reviewValue, { color: theme.text }]}>
                    {name}
                  </Text>

                  <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>
                    Register number
                  </Text>
                  <Text style={[styles.reviewValue, { color: theme.text }]}>
                    {registrationNumber.toUpperCase()}
                  </Text>

                  <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>
                    College / Branch
                  </Text>
                  <Text style={[styles.reviewValue, { color: theme.text }]}>
                    {parsedInfo.college} • {parsedInfo.branch}
                  </Text>

                  <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>
                    Batch
                  </Text>
                  <Text style={[styles.reviewValue, { color: theme.text }]}>
                    {parsedInfo.yearJoined} – {parsedInfo.yearEnding}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { backgroundColor: theme.primary },
                    loading && styles.primaryButtonDisabled,
                  ]}
                  disabled={loading}
                  onPress={() => setStep(4)}
                  activeOpacity={0.9}
                >
                  <Text style={styles.primaryButtonText}>Yes, continue</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 4 && (
              <View style={styles.form}>
                <TouchableOpacity
                  onPress={() => setStep(3)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={[styles.backLink, { color: theme.primary }]}>← Back</Text>
                </TouchableOpacity>

                <Text style={[styles.sectionTitle, { color: '#E5E7EB' }]}>
                  How do you want to sign in?
                </Text>
                <Text style={[styles.sectionSubtitle, { color: '#9CA3AF' }]}>
                  Choose your preferred method.
                </Text>

                <View style={styles.signInChoiceColumn}>
                  <TouchableOpacity
                    style={styles.googleButton}
                    activeOpacity={0.85}
                  >
                    <View style={styles.googleContent}>
                      <Text style={styles.googleLabel}>Sign in with Google</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.emailChoiceButton,
                      { borderColor: theme.primary, backgroundColor: 'transparent' },
                    ]}
                    activeOpacity={0.9}
                    onPress={() => setStep(5)}
                  >
                    <Text
                      style={[
                        styles.emailChoiceText,
                        { color: theme.primary },
                      ]}
                    >
                      Use email instead
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === 5 && (
              <View style={styles.form}>
                <TouchableOpacity
                  onPress={() => setStep(4)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={[styles.backLink, { color: theme.primary }]}>← Back</Text>
                </TouchableOpacity>

                <Text style={[styles.sectionTitle, { color: '#E5E7EB' }]}>
                  Sign in with email
                </Text>
                <Text style={[styles.sectionSubtitle, { color: '#9CA3AF' }]}>
                  Add an email and password for your account.
                </Text>

                {signupError && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorMessage}>{signupError}</Text>
                  </View>
                )}

                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: signupError ? '#EF4444' : theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Email address"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setSignupError(null);
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
                      borderColor: signupError ? '#EF4444' : theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Create a password"
                  placeholderTextColor={theme.textSecondary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setSignupError(null);
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                />

                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: signupError ? '#EF4444' : theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Confirm password"
                  placeholderTextColor={theme.textSecondary}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setSignupError(null);
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { backgroundColor: theme.primary },
                    (loading ||
                      !email ||
                      !password ||
                      !confirmPassword ||
                      !name ||
                      !registrationNumber) &&
                      styles.primaryButtonDisabled,
                  ]}
                  onPress={handleSignup}
                  disabled={
                    loading ||
                    !email ||
                    !password ||
                    !confirmPassword ||
                    !name ||
                    !registrationNumber
                  }
                  activeOpacity={0.9}
                >
                  <Text style={styles.primaryButtonText}>
                    {loading ? 'Creating your space…' : 'Create my account'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.linkText, { color: theme.primary }]}>Sign in</Text>
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
    opacity: 0.5,
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
  content: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  stepperPills: {
    flexDirection: 'row',
    gap: 4,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    marginTop: 16,
    marginBottom: 24,
    gap: 14,
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
  backLink: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    borderWidth: 1,
  },
  errorContainer: {
    marginBottom: 12,
  },
  errorMessage: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '500',
  },
  parsedInfo: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
  },
  parsedInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  errorInfo: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  reviewCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  reviewLabel: {
    fontSize: 12,
    marginTop: 6,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  primaryButton: {
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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
  signInChoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  signInChoice: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  signInChoiceText: {
    fontSize: 13,
    fontWeight: '600',
  },
  signInChoiceColumn: {
    marginTop: 8,
    marginBottom: 16,
  },
  googleButton: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 10,
    justifyContent: 'center',
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogoCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  googleLogoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  googleSublabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  emailChoiceButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailChoiceText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SignupScreen;
