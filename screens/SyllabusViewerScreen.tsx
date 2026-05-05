import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { SyllabusViewerScreenNavigationProp } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft } from 'lucide-react-native';
import { SyllabusSubject } from '../services/syllabusService';

import MySyllabus from '../components/syllabus/MySyllabus';
import BrowseSyllabus from '../components/syllabus/BrowseSyllabus';
import SubjectDetail from '../components/syllabus/SubjectDetail';

export default function SyllabusViewerScreen() {
  const navigation = useNavigation<SyllabusViewerScreenNavigationProp>();
  const { theme } = useTheme();

  // Mode states
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SyllabusSubject | null>(null);

  // Browse state
  const [browseBranch, setBrowseBranch] = useState<string | null>(null);
  const [browseSemester, setBrowseSemester] = useState<string | null>(null);

  const goUpOneLevel = useCallback(() => {
    if (selectedSubject) {
      setSelectedSubject(null);
      return true;
    } else if (isBrowsing) {
      if (browseSemester) {
        setBrowseSemester(null);
        return true;
      } else if (browseBranch) {
        setBrowseBranch(null);
        return true;
      } else {
        setIsBrowsing(false);
        return true;
      }
    }
    return false;
  }, [selectedSubject, isBrowsing, browseSemester, browseBranch]);

  const onHeaderBackPress = useCallback(() => {
    if (!goUpOneLevel()) {
      navigation.goBack();
    }
  }, [goUpOneLevel, navigation]);

  const getHeaderTitle = () => {
    if (selectedSubject) return selectedSubject.code;
    if (isBrowsing) {
      if (browseSemester) return `${browseBranch} · ${browseSemester}`;
      if (browseBranch) return browseBranch;
      return 'Browse Syllabus';
    }
    return 'My Syllabus';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: 'transparent' }]}>
        <TouchableOpacity onPress={onHeaderBackPress} style={styles.headerIconBtn} activeOpacity={0.7}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.hBrandDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {getHeaderTitle()}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {selectedSubject ? (
          <SubjectDetail subject={selectedSubject} />
        ) : isBrowsing ? (
          <BrowseSyllabus
            onSubjectPress={(subject) => setSelectedSubject(subject)}
            browseBranch={browseBranch}
            setBrowseBranch={setBrowseBranch}
            browseSemester={browseSemester}
            setBrowseSemester={setBrowseSemester}
          />
        ) : (
          <MySyllabus
            onSubjectPress={(subject) => setSelectedSubject(subject)}
            onBrowsePress={() => setIsBrowsing(true)}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerIconBtn: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hBrandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
});
