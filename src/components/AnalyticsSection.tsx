import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from 'react-native';
import { Svg, Path, Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next'
import { WorkoutAnalytics } from '../services/workoutHistoryService';
import CustomText from './common/CustomText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnalyticsSectionProps {
  analytics: WorkoutAnalytics;
  loading?: boolean;
}

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ analytics, loading = false }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Animated values
  const animatedTotalWorkouts = useRef(new Animated.Value(0)).current;
  const animatedAvgDuration = useRef(new Animated.Value(0)).current;
  const animatedTotalVolume = useRef(new Animated.Value(0)).current;
  const animatedConsistency = useRef(new Animated.Value(0)).current;
  const animatedCurrentStreak = useRef(new Animated.Value(0)).current;
  const animatedLongestStreak = useRef(new Animated.Value(0)).current;

  // Display values
  const [displayedTotalWorkouts, setDisplayedTotalWorkouts] = React.useState('0');
  const [displayedAvgDuration, setDisplayedAvgDuration] = React.useState('0');
  const [displayedTotalVolume, setDisplayedTotalVolume] = React.useState('0');
  const [displayedConsistency, setDisplayedConsistency] = React.useState('0');
  const [displayedCurrentStreak, setDisplayedCurrentStreak] = React.useState('0');
  const [displayedLongestStreak, setDisplayedLongestStreak] = React.useState('0');

  // Animation configuration
  const animationConfig = {
    duration: 800,
    easing: Easing.out(Easing.ease),
    useNativeDriver: false,
  };

  // Start animations
  const startAnimations = React.useCallback(() => {
    if (!analytics || loading) return;

    // Reset all animated values
    animatedTotalWorkouts.setValue(0);
    animatedAvgDuration.setValue(0);
    animatedTotalVolume.setValue(0);
    animatedConsistency.setValue(0);
    animatedCurrentStreak.setValue(0);
    animatedLongestStreak.setValue(0);

    // Start parallel animations
    Animated.parallel([
      Animated.timing(animatedTotalWorkouts, {
        toValue: analytics.totalWorkouts,
        ...animationConfig,
      }),
      Animated.timing(animatedAvgDuration, {
        toValue: Math.round(analytics.averageDuration / 60), // Convert to minutes
        ...animationConfig,
      }),
      Animated.timing(animatedTotalVolume, {
        toValue: Math.round(analytics.totalVolume / 1000), // Convert to tons for display
        ...animationConfig,
      }),
      Animated.timing(animatedConsistency, {
        toValue: analytics.consistencyScore,
        ...animationConfig,
      }),
      Animated.timing(animatedCurrentStreak, {
        toValue: analytics.currentStreak,
        ...animationConfig,
      }),
      Animated.timing(animatedLongestStreak, {
        toValue: analytics.longestStreak,
        ...animationConfig,
      }),
    ]).start();
  }, [analytics, loading]);

  // Set up listeners
  useEffect(() => {
    const listeners = [
      animatedTotalWorkouts.addListener(({ value }) => {
        setDisplayedTotalWorkouts(Math.floor(value).toString());
      }),
      animatedAvgDuration.addListener(({ value }) => {
        setDisplayedAvgDuration(Math.floor(value).toString());
      }),
      animatedTotalVolume.addListener(({ value }) => {
        setDisplayedTotalVolume(Math.floor(value).toString());
      }),
      animatedConsistency.addListener(({ value }) => {
        setDisplayedConsistency(Math.floor(value).toString());
      }),
      animatedCurrentStreak.addListener(({ value }) => {
        setDisplayedCurrentStreak(Math.floor(value).toString());
      }),
      animatedLongestStreak.addListener(({ value }) => {
        setDisplayedLongestStreak(Math.floor(value).toString());
      }),
    ];

    return () => {
      listeners.forEach((listener, index) => {
        switch (index) {
          case 0: animatedTotalWorkouts.removeListener(listener); break;
          case 1: animatedAvgDuration.removeListener(listener); break;
          case 2: animatedTotalVolume.removeListener(listener); break;
          case 3: animatedConsistency.removeListener(listener); break;
          case 4: animatedCurrentStreak.removeListener(listener); break;
          case 5: animatedLongestStreak.removeListener(listener); break;
        }
      });
    };
  }, []);

  // Start animations when analytics change
  useEffect(() => {
    startAnimations();
  }, [startAnimations]);

  // Get consistency color
  const getConsistencyColor = (score: number): string => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#F59E0B'; // Yellow
    if (score >= 40) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  // Get streak emoji
  const getStreakEmoji = (streak: number): string => {
    if (streak >= 30) return '🔥🔥🔥';
    if (streak >= 14) return '🔥🔥';
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '⚡';
    return '💪';
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <CustomText style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t('loading_analytics') || 'Loading analytics...'}
        </CustomText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <CustomText style={[styles.title, { color: colors.text }]} fontWeight="700">
          {t('workout_analytics') || 'Workout Analytics'}
        </CustomText>
        <CustomText style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('your_fitness_journey') || 'Your fitness journey at a glance'}
        </CustomText>
      </View>

      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Total Workouts */}
        <View style={[styles.statCard, { backgroundColor: colors.background }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.primary }]}>
            <Svg width="20" height="20" viewBox="0 0 24 24">
              <Path
                d="M6 12H18M4 8V16M20 8V16M2 10V14M22 10V14"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <CustomText style={[styles.statValue, { color: colors.primary }]} fontWeight="700">
            {displayedTotalWorkouts}
          </CustomText>
          <CustomText style={[styles.statLabel, { color: colors.textSecondary }]}>
            {t('total_workouts') || 'Total Workouts'}
          </CustomText>
        </View>

        {/* Average Duration */}
        <View style={[styles.statCard, { backgroundColor: colors.background }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.primary }]}>
            <Svg width="20" height="20" viewBox="0 0 24 24">
              <Path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="#FFFFFF"
                strokeWidth="2"
                fill="none"
              />
              <Path
                d="M12 6V12L16 14"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </Svg>
          </View>
          <CustomText style={[styles.statValue, { color: colors.primary }]} fontWeight="700">
            {displayedAvgDuration}
          </CustomText>
          <CustomText style={[styles.statLabel, { color: colors.textSecondary }]}>
            {t('avg_minutes') || 'Avg Minutes'}
          </CustomText>
        </View>

        {/* Total Volume */}
        <View style={[styles.statCard, { backgroundColor: colors.background }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.primary }]}>
            <Svg width="20" height="20" viewBox="0 0 24 24">
              <Path
                d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
                fill="#FFFFFF"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <CustomText style={[styles.statValue, { color: colors.primary }]} fontWeight="700">
            {displayedTotalVolume}
          </CustomText>
          <CustomText style={[styles.statLabel, { color: colors.textSecondary }]}>
            {t('total_tons') || 'Total Tons'}
          </CustomText>
        </View>

        {/* Consistency Score */}
        <View style={[styles.statCard, { backgroundColor: colors.background }]}>
          <View style={[styles.statIconContainer, { backgroundColor: getConsistencyColor(analytics.consistencyScore) }]}>
            <Svg width="20" height="20" viewBox="0 0 24 24">
              <Path
                d="M21 21H3V3"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M7 14L12 9L16 13L21 8"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <CustomText style={[styles.statValue, { color: getConsistencyColor(analytics.consistencyScore) }]} fontWeight="700">
            {displayedConsistency}%
          </CustomText>
          <CustomText style={[styles.statLabel, { color: colors.textSecondary }]}>
            {t('consistency') || 'Consistency'}
          </CustomText>
        </View>
      </View>

      {/* Streak Section */}
      <View style={[styles.streakSection, { backgroundColor: colors.background }]}>
        <View style={styles.streakItem}>
          <CustomText style={[styles.streakEmoji]}>{getStreakEmoji(analytics.currentStreak)}</CustomText>
          <View style={styles.streakInfo}>
            <CustomText style={[styles.streakValue, { color: colors.primary }]} fontWeight="700">
              {displayedCurrentStreak}
            </CustomText>
            <CustomText style={[styles.streakLabel, { color: colors.textSecondary }]}>
              {t('current_streak') || 'Current Streak'}
            </CustomText>
          </View>
        </View>

        <View style={[styles.streakDivider, { backgroundColor: colors.border }]} />

        <View style={styles.streakItem}>
          <CustomText style={[styles.streakEmoji]}>🏆</CustomText>
          <View style={styles.streakInfo}>
            <CustomText style={[styles.streakValue, { color: colors.primary }]} fontWeight="700">
              {displayedLongestStreak}
            </CustomText>
            <CustomText style={[styles.streakLabel, { color: colors.textSecondary }]}>
              {t('longest_streak') || 'Longest Streak'}
            </CustomText>
          </View>
        </View>
      </View>

      {/* Muscle Group Distribution */}
      {Object.keys(analytics.muscleGroupDistribution).length > 0 && (
        <View style={styles.distributionSection}>
          <CustomText style={[styles.distributionTitle, { color: colors.text }]} fontWeight="600">
            {t('muscle_group_focus') || 'Muscle Group Focus'}
          </CustomText>
          <View style={styles.distributionList}>
            {Object.entries(analytics.muscleGroupDistribution)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([muscleGroup, count], index) => {
                const percentage = (count / analytics.totalWorkouts) * 100;
                return (
                  <View key={muscleGroup} style={styles.distributionItem}>
                    <View style={styles.distributionInfo}>
                      <CustomText style={[styles.distributionLabel, { color: colors.text }]} fontWeight="500">
                        {muscleGroup}
                      </CustomText>
                      <CustomText style={[styles.distributionCount, { color: colors.textSecondary }]}>
                        {count} ({Math.round(percentage)}%)
                      </CustomText>
                    </View>
                    <View style={[styles.distributionBar, { backgroundColor: `${colors.primary}20` }]}>
                      <View 
                        style={[
                          styles.distributionBarFill, 
                          { 
                            backgroundColor: colors.primary,
                            width: `${percentage}%`
                          }
                        ]} 
                      />
                    </View>
                  </View>
                );
              })}
          </View>
        </View>
      )}

      {/* Workout Type Distribution */}
      {Object.keys(analytics.workoutTypeDistribution).length > 0 && (
        <View style={styles.distributionSection}>
          <CustomText style={[styles.distributionTitle, { color: colors.text }]} fontWeight="600">
            {t('workout_type_breakdown') || 'Workout Type Breakdown'}
          </CustomText>
          <View style={styles.typeDistributionGrid}>
            {Object.entries(analytics.workoutTypeDistribution).map(([type, count]) => {
              const percentage = (count / analytics.totalWorkouts) * 100;
              const typeColors = {
                strength: '#E11D48',
                cardio: '#059669',
                flexibility: '#7C3AED',
                mixed: '#EA580C',
              };
              const typeColor = typeColors[type as keyof typeof typeColors] || colors.primary;
              
              return (
                <View key={type} style={[styles.typeCard, { backgroundColor: colors.background }]}>
                  <View style={[styles.typeIcon, { backgroundColor: `${typeColor}20` }]}>
                    <CustomText style={[styles.typeEmoji]}>
                      {type === 'strength' ? '💪' : 
                       type === 'cardio' ? '❤️' : 
                       type === 'flexibility' ? '🧘' : '🔥'}
                    </CustomText>
                  </View>
                  <CustomText style={[styles.typeValue, { color: typeColor }]} fontWeight="700">
                    {count}
                  </CustomText>
                  <CustomText style={[styles.typeLabel, { color: colors.textSecondary }]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </CustomText>
                  <CustomText style={[styles.typePercentage, { color: colors.textSecondary }]}>
                    {Math.round(percentage)}%
                  </CustomText>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 8,
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
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Outfit',
    paddingVertical: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Outfit',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Outfit',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 80) / 2 - 6,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Outfit',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Outfit',
    textAlign: 'center',
  },
  streakSection: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  streakItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakEmoji: {
    fontSize: 24,
  },
  streakInfo: {
    flex: 1,
  },
  streakValue: {
    fontSize: 20,
    fontFamily: 'Outfit',
    marginBottom: 2,
  },
  streakLabel: {
    fontSize: 12,
    fontFamily: 'Outfit',
  },
  streakDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  distributionSection: {
    marginBottom: 20,
  },
  distributionTitle: {
    fontSize: 16,
    fontFamily: 'Outfit',
    marginBottom: 12,
  },
  distributionList: {
    gap: 12,
  },
  distributionItem: {
    gap: 8,
  },
  distributionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distributionLabel: {
    fontSize: 14,
    fontFamily: 'Outfit',
    textTransform: 'capitalize',
  },
  distributionCount: {
    fontSize: 12,
    fontFamily: 'Outfit',
  },
  distributionBar: {
    height: 6,
    borderRadius: 3,
  },
  distributionBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  typeDistributionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 80) / 2 - 6,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  typeEmoji: {
    fontSize: 16,
  },
  typeValue: {
    fontSize: 18,
    fontFamily: 'Outfit',
    marginBottom: 2,
  },
  typeLabel: {
    fontSize: 12,
    fontFamily: 'Outfit',
    marginBottom: 2,
  },
  typePercentage: {
    fontSize: 10,
    fontFamily: 'Outfit',
  },
});

export default AnalyticsSection;