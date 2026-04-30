import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText, Line } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { WorkoutData, WeeklyTrend } from '../services/workoutHistoryService';
import CustomText from './common/CustomText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProgressChartsSectionProps {
  workoutData: WorkoutData[];
  weeklyTrends: WeeklyTrend[];
}

type TimeRange = 'week' | 'month' | 'quarter' | 'year';

const ProgressChartsSection: React.FC<ProgressChartsSectionProps> = ({
  workoutData,
  weeklyTrends,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('month');

  // Filter data based on time range
  const getFilteredData = (timeRange: TimeRange) => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    return workoutData.filter(workout =>
      new Date(workout.completedAt) >= startDate
    );
  };

  // Generate AI Score Trend Chart
  const AIScoreTrendChart = () => {
    const filteredData = getFilteredData(selectedTimeRange);
    if (filteredData.length === 0) return null;

    const chartWidth = SCREEN_WIDTH - 80;
    const chartHeight = 200;
    const padding = 40;
    const dataPoints = filteredData.slice(-20); // Last 20 workouts

    if (dataPoints.length < 2) return null;

    const maxScore = Math.max(...dataPoints.map(d => d.aiScore || 0));
    const minScore = Math.min(...dataPoints.map(d => d.aiScore || 0));
    const scoreRange = maxScore - minScore || 1;

    const points = dataPoints.map((workout, index) => {
      const x = padding + (index / (dataPoints.length - 1)) * (chartWidth - 2 * padding);
      const y = chartHeight - padding - ((workout.aiScore || 0) - minScore) / scoreRange * (chartHeight - 2 * padding);
      return { x, y, score: workout.aiScore || 0, date: workout.completedAt };
    });

    const pathData = points.map((point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
    ).join(' ');

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <CustomText style={[styles.chartTitle, { color: colors.text }]} fontWeight="600">
          {t('ai_score_trend') || 'AI Score Trend'}
        </CustomText>

        <Svg width={chartWidth} height={chartHeight}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((value, index) => {
            const y = chartHeight - padding - (value / 100) * (chartHeight - 2 * padding);
            return (
              <G key={index}>
                <Line
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke={`${colors.primary}15`}
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <SvgText
                  x={padding - 10}
                  y={y + 4}
                  fill={colors.textSecondary}
                  fontSize="12"
                  textAnchor="end"
                >
                  {value}
                </SvgText>
              </G>
            );
          })}

          {/* Trend line */}
          <Path
            d={pathData}
            stroke={colors.primary}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill={colors.primary}
              stroke="#FFFFFF"
              strokeWidth="2"
            />
          ))}
        </Svg>

        <View style={styles.chartStats}>
          <View style={styles.chartStat}>
            <CustomText style={[styles.chartStatValue, { color: colors.primary }]} fontWeight="700">
              {Math.round(dataPoints.reduce((sum, d) => sum + (d.aiScore || 0), 0) / dataPoints.length)}
            </CustomText>
            <CustomText style={[styles.chartStatLabel, { color: colors.textSecondary }]}>
              {t('average') || 'Average'}
            </CustomText>
          </View>
          <View style={styles.chartStat}>
            <CustomText style={[styles.chartStatValue, { color: colors.primary }]} fontWeight="700">
              {maxScore}
            </CustomText>
            <CustomText style={[styles.chartStatLabel, { color: colors.textSecondary }]}>
              {t('best') || 'Best'}
            </CustomText>
          </View>
        </View>
      </View>
    );
  };

  // Generate Volume Progress Chart
  const VolumeProgressChart = () => {
    const filteredData = getFilteredData(selectedTimeRange);
    if (filteredData.length === 0) return null;

    const chartWidth = SCREEN_WIDTH - 80;
    const chartHeight = 180;
    const padding = 40;

    // Group by week for better visualization
    const weeklyVolume = filteredData.reduce((acc, workout) => {
      const weekStart = new Date(workout.completedAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      acc[weekKey] = (acc[weekKey] || 0) + workout.volume;
      return acc;
    }, {} as Record<string, number>);

    const volumeData = Object.entries(weeklyVolume)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12); // Last 12 weeks

    if (volumeData.length < 2) return null;

    const maxVolume = Math.max(...volumeData.map(([, volume]) => volume));
    const barWidth = (chartWidth - 2 * padding) / volumeData.length - 4;

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <CustomText style={[styles.chartTitle, { color: colors.text }]} fontWeight="600">
          {t('weekly_volume') || 'Weekly Volume'}
        </CustomText>

        <Svg width={chartWidth} height={chartHeight}>
          {volumeData.map(([week, volume], index) => {
            const barHeight = (volume / maxVolume) * (chartHeight - 2 * padding);
            const x = padding + index * (barWidth + 4);
            const y = chartHeight - padding - barHeight;

            return (
              <G key={week}>
                <Path
                  d={`M ${x} ${y + barHeight} 
                     q 0 -4 4 -4 
                     h ${barWidth - 8} 
                     q 4 0 4 4 
                     v ${barHeight - 4}
                     h -${barWidth} Z`}
                  fill={colors.primary}
                />
                <SvgText
                  x={x + barWidth / 2}
                  y={chartHeight - 10}
                  fill={colors.textSecondary}
                  fontSize="10"
                  textAnchor="middle"
                >
                  {new Date(week).getMonth() + 1}/{new Date(week).getDate()}
                </SvgText>
              </G>
            );
          })}
        </Svg>

        <View style={styles.chartStats}>
          <View style={styles.chartStat}>
            <CustomText style={[styles.chartStatValue, { color: colors.primary }]} fontWeight="700">
              {Math.round(volumeData.reduce((sum, [, volume]) => sum + volume, 0) / 1000)}
            </CustomText>
            <CustomText style={[styles.chartStatLabel, { color: colors.textSecondary }]}>
              {t('total_tons') || 'Total Tons'}
            </CustomText>
          </View>
          <View style={styles.chartStat}>
            <CustomText style={[styles.chartStatValue, { color: colors.primary }]} fontWeight="700">
              {Math.round(maxVolume / 1000)}
            </CustomText>
            <CustomText style={[styles.chartStatLabel, { color: colors.textSecondary }]}>
              {t('peak_week') || 'Peak Week'}
            </CustomText>
          </View>
        </View>
      </View>
    );
  };

  // Generate Consistency Chart
  const ConsistencyChart = () => {
    const filteredData = getFilteredData(selectedTimeRange);
    if (filteredData.length === 0) return null;

    const chartWidth = SCREEN_WIDTH - 80;
    const chartHeight = 120;

    // Calculate weekly consistency (last 8 weeks)
    const weeks = [];
    const now = new Date();

    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

      const weekWorkouts = filteredData.filter(workout => {
        const workoutDate = new Date(workout.completedAt);
        return workoutDate >= weekStart && workoutDate <= weekEnd;
      });

      const workoutDays = new Set(weekWorkouts.map(w =>
        new Date(w.completedAt).toDateString()
      )).size;

      // Target: 3-4 workout days per week
      const consistencyScore = Math.min(100, (workoutDays / 4) * 100);

      weeks.push({
        week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        score: consistencyScore,
        workoutDays,
      });
    }

    const barWidth = (chartWidth - 60) / weeks.length - 4;

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <CustomText style={[styles.chartTitle, { color: colors.text }]} fontWeight="600">
          {t('weekly_consistency') || 'Weekly Consistency'}
        </CustomText>

        <Svg width={chartWidth} height={chartHeight}>
          {weeks.map((week, index) => {
            const barHeight = (week.score / 100) * (chartHeight - 40);
            const x = 30 + index * (barWidth + 4);
            const y = chartHeight - 20 - barHeight;

            const getConsistencyColor = (score: number) => {
              if (score >= 75) return '#10B981'; // Green
              if (score >= 50) return '#F59E0B'; // Yellow
              if (score >= 25) return '#F97316'; // Orange
              return '#EF4444'; // Red
            };

            return (
              <G key={index}>
                <Path
                  d={`M ${x} ${y + barHeight} 
                     q 0 -3 3 -3 
                     h ${barWidth - 6} 
                     q 3 0 3 3 
                     v ${barHeight - 3}
                     h -${barWidth} Z`}
                  fill={getConsistencyColor(week.score)}
                />
                <SvgText
                  x={x + barWidth / 2}
                  y={chartHeight - 5}
                  fill={colors.textSecondary}
                  fontSize="9"
                  textAnchor="middle"
                >
                  {week.week}
                </SvgText>
              </G>
            );
          })}
        </Svg>

        <View style={styles.chartStats}>
          <View style={styles.chartStat}>
            <CustomText style={[styles.chartStatValue, { color: colors.primary }]} fontWeight="700">
              {Math.round(weeks.reduce((sum, w) => sum + w.score, 0) / weeks.length)}%
            </CustomText>
            <CustomText style={[styles.chartStatLabel, { color: colors.textSecondary }]}>
              {t('avg_consistency') || 'Avg Consistency'}
            </CustomText>
          </View>
          <View style={styles.chartStat}>
            <CustomText style={[styles.chartStatValue, { color: colors.primary }]} fontWeight="700">
              {Math.max(...weeks.map(w => w.workoutDays))}
            </CustomText>
            <CustomText style={[styles.chartStatLabel, { color: colors.textSecondary }]}>
              {t('best_week') || 'Best Week'}
            </CustomText>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Time Range Selector */}
      <View style={[styles.timeRangeSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <CustomText style={[styles.selectorTitle, { color: colors.text }]} fontWeight="600">
          {t('progress_trends') || 'Progress Trends'}
        </CustomText>

        <View style={[styles.timeRangeButtons, { backgroundColor: colors.background }]}>
          {(['week', 'month', 'quarter', 'year'] as TimeRange[]).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                selectedTimeRange === range && { backgroundColor: colors.primary }
              ]}
              onPress={() => setSelectedTimeRange(range)}
            >
              <CustomText
                style={[
                  styles.timeRangeButtonText,
                  { color: selectedTimeRange === range ? '#FFFFFF' : colors.textSecondary }
                ]}
                fontWeight="500"
              >
                {t(range) || range.charAt(0).toUpperCase() + range.slice(1)}
              </CustomText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Charts */}
      <AIScoreTrendChart />
      <VolumeProgressChart />
      <ConsistencyChart />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  timeRangeSelector: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    borderWidth: 1,
  },
  selectorTitle: {
    fontSize: 18,
    fontFamily: 'Outfit',
    marginBottom: 12,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  timeRangeButtonText: {
    fontSize: 14,
    fontFamily: 'Outfit',
  },
  chartContainer: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'Outfit',
    marginBottom: 16,
  },
  chartStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#00000010',
  },
  chartStat: {
    alignItems: 'center',
  },
  chartStatValue: {
    fontSize: 18,
    fontFamily: 'Outfit',
    marginBottom: 4,
  },
  chartStatLabel: {
    fontSize: 12,
    fontFamily: 'Outfit',
  },
});

export default ProgressChartsSection;