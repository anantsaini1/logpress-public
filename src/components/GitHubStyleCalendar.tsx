import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { CalendarCell } from '../services/workoutHistoryService';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GitHubStyleCalendarProps {
  workoutData: CalendarCell[];
  onDateSelect?: (date: string) => void;
  currentMonth: Date;
  isLoading?: boolean;
}

const GitHubStyleCalendar: React.FC<GitHubStyleCalendarProps> = React.memo(({
  workoutData,
  onDateSelect,
  currentMonth,
  isLoading = false
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  


  const getIntensityColor = useCallback((intensity: number): string => {
    // GitHub tarzı kırmızı renk sistemi
    switch (intensity) {
      case 0: return 'transparent'; // Workout yok
      case 1: return '#FF4081'; // Hafif kırmızı
      case 2: return '#E91E63'; // Orta kırmızı  
      case 3: return '#C2185B'; // Koyu kırmızı
      case 4: return '#AD1457'; // En koyu kırmızı
      default: return 'transparent';
    }
  }, []);

  const getDayNames = () => {
    return [
      t('calendar_monday') || 'Pzt',
      t('calendar_tuesday') || 'Sal', 
      t('calendar_wednesday') || 'Çar',
      t('calendar_thursday') || 'Per',
      t('calendar_friday') || 'Cum',
      t('calendar_saturday') || 'Cmt',
      t('calendar_sunday') || 'Paz'
    ];
  };

  const getMonthName = (date: Date) => {
    const months = [
      t('calendar_january') || 'Ocak',
      t('calendar_february') || 'Şubat',
      t('calendar_march') || 'Mart',
      t('calendar_april') || 'Nisan',
      t('calendar_may') || 'Mayıs',
      t('calendar_june') || 'Haziran',
      t('calendar_july') || 'Temmuz',
      t('calendar_august') || 'Ağustos',
      t('calendar_september') || 'Eylül',
      t('calendar_october') || 'Ekim',
      t('calendar_november') || 'Kasım',
      t('calendar_december') || 'Aralık'
    ];
    return months[date.getMonth()];
  };

  const calendarGrid = useMemo(() => {
    if (!currentMonth) return [];
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // First day of week (Monday = 1, Sunday = 0)
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1; // Make Monday = 0
    
    const weeks = [];
    let currentWeek = [];
    
    // Add empty cells (days before month start)
    for (let i = 0; i < startDay; i++) {
      currentWeek.push(
        <View key={`empty-${i}`} style={styles.emptyCell} />
      );
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      // Timezone sorununu çözmek için manuel date formatting
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const cellData = workoutData.find(cell => cell.date === dateString);
      const intensity = cellData?.intensity || 0;
      const workoutCount = cellData?.workoutCount || 0;
      // Today kontrolü için de manuel formatting
      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              const isToday = dateString === todayString;
        
        currentWeek.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarCell,
            {
              backgroundColor: intensity > 0 ? getIntensityColor(intensity) : colors.background,
              borderColor: isToday ? colors.textSecondary : colors.border,
              borderWidth: isToday ? 1.5 : 0.5,
              shadowColor: intensity > 0 ? '#FF4081' : 'transparent',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: intensity > 0 ? 0.3 : 0,
              shadowRadius: 2,
              elevation: intensity > 0 ? 2 : 0,
            }
          ]}
          onPress={() => {
            if (isLoading) {
              return;
            }
            onDateSelect?.(dateString);
          }}
          activeOpacity={0.7}
          delayPressIn={0}
        >
          <Text style={[
            styles.cellText,
            { 
              color: intensity > 0 ? '#FFFFFF' : (isToday ? colors.primary : colors.text),
              fontWeight: isToday ? '700' : (intensity > 0 ? '600' : '500')
            }
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
      
      // If week is complete, move to next week
      if (currentWeek.length === 7) {
        weeks.push(
          <View key={weeks.length} style={styles.weekRow}>
            {currentWeek}
          </View>
        );
        currentWeek = [];
      }
    }
    
    // Complete the last week
    while (currentWeek.length < 7) {
      currentWeek.push(
        <View key={`empty-end-${currentWeek.length}`} style={styles.emptyCell} />
      );
    }
    
    if (currentWeek.length > 0) {
      weeks.push(
        <View key={weeks.length} style={styles.weekRow}>
          {currentWeek}
        </View>
      );
    }
    
    return weeks;
  }, [workoutData, currentMonth, colors, getIntensityColor]);

  const renderCalendarGrid = () => calendarGrid;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.monthTitle, { color: colors.text }]}>
          {getMonthName(currentMonth)} {currentMonth.getFullYear()}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('calendar_workout_history') || 'Workout Geçmişi'}
        </Text>
      </View>
      
      {/* Day names */}
      <View style={styles.dayNamesRow}>
        {getDayNames().map((day, index) => (
          <Text key={index} style={[styles.dayName, { color: colors.textSecondary }]}>
            {day}
          </Text>
        ))}
      </View>
      
      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {renderCalendarGrid()}
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>
          {t('calendar_less') || 'Az'}
        </Text>
        <View style={styles.legendColors}>
          {[0, 1, 2, 3, 4].map(intensity => (
            <View
              key={intensity}
              style={[
                styles.legendCell,
                { backgroundColor: getIntensityColor(intensity) }
              ]}
            />
          ))}
        </View>
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>
          {t('calendar_more') || 'Çok'}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 8,
    borderWidth: 1,
  },
  header: {
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-SemiBold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
  },
  dayNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  dayName: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    width: 32,
    textAlign: 'center',
  },
  calendarGrid: {
    marginBottom: 16,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calendarCell: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  emptyCell: {
    width: 40,
    height: 40,
  },
  cellText: {
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
  },
  workoutIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutCount: {
    fontSize: 8,
    fontFamily: 'Outfit-Bold',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
    marginHorizontal: 8,
  },
  legendColors: {
    flexDirection: 'row',
    gap: 3,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});

export default GitHubStyleCalendar;