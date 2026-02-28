import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthProvider';
import supabase from '../supabaseClient';
import { getUserProfile } from '../supabaseConfig';
import { ProfileScreenNavigationProp } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { getCachedUserProfile, setCachedUserProfile } from '../services/cacheService';
import { Settings, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { ProfileScreenSkeleton } from '../components/SkeletonLoader';

const { width } = Dimensions.get('window');

const FONT = { display: 39, h1: 24, h2: 20, body: 15, caption: 12, micro: 10 };

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

interface UserData {
  name?: string;
  email?: string;
  registration_number?: string;
  college?: string;
  branch?: string;
  year_joined?: number;
  year_ending?: number;
  roll_number?: string;
  semester?: string;
  created_at?: string;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user: authUser, signOut } = useAuth();
  const { theme, isDark } = useTheme();
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [supabaseUser, setSupabaseUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Edit modal state
  const [showEdit, setShowEdit] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    name: '', registration_number: '', college: '', branch: '',
    year_joined: '', year_ending: '', roll_number: '', semester: '',
  });
  const [saving, setSaving] = React.useState(false);
  const [alertConfig, setAlertConfig] = React.useState<{
    title: string;
    message: string;
    onConfirm?: () => void;
    showCancel?: boolean;
    isDestructive?: boolean;
  } | null>(null);

  const customAlert = (title: string, message: string, onConfirm?: () => void, showCancel = false, isDestructive = false) => {
    setAlertConfig({ title, message, onConfirm, showCancel, isDestructive });
  };

  const loadProfile = React.useCallback(async () => {
    try {
      setError(null);

      // Get supabase auth user for email/verification
      const { data: userRes } = await supabase.auth.getUser();
      const sUser = userRes?.user ?? null;
      setSupabaseUser(sUser);

      if (!sUser) {
        setLoading(false);
        return;
      }

      // Try cache first
      const cached = await getCachedUserProfile();
      if (cached) {
        setUserData(cached);
        setLoading(false);
      }

      // Fetch profile directly from Supabase (no backend)
      const profile = await getUserProfile(sUser.id);
      if (profile) {
        setUserData(profile as UserData);
        await setCachedUserProfile(profile);
      } else {
        // No profile row — use auth metadata
        const meta = sUser.user_metadata || {};
        const fallback: UserData = {
          name: meta.name,
          email: sUser.email,
          registration_number: meta.registration_number,
          college: meta.college,
          branch: meta.branch,
          year_joined: meta.year_joined,
          year_ending: meta.year_ending,
          roll_number: meta.roll_number,
        };
        setUserData(fallback);
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError('Unable to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => loadProfile());
    return unsubscribe;
  }, [navigation, loadProfile]);

  const handleEdit = () => {
    setEditForm({
      name: userData?.name || '',
      registration_number: userData?.registration_number || '',
      college: userData?.college || '',
      branch: userData?.branch || '',
      year_joined: userData?.year_joined?.toString() || '',
      year_ending: userData?.year_ending?.toString() || '',
      roll_number: userData?.roll_number || '',
      semester: userData?.semester || '',
    });
    setShowEdit(true);
  };

  const handleSave = async () => {
    if (!editForm.name.trim()) {
      customAlert('Error', 'Name is required');
      return;
    }
    if (!supabaseUser) return;

    setSaving(true);
    try {
      const updateData: any = {
        id: supabaseUser.id,
        name: editForm.name.trim(),
      };
      if (editForm.registration_number.trim()) updateData.registration_number = editForm.registration_number.trim().toUpperCase();
      if (editForm.college.trim()) updateData.college = editForm.college.trim().toUpperCase();
      if (editForm.branch.trim()) updateData.branch = editForm.branch.trim().toUpperCase();
      if (editForm.roll_number.trim()) updateData.roll_number = editForm.roll_number.trim();
      if (editForm.year_joined.trim()) updateData.year_joined = parseInt(editForm.year_joined);
      if (editForm.year_ending.trim()) updateData.year_ending = parseInt(editForm.year_ending);
      if (editForm.semester.trim()) updateData.semester = editForm.semester.trim();

      // Upsert directly in Supabase (creates row if missing, updates if exists)
      const { error: updateErr } = await supabase
        .from('users')
        .upsert(updateData, { onConflict: 'id' });

      if (updateErr) throw updateErr;

      const merged = { ...userData, ...updateData } as UserData;
      setUserData(merged);
      await setCachedUserProfile(merged);
      setShowEdit(false);
      customAlert('Success', 'Profile updated!');
    } catch (err: any) {
      customAlert('Error', err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    customAlert(
      'Logout',
      'Are you sure you want to log out?',
      async () => {
        try { await signOut(); } catch (e: any) { customAlert('Error', e.message); }
      },
      true,
      true
    );
  };

  const handleResetPassword = () => {
    const email = userData?.email || supabaseUser?.email;
    if (!email) return;
    customAlert(
      'Reset Password',
      `Send reset link to ${email}?`,
      async () => {
        try {
          await supabase.auth.resetPasswordForEmail(email);
          customAlert('Sent', 'Check your email for the reset link.');
        } catch (e: any) { customAlert('Error', e.message); }
      },
      true
    );
  };

  const getInitial = () =>
    (userData?.name?.charAt(0) || supabaseUser?.email?.charAt(0) || 'U').toUpperCase();

  const getBatch = () => {
    if (userData?.year_joined && userData?.year_ending)
      return `${userData.year_joined} – ${userData.year_ending}`;
    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.background }}>
        {/* Minimal header */}
        <View style={[styles.header, { borderBottomColor: theme.divider }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.headerBtn}>
            <Settings size={22} color={theme.text} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {loading ? (
        <ProfileScreenSkeleton />
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Avatar + Name Card */}
          <View style={[styles.profileCard, { borderBottomColor: theme.divider }]}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <Text style={[styles.avatarLetter, { color: '#FFFFFF' }]}>{getInitial()}</Text>
            </View>
            <Text style={[styles.name, { color: theme.text }]}>
              {userData?.name || supabaseUser?.email || 'Student'}
            </Text>
            <Text style={[styles.email, { color: theme.textSecondary }]}>{userData?.email || supabaseUser?.email}</Text>

            {/* Quick info badges */}
            <View style={styles.badges}>
              {userData?.branch && (
                <View style={[styles.badge, { backgroundColor: theme.primary + '1A', borderColor: theme.primaryLight + '40' }]}>
                  <Text style={[styles.badgeText, { color: theme.primaryLight }]}>{userData.branch}</Text>
                </View>
              )}
              {getBatch() && (
                <View style={[styles.badge, { backgroundColor: theme.primary + '1A', borderColor: theme.primaryLight + '40' }]}>
                  <Text style={[styles.badgeText, { color: theme.primaryLight }]}>{getBatch()}</Text>
                </View>
              )}
              {userData?.college && (
                <View style={[styles.badge, { backgroundColor: theme.primary + '1A', borderColor: theme.primaryLight + '40' }]}>
                  <Text style={[styles.badgeText, { color: theme.primaryLight }]}>{userData.college}</Text>
                </View>
              )}
            </View>
          </View>

          {error && (
            <View style={[styles.errorBanner, { backgroundColor: theme.error + '14', borderLeftColor: theme.error }]}>
              <Text style={[styles.errorText, { color: theme.error }]}>⚠ {error}</Text>
            </View>
          )}

          {/* Academic Info */}
          {userData?.registration_number && (
            <View style={[styles.card, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.textTertiary }]}>Academic</Text>
              <View style={[styles.row, { borderBottomColor: theme.divider }]}>
                <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>Registration</Text>
                <Text style={[styles.rowValue, { color: theme.text }]}>{userData.registration_number}</Text>
              </View>
              {userData?.roll_number && (
                <View style={[styles.row, { borderBottomColor: theme.divider }]}>
                  <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>Roll Number</Text>
                  <Text style={[styles.rowValue, { color: theme.text }]}>{userData.roll_number}</Text>
                </View>
              )}
            </View>
          )}

          {/* Account Info */}
          <View style={[styles.card, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.textTertiary }]}>Account</Text>
            <View style={[styles.row, { borderBottomColor: theme.divider }]}>
              <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>Email Verified</Text>
              <View style={[styles.statusBadge, supabaseUser?.email_confirmed_at ? { backgroundColor: theme.success + '26' } : { backgroundColor: theme.warning + '26' }]}>
                <Text style={[styles.statusText, { color: supabaseUser?.email_confirmed_at ? theme.success : theme.warning }]}>
                  {supabaseUser?.email_confirmed_at ? 'Verified' : 'Pending'}
                </Text>
              </View>
            </View>
            <View style={[styles.row, { borderBottomColor: theme.divider }]}>
              <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>Member Since</Text>
              <Text style={[styles.rowValue, { color: theme.text }]}>
                {supabaseUser?.created_at
                  ? new Date(supabaseUser.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : '—'}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]} onPress={handleEdit}>
              <Text style={[styles.actionText, { color: theme.text }]}>Edit Profile</Text>
              <ChevronRight size={20} color={theme.textTertiary} strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]} onPress={handleResetPassword}>
              <Text style={[styles.actionText, { color: theme.text }]}>Change Password</Text>
              <ChevronRight size={20} color={theme.textTertiary} strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionDanger, { backgroundColor: theme.backgroundSecondary, borderColor: theme.error + '4D' }]} onPress={handleLogout}>
              <Text style={[styles.actionText, { color: theme.error }]}>Logout</Text>
              <ChevronRight size={20} color={theme.error} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {/* Edit Modal */}
      <Modal visible={showEdit} animationType="slide" transparent onRequestClose={() => setShowEdit(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEdit(false)}>
                <Text style={[styles.modalClose, { color: theme.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { label: 'Full Name *', key: 'name', cap: 'words' as const },
                { label: 'Registration No.', key: 'registration_number', cap: 'characters' as const },
                { label: 'College', key: 'college', cap: 'characters' as const },
                { label: 'Branch', key: 'branch', cap: 'characters' as const },
                { label: 'Roll Number', key: 'roll_number', cap: 'none' as const },
              ].map(({ label, key, cap }) => (
                <View key={key} style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{label}</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: theme.backgroundTertiary, color: theme.text, borderColor: theme.border }]}
                    value={(editForm as any)[key]}
                    onChangeText={(t) => setEditForm({ ...editForm, [key]: t })}
                    placeholderTextColor={theme.textTertiary}
                    autoCapitalize={cap}
                  />
                </View>
              ))}

              <View style={{ flexDirection: 'row', gap: 12 }}>
                {[
                  { label: 'Year Joined', key: 'year_joined' },
                  { label: 'Year Ending', key: 'year_ending' },
                ].map(({ label, key }) => (
                  <View key={key} style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{label}</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: theme.backgroundTertiary, color: theme.text, borderColor: theme.border }]}
                      value={(editForm as any)[key]}
                      onChangeText={(t) => setEditForm({ ...editForm, [key]: t })}
                      placeholderTextColor={theme.textTertiary}
                      keyboardType="numeric"
                      maxLength={4}
                    />
                  </View>
                ))}
              </View>

              {/* Semester Selector — full width row below Year Joined/Ending */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Semester</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map(sem => (
                    <TouchableOpacity
                      key={sem}
                      style={{
                        width: 52, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5,
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: editForm.semester === sem ? theme.primary : theme.backgroundTertiary,
                        borderColor: editForm.semester === sem ? theme.primary : theme.border,
                      }}
                      onPress={() => setEditForm({ ...editForm, semester: sem })}
                    >
                      <Text style={{ color: editForm.semester === sem ? '#FFF' : theme.text, fontWeight: '700', fontSize: 13 }}>
                        {sem}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>


              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.border }]} onPress={() => setShowEdit(false)}>
                  <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: theme.primary }, saving && { opacity: 0.5 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={[styles.saveText, { color: '#FFFFFF' }]}>{saving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Alert / Confirm Modal */}
      <Modal visible={!!alertConfig} animationType="fade" transparent onRequestClose={() => setAlertConfig(null)}>
        <View style={[styles.modalOverlay, { justifyContent: 'center', paddingHorizontal: 40 }]}>
          <View style={[styles.alertModal, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <Text style={[styles.alertTitle, { color: theme.text }]}>{alertConfig?.title}</Text>
            <Text style={[styles.alertMessage, { color: theme.textSecondary }]}>{alertConfig?.message}</Text>

            <View style={styles.alertActions}>
              {alertConfig?.showCancel && (
                <TouchableOpacity style={styles.alertCancelBtn} onPress={() => setAlertConfig(null)}>
                  <Text style={[styles.alertCancelText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.alertConfirmBtn, { backgroundColor: theme.primary }, alertConfig?.isDestructive && { backgroundColor: theme.error }]}
                onPress={() => {
                  const onConfirm = alertConfig?.onConfirm;
                  setAlertConfig(null);
                  if (onConfirm) onConfirm();
                }}
              >
                <Text style={[styles.alertConfirmText, { color: '#FFFFFF' }]}>
                  {alertConfig?.showCancel ? (alertConfig?.isDestructive ? 'Logout' : 'Confirm') : 'OK'}
                </Text>
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
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  headerBtnText: { fontSize: 20 },
  headerTitle: { fontSize: FONT.body, fontWeight: '700', paddingLeft: 5 },
  // Loading
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  // Scroll
  scroll: { flex: 1, paddingHorizontal: 16 },
  // Profile card
  profileCard: {
    alignItems: 'center', paddingVertical: 28,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  avatarLetter: { fontSize: 32, fontWeight: '700' },
  name: { fontSize: FONT.h1, fontWeight: '700', marginBottom: 4 },
  email: { fontSize: FONT.caption, marginBottom: 12 },
  badges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  badge: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: { fontSize: FONT.micro, fontWeight: '600' },
  // Error
  errorBanner: {
    borderLeftWidth: 3,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginBottom: 16,
  },
  errorText: { fontSize: FONT.caption },
  // Cards
  card: {
    borderRadius: 14,
    padding: 16, marginBottom: 12,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: FONT.caption, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  rowLabel: { fontSize: FONT.body },
  rowValue: { fontSize: FONT.body, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: FONT.micro, fontWeight: '600' },
  // Actions
  actions: { marginTop: 8 },
  actionBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 8, borderWidth: 1,
  },
  actionDanger: {},
  actionText: { fontSize: FONT.body, fontWeight: '500' },
  actionArrow: { fontSize: 20, fontWeight: '300' },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: FONT.h2, fontWeight: '700' },
  modalClose: { fontSize: 18, fontWeight: '600' },
  inputGroup: { marginBottom: 14 },
  inputLabel: {
    fontSize: FONT.caption, fontWeight: '600',
    marginBottom: 6, letterSpacing: 0.3,
  },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: FONT.body,
    borderWidth: 1,
  },
  modalActions: {
    flexDirection: 'row', gap: 12, marginTop: 20,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: { fontSize: FONT.body, fontWeight: '500' },
  saveBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    alignItems: 'center',
  },
  saveText: { fontSize: FONT.body, fontWeight: '600' },
  // Alert Modal
  alertModal: {
    borderRadius: 16,
    padding: 24, borderWidth: 1,
  },
  alertTitle: { fontSize: FONT.h2, fontWeight: '700', marginBottom: 8 },
  alertMessage: { fontSize: FONT.body, marginBottom: 24, lineHeight: 22 },
  alertActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  alertCancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  alertCancelText: { fontSize: FONT.body, fontWeight: '500' },
  alertConfirmBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  alertConfirmText: { fontSize: FONT.body, fontWeight: '600' },
});

// (Removed duplicate styles block)


export default ProfileScreen;
