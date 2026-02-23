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

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const [name, setName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedInfo, setParsedInfo] = useState<ParsedRegistration | null>(null);

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
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Sign up to get started</Text>

          <View style={styles.form}>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="Full Name"
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="Registration Number (e.g., MEA22CS051)"
              placeholderTextColor={theme.textSecondary}
              value={registrationNumber}
              onChangeText={handleRegistrationChange}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            {parsedInfo && parsedInfo.isValid && (
              <View style={[styles.parsedInfo, { backgroundColor: theme.success + '20', borderColor: theme.success }]}>
                <Text style={[styles.parsedInfoTitle, { color: theme.success }]}>✓ Registration Info:</Text>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>College:</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>{parsedInfo.college}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Branch:</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>{parsedInfo.branch}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Year:</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>{parsedInfo.yearJoined} - {parsedInfo.yearEnding}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Roll No:</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>{parsedInfo.rollNumber}</Text>
                </View>
              </View>
            )}

            {parsedInfo && !parsedInfo.isValid && registrationNumber.length > 0 && (
              <View style={[styles.errorInfo, { backgroundColor: theme.error + '20', borderColor: theme.error }]}>
                <Text style={[styles.errorText, { color: theme.error }]}>⚠ Invalid format. Use: MEA22CS051</Text>
              </View>
            )}

            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="Email"
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="Password"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="Confirm Password"
              placeholderTextColor={theme.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }, loading && { opacity: 0.6 }]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.linkText, { color: theme.primary }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  parsedInfo: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  parsedInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#558B2F',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#1B5E20',
    fontWeight: '700',
  },
  errorInfo: {
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EF5350',
  },
  errorText: {
    fontSize: 13,
    color: '#C62828',
    fontWeight: '600',
  },
});

export default SignupScreen;
