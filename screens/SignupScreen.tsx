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

type SignupStep = 1 | 2 | 3 | 4;

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedInfo, setParsedInfo] = useState<ParsedRegistration | null>(null);
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

  // Handle registration number change and parse it
  const handleRegistrationChange = (text: string) => {
    setRegistrationNumber(text);
    const parsed = parseRegistrationNumber(text);
    setParsedInfo(parsed);
  };

  const { signUp } = useAuth();

  const handleSignup = async () => {
    if (!name || !registrationNumber || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const parsed = parseRegistrationNumber(registrationNumber);
    if (!parsed.isValid) {
      Alert.alert(
        'Invalid Registration Number',
        'Please enter a valid registration number in the format: MEA22CS051\n\n' +
        'Format:\n' +
        '• 3 letters (College code)\n' +
        '• 2 digits (Year joined)\n' +
        '• 2 letters (Branch code)\n' +
        '• Digits (Roll number)'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

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
      Alert.alert('Signup Error', error.message || JSON.stringify(error));
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
            <View style={styles.headerRow}>
              <Text style={[styles.appName, { color: theme.primary }]}>KTUfy</Text>
              <View style={[styles.stepperPills]}>
                {[1, 2, 3, 4].map((s) => (
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

            <Text style={[styles.title, { color: theme.text }]}>
              Tell us about you
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              We’ll personalise your KTUfy experience based on your college, branch and year.
            </Text>

            {step === 1 && (
              <View style={styles.form}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  What should we call you?
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
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
                  <Text style={[styles.backLink, { color: theme.textSecondary }]}>‹ Back</Text>
                </TouchableOpacity>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  What’s your register number?
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                  We’ll decode this to figure out your college, branch and batch.
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

                {parsedInfo && parsedInfo.isValid && (
                  <View
                    style={[
                      styles.parsedInfo,
                      {
                        backgroundColor: theme.primaryLight,
                        borderColor: theme.primaryDark,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.parsedInfoTitle,
                        { color: theme.primaryDark },
                      ]}
                    >
                      We detected your details
                    </Text>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                        College
                      </Text>
                      <Text style={[styles.infoValue, { color: theme.text }]}>
                        {parsedInfo.college}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                        Branch
                      </Text>
                      <Text style={[styles.infoValue, { color: theme.text }]}>
                        {parsedInfo.branch}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                        Years
                      </Text>
                      <Text style={[styles.infoValue, { color: theme.text }]}>
                        {parsedInfo.yearJoined} – {parsedInfo.yearEnding}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                        Roll no.
                      </Text>
                      <Text style={[styles.infoValue, { color: theme.text }]}>
                        {parsedInfo.rollNumber}
                      </Text>
                    </View>
                  </View>
                )}

                {parsedInfo && !parsedInfo.isValid && registrationNumber.length > 0 && (
                  <View
                    style={[
                      styles.errorInfo,
                      {
                        backgroundColor: theme.error + '20',
                        borderColor: theme.error,
                      },
                    ]}
                  >
                    <Text style={[styles.errorText, { color: theme.error }]}>
                      Invalid format. Use something like MEA22CS051.
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { backgroundColor: theme.primary },
                    (!parsedInfo || !parsedInfo.isValid || loading) &&
                      styles.primaryButtonDisabled,
                  ]}
                  disabled={!parsedInfo || !parsedInfo.isValid || loading}
                  onPress={() => setStep(3)}
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
                  <Text style={[styles.backLink, { color: theme.textSecondary }]}>‹ Edit details</Text>
                </TouchableOpacity>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Does this look correct?
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
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
              <View className="form" style={styles.form}>
                <TouchableOpacity
                  onPress={() => setStep(3)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={[styles.backLink, { color: theme.textSecondary }]}>‹ Back</Text>
                </TouchableOpacity>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  How do you want to sign in?
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                  We’ll create your KTUfy account with the method you choose.
                </Text>

                <View style={styles.signInChoiceRow}>
                  <TouchableOpacity
                    style={[
                      styles.signInChoice,
                      { backgroundColor: theme.primaryLight, borderColor: theme.primaryDark },
                    ]}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[
                        styles.signInChoiceText,
                        { color: theme.primaryDark },
                      ]}
                    >
                      Use email
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.signInChoice,
                      { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
                    ]}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[
                        styles.signInChoiceText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Google (coming soon)
                    </Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Email address"
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
                  placeholder="Create a password"
                  placeholderTextColor={theme.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
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
                  placeholder="Confirm password"
                  placeholderTextColor={theme.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
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
    justifyContent: 'center',
  },
  gradientHalo: {
    position: 'absolute',
    top: -140,
    alignSelf: 'center',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(99, 102, 241, 0.22)',
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
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
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
  form: {
    marginTop: 8,
    marginBottom: 20,
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
  backLink: {
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    borderWidth: 1,
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
