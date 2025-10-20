import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { ScheduleScreenNavigationProp } from '../types/navigation';

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
  const [selectedMonth, setSelectedMonth] = useState<'October' | 'November' | 'December'>('October');

  const academicCalendar: CalendarEvent[] = [
    // October 2025
    { date: '2025-10-01', title: 'Onam Holiday', type: 'holiday' },
    { date: '2025-10-02', title: 'Gandhi Jayanthi & Vijaya Dashami', type: 'holiday' },
    { date: '2025-10-03', title: 'Onam Holiday', type: 'holiday' },
    { date: '2025-10-05', title: 'Series Test 2 (S3/S5/S7)', type: 'exam', description: 'Day 1' },
    { date: '2025-10-06', title: 'Series Test 2 (S3/S5/S7)', type: 'exam', description: 'Day 2' },
    { date: '2025-10-07', title: 'Series Test 2 (S3/S5/S7)', type: 'exam', description: 'Day 3' },
    { date: '2025-10-08', title: 'Series Test 2 (S3/S5/S7)', type: 'exam', description: 'Day 4' },
    { date: '2025-10-12', title: 'Module 3 Completion', type: 'deadline', description: '75% labs completed' },
    { date: '2025-10-15', title: 'Deepavali', type: 'holiday' },
    { date: '2025-10-20', title: 'Working Day', type: 'event', description: 'Compensation for Oct 3' },
    { date: '2025-10-31', title: 'ERP Report Submission', type: 'deadline', description: 'Monthly completion report' },
    
    // November 2025
    { date: '2025-11-08', title: 'Module 5 Completion', type: 'deadline', description: 'S5 & S7' },
    { date: '2025-11-10', title: 'Internal Lab/Retests Start', type: 'exam', description: 'All semesters' },
    { date: '2025-11-11', title: 'Internal Lab/Retests', type: 'exam' },
    { date: '2025-11-12', title: 'Internal Lab/Retests', type: 'exam' },
    { date: '2025-11-13', title: 'Internal Lab/Retests', type: 'exam' },
    { date: '2025-11-14', title: 'Internal Lab/Retests', type: 'exam' },
    { date: '2025-11-15', title: 'Internal Lab/Retests', type: 'exam' },
    { date: '2025-11-16', title: 'Internal Lab/Retests', type: 'exam' },
    { date: '2025-11-17', title: 'Internal Lab/Retests', type: 'exam' },
    { date: '2025-11-18', title: 'Final Assignment Submission', type: 'deadline' },
    { date: '2025-11-19', title: 'Internal Lab/Retests', type: 'exam' },
    { date: '2025-11-20', title: 'Internal Lab/Retests', type: 'exam' },
    { date: '2025-11-21', title: 'Internal Lab/Retests End', type: 'exam' },
    { date: '2025-11-22', title: 'Final IA Marks Published', type: 'event' },
    { date: '2025-11-25', title: 'S7 University Exam Starts', type: 'exam' },
    { date: '2025-11-27', title: 'S5 University Exam Starts', type: 'exam' },
    { date: '2025-11-29', title: 'S3 University Exam Starts', type: 'exam' },
    
    // December 2025
    { date: '2025-12-01', title: 'University Exams Continue', type: 'exam' },
    { date: '2025-12-20', title: 'University Exams End', type: 'exam', description: 'Valuation camp begins' },
  ];

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

  const filterEventsByMonth = (month: string) => {
    const monthNumber = month === 'October' ? '10' : month === 'November' ? '11' : '12';
    return academicCalendar.filter(event => event.date.includes(`-${monthNumber}-`));
  };

  const currentMonthEvents = filterEventsByMonth(selectedMonth);

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
      <View style={styles.monthSelector}>
        <TouchableOpacity 
          style={[styles.monthButton, selectedMonth === 'October' && styles.monthButtonActive]}
          onPress={() => setSelectedMonth('October')}
        >
          <Text style={[styles.monthButtonText, selectedMonth === 'October' && styles.monthButtonTextActive]}>
            October
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.monthButton, selectedMonth === 'November' && styles.monthButtonActive]}
          onPress={() => setSelectedMonth('November')}
        >
          <Text style={[styles.monthButtonText, selectedMonth === 'November' && styles.monthButtonTextActive]}>
            November
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.monthButton, selectedMonth === 'December' && styles.monthButtonActive]}
          onPress={() => setSelectedMonth('December')}
        >
          <Text style={[styles.monthButtonText, selectedMonth === 'December' && styles.monthButtonTextActive]}>
            December
          </Text>
        </TouchableOpacity>
      </View>

      {/* Events List */}
      <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
        <Text style={styles.monthTitle}>{selectedMonth} 2025</Text>
        <Text style={styles.eventCount}>{currentMonthEvents.length} events this month</Text>

        {currentMonthEvents.map((event, index) => {
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
    flexDirection: 'row',
    padding: 16,
    gap: 10,
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
