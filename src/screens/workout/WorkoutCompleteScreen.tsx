import React, { useEffect, useState, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import {
  getUserStats,
  getWorkoutEvaluation,
  updateLeaderboardPoints,
} from '../../services/api';
import { storage, RatingHistoryEntry } from '../../services/storage';
import { NavigationProps } from '../../types/navigation';
import { useAppDispatch } from '../../store/hooks';
import { loadUserStats, loadUserFromStorage } from '../../store/slices/userSlice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const timerIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 7V12L15 15" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const weightIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20.2 4H3.8C2.80589 4 2 4.80589 2 5.8V18.2C2 19.1941 2.80589 20 3.8 20H20.2C21.1941 20 22 19.1941 22 18.2V5.8C22 4.80589 21.1941 4 20.2 4Z" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 8H16M8 12H16M8 16H16" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const repeatIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M17 2L21 6L17 10" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M3 11V9C3 7.93913 3.42143 6.92172 4.17157 6.17157C4.92172 5.42143 5.93913 5 7 5H21" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M7 22L3 18L7 14" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M21 13V15C21 16.0609 20.5786 17.0783 19.8284 17.8284C19.0783 18.5786 18.0609 19 17 19H3" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Muscle group icon SVGs
const muscleIcons: Record<string, string> = {
  chest: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15C15.3137 15 18 12.3137 18 9C18 5.68629 15.3137 3 12 3C8.68629 3 6 5.68629 6 9C6 12.3137 8.68629 15 12 15Z" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M7 13L5 21L12 19L19 21L17 13" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  
  back: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 18V5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V18" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 9V7C6 5.89543 6.89543 5 8 5" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18 9V7C18 5.89543 17.1046 5 16 5" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 9V17C6 19.2091 7.79086 21 10 21H14C16.2091 21 18 19.2091 18 17V9" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  
  shoulders: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 4C6 2.89543 6.89543 2 8 2H16C17.1046 2 18 2.89543 18 4V20C18 21.1046 17.1046 22 16 22H8C6.89543 22 6 21.1046 6 20V4Z" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3 9.5H6" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18 9.5H21" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3 14.5H6" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18 14.5H21" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  
  biceps: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 20L9 18.5L15 21L20 19.5" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4 16L9 14.5L15 17L20 15.5" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4 12L9 10.5L15 13L20 11.5" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4 8L9 6.5L15 9L20 7.5" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4 4L9 2.5L15 5L20 3.5" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  
  triceps: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 5V15C5 16.1046 5.89543 17 7 17H17C18.1046 17 19 16.1046 19 15V5" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3 5H21" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  
  legs: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2L8 14C8 17.3137 10.6863 20 14 20V20" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16 20L20 20" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16 2L16 9" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  
  abs: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 8H18" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 12H18" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 16H18" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 3V21" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  
  glutes: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  
  cardio: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 12H18L15 21L9 3L6 12H2" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  
  core: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 2V12L17 17" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  
  shoulder: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 4C6 2.89543 6.89543 2 8 2H16C17.1046 2 18 2.89543 18 4V20C18 21.1046 17.1046 22 16 22H8C6.89543 22 6 21.1046 6 20V4Z" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3 9.5H6" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18 9.5H21" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3 14.5H6" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18 14.5H21" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  
  upper_chest: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15C15.3137 15 18 12.3137 18 9C18 5.68629 15.3137 3 12 3C8.68629 3 6 5.68629 6 9C6 12.3137 8.68629 15 12 15Z" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M7 13L5 21L12 19L19 21L17 13" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  
  hamstring: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2L8 14C8 17.3137 10.6863 20 14 20V20" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16 20L20 20" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16 2L16 9" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  
  calf: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2L8 14C8 17.3137 10.6863 20 14 20V20" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16 20L20 20" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16 2L16 9" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
};

  // Component içinde muscle groups tanımlaması yapılacak

const calculateStats = (volume: number, duration: number, sets: number) => {
  const endurance = Math.ceil((duration / 60) * 0.3 + (sets * 0.2));
  const strength = Math.ceil((volume / 1000) * 0.5);
  const power = Math.ceil((volume * sets) / (duration * 0.5));

  return {
    endurance: Number(endurance),
    strength: Number(strength),
    power: Number(power)
  };
};

// Ağırlık animasyonu seçme
const getWeightAnimation = (totalWeight: number, t: any) => {
  if (totalWeight >= 1000) {
    const cars = Math.floor(totalWeight / 1000);
    return {
      source: require('../../assets/lotties/carLottie.json'),
      text: t('animation_car_weight').replace('{count}', cars.toString()),
      celebration: 'Amazing!'
    };
  } else if (totalWeight >= 500) {
    return {
      source: require('../../assets/lotties/monkey.json'),
      text: t('animation_great_workout'),
      celebration: 'Great Job!'
    };
  } else {
    const turtles = Math.floor(totalWeight / 100) || 1;
    return {
      source: require('../../assets/lotties/turtle.json'),
      text: t('animation_turtle_weight').replace('{count}', turtles.toString()),
      celebration: 'Well Done!'
    };
  }
};

interface CompletedExercise {
  name: string;
  sets: Array<{
    weight: number;
    reps: number;
    isCompleted: boolean;
  }>;
}

const WorkoutCompleteScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user_role_id } = useUser();
  const dispatch = useAppDispatch();

  const muscleGroups: Record<string, string> = {
    chest: t('muscle_chest'),
    back: t('muscle_back'),
    shoulders: t('muscle_shoulders'),
    biceps: t('muscle_biceps'),
    triceps: t('muscle_triceps'),
    legs: t('muscle_legs'),
    abs: t('muscle_abs'),
    glutes: t('muscle_glutes'),
    core: t('muscle_core'),
    calf: t('muscle_calf'),
    upper_chest: t('muscle_upper_chest'),
    shoulder: t('muscle_shoulders')
  };
  const { duration, volume, sets, routineName, exercises = [] } = route.params as {
    duration: number;
    volume: number;
    sets: number;
    routineName?: string;
    exercises: Array<CompletedExercise>;
  };

  const [isLoading, setIsLoading] = useState(true);
  const [_totalPoints, setTotalPoints] = useState(0);
  const [musclePoints, setMusclePoints] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  
  const isPremium = user_role_id >= 1;

  const stats = calculateStats(volume, duration, sets);
  const weightAnimation = getWeightAnimation(volume, t);

  // iOS'ta swipe back gesture'ını engelle
  useLayoutEffect(() => {
    navigation.setOptions({
      gestureEnabled: false, // iOS swipe back'i engelle
      headerBackVisible: false, // Header back button'ı da gizle (eğer varsa)
    });
  }, [navigation]);

  const processWorkoutData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Premium kontrolü - Sadece premium kullanıcılar AI analizi alır
      
      if (!isPremium) {
        setIsLoading(false);
        return;
      }
      
      // 📈 RATING HISTORY: Workout öncesi rating'i kaydet
      const beforeRating = await storage.getCurrentUserRating();
      
      const { stats: currentStats, error: statsError } = await getUserStats();
      
      if (statsError) {
        throw new Error('Kullanıcı istatistikleri alınamadı');
      }
      
      let totalVolume = 0;
      let completedExercises: any[] = [];

      exercises.forEach(exercise => {
        const completedSets = exercise.sets.filter(set => set.isCompleted);
        if (completedSets.length > 0) {
          let exerciseVolume = 0;
          completedSets.forEach(set => {
            const reps = set.reps || 0;
            exerciseVolume += set.weight * reps;
          });

          completedExercises.push({
            name: exercise.name,
            sets: completedSets.map(set => ({
              weight: set.weight,
              reps: set.reps || 0
            })),
            totalVolume: exerciseVolume
          });

          totalVolume += exerciseVolume;
        }
      });

      const workoutData = {
        exercises: completedExercises,
        totalVolume,
        duration,
        totalSets: sets
      };

      const { evaluation, error: aiError } = await getWorkoutEvaluation(currentStats, workoutData);
      
      if (aiError) {
        throw new Error('AI değerlendirmesi alınamadı');
      }

      if (!evaluation) {
        throw new Error('AI değerlendirmesi boş geldi');
      }

      setTotalPoints(evaluation.over_all_rating);
      setMusclePoints({
        biceps: evaluation.biceps || 0,
        triceps: evaluation.triceps || 0,
        back: evaluation.back || 0,
        chest: evaluation.chest || 0,
        shoulder: evaluation.shoulder || 0,
        upper_chest: evaluation.upper_chest || 0,
        hamstring: evaluation.hamstring || 0,
        calf: evaluation.calf || 0,
      });

      const leaderboardPoints = Math.ceil(evaluation.over_all_rating * 0.1);
      const { error: leaderboardError, newLeaderboardPoints } = await updateLeaderboardPoints(leaderboardPoints);

      // 🔥 ÖNEMLİ: Redux store'u güncelle ki Ana sayfa yeni leaderboard puanını görsün
      await Promise.all([
        dispatch(loadUserStats()),
        dispatch(loadUserFromStorage()) // Ana sayfa için user data'yı da yenile
      ]);
      
      // 📈 RATING HISTORY: Workout sonrası rating'i al ve değişimi kaydet
      const afterRating = await storage.getCurrentUserRating();
      
      if (beforeRating !== afterRating) {
        const ratingHistoryEntry: RatingHistoryEntry = {
          date: new Date().toISOString(),
          beforeRating,
          afterRating,
          workoutId: `workout_${Date.now()}`,
          workoutName: routineName || 'Unnamed Workout',
          change: afterRating - beforeRating,
          workoutDuration: duration,
          workoutVolume: volume
        };
        
        await storage.addRatingHistoryEntry(ratingHistoryEntry);
      }
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('❌ İstatistik hesaplama hatası:', err);
      setError(err.message || 'Puanlar hesaplanırken bir hata oluştu');
      setIsLoading(false);
    }
  }, [isPremium, user_role_id, exercises, duration, sets, dispatch]);

  useEffect(() => {
    processWorkoutData();
  }, [processWorkoutData]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('workout_calculating_stats')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{t('workout_thats_it')}</Text>
          
          <View style={styles.animationContainer}>
            <LottieView
              source={weightAnimation.source}
              autoPlay
              loop={true}
              style={styles.lottieAnimation}
            />
            <Text style={[styles.congratsText, { color: colors.text }]}>{weightAnimation.text}</Text>
          </View>

          <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('workout_statistics')}</Text>
            
            <View style={[styles.statItem, { borderBottomColor: colors.border }]}>
              <View style={styles.statLeft}>
                <SvgXml xml={timerIcon} width={24} height={24} />
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('workout_duration')}</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{Math.round(duration / 60)} {t('workout_minutes')}</Text>
              </View>
              <Text style={[styles.bonus, styles.redText]}>+{stats.endurance} {t('workout_endurance')}</Text>
            </View>

            <View style={[styles.statItem, { borderBottomColor: colors.border }]}>
              <View style={styles.statLeft}>
                <SvgXml xml={weightIcon} width={24} height={24} />
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('workout_volume')}</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{volume} {t('workout_kg_unit')}</Text>
              </View>
              <Text style={[styles.bonus, styles.redText]}>+{stats.strength} {t('workout_strength')}</Text>
            </View>

            <View style={[styles.statItem, { borderBottomColor: colors.border }]}>
              <View style={styles.statLeft}>
                <SvgXml xml={repeatIcon} width={24} height={24} />
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('workout_total_sets')}</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{sets} {t('workout_set_unit')}</Text>
              </View>
              <Text style={[styles.bonus, styles.redText]}>+{stats.power} {t('workout_endurance')}</Text>
            </View>
            

            
            {isPremium && Object.entries(musclePoints).some(([, points]) => points > 0) && 
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('workout_ai_muscle_analysis')}</Text>
                {Object.entries(musclePoints)
                  .filter(([, points]) => points > 0) // 0 puan olanları gizle
                  .sort(([, a], [, b]) => b - a) 
                  .map(([muscleGroup, points]) => (
                    <View key={muscleGroup} style={[styles.statItem, { borderBottomColor: colors.border }]}>
                      <View style={styles.statLeft}>
                        {muscleIcons[muscleGroup] && (
                          <SvgXml 
                            xml={muscleIcons[muscleGroup]} 
                            width={24} 
                            height={24} 
                          />
                        )}
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          {muscleGroups[muscleGroup as keyof typeof muscleGroups] || muscleGroup}
                        </Text>
                      </View>
                      <Text style={[styles.bonus, styles.redText]}>+{Math.ceil(points)} {t('workout_points_unit')}</Text>
                    </View>
                  ))
                }
              </>
            }
            
            {!isPremium && (
              <View style={[styles.premiumBanner, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                <Text style={[styles.premiumTitle, { color: colors.primary }]}>{t('workout_ai_muscle_analysis_robot')}</Text>
                <Text style={[styles.premiumDescription, { color: colors.textSecondary }]}>
                  {t('workout_premium_ai_description')}
                </Text>
                <Text style={[styles.premiumCta, { color: colors.primary }]}>
                  {t('workout_upgrade_to_premium_cta')}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={[
              styles.continueButton,
              (isLoading || error) && styles.disabledButton
            ]}
            disabled={isLoading || !!error}
            onPress={() => {
              navigation.navigate('Home', { screen: 'Stats' });
            }}
          >
            <Text style={styles.continueButtonText}>
              {isLoading ? t('workout_calculating') : error ? t('workout_try_again') : t('workout_continue')}
            </Text>
          </TouchableOpacity>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
  },
  animationContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  lottieAnimation: {
    width: SCREEN_WIDTH * 0.4,
    height: SCREEN_WIDTH * 0.4,
    marginBottom: 16,
  },
  congratsText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsContainer: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIcon: {
    fontSize: 24,
  },
  statLabel: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  bonus: {
    fontSize: 14,
    fontWeight: '500',
  },
  redText: {
    color: '#E11D48',
  },
  continueButton: {
    width: SCREEN_WIDTH - 40,
    height: 56,
    backgroundColor: '#E11D48',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 16,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },

  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
  premiumBanner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  premiumDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  premiumCta: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default WorkoutCompleteScreen; 