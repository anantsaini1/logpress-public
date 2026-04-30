import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { WorkoutData } from '../services/workoutHistoryService';
import { storage, RatingHistoryEntry } from '../services/storage';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProgressTrendsSectionProps {
  workoutData: WorkoutData[];
  timeRange: 'week' | 'month' | 'quarter';
  onTimeRangeChange: (range: 'week' | 'month' | 'quarter') => void;
}

interface TrendDataPoint {
  date: string;
  value: number;
  label: string;
}

const ProgressTrendsSection: React.FC<ProgressTrendsSectionProps> = ({
  workoutData,
  timeRange,
  onTimeRangeChange
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [ratingHistory, setRatingHistory] = React.useState<RatingHistoryEntry[]>([]);
  
  // Rating history'yi component mount'ta yükle
  React.useEffect(() => {
    const loadRatingHistory = async () => {
      const history = await storage.getRatingHistory();
      setRatingHistory(history);
    };
    loadRatingHistory();
  }, []);

  const generateTrendData = (): TrendDataPoint[] => {
    const now = new Date();
    const data: TrendDataPoint[] = [];
    
    if (ratingHistory.length === 0) {
      // Rating history yoksa boş data döndür
      return data;
    }
    
    if (timeRange === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        // Bu tarihteki rating değişimlerini bul
        const dayRatingChanges = ratingHistory.filter(entry => 
          entry.date.split('T')[0] === dateString
        );
        
        // Bu tarihte son rating'i hesapla
        let dayRating = 0;
        if (dayRatingChanges.length > 0) {
          // En son rating değişimindeki afterRating'i al
          const lastChange = dayRatingChanges[dayRatingChanges.length - 1];
          dayRating = lastChange.afterRating;
        } else {
          // Bu tarihte değişim yoksa en yakın önceki rating'i al
          const previousChanges = ratingHistory.filter(entry => 
            new Date(entry.date) <= date
          ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          if (previousChanges.length > 0) {
            dayRating = previousChanges[0].afterRating;
          }
        }
        
        // Gün kısaltmalarını çeviri sisteminden al
        const dayNames = [
          t('calendar_monday') || 'Pzt',
          t('calendar_tuesday') || 'Sal',
          t('calendar_wednesday') || 'Çar',
          t('calendar_thursday') || 'Per',
          t('calendar_friday') || 'Cum',
          t('calendar_saturday') || 'Cmt',
          t('calendar_sunday') || 'Paz'
        ];
        const dayLabel = dayNames[date.getDay() === 0 ? 6 : date.getDay() - 1]; // Sunday=0 -> 6
        
        data.push({
          date: dateString,
          value: dayRating,
          label: dayLabel
        });
      }
    } else if (timeRange === 'month') {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() - (i * 7));
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);
        
        // Bu hafta içindeki rating değişimlerini bul
        const weekRatingChanges = ratingHistory.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= startDate && entryDate <= endDate;
        });
        
        // Hafta sonundaki rating'i hesapla
        let weekRating = 0;
        if (weekRatingChanges.length > 0) {
          const lastChange = weekRatingChanges[weekRatingChanges.length - 1];
          weekRating = lastChange.afterRating;
        } else {
          // Bu haftada değişim yoksa önceki rating'i al
          const previousChanges = ratingHistory.filter(entry => 
            new Date(entry.date) <= endDate
          ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          if (previousChanges.length > 0) {
            weekRating = previousChanges[0].afterRating;
          }
        }
        
        data.push({
          date: startDate.toISOString().split('T')[0],
          value: weekRating,
          label: `${startDate.getDate()}/${startDate.getMonth() + 1}`
        });
      }
    } else {
      // Last 3 months
      for (let i = 2; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        // Bu ay içindeki rating değişimlerini bul
        const monthRatingChanges = ratingHistory.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= monthStart && entryDate <= monthEnd;
        });
        
        // Ay sonundaki rating'i hesapla
        let monthRating = 0;
        if (monthRatingChanges.length > 0) {
          const lastChange = monthRatingChanges[monthRatingChanges.length - 1];
          monthRating = lastChange.afterRating;
        } else {
          // Bu ayda değişim yoksa önceki rating'i al
          const previousChanges = ratingHistory.filter(entry => 
            new Date(entry.date) <= monthEnd
          ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          if (previousChanges.length > 0) {
            monthRating = previousChanges[0].afterRating;
          }
        }
        
        // Ay kısaltmalarını çeviri sisteminden al
        const monthNames = [
          t('calendar_january_short') || 'Oca',
          t('calendar_february_short') || 'Şub',
          t('calendar_march_short') || 'Mar',
          t('calendar_april_short') || 'Nis',
          t('calendar_may_short') || 'May',
          t('calendar_june_short') || 'Haz',
          t('calendar_july_short') || 'Tem',
          t('calendar_august_short') || 'Ağu',
          t('calendar_september_short') || 'Eyl',
          t('calendar_october_short') || 'Eki',
          t('calendar_november_short') || 'Kas',
          t('calendar_december_short') || 'Ara'
        ];
        const monthLabel = monthNames[date.getMonth()];
        
        data.push({
          date: monthStart.toISOString().split('T')[0],
          value: monthRating,
          label: monthLabel
        });
      }
    }
    
    return data;
  };

  const renderChart = () => {
    const data = generateTrendData();
    const chartWidth = SCREEN_WIDTH - 40;
    const chartHeight = 160;
    const leftPadding = 60; // Y ekseni için daha fazla alan
    const rightPadding = 30;
    const topPadding = 30;
    const bottomPadding = 30;
    const padding = leftPadding; // Backward compatibility için
    
    if (data.length === 0 || data.every(d => d.value === 0)) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('no_rating_data_yet') || 'Henüz rating verisi yok'}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {t('complete_workouts_to_see_rating_trend') || 'Antrenman tamamladıkça rating trendi görünecek'}
          </Text>
        </View>
      );
    }
    
    const maxValue = Math.max(...data.map(d => d.value), 5);
    const minValue = Math.min(...data.map(d => d.value), 0);
    const valueRange = maxValue - minValue || 1;
    
    const points = data.map((point, index) => {
      const x = leftPadding + (index * (chartWidth - leftPadding - rightPadding)) / (data.length - 1);
      const y = chartHeight - bottomPadding - ((point.value - minValue) / valueRange) * (chartHeight - topPadding - bottomPadding);
      return { x, y, value: point.value, label: point.label };
    });
    
    const pathData = points.map((point, index) => 
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
    ).join(' ');
    
    return (
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight + 40}>
          {/* Y-axis label */}
          <SvgText
            x={20}
            y={chartHeight / 2}
            fill={colors.text}
            fontSize="14"
            textAnchor="middle"
            fontFamily="Outfit-Medium"
            transform={`rotate(-90, 20, ${chartHeight / 2})`}
          >
            Rating
          </SvgText>
          
          {/* Grid lines only */}
          {[0, 1, 2, 3, 4, 5].map((value, index) => {
            const y = chartHeight - bottomPadding - ((value - minValue) / valueRange) * (chartHeight - topPadding - bottomPadding);
            return (
              <Line
                key={index}
                x1={leftPadding}
                y1={y}
                x2={chartWidth - rightPadding}
                y2={y}
                stroke={colors.divider}
                strokeWidth="1"
                strokeDasharray="2,2"
                opacity={0.3}
              />
            );
          })}
          
          {/* Chart line */}
          <Path
            d={pathData}
            stroke={colors.primary}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {points.map((point, index) => (
            <G key={index}>
              <Circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill={colors.primary}
                stroke={colors.card}
                strokeWidth="4"
              />
              {/* Rating değerlerini data points'lerin üzerine ekle */}
              <SvgText
                x={point.x}
                y={point.y - 15}
                textAnchor="middle"
                fontSize="12"
                fill={colors.text}
                fontFamily="Outfit-Bold"
              >
                {point.value.toFixed(1)}
              </SvgText>
            </G>
          ))}
          
          {/* Labels */}
          {points.map((point, index) => (
            <SvgText
              key={`label-${index}`}
              x={point.x}
              y={chartHeight + 20}
              textAnchor="middle"
              fontSize="12"
              fill={colors.textSecondary}
              fontFamily="Outfit-Regular"
            >
              {point.label}
            </SvgText>
          ))}
        </Svg>
      </View>
    );
  };

  const getTimeRangeText = (range: string) => {
    switch (range) {
      case 'week': return t('trends_week') || 'Hafta';
      case 'month': return t('trends_month') || 'Ay';
      case 'quarter': return t('trends_quarter') || 'Çeyrek';
      default: return range;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('trends_rating') || 'Rating Trendi'}
        </Text>
        <View style={styles.timeRangeSelector}>
          {(['week', 'month', 'quarter'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                {
                  backgroundColor: timeRange === range ? colors.primary : 'transparent',
                  borderColor: colors.primary,
                }
              ]}
              onPress={() => onTimeRangeChange(range)}
            >
              <Text style={[
                styles.timeRangeText,
                {
                  color: timeRange === range ? colors.buttonText : colors.primary,
                }
              ]}>
                {getTimeRangeText(range)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {renderChart()}
      
      <View style={styles.summary}>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          {t('trends_rating_summary') || 'Son dönemde rating gelişiminiz'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Outfit-SemiBold',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  timeRangeText: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16,
    paddingTop: 12,
    paddingLeft: 8,
  },
  summary: {
    marginTop: 8,
  },
  summaryText: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Outfit-Medium',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    textAlign: 'center',
  },
});

export default ProgressTrendsSection;