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

const { width } = Dimensions.get('window');

// ─── Blue Theme ───────────────────────────────────────────────────
const C = {
  bg900: '#050816',
  bg850: '#070B1E',
  bg800: '#0A1128',
  bg700: '#0F1A3E',
  surface: '#0F1535',
  accent: '#2563EB',
  accentLight: '#3B82F6',
  accentDim: 'rgba(37, 99, 235, 0.12)',
  accentBorder: 'rgba(37, 99, 235, 0.25)',
  textPrimary: '#E6EDF3',
  textSecondary: '#8B949E',
  textMuted: '#484F58',
  cardBorder: 'rgba(71, 85, 105, 0.25)',
  error: '#F87171',
  errorBg: 'rgba(248, 113, 113, 0.08)',
  success: '#34D399',
  warning: '#FBBF24',
  white: '#FFFFFF',
  inputBg: '#0A1128',
  inputBorder: 'rgba(71, 85, 105, 0.4)',
};

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
  created_at?: string;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user: authUser, signOut } = useAuth();
  const { theme } = useTheme();
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [supabaseUser, setSupabaseUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Edit modal state
  const [showEdit, setShowEdit] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    name: '', registration_number: '', college: '', branch: '',
    year_joined: '', year_ending: '', roll_number: '',
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg900} />

      <SafeAreaView edges={['top']} style={{ backgroundColor: C.bg900 }}>
        {/* Minimal header */}
        <View style={styles.header}>
          {/* <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <ArrowLeft size={22} color={C.textPrimary} strokeWidth={2} />
          </TouchableOpacity> */}
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.headerBtn}>
            <Settings size={22} color={C.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.loadWrap}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Avatar + Name Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{getInitial()}</Text>
            </View>
            <Text style={styles.name}>
              {userData?.name || supabaseUser?.email || 'Student'}
            </Text>
            <Text style={styles.email}>{userData?.email || supabaseUser?.email}</Text>

            {/* Quick info badges */}
            <View style={styles.badges}>
              {userData?.branch && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{userData.branch}</Text>
                </View>
              )}
              {getBatch() && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{getBatch()}</Text>
                </View>
              )}
              {userData?.college && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{userData.college}</Text>
                </View>
              )}
            </View>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          )}

          {/* Academic Info */}
          {userData?.registration_number && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Academic</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Registration</Text>
                <Text style={styles.rowValue}>{userData.registration_number}</Text>
              </View>
              {userData?.roll_number && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Roll Number</Text>
                  <Text style={styles.rowValue}>{userData.roll_number}</Text>
                </View>
              )}
            </View>
          )}

          {/* Account Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Email Verified</Text>
              <View style={[styles.statusBadge, supabaseUser?.email_confirmed_at ? styles.statusOk : styles.statusWarn]}>
                <Text style={styles.statusText}>
                  {supabaseUser?.email_confirmed_at ? 'Verified' : 'Pending'}
                </Text>
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Member Since</Text>
              <Text style={styles.rowValue}>
                {supabaseUser?.created_at
                  ? new Date(supabaseUser.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : '—'}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleEdit}>
              <Text style={styles.actionText}>Edit Profile</Text>
              <ChevronRight size={20} color={C.textMuted} strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleResetPassword}>
              <Text style={styles.actionText}>Change Password</Text>
              <ChevronRight size={20} color={C.textMuted} strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionDanger]} onPress={handleLogout}>
              <Text style={[styles.actionText, { color: C.error }]}>Logout</Text>
              <ChevronRight size={20} color={C.error} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {/* Edit Modal */}
      <Modal visible={showEdit} animationType="slide" transparent onRequestClose={() => setShowEdit(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEdit(false)}>
                <Text style={styles.modalClose}>✕</Text>
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
                  <Text style={styles.inputLabel}>{label}</Text>
                  <TextInput
                    style={styles.textInput}
                    value={(editForm as any)[key]}
                    onChangeText={(t) => setEditForm({ ...editForm, [key]: t })}
                    placeholderTextColor={C.textMuted}
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
                    <Text style={styles.inputLabel}>{label}</Text>
                    <TextInput
                      style={styles.textInput}
                      value={(editForm as any)[key]}
                      onChangeText={(t) => setEditForm({ ...editForm, [key]: t })}
                      placeholderTextColor={C.textMuted}
                      keyboardType="numeric"
                      maxLength={4}
                    />
                  </View>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEdit(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.5 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Alert / Confirm Modal */}
      <Modal visible={!!alertConfig} animationType="fade" transparent onRequestClose={() => setAlertConfig(null)}>
        <View style={[styles.modalOverlay, { justifyContent: 'center', paddingHorizontal: 40 }]}>
          <View style={styles.alertModal}>
            <Text style={styles.alertTitle}>{alertConfig?.title}</Text>
            <Text style={styles.alertMessage}>{alertConfig?.message}</Text>

            <View style={styles.alertActions}>
              {alertConfig?.showCancel && (
                <TouchableOpacity style={styles.alertCancelBtn} onPress={() => setAlertConfig(null)}>
                  <Text style={styles.alertCancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.alertConfirmBtn, alertConfig?.isDestructive && { backgroundColor: C.error }]}
                onPress={() => {
                  const onConfirm = alertConfig?.onConfirm;
                  setAlertConfig(null);
                  if (onConfirm) onConfirm();
                }}
              >
                <Text style={styles.alertConfirmText}>
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
  container: { flex: 1, backgroundColor: C.bg900 },
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.cardBorder,
  },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  headerBtnText: { fontSize: 20, color: C.textPrimary },
  headerTitle: { fontSize: FONT.body, fontWeight: '700', color: C.textPrimary, paddingLeft: 5 },
  // Loading
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  // Scroll
  scroll: { flex: 1, paddingHorizontal: 16 },
  // Profile card
  profileCard: {
    alignItems: 'center', paddingVertical: 28,
    borderBottomWidth: 1, borderBottomColor: C.cardBorder,
    marginBottom: 16,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.accent,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  avatarLetter: { fontSize: 32, fontWeight: '700', color: C.white },
  name: { fontSize: FONT.h1, fontWeight: '700', color: C.textPrimary, marginBottom: 4 },
  email: { fontSize: FONT.caption, color: C.textSecondary, marginBottom: 12 },
  badges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  badge: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10,
    backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accentBorder,
  },
  badgeText: { fontSize: FONT.micro, fontWeight: '600', color: C.accentLight },
  // Error
  errorBanner: {
    backgroundColor: C.errorBg, borderLeftWidth: 3, borderLeftColor: C.error,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginBottom: 16,
  },
  errorText: { color: C.error, fontSize: FONT.caption },
  // Cards
  card: {
    backgroundColor: C.surface, borderRadius: 14,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  cardTitle: {
    fontSize: FONT.caption, fontWeight: '700', color: C.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(71,85,105,0.12)',
  },
  rowLabel: { fontSize: FONT.body, color: C.textSecondary },
  rowValue: { fontSize: FONT.body, color: C.textPrimary, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  statusOk: { backgroundColor: 'rgba(52, 211, 153, 0.15)' },
  statusWarn: { backgroundColor: 'rgba(251, 191, 36, 0.15)' },
  statusText: { fontSize: FONT.micro, fontWeight: '600', color: C.success },
  // Actions
  actions: { marginTop: 8 },
  actionBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 8, borderWidth: 1, borderColor: C.cardBorder,
  },
  actionDanger: { borderColor: 'rgba(248, 113, 113, 0.2)' },
  actionText: { fontSize: FONT.body, color: C.textPrimary, fontWeight: '500' },
  actionArrow: { fontSize: 20, color: C.textMuted, fontWeight: '300' },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: C.bg800, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: FONT.h2, fontWeight: '700', color: C.textPrimary },
  modalClose: { fontSize: 18, color: C.textSecondary, fontWeight: '600' },
  inputGroup: { marginBottom: 14 },
  inputLabel: {
    fontSize: FONT.caption, fontWeight: '600', color: C.textSecondary,
    marginBottom: 6, letterSpacing: 0.3,
  },
  textInput: {
    backgroundColor: C.inputBg, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: FONT.body, color: C.textPrimary,
    borderWidth: 1, borderColor: C.inputBorder,
  },
  modalActions: {
    flexDirection: 'row', gap: 12, marginTop: 20,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: C.cardBorder,
    alignItems: 'center',
  },
  cancelText: { fontSize: FONT.body, color: C.textSecondary, fontWeight: '500' },
  saveBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: C.accent, alignItems: 'center',
  },
  saveText: { fontSize: FONT.body, color: C.white, fontWeight: '600' },
  // Alert Modal
  alertModal: {
    backgroundColor: C.bg800, borderRadius: 16,
    padding: 24, borderWidth: 1, borderColor: C.cardBorder,
  },
  alertTitle: { fontSize: FONT.h2, fontWeight: '700', color: C.textPrimary, marginBottom: 8 },
  alertMessage: { fontSize: FONT.body, color: C.textSecondary, marginBottom: 24, lineHeight: 22 },
  alertActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  alertCancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  alertCancelText: { fontSize: FONT.body, color: C.textSecondary, fontWeight: '500' },
  alertConfirmBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: C.accent },
  alertConfirmText: { fontSize: FONT.body, color: C.white, fontWeight: '600' },
});

export default ProfileScreen;
