import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthProvider';
import supabase from '../supabaseClient';
import { ProfileScreenNavigationProp } from '../types/navigation';
import { 
  getCurrentUserProfile, 
  updateUserProfile, 
  requestPasswordReset,
  requestEmailVerification,
  deleteUserAccount,
  UserProfile 
} from '../services/userService';

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user: authUser, getToken, signOut } = useAuth();
  const [supabaseUser, setSupabaseUser] = React.useState<any | null>(null);
  const [userData, setUserData] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // Full profile edit modal state
  const [showEditProfileModal, setShowEditProfileModal] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    name: '',
    registration_number: '',
    college: '',
    branch: '',
    year_joined: '',
    year_ending: '',
    roll_number: '',
  });
  const [savingProfile, setSavingProfile] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        // Get user from supabase session for email verification status
        const { data: userRes, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        const sUser = userRes?.user ?? null;
        setSupabaseUser(sUser);

        // Get token to verify authentication
        const token = await getToken();
        if (!token) {
          setUserData(null);
          setLoading(false);
          return;
        }

        // Fetch profile from backend API
        const profile = await getCurrentUserProfile();
        setUserData(profile);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError('Unable to load profile data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleEditProfile = () => {
    // Pre-fill the form with current data
    setEditForm({
      name: userData?.name || '',
      registration_number: userData?.registration_number || '',
      college: userData?.college || '',
      branch: userData?.branch || '',
      year_joined: userData?.year_joined?.toString() || '',
      year_ending: userData?.year_ending?.toString() || '',
      roll_number: userData?.roll_number || '',
    });
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setSavingProfile(true);
    try {
      // Prepare update data
      const updateData: Partial<UserProfile> = {
        name: editForm.name.trim(),
      };

      // Add optional fields only if they have values
      if (editForm.registration_number.trim()) {
        updateData.registration_number = editForm.registration_number.trim();
      }
      if (editForm.college.trim()) {
        updateData.college = editForm.college.trim();
      }
      if (editForm.branch.trim()) {
        updateData.branch = editForm.branch.trim();
      }
      if (editForm.year_joined.trim()) {
        updateData.year_joined = parseInt(editForm.year_joined);
      }
      if (editForm.year_ending.trim()) {
        updateData.year_ending = parseInt(editForm.year_ending);
      }
      if (editForm.roll_number.trim()) {
        updateData.roll_number = editForm.roll_number.trim();
      }

      // Update profile via backend API
      const updatedProfile = await updateUserProfile(updateData);

      setUserData(updatedProfile);
      setShowEditProfileModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = () => {
    if (!userData?.email && !supabaseUser?.email) {
      Alert.alert('Error', 'Email not found');
      return;
    }

    Alert.alert(
      'Reset Password',
      `We'll send a password reset link to ${userData?.email || supabaseUser?.email}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send Reset Link',
          onPress: async () => {
            try {
              await requestPasswordReset(userData?.email || supabaseUser?.email || '');
              Alert.alert(
                'Success',
                'Password reset email sent! Please check your inbox.',
                [{ text: 'OK' }]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to send reset email');
            }
          },
        },
      ]
    );
  };

  const handleVerifyEmail = async () => {
    if (supabaseUser?.email_confirmed_at) {
      Alert.alert('Email Verified', 'Your email is already verified!');
      return;
    }

    try {
      await requestEmailVerification();
      Alert.alert(
        'Verification Email Sent',
        'Please check your inbox and click the verification link.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send verification email');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Navigation will automatically redirect to Login screen
              // because of the auth state listener in App.tsx
            } catch (error: any) {
              Alert.alert('Logout Error', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(userData?.name?.charAt(0) || supabaseUser?.email?.charAt(0) || 'U').toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.userName}>
            {userData?.name || supabaseUser?.user_metadata?.name || supabaseUser?.email || 'User Name'}
          </Text>
          <Text style={styles.userEmail}>{userData?.email || supabaseUser?.email}</Text>
          {userData?.registration_number && (
            <Text style={styles.userRegistration}>{userData.registration_number}</Text>
          )}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <>
            {/* Registration Details Section */}
            {userData?.registration_number && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📚 Registration Details</Text>
                
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Registration No.</Text>
                    <Text style={styles.infoValue}>{userData.registration_number}</Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>College</Text>
                    <Text style={styles.infoValue}>{userData.college || 'N/A'}</Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Branch</Text>
                    <Text style={styles.infoValue}>{userData.branch || 'N/A'}</Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Academic Year</Text>
                    <Text style={styles.infoValue}>
                      {userData.year_joined && userData.year_ending 
                        ? `${userData.year_joined} - ${userData.year_ending}`
                        : 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Roll Number</Text>
                    <Text style={styles.infoValue}>{userData.roll_number || 'N/A'}</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{userData?.email || supabaseUser?.email}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>User ID</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                {supabaseUser?.id || 'N/A'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email Verified</Text>
              <View style={[
                styles.badge,
                (supabaseUser?.email_confirmed_at ? styles.badgeSuccess : styles.badgeWarning)
              ]}>
                <Text style={styles.badgeText}>
                  {supabaseUser?.email_confirmed_at ? 'Verified' : 'Not Verified'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Created</Text>
              <Text style={styles.infoValue}>
                {userData?.created_at
                  ? new Date(userData.created_at).toLocaleDateString()
                  : supabaseUser?.created_at
                  ? new Date(supabaseUser.created_at).toLocaleDateString()
                  : 'N/A'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Sign In</Text>
              <Text style={styles.infoValue}>
                {supabaseUser?.last_sign_in_at
                  ? new Date(supabaseUser.last_sign_in_at).toLocaleDateString()
                  : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          {!supabaseUser?.email_confirmed_at && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={handleVerifyEmail}
            >
              <Text style={styles.actionButtonText}>Verify Email</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={handleChangePassword}
          >
            <Text style={styles.actionButtonText}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={handleLogout}
          >
            <Text style={styles.actionButtonText}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>
          </>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.editProfileModalScroll}>
            <View style={styles.editProfileModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your full name"
                  value={editForm.name}
                  onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                />
              </View>

              {/* Registration Number */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Registration Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., MEA22CS084"
                  value={editForm.registration_number}
                  onChangeText={(text) => setEditForm({ ...editForm, registration_number: text })}
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                />
              </View>

              {/* College */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>College</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., MEA"
                  value={editForm.college}
                  onChangeText={(text) => setEditForm({ ...editForm, college: text })}
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                />
              </View>

              {/* Branch */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Branch</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., CS, EC, ME"
                  value={editForm.branch}
                  onChangeText={(text) => setEditForm({ ...editForm, branch: text })}
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                />
              </View>

              {/* Roll Number */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Roll Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your roll number"
                  value={editForm.roll_number}
                  onChangeText={(text) => setEditForm({ ...editForm, roll_number: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Academic Years */}
              <View style={styles.yearContainer}>
                <View style={[styles.inputContainer, styles.yearInput]}>
                  <Text style={styles.inputLabel}>Year Joined</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., 2022"
                    value={editForm.year_joined}
                    onChangeText={(text) => setEditForm({ ...editForm, year_joined: text })}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>

                <View style={[styles.inputContainer, styles.yearInput]}>
                  <Text style={styles.inputLabel}>Year Ending</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., 2026"
                    value={editForm.year_ending}
                    onChangeText={(text) => setEditForm({ ...editForm, year_ending: text })}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonCancel}
                  onPress={() => setShowEditProfileModal(false)}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButtonSave, savingProfile && styles.modalButtonDisabled]}
                  onPress={handleSaveProfile}
                  disabled={savingProfile}
                >
                  <Text style={styles.modalButtonSaveText}>
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  userRegistration: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 4,
  },
  errorBanner: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeSuccess: {
    backgroundColor: '#34C759',
  },
  badgeWarning: {
    backgroundColor: '#FF9500',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: '#5856D6',
  },
  actionButtonDanger: {
    backgroundColor: '#FF3B30',
    marginTop: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Edit Profile Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editProfileModalScroll: {
    flex: 1,
    width: '100%',
  },
  editProfileModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginVertical: 40,
    marginHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  modalClose: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '300',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  yearContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  yearInput: {
    flex: 1,
    marginBottom: 0,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalButtonSave: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  modalButtonSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
});

export default ProfileScreen;
