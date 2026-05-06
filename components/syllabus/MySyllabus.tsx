import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ChevronRight, GraduationCap, BookOpen } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../auth/AuthProvider';
import { getUserProfile } from '../../supabaseConfig';
import { getSubjects, SyllabusSubject } from '../../services/syllabusService';
import { BRANCHES } from './constants';
import { getSubjectCategoryLabel, groupSubjectsByCategory } from './subjectCategoryUtils';

interface MySyllabusProps {
  onSubjectPress: (subject: SyllabusSubject) => void;
  onBrowsePress: () => void;
}

export default function MySyllabus({ onSubjectPress, onBrowsePress }: MySyllabusProps) {
  const { theme } = useTheme();
  const { user: authUser } = useAuth();
  
  const [userData, setUserData] = useState<any>(null);
  const [mySubjects, setMySubjects] = useState<SyllabusSubject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);

  const groupedSubjects = useMemo(() => groupSubjectsByCategory(mySubjects), [mySubjects]);

  const toggleCategory = (categoryKey: string) => {
    setCollapsedCategories((current) => (
      current.includes(categoryKey)
        ? current.filter((key) => key !== categoryKey)
        : [...current, categoryKey]
    ));
  };

  useEffect(() => {
    let mounted = true;
    console.log('📚 [MySyllabus] useEffect triggered. authUser:', authUser ? authUser.id : authUser);
    (async () => {
      if (authUser) {
        try {
          console.log('📚 [MySyllabus] Fetching profile for user:', authUser.id);
          const profile = await getUserProfile(authUser.id);
          console.log('📚 [MySyllabus] Profile result:', JSON.stringify(profile, null, 2));
          if (!mounted) { console.log('📚 [MySyllabus] Unmounted after getUserProfile, aborting'); return; }
          setUserData(profile);
          
          if (profile?.branch && profile?.semester) {
            let branchCode = profile.branch.toString().toUpperCase().trim();
            const matchedBranch = BRANCHES.find(
              b => b.code === branchCode || b.name.toUpperCase() === branchCode || branchCode.includes(b.code) || b.code.startsWith(branchCode)
            );
            if (matchedBranch) branchCode = matchedBranch.code;

            const semRaw = profile.semester.toString().toUpperCase().trim();
            const sem = semRaw.startsWith('S') ? semRaw : `S${semRaw.match(/\d+/)?.[0] || '1'}`;
            
            console.log('📚 [MySyllabus] Normalized: branch=', branchCode, 'semester=', sem);
            
            setLoading(true);
            try {
              console.log('📚 [MySyllabus] Calling getSubjects(', branchCode, ',', sem, ')');
              const data = await getSubjects(branchCode, sem);
              console.log('📚 [MySyllabus] getSubjects returned:', data?.length, 'subjects');
              if (!mounted) { console.log('📚 [MySyllabus] Unmounted after getSubjects, aborting'); return; }
              if (data && data.length) {
                setMySubjects(data);
              } else {
                setMySubjects([]);
              }
            } catch (err: any) {
               console.error('📚 [MySyllabus] getSubjects ERROR:', err);
               if (!mounted) return;
               setError(err?.message || 'Failed to load subjects');
               setMySubjects([]);
            } finally {
               if (mounted) setLoading(false);
            }
          } else {
            console.log('📚 [MySyllabus] Profile missing branch or semester. branch:', profile?.branch, 'semester:', profile?.semester);
          }
        } catch (e) {
          console.error('📚 [MySyllabus] Failed to load profile:', e);
        }
      } else {
        console.log('📚 [MySyllabus] authUser is falsy, skipping fetch');
      }
    })();
    return () => { mounted = false; };
  }, [authUser]);

  return (
    <View style={styles.container}>
      <View style={[styles.infoCard, { backgroundColor: theme.card, borderLeftColor: theme.primary, marginBottom: 16 }]}>
        <Text style={[styles.infoTitle, { color: theme.text }]}>Hi {userData?.name?.split(' ')[0] || 'there'}!</Text>
        <Text style={[styles.infoDescription, { color: theme.textSecondary }]}>
          Here is your syllabus for {userData?.branch || 'your branch'} {userData?.semester || ''}.
        </Text>
      </View>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingHorizontal: 16 }}>
        <Text accessibilityRole="header" style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>My Subjects</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading subjects…</Text>
        </View>
      ) : mySubjects.length === 0 ? (
        <View style={styles.emptyState}>
          <GraduationCap size={56} color={theme.textTertiary} strokeWidth={1.5} />
          <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>No subjects found</Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.textTertiary }]}>Update your profile or browse manually.</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {groupedSubjects.map((group) => {
            const isExpanded = !collapsedCategories.includes(group.key);

            return (
              <View key={group.key} style={styles.categorySection}>
                <TouchableOpacity
                  style={[styles.categoryHeader, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  onPress={() => toggleCategory(group.key)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isExpanded }}
                  accessibilityLabel={`${group.label} — ${group.subjects.length} subjects`}
                  accessibilityHint={isExpanded ? 'Collapse this category' : 'Expand this category'}
                >
                  <View style={styles.categoryHeaderContent}>
                    <Text accessibilityRole="header" style={[styles.categoryHeaderTitle, { color: theme.text }]}>
                      {getSubjectCategoryLabel(group.key)} — {group.subjects.length} subjects
                    </Text>
                    <Text style={[styles.categoryHeaderSubtitle, { color: theme.textSecondary }]}>
                      {isExpanded ? 'Tap to collapse' : 'Tap to expand'}
                    </Text>
                  </View>
                  <View style={[styles.categoryChevronWrap, { backgroundColor: theme.backgroundSecondary }]}>
                    <ChevronRight
                      size={16}
                      color={theme.textTertiary}
                      strokeWidth={2}
                      style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                    />
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.categoryBody}>
                    {group.subjects.map((subject) => {
                      const moduleCount = subject.module_count ?? 0;

                      return (
                        <TouchableOpacity
                          key={subject.code}
                          style={[styles.subjectCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                          onPress={() => onSubjectPress(subject)}
                          activeOpacity={0.75}
                          accessibilityRole="button"
                          accessibilityLabel={`Open ${subject.name} syllabus details`}
                          accessibilityHint={`View ${subject.code}, ${subject.credits} credits, ${moduleCount} modules`}
                        >
                          <View style={styles.subjectInfo}>
                            <Text style={[styles.subjectName, { color: theme.text }]}>{subject.name}</Text>
                            <Text style={[styles.subjectMeta, { color: theme.textSecondary }]}>
                              {subject.code} • {subject.credits} Credits • {moduleCount} Modules
                            </Text>
                            <View style={styles.detailLinkRow}>
                              <Text style={[styles.detailLinkText, { color: theme.primary }]}>Open subject details</Text>
                              <ChevronRight size={14} color={theme.primary} strokeWidth={2} />
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        style={[styles.browseAllBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder, marginTop: 12, marginHorizontal: 16 }]}
        onPress={onBrowsePress}
        activeOpacity={0.8}
      >
        <View style={[styles.browseAllIconWrap, { backgroundColor: theme.primary + '20' }]}>
          <BookOpen size={20} color={theme.primary} strokeWidth={2.5} />
        </View>
        <Text style={[styles.browseAllText, { color: theme.text }]}>Browse All KTU Syllabus</Text>
        <ChevronRight size={20} color={theme.textTertiary} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  infoCard: {
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    marginHorizontal: 16,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  categorySection: {
    marginBottom: 14,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryHeaderContent: {
    flex: 1,
    marginRight: 12,
  },
  categoryHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  categoryHeaderSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryChevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBody: {
    marginTop: 12,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  subjectMeta: {
    fontSize: 13,
    marginBottom: 4,
  },
  detailLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLinkText: {
    fontSize: 13,
    fontWeight: '700',
    marginRight: 4,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  browseAllIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  browseAllText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
});
