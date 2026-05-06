import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { GraduationCap, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getSubjects, SyllabusSubject } from '../../services/syllabusService';
import { BRANCHES, SEMESTERS } from './constants';
import { groupSubjectsByCategory, getSubjectCategoryLabel } from './subjectCategoryUtils';

interface BrowseSyllabusProps {
  onSubjectPress: (subject: SyllabusSubject) => void;
  browseBranch: string | null;
  setBrowseBranch: (b: string | null) => void;
  browseSemester: string | null;
  setBrowseSemester: (s: string | null) => void;
}

export default function BrowseSyllabus({
  onSubjectPress,
  browseBranch,
  setBrowseBranch,
  browseSemester,
  setBrowseSemester
}: BrowseSyllabusProps) {
  const { theme, isDark } = useTheme();

  const [subjects, setSubjects] = useState<SyllabusSubject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!browseBranch || !browseSemester) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getSubjects(browseBranch, browseSemester);
        if (!mounted) return;
        setSubjects(data || []);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || 'Failed to load subjects');
        setSubjects([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [browseBranch, browseSemester]);

  const handleBranchSelect = (code: string) => {
    setBrowseBranch(code);
    setCollapsedCategories([]);
  };

  const handleSemesterSelect = (sem: string) => {
    setBrowseSemester(sem);
    setSearchQuery('');
    setCollapsedCategories([]);
  };

  const displayedSubjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter((subject) => {
      return subject.name.toLowerCase().includes(q) || subject.code.toLowerCase().includes(q);
    });
  }, [searchQuery, subjects]);

  const groupedSubjects = useMemo(() => groupSubjectsByCategory(displayedSubjects), [displayedSubjects]);

  const isSearchActive = searchQuery.trim().length > 0;

  const toggleCategory = (categoryKey: string) => {
    setCollapsedCategories((current) => (
      current.includes(categoryKey)
        ? current.filter((key) => key !== categoryKey)
        : [...current, categoryKey]
    ));
  };

  const selectedBranchData = BRANCHES.find(b => b.code === browseBranch);

  return (
    <View style={styles.container}>
      {!browseBranch ? (
        <View style={styles.contentPad}>
          <View style={[styles.infoCard, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.12)' : '#EEF2FF', borderLeftColor: theme.primary }]}>
            <Text style={[styles.infoTitle, { color: theme.text }]}>Browse KTU Syllabus</Text>
            <Text style={[styles.infoDescription, { color: theme.textSecondary }]}>
              Access syllabus for all subjects by branch and semester
            </Text>
          </View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Your Branch</Text>
          {BRANCHES.map((branch) => (
            <TouchableOpacity key={branch.code} style={[styles.branchCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={() => handleBranchSelect(branch.code)} activeOpacity={0.7}>
              <View style={[styles.branchIconCircle, { backgroundColor: `${branch.color}18` }]}>
                <branch.icon size={22} color={branch.color} strokeWidth={2} />
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.branchCode, { color: theme.text }]}>{branch.code}</Text>
                <Text style={[styles.branchName, { color: theme.textSecondary }]}>{branch.name}</Text>
              </View>
              <View style={[styles.arrowCircle, { backgroundColor: theme.backgroundSecondary }]}>
                <ChevronRight size={16} color={theme.textTertiary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : !browseSemester ? (
        <View style={styles.contentPad}>
          {selectedBranchData && (
            <View style={[styles.branchBanner, { backgroundColor: `${selectedBranchData.color}18`, borderColor: `${selectedBranchData.color}40` }]}>
              <View style={styles.branchBannerIconWrap}>
                <selectedBranchData.icon size={32} color={selectedBranchData.color} strokeWidth={2} />
              </View>
              <View>
                <Text style={[styles.branchBannerCode, { color: selectedBranchData.color }]}>{selectedBranchData.code}</Text>
                <Text style={[styles.branchBannerName, { color: theme.textSecondary }]}>{selectedBranchData.name}</Text>
              </View>
            </View>
          )}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Semester</Text>
          <View style={styles.semesterGrid}>
            {SEMESTERS.map((semester) => (
              <TouchableOpacity key={semester} style={[styles.semesterCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={() => handleSemesterSelect(semester)} activeOpacity={0.7}>
                <Text style={[styles.semesterText, { color: theme.primary }]}>{semester}</Text>
                <Text style={[styles.semesterSubtext, { color: theme.textSecondary }]}>Semester {semester.replace('S', '')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.contentPad}>
          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: theme.text }]}>Subjects</Text>
          <View style={{ marginBottom: 12 }}>
            <TextInput
              placeholder="Search subjects by name or code"
              placeholderTextColor={theme.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.cardBorder }]}
            />
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading subjects…</Text>
            </View>
          ) : subjects.length === 0 ? (
            <View style={styles.emptyState}>
              <GraduationCap size={56} color={theme.textTertiary} strokeWidth={1.5} />
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>No subjects found</Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.textTertiary }]}>No syllabus data returned from the server.</Text>
            </View>
          ) : displayedSubjects.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>No subjects match "{searchQuery}"</Text>
            </View>
          ) : (
            groupedSubjects.map((group) => {
              const isExpanded = isSearchActive || !collapsedCategories.includes(group.key);

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
            })
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentPad: {
    paddingHorizontal: 16,
  },
  infoCard: {
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    marginBottom: 20,
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
    marginBottom: 16,
    marginTop: 8,
  },
  branchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  branchIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  branchCode: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  branchName: {
    fontSize: 13,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  branchBannerIconWrap: {
    marginRight: 16,
  },
  branchBannerCode: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  branchBannerName: {
    fontSize: 14,
  },
  semesterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  semesterCard: {
    width: '48%',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  semesterText: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  semesterSubtext: {
    fontSize: 12,
    fontWeight: '500',
  },
  searchInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    marginBottom: 12,
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
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 13,
    textAlign: 'center',
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
    marginBottom: 12,
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
  subjectCode: {
    fontSize: 13,
  },
});
