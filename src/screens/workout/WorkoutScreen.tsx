import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { NavigationProp, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { 
  removeWorkout, 
  refreshWorkouts, 
  clearError,
  optimisticRemoveWorkout 
} from '../../store/slices/workoutSlice';
import { useTheme } from '../../context/ThemeContext';
import { useToastService } from '../../services/toast';
import { RootStackParamList } from '../../types/navigation';
import LottieView from 'lottie-react-native';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { Exercise } from '../../types/exercise';
import Svg, { Path, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ExerciseSet {
  id?: number;
  weight: number;
  reps: string;
  isCompleted: boolean;
}

interface WorkoutExercise extends Exercise {
  icon?: string;
  description?: string;
  restTime?: string;
  sets: ExerciseSet[];
}

interface WorkoutScreenProps {
  navigation: NavigationProp<any>;
  route?: any;
}

const WorkoutScreen: React.FC<WorkoutScreenProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const route = useRoute();
  const toast = useToastService();
  const dispatch = useDispatch();
  const { user_role_id } = useUser();

  // 🚀 Redux'dan instant veri al
  const { workouts, loading, error, initialized } = useSelector((state: RootState) => state.workout);

  useFocusEffect(
    React.useCallback(() => {
      dispatch(refreshWorkouts() as any);
    }, [dispatch])
  );

  const handleDeleteWorkout = async (workoutId: string) => {
    Alert.alert(
      t('workout_delete_title'),
      t('workout_delete_message'),
      [
        {
          text: t('cancel'),
          style: "cancel"
        },
        {
          text: t('workout_delete_confirm'),
          style: "destructive",
          onPress: async () => {
            try {
              // 🚀 Optimistic UI - Instant feedback
              dispatch(optimisticRemoveWorkout(workoutId));
              toast.showToast('success', t('workout_deleting'));

              // 💾 Background'da AsyncStorage'dan sil
              const result = await dispatch(removeWorkout(workoutId) as any);
              
              if (removeWorkout.rejected.match(result)) {
                toast.showToast('error', t('workout_delete_error'));
                return;
              }

              toast.showToast('success', t('workout_delete_success'));
            } catch (error) {
              console.error('Rutin silinirken hata:', error);
              toast.showToast('error', t('workout_delete_error'));
            }
          }
        }
      ]
    );
  };

  // Route params ile refresh tetiklenirse
  useEffect(() => {
    if ((route.params as any)?.shouldRefresh) {
      dispatch(refreshWorkouts() as any);
    }
  }, [(route.params as any)?.shouldRefresh]);

  // Error handling
  useEffect(() => {
    if (error) {
      toast.showToast('error', error);
      dispatch(clearError());
    }
  }, [error, dispatch, toast]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(refreshWorkouts() as any);
    setRefreshing(false);
  };

  // Loading state (sadece initial load için)
  if (!initialized && loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t('workout_loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (workouts.length === 0 && initialized) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'} />
        <View style={styles.emptyContainer}>
          <View style={styles.lottieContainer}>
            <LottieView
              source={require('../../assets/lotties/octopus.json')}
              autoPlay
              loop
              style={styles.lottie}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {t('workout_empty_title')}
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('CreateWorkout')}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyButtonText}>{t('workout_create_own')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.emptySecondaryButton, { borderColor: colors.primary }]}
            onPress={() => navigation.navigate('ReadyRoutines')}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonContent}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                    <Path 
                        d="M12 2L9.5 9.5L2 12L9.5 14.5L12 22L14.5 14.5L22 12L14.5 9.5L12 2Z" 
                        stroke={colors.primary} 
                        strokeWidth="2" 
                        strokeLinejoin="round"
                    />
                </Svg>
                <Text style={[styles.emptySecondaryButtonText, { color: colors.primary }]}>
                {t('workout_select_ready')}
                </Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
      >
        
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { 
              backgroundColor: colors.primary,
            }]}
            onPress={() => {
              // Freemium kullanıcılar için limit kontrolü
              if (user_role_id === 0 && workouts.length >= 3) {
                Alert.alert(
                  t('workout_limit_title'),
                  t('workout_limit_message'),
                  [
                    {
                      text: t('cancel'),
                      style: 'cancel',
                    },
                    {
                      text: t('upgrade_now'),
                      onPress: () => navigation.navigate('PaywallScreen', { source: 'settings' }),
                      style: 'default',
                    },
                  ]
                );
              } else {
                navigation.navigate('CreateWorkout');
              }
            }}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonContent}>
              <Svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                <Path
                  d="M12 2V22M2 12H22"
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </Svg>
              <Text style={styles.actionButtonText}>{t('workout_new_routine')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { 
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }]}
            onPress={() => navigation.navigate('ReadyRoutines')}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonContent}>
              <Svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                <Circle
                  cx="11"
                  cy="11"
                  r="8"
                  stroke={colors.text}
                  strokeWidth="2"
                  fill="none"
                />
                <Path
                  d="M21 21L16.65 16.65"
                  stroke={colors.text}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </Svg>
              <Text style={[styles.secondaryActionButtonText, { color: colors.text }]}>
                {t('workout_discover')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('workout_my_routines')}
          </Text>
        </View>

        {/* Workout Cards */}
        {workouts.map((workout, index) => (
          <View 
            key={workout.id || index} 
            style={[
              styles.routineCard, 
              { 
                backgroundColor: colors.card,
                borderColor: colors.border
              }
            ]}
          >
            <View style={styles.routineHeader}>
              <View style={[styles.routineAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.routineAvatarText}>
                  {workout.routineName?.split(' ').map(word => word[0]).join('').slice(0, 2) || 'W'}
                </Text>
              </View>
              
              <View style={styles.routineInfo}>
                <Text style={[styles.routineName, { color: colors.text }]} numberOfLines={1}>
                  {workout.routineName || t('workout_untitled')}
                </Text>
                <Text style={[styles.routineDescription, { 
                  color: colors.textSecondary 
                }]} numberOfLines={2}>
                  {workout.exercises?.map(ex => ex.name).join(' • ').slice(0, 80)}
                  {workout.exercises?.map(ex => ex.name).join(' • ').length > 80 ? '...' : ''}
                </Text>
                <View style={styles.routineMetaContainer}>
                  <View style={styles.routineMeta}>
                    <Svg width="14" height="14" viewBox="0 0 24 24" style={{ marginRight: 4 }}>
                      <Path
                        d="M6 2L3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6L18 2H6Z"
                        stroke={colors.textSecondary}
                        strokeWidth="2"
                        fill="none"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M3 6H21"
                        stroke={colors.textSecondary}
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <Path
                        d="M16 10C16 11.1046 15.1046 12 14 12H10C8.89543 12 8 11.1046 8 10"
                        stroke={colors.textSecondary}
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </Svg>
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      {workout.exercises?.length || 0} {t('workout_exercise')}
                    </Text>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.moreButton}
                onPress={() => handleDeleteWorkout(workout.id)}
                activeOpacity={0.7}
              >
                <Svg width="24" height="24" viewBox="0 0 24 24">
                  <Circle cx="12" cy="6" r="2" fill={colors.text} />
                  <Circle cx="12" cy="12" r="2" fill={colors.text} />
                  <Circle cx="12" cy="18" r="2" fill={colors.text} />
                </Svg>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.startButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('WorkoutTracking', {
                routineId: workout.id,
                routineName: workout.routineName || t('workout_untitled'),
                exercises: workout.exercises.map((exercise: any) => ({
                  id: exercise.id || Date.now(),
                  name: exercise.name,
                  icon: exercise.image || exercise.icon || '💪',
                  image: exercise.image,
                  description: exercise.description || `${exercise.name} egzersizi`,
                  restTime: exercise.restTime || '2:30',
                  sets: exercise.sets.map((set: any) => ({
                    id: set.id || 1,
                    weight: set.weight || 0,
                    reps: set.reps || '0',
                    isCompleted: set.isCompleted || false
                  }))
                })),
                isFromStats: false
              })}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>{t('workout_start_routine')}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  lottieContainer: {
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.5,
    marginBottom: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySecondaryButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  emptySecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryActionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  routineCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routineAvatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routineAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  routineDescription: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 6,
  },
  routineMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  moreButton: {
    padding: 8,
  },
  startButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default WorkoutScreen; 