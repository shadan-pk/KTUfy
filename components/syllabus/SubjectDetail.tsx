import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ChevronRight, ChevronDown, AlertTriangle, BookOpen, Download } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getSubjectSyllabus, SubjectSyllabus, SyllabusSubject, syllabusToText } from '../../services/syllabusService';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getSubjectCategoryLabel } from './subjectCategoryUtils';

interface SubjectDetailProps {
  subject: SyllabusSubject;
}

export default function SubjectDetail({ subject }: SubjectDetailProps) {
  const { theme, isDark } = useTheme();

  const [detail, setDetail] = useState<SubjectSyllabus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

  const loadDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSubjectSyllabus(subject.code);
      console.log('🧪 [SubjectDetail] API Data received:', JSON.stringify(data, null, 2));
      setDetail(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load syllabus details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      console.log('🔍 [SubjectDetail] Attempting to fetch detail for:', subject.code);
      setLoading(true);
      setError(null);
      try {
        const data = await getSubjectSyllabus(subject.code);
        if (mounted) {
          console.log('✅ [SubjectDetail] Received data for:', subject.code);
          setDetail(data);
        }
      } catch (err: any) {
        console.error('❌ [SubjectDetail] Fetch error:', err);
        if (mounted) setError(err?.message || 'Failed to load syllabus details');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [subject.code]);

  const toggleModule = (modNum: number) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(modNum)) next.delete(modNum);
      else next.add(modNum);
      return next;
    });
  };

  const handleDownloadText = async () => {
    if (!detail) return;
    try {
      const text = syllabusToText(detail);
      const filename = `${detail.subject_code}_Syllabus.txt`;
      const fileUri = `${Paths.cache}/${filename}`;
      await File.writeAsStringAsync(fileUri, text);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { dialogTitle: 'Share Syllabus' });
      }
    } catch (err) {
      console.error('Error sharing text:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading syllabus…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyState}>
        <AlertTriangle size={56} color={theme.textTertiary} strokeWidth={1.5} />
        <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>Couldn't load syllabus</Text>
        <Text style={[styles.emptyStateSubtext, { color: theme.textTertiary }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.primary }]} onPress={loadDetail}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!detail) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.detailHeaderCard, { backgroundColor: isDark ? (theme.primary + '14') : (theme.primary + '12'), borderLeftColor: theme.primary }]}>
        <Text style={[styles.detailSubjectName, { color: theme.text }]}>{detail.subject_name}</Text>
        <Text style={[styles.detailSubjectMeta, { color: theme.textSecondary }]}>
          {detail.subject_code} • {detail.credits} Credits
          {detail.modules?.length ? ` • ${detail.modules.length} Modules` : ''}
          {detail.category && ` • ${getSubjectCategoryLabel(detail.program_elective || detail.category)}`}
        </Text>
      </View>

      {/* Modules */}
      {detail.modules?.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Modules</Text>
          {detail.modules.map((mod) => (
            <View key={mod.module_number} style={{ marginBottom: 10 }}>
              <TouchableOpacity
                style={[styles.moduleHeader, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={() => toggleModule(mod.module_number)}
                activeOpacity={0.7}
              >
                <View style={[styles.moduleBadge, { backgroundColor: theme.primary + '20' }]}>
                  <Text style={[styles.moduleBadgeText, { color: theme.primary }]}>M{mod.module_number}</Text>
                </View>
                <View style={styles.moduleInfo}>
                  <Text style={[styles.moduleTitle, { color: theme.text }]}>{mod.title}</Text>
                  <Text style={[styles.moduleHours, { color: theme.textTertiary }]}>
                    {mod.hours} hrs • {mod.topics.length} topics
                  </Text>
                </View>
                {expandedModules.has(mod.module_number) ? (
                  <ChevronDown size={18} color={theme.textTertiary} strokeWidth={2} />
                ) : (
                  <ChevronRight size={18} color={theme.textTertiary} strokeWidth={2} />
                )}
              </TouchableOpacity>

              {expandedModules.has(mod.module_number) && (
                <View style={[styles.topicList, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  {mod.topics.map((topic, ti) => (
                    <View key={ti} style={styles.topicRow}>
                      <View style={[styles.topicDot, { backgroundColor: theme.primary }]} />
                      <Text style={[styles.topicText, { color: theme.text }]}>{topic}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Course Outcomes */}
      {detail.course_outcomes && detail.course_outcomes.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Course Outcomes</Text>
          <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {detail.course_outcomes.map((co, i) => (
              <View key={i} style={styles.listItem}>
                <View style={[styles.coBadge, { backgroundColor: theme.primary + '20' }]}>
                  <Text style={[styles.coBadgeText, { color: theme.primary }]}>CO{i + 1}</Text>
                </View>
                <Text style={[styles.listItemText, { color: theme.text }]}>{co}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Textbooks */}
      {detail.textbooks && detail.textbooks.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Textbooks</Text>
          <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {detail.textbooks.map((tb, i) => (
              <View key={i} style={styles.listItem}>
                <BookOpen size={14} color={theme.textTertiary} strokeWidth={2} style={{ marginRight: 10, marginTop: 2 }} />
                <Text style={[styles.listItemText, { color: theme.text }]}>{tb}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* References */}
      {detail.references && detail.references.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>References</Text>
          <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {detail.references.map((ref, i) => (
              <View key={i} style={styles.listItem}>
                <Text style={[styles.refNumber, { color: theme.textTertiary }]}>{i + 1}.</Text>
                <Text style={[styles.listItemText, { color: theme.text }]}>{ref}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.downloadBtnGradient, { backgroundColor: theme.primary }]}
        onPress={handleDownloadText}
        activeOpacity={0.8}
      >
        <Download size={18} color="#fff" strokeWidth={2} />
        <Text style={styles.downloadBtnText}>Download as Text</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
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
    marginBottom: 20,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  detailHeaderCard: {
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    marginBottom: 24,
  },
  detailSubjectName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  detailSubjectMeta: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  moduleBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  moduleBadgeText: {
    fontSize: 16,
    fontWeight: '800',
  },
  moduleInfo: {
    flex: 1,
    marginRight: 12,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  moduleHours: {
    fontSize: 13,
  },
  topicList: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 16,
    marginTop: -16,
    paddingTop: 32,
    zIndex: -1,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  topicDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 12,
  },
  topicText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  coBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  coBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  refNumber: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 12,
    marginTop: 2,
    width: 20,
  },
  downloadBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  downloadBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
});
