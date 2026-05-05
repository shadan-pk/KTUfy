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
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../auth/AuthProvider';
import supabase from '../supabaseClient';
import { getUserProfile } from '../supabaseConfig';
import { ProfileScreenNavigationProp } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { getCachedUserProfile, setCachedUserProfile } from '../services/cacheService';
import {
  Settings,
  ChevronRight,
  ArrowLeft,
  User,
  Mail,
  Book,
  School,
  Calendar,
  Hash,
  GraduationCap,
  LogOut,
  Key,
  Edit2
} from 'lucide-react-native';
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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header Background */}
        <View style={styles.headerBackground}>
        <LinearGradient
          colors={['#06070a', '#1E3A8A']}
          style={StyleSheet.absoluteFill}
        />
          <SafeAreaView edges={['top']} style={styles.headerContent}>
            <View style={styles.headerTopRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <ArrowLeft size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>My Profile</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.backBtn}>
                <Settings size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Profile Summary in Header */}
            <View style={styles.profileSummary}>
              <View style={styles.avatarWrapper}>
                <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: '#FFF' }]}>
                  <Text style={styles.avatarLetter}>{getInitial()}</Text>
                </View>
                <TouchableOpacity style={styles.editAvatarBtn} onPress={handleEdit}>
                  <Edit2 size={14} color="#FFF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.userName}>{userData?.name || 'Student'}</Text>
              <Text style={styles.userEmail}>{userData?.email || supabaseUser?.email}</Text>

              <View style={styles.badgeRow}>
                {userData?.branch && (
                  <View style={styles.headerBadge}>
                    <Text style={styles.headerBadgeText}>{userData.branch}</Text>
                  </View>
                )}
                {userData?.semester && (
                  <View style={styles.headerBadge}>
                    <Text style={styles.headerBadgeText}>{userData.semester}</Text>
                  </View>
                )}
              </View>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.contentBody}>
          {loading ? (
            <View style={{ marginTop: 20 }}><ProfileScreenSkeleton /></View>
          ) : (
            <>
              {error && (
                <View style={[styles.errorBanner, { backgroundColor: theme.error + '14', borderLeftColor: theme.error }]}>
                  <Text style={[styles.errorText, { color: theme.error }]}>⚠ {error}</Text>
                </View>
              )}

              {/* Information Section */}
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Academic Information</Text>
              <View style={[styles.card, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                <ProfileRow
                  icon={Hash}
                  label="Registration No."
                  value={userData?.registration_number || '—'}
                  theme={theme}
                />
                <ProfileRow
                  icon={School}
                  label="College"
                  value={userData?.college || '—'}
                  theme={theme}
                />
                <ProfileRow
                  icon={Book}
                  label="Branch"
                  value={userData?.branch || '—'}
                  theme={theme}
                />
                <ProfileRow
                  icon={GraduationCap}
                  label="Semester"
                  value={userData?.semester || '—'}
                  theme={theme}
                />
                <ProfileRow
                  icon={Calendar}
                  label="Batch"
                  value={getBatch() || '—'}
                  theme={theme}
                  isLast
                />
              </View>

              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Account Settings</Text>
              <View style={[styles.card, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                {/* <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
                  <View style={[styles.menuIcon, { backgroundColor: theme.primary + '1A' }]}>
                    <User size={18} color={theme.primary} />
                  </View>
                  <Text style={[styles.menuLabel, { color: theme.text }]}>Edit Profile</Text>
                  <ChevronRight size={18} color={theme.textTertiary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleResetPassword}>
                  <View style={[styles.menuIcon, { backgroundColor: theme.success + '1A' }]}>
                    <Key size={18} color={theme.success} />
                  </View>
                  <Text style={[styles.menuLabel, { color: theme.text }]}>Change Password</Text>
                  <ChevronRight size={18} color={theme.textTertiary} />
                </TouchableOpacity> */}

                <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
                  <View style={[styles.menuIcon, { backgroundColor: theme.error + '1A' }]}>
                    <LogOut size={18} color={theme.error} />
                  </View>
                  <Text style={[styles.menuLabel, { color: theme.error }]}>Logout</Text>
                  <ChevronRight size={18} color={theme.error} />
                </TouchableOpacity>
              </View>

              {/* Version Info */}
              <Text style={[styles.versionText, { color: theme.textTertiary }]}>KTUfy v1.0.4 (Stable)</Text>
            </>
          )}
        </View>
      </ScrollView>

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

const ProfileRow = ({ icon: Icon, label, value, theme, isLast }: any) => (
  <View style={[styles.infoRow, !isLast && { borderBottomWidth: 1, borderBottomColor: theme.divider }]}>
    <View style={[styles.infoIconBox, { backgroundColor: theme.backgroundTertiary }]}>
      <Icon size={16} color={theme.textSecondary} />
    </View>
    <View style={styles.infoContent}>
      <Text style={[styles.infoLabel, { color: theme.textTertiary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  headerBackground: {
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    marginBottom: 20
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  profileSummary: {
    alignItems: 'center',
    marginTop: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#FFF',
    fontSize: 40,
    fontWeight: '700',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3B82F6',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  contentBody: {
    paddingHorizontal: 20,
    marginTop: -30,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 25,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingVertical: 14,
    // borderBottomWidth: 1,
    // borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  errorBanner: {
    borderLeftWidth: 4,
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  errorText: {
    fontSize: 14,
  },
  versionText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalClose: { fontSize: 24, fontWeight: '400' },
  inputGroup: { marginBottom: 18 },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1.5,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 25,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  cancelText: { fontSize: 16, fontWeight: '700' },
  saveBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveText: { fontSize: 16, fontWeight: '700' },
  alertModal: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  alertTitle: { fontSize: 20, fontWeight: '800', marginBottom: 10 },
  alertMessage: { fontSize: 15, marginBottom: 25, lineHeight: 22 },
  alertActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  alertCancelBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  alertCancelText: { fontSize: 15, fontWeight: '600' },
  alertConfirmBtn: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: 12 },
  alertConfirmText: { fontSize: 15, fontWeight: '700' },
});

export default ProfileScreen;
