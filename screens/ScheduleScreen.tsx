import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { ScheduleScreenNavigationProp } from '../types/navigation';
import { getExamSchedule, ExamEvent } from '../services/scheduleService';
import { ScheduleScreenSkeleton } from '../components/SkeletonLoader';


interface CalendarEvent {
  date: string;
  title: string;
  type: 'holiday' | 'exam' | 'deadline' | 'event';
  description?: string;
}

interface ScheduleScreenProps {
  navigation: ScheduleScreenNavigationProp;
}

const ScheduleScreen: React.FC<ScheduleScreenProps> = ({ navigation }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getExamSchedule();
      const calendarEvents: CalendarEvent[] = data.map((e: ExamEvent) => ({
        date: e.date,
        title: e.title,
        type: e.type,
        description: e.description,
      }));
      setEvents(calendarEvents);

      // Extract unique months
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const uniqueMonths = [...new Set(calendarEvents.map(e => {
        const monthIndex = parseInt(e.date.split('-')[1]) - 1;
        return monthNames[monthIndex];
      }))];
      setMonths(uniqueMonths);
      if (uniqueMonths.length > 0) setSelectedMonth(uniqueMonths[0]);
    } catch (err: any) {
      console.error('Error loading schedule:', err);
      setError('Could not load schedule. Backend may be offline.');
      // No fallback data — show error state
    } finally {
      setIsLoading(false);
    }
  };

  const getMonthNumber = (monthName: string): string => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const index = monthNames.indexOf(monthName) + 1;
    return index < 10 ? `0${index}` : `${index}`;
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'holiday': return '#4CAF50';
      case 'exam': return '#F44336';
      case 'deadline': return '#FF9800';
      case 'event': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      day: day,
      month: monthNames[date.getMonth()],
      weekday: weekdays[date.getDay()]
    };
  };

  const filterEventsByMonth = (month: string): CalendarEvent[] => {
    const monthNum = getMonthNumber(month);
    return events.filter((event: CalendarEvent) => event.date.includes(`-${monthNum}-`));
  };

  const currentMonthEvents = filterEventsByMonth(selectedMonth);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Academic Calendar</Text>
          <View style={styles.backButton} />
        </View>
        <ScheduleScreenSkeleton />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Academic Calendar</Text>
          <View style={styles.backButton} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📅</Text>
          <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 16 }}>{error}</Text>
          <TouchableOpacity style={{ backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }} onPress={loadSchedule}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Academic Calendar</Text>
        <View style={styles.backButton} />
      </View>

      {/* Month Selector */}
      <ScrollView horizontal style={styles.monthSelector} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingVertical: 12 }}>
        {months.map((month) => (
          <TouchableOpacity
            key={month}
            style={[styles.monthButton, selectedMonth === month && styles.monthButtonActive]}
            onPress={() => setSelectedMonth(month)}
          >
            <Text style={[styles.monthButtonText, selectedMonth === month && styles.monthButtonTextActive]}>
              {month}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Events List */}
      <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
        <Text style={styles.monthTitle}>{selectedMonth} 2025</Text>
        <Text style={styles.eventCount}>{currentMonthEvents.length} events this month</Text>

        {currentMonthEvents.map((event: CalendarEvent, index: number) => {
          const dateInfo = formatDate(event.date);
          return (
            <View key={index} style={styles.eventCard}>
              <View style={styles.eventDateContainer}>
                <Text style={styles.eventDay}>{dateInfo.day}</Text>
                <Text style={styles.eventMonth}>{dateInfo.month}</Text>
                <Text style={styles.eventWeekday}>{dateInfo.weekday}</Text>
              </View>

              <View style={styles.eventDetailsContainer}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <View style={[styles.eventTypeBadge, { backgroundColor: getEventColor(event.type) }]}>
                    <Text style={styles.eventTypeBadgeText}>{event.type}</Text>
                  </View>
                </View>
                {event.description && (
                  <Text style={styles.eventDescription}>{event.description}</Text>
                )}
              </View>

              <View style={[styles.eventIndicator, { backgroundColor: getEventColor(event.type) }]} />
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Holiday</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
          <Text style={styles.legendText}>Exam</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.legendText}>Deadline</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
          <Text style={styles.legendText}>Event</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#007AFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  monthSelector: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  monthButtonActive: {
    backgroundColor: '#007AFF',
  },
  monthButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  monthButtonTextActive: {
    color: '#fff',
  },
  eventsList: {
    flex: 1,
    padding: 16,
  },
  monthTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  eventCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  eventDateContainer: {
    width: 60,
    alignItems: 'center',
    marginRight: 16,
  },
  eventDay: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  eventMonth: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  eventWeekday: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  eventDetailsContainer: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  eventTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventTypeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  eventDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  eventIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});

export default ScheduleScreen;
