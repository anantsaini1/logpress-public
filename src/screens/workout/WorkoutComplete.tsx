import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { storage } from '../../services/storage';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CompletedExercise {
  name: string;
  sets: Array<{
    weight: number;
    reps: number;
    isCompleted: boolean;
  }>;
}

interface WorkoutCompleteParams {
  duration: number;
  volume: number;
  sets: number;
  routineName?: string;
  exercises: CompletedExercise[];
}

// Kas grubu kategorileri
const getMuscleGroup = (exerciseName: string): string => {
  const name = exerciseName.toLowerCase();
  
  if (name.includes('bench') || name.includes('chest') || name.includes('fly')) return 'chest';
  if (name.includes('shoulder') || name.includes('press') || name.includes('raise')) return 'shoulders';
  if (name.includes('bicep') || name.includes('curl')) return 'biceps';
  if (name.includes('tricep') || name.includes('extension') || name.includes('dip')) return 'triceps';
  if (name.includes('back') || name.includes('row') || name.includes('pull') || name.includes('lat')) return 'back';
  if (name.includes('leg') || name.includes('squat') || name.includes('lunge')) return 'legs';
  if (name.includes('deadlift') || name.includes('hip')) return 'glutes';
  if (name.includes('plank') || name.includes('crunch') || name.includes('abs')) return 'abs';
  
  return 'core';
};

