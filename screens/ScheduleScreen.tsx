import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScheduleScreenNavigationProp } from '../types/navigation';
import { getExamSchedule, ExamEvent } from '../services/scheduleService';
import { ScheduleScreenSkeleton } from '../components/SkeletonLoader';
import { useTheme } from '../contexts/ThemeContext';

interface ScheduleScreenProps {
  navigation: ScheduleScreenNavigationProp;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TYPE_COLORS: Record<string, string> = {
  holiday: '#22C55E',
  exam: '#EF4444',
  deadline: '#F59E0B',
  event: '#3B82F6',
};

const ScheduleScreen: React.FC<ScheduleScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const [events, setEvents] = useState<ExamEvent[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadSchedule(); }, []);

  const loadSchedule = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getExamSchedule({ forceRefresh: true });
      setEvents(data);
      const unique = [...new Set(data.map(e => MONTH_NAMES[parseInt(e.date.split('-')[1]) - 1]))];
      setMonths(unique);
      if (unique.length > 0) setSelectedMonth(unique[0]);
    } catch (err: any) {
      setError('Could not load schedule.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedMonthEvents = events.filter(e => {
    const m = parseInt(e.date.split('-')[1]) - 1;
    return MONTH_NAMES[m] === selectedMonth;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return { day: d.getDate(), month: MONTH_SHORT[d.getMonth()], weekday: WEEKDAYS[d.getDay()] };
  };

  const Header = () => (
    <View style={[styles.header, { backgroundColor: theme.primary }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.headerIcon}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Academic Calendar</Text>
      <View style={styles.iconBtn} />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.primary} />
        <Header />
        <ScheduleScreenSkeleton />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.primary} />
        <Header />
        <View style={styles.centeredMsg}>
          <Text style={styles.errorIcon}>📅</Text>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.primary }]} onPress={loadSchedule}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.primary} />
      <Header />

      {/* Month pill selector */}
      <View style={[styles.monthBar, { backgroundColor: theme.backgroundSecondary, borderBottomColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthScroll}>
          {months.map(m => (
            <TouchableOpacity
              key={m}
              style={[
                styles.monthPill,
                { backgroundColor: selectedMonth === m ? theme.primary : theme.backgroundTertiary },
              ]}
              onPress={() => setSelectedMonth(m)}
              activeOpacity={0.8}
            >
              <Text style={[styles.monthPillText, { color: selectedMonth === m ? '#FFF' : theme.textSecondary }]}>
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Events */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.listHeader}>
          <Text style={[styles.monthHeading, { color: theme.text }]}>{selectedMonth}</Text>
          <Text style={[styles.eventCount, { color: theme.textTertiary }]}>
            {selectedMonthEvents.length} event{selectedMonthEvents.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {selectedMonthEvents.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No events this month</Text>
          </View>
        ) : selectedMonthEvents.map((event, i) => {
          const { day, month, weekday } = formatDate(event.date);
          const color = TYPE_COLORS[event.type] ?? '#9E9E9E';
          return (
            <View
              key={i}
              style={[styles.card, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
            >
              {/* Left color stripe */}
              <View style={[styles.stripe, { backgroundColor: color }]} />

              {/* Date box */}
              <View style={[styles.dateBox, { backgroundColor: color + '18' }]}>
                <Text style={[styles.dateWeekday, { color }]}>{weekday}</Text>
                <Text style={[styles.dateDay, { color }]}>{day}</Text>
                <Text style={[styles.dateMon, { color }]}>{month}</Text>
              </View>

              {/* Info */}
              <View style={styles.cardInfo}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>{event.title}</Text>
                  <View style={[styles.badge, { backgroundColor: color }]}>
                    <Text style={styles.badgeText}>{event.type.toUpperCase()}</Text>
                  </View>
                </View>
                {event.subject_code && (
                  <Text style={[styles.subjectCode, { color: theme.primary }]}>{event.subject_code}</Text>
                )}
                {event.description && (
                  <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                    {event.description}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: theme.backgroundSecondary, borderTopColor: theme.border }]}>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <View key={type} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerIcon: { fontSize: 26, color: '#FFF', fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', letterSpacing: 0.3 },

  monthBar: { borderBottomWidth: 1 },
  monthScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  monthPill: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  monthPillText: { fontSize: 13, fontWeight: '600' },

  list: { flex: 1, paddingHorizontal: 16 },
  listHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingTop: 20, paddingBottom: 12 },
  monthHeading: { fontSize: 24, fontWeight: '800' },
  eventCount: { fontSize: 13 },

  card: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  stripe: { width: 4 },
  dateBox: { width: 64, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 1 },
  dateWeekday: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  dateDay: { fontSize: 26, fontWeight: '800', lineHeight: 30 },
  dateMon: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  cardInfo: { flex: 1, padding: 12, gap: 2 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', lineHeight: 20 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: '700', color: '#FFF', letterSpacing: 0.5 },
  subjectCode: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  cardDesc: { fontSize: 12, lineHeight: 17, marginTop: 2 },

  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: 'center', marginTop: 8 },
  emptyText: { fontSize: 14 },

  centeredMsg: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  errorIcon: { fontSize: 48 },
  errorText: { fontSize: 15, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  legend: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 16, borderTopWidth: 1 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12 },
});

export default ScheduleScreen;