// Stat hesaplama fonksiyonu
const calculateStats = (volume: number, duration: number, sets: number) => {
  const durationMinutes = duration / 60;
  
  const endurance = Math.ceil(durationMinutes * 0.5 + sets * 0.3);
  const strength = Math.ceil((volume / 100) * 0.8);
  const power = Math.ceil((volume * sets) / (durationMinutes || 1) * 0.1);

  return {
    endurance: Math.max(1, endurance),
    strength: Math.max(1, strength),
    power: Math.max(1, power)
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

const WorkoutComplete = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const route = useRoute();
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  
  const params = route.params as WorkoutCompleteParams;
  const { duration, volume, sets, routineName, exercises = [] } = params;

  const [isLoading, setIsLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [muscleGroups, setMuscleGroups] = useState<Record<string, number>>({});
  
  const stats = calculateStats(volume, duration, sets);
  const weightAnimation = getWeightAnimation(volume, t);

  useEffect(() => {
    processWorkoutData();
  }, []);

  const processWorkoutData = async () => {
    try {
      setIsLoading(true);
      
      // Egzersizleri analiz et
      const muscleGroupStats: Record<string, number> = {};
      let totalWorkoutPoints = 0;
      
      exercises.forEach(exercise => {
        const completedSets = exercise.sets.filter(set => set.isCompleted);
        if (completedSets.length > 0) {
          const muscleGroup = getMuscleGroup(exercise.name);
          
          // Kas grubu puanları hesapla
          let exercisePoints = 0;
          completedSets.forEach(set => {
            const reps = parseInt(set.reps?.toString() || '0', 10);
            exercisePoints += (set.weight * reps) / 10; // Basit puanlama
          });
          
          muscleGroupStats[muscleGroup] = (muscleGroupStats[muscleGroup] || 0) + exercisePoints;
          totalWorkoutPoints += exercisePoints;
        }
      });

      // Genel puanı hesapla
      const overallRating = Math.ceil(
        (totalWorkoutPoints * 0.4) + 
        (stats.endurance * 2) + 
        (stats.strength * 2) + 
        (stats.power * 1.5)
      );

      setTotalPoints(overallRating);
      setMuscleGroups(muscleGroupStats);

      // AsyncStorage'a kaydet
      await saveWorkoutStats(overallRating, muscleGroupStats);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Workout data processing error:', error);
      setIsLoading(false);
    }
  };

  const saveWorkoutStats = async (points: number, muscles: Record<string, number>) => {
    try {
      // Mevcut istatistikleri al
      const currentStats = await storage.getUserStats() || {};
      
      // Yeni istatistikleri hesapla
      const updatedStats = {
        ...currentStats,
        total_workouts: (currentStats.total_workouts || 0) + 1,
        total_exercises: (currentStats.total_exercises || 0) + exercises.length,
        total_weight: (currentStats.total_weight || 0) + volume,
        total_time: (currentStats.total_time || 0) + duration,
        overall_rating: Math.ceil(((currentStats.overall_rating || 0) + points) / 2), // Ortalama
        last_workout_date: new Date().toISOString(),
        // Kas grubu istatistikleri
        muscle_data: {
          ...currentStats.muscle_data,
          biceps: Math.ceil(((currentStats.muscle_data?.biceps || 0) + (muscles.biceps || 0)) / 2),
          triceps: Math.ceil(((currentStats.muscle_data?.triceps || 0) + (muscles.triceps || 0)) / 2),
          chest: Math.ceil(((currentStats.muscle_data?.chest || 0) + (muscles.chest || 0)) / 2),
          back: Math.ceil(((currentStats.muscle_data?.back || 0) + (muscles.back || 0)) / 2),
          shoulders: Math.ceil(((currentStats.muscle_data?.shoulders || 0) + (muscles.shoulders || 0)) / 2),
          legs: Math.ceil(((currentStats.muscle_data?.legs || 0) + (muscles.legs || 0)) / 2),
          glutes: Math.ceil(((currentStats.muscle_data?.glutes || 0) + (muscles.glutes || 0)) / 2),
          abs: Math.ceil(((currentStats.muscle_data?.abs || 0) + (muscles.abs || 0)) / 2),
        }
      };

      await storage.saveUserStats(updatedStats);
      
    } catch (error) {
      console.error('Stats save error:', error);
    }
  };

  const getMuscleGroupDisplayName = (group: string): string => {
    const names: Record<string, string> = {
      chest: t('muscle_chest'),
      shoulders: t('muscle_shoulders'),
      biceps: t('muscle_biceps'),
      triceps: t('muscle_triceps'),
      back: t('muscle_back'),
      legs: t('muscle_legs'),
      glutes: t('muscle_glutes'),
      abs: t('muscle_abs'),
      core: t('muscle_core'),
    };
    return names[group] || group;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Antrenman istatistikleri hesaplanıyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          
          {/* Başlık */}
          <Text style={[styles.celebration, { color: colors.primary }]}>{weightAnimation.celebration}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{t('workout_completed')}</Text>
          
          {/* Animasyon */}
          <View style={styles.animationContainer}>
            <LottieView
              source={weightAnimation.source}
              autoPlay
              loop={true}
              style={styles.lottieAnimation}
            />
            <Text style={[styles.congratsText, { color: colors.text }]}>
              {weightAnimation.text}
            </Text>
          </View>

          {/* Ana İstatistikler */}
          <View style={[styles.statsContainer, { 
            backgroundColor: colors.card,
            borderColor: colors.border 
          }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('workout_summary')}</Text>
            
            {/* Süre */}
            <View style={[styles.statItem, { borderBottomColor: colors.border }]}>
              <View style={styles.statLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                  <Svg width="20" height="20" viewBox="0 0 24 24">
                    <Circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke={colors.primary}
                      strokeWidth="2"
                      fill="none"
                    />
                    <Path
                      d="M12 6V12L16 14"
                      stroke={colors.primary}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>
                <View>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('workout_duration')}</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {Math.floor(duration / 60)} {t('workout_minutes')}
                  </Text>
                </View>
              </View>
              <Text style={[styles.bonus, { color: colors.primary }]}>+{stats.endurance}</Text>
            </View>

            {/* Hacim */}
            <View style={[styles.statItem, { borderBottomColor: colors.border }]}>
              <View style={styles.statLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                  <Svg width="20" height="20" viewBox="0 0 24 24">
                    <Path
                      d="M20.2 4H3.8C2.80589 4 2 4.80589 2 5.8V18.2C2 19.1941 2.80589 20 3.8 20H20.2C21.1941 20 22 19.1941 22 18.2V5.8C22 4.80589 21.1941 4 20.2 4Z"
                      stroke={colors.primary}
                      strokeWidth="2"
                      fill="none"
                    />
                    <Path
                      d="M8 8H16M8 12H16M8 16H16"
                      stroke={colors.primary}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>
                <View>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('workout_total_volume')}</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{volume} {t('workout_kg_unit')}</Text>
                </View>
              </View>
              <Text style={[styles.bonus, { color: colors.primary }]}>+{stats.strength}</Text>
            </View>

            {/* Set Sayısı */}
            <View style={[styles.statItem, { borderBottomColor: colors.border }]}>
              <View style={styles.statLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                  <Svg width="20" height="20" viewBox="0 0 24 24">
                    <Path
                      d="M17 2L21 6L17 10"
                      stroke={colors.primary}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <Path
                      d="M3 11V9C3 7.93913 3.42143 6.92172 4.17157 6.17157C4.92172 5.42143 5.93913 5 7 5H21"
                      stroke={colors.primary}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>
                <View>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('workout_total_sets')}</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{sets} {t('workout_set_unit')}</Text>
                </View>
              </View>
              <Text style={[styles.bonus, { color: colors.primary }]}>+{stats.power}</Text>
            </View>
            
            {/* Toplam Puan */}
            <View style={[styles.totalPointsContainer, { backgroundColor: colors.primary }]}>
              <Text style={styles.totalPointsLabel}>{t('workout_total_points')}</Text>
              <Text style={styles.totalPointsValue}>{totalPoints}</Text>
            </View>
          </View>

          {/* Tamamlanan Egzersizler */}
          {exercises.length > 0 && (
            <View style={[styles.statsContainer, { 
              backgroundColor: colors.card,
              borderColor: colors.border 
            }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('workout_completed_exercises')}</Text>
              
              {exercises.map((exercise, index) => {
                const completedSets = exercise.sets.filter(set => set.isCompleted).length;
                
                return (
                  <View key={index} style={[styles.exerciseItem, { borderBottomColor: colors.border }]}>
                    <View style={styles.exerciseLeft}>
                      <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                        <Svg width="16" height="16" viewBox="0 0 24 24">
                          <Path
                            d="M6 2L3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6L18 2H6Z"
                            stroke={colors.primary}
                            strokeWidth="2"
                            fill="none"
                          />
                          <Path
                            d="M3 6H21"
                            stroke={colors.primary}
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </Svg>
                      </View>
                      <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={1}>
                        {exercise.name}
                      </Text>
                    </View>
                    <View style={[styles.exerciseBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.exerciseBadgeText}>{completedSets}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Kas Grubu Gelişimi */}
          {Object.keys(muscleGroups).length > 0 && (
            <View style={[styles.statsContainer, { 
              backgroundColor: colors.card,
              borderColor: colors.border 
            }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('workout_muscle_group_development')}</Text>
              
              {Object.entries(muscleGroups)
                .sort(([_, a], [__, b]) => b - a)
                .slice(0, 5) // En yüksek 5 kas grubu
                .map(([muscleGroup, points]) => (
                  <View key={muscleGroup} style={[styles.statItem, { borderBottomColor: colors.border }]}>
                    <View style={styles.statLeft}>
                      <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                        <Svg width="16" height="16" viewBox="0 0 24 24">
                          <Circle
                            cx="12"
                            cy="12"
                            r="3"
                            stroke={colors.primary}
                            strokeWidth="2"
                            fill={colors.primary}
                          />
                        </Svg>
                      </View>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                        {getMuscleGroupDisplayName(muscleGroup)}
                      </Text>
                    </View>
                    <Text style={[styles.bonus, { color: colors.primary }]}>
                      +{Math.ceil(points)}
                    </Text>
                  </View>
                ))
              }
            </View>
          )}

          {/* Devam Et Butonu */}
          <TouchableOpacity 
            style={[styles.continueButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              navigation.goBack();
            }}
          >
            <Text style={styles.continueButtonText}>{t('workout_great_continue')}</Text>
          </TouchableOpacity>
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
    textAlign: 'center',
  },
  celebration: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  animationContainer: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  lottieAnimation: {
    width: SCREEN_WIDTH * 0.35,
    height: SCREEN_WIDTH * 0.35,
    marginBottom: 16,
  },
  congratsText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  statsContainer: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  bonus: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalPointsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  totalPointsLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  totalPointsValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  exerciseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  exerciseBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 40,
    alignItems: 'center',
  },
  exerciseBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  continueButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WorkoutComplete; 