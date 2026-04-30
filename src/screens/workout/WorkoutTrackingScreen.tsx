import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  PanResponder,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  AppState,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { storage } from '../../services/storage';
import Toast from 'react-native-toast-message';
import { useTheme, lightColors, darkColors } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { exerciseService } from '../../services/exerciseService';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { updateWorkout } from '../../store/slices/workoutSlice';
import Svg, { Path, Circle } from 'react-native-svg';
import { ExerciseSet as GlobalExerciseSet, Exercise as GlobalExercise } from '../../types/exercise';
import WorkoutInfoScreen from './WorkoutInfoScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutTracking'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -80;

export interface ExerciseSet extends GlobalExerciseSet {
  previousWeight?: string;
  previousReps?: string;
}

export interface Exercise extends Omit<GlobalExercise, 'id'| 'sets'> {
  id: number;
  restTime?: string;
  sets: ExerciseSet[];
  isExpanded?: boolean;
  icon?: string;
  description?: string;
}

type Routine = {
  id: string | number;
  name: string;
  exercises: Exercise[];
};

type LocalWorkout = {
  id: string;
  name: string;
  duration: number;
  volume: number;
  totalSets: number;
  exercises: Exercise[];
  updatedAt: string;
  createdAt: string;
};

const WorkoutTrackingScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [imageErrors, setImageErrors] = useState<{[key: number]: boolean}>({});
  
  // 🔥 ARRAY MEMORY LEAK FIX: Memoized initial exercises to prevent recreation
  const initialExercises = useMemo(() => {
    return route.params.exercises.map((exercise, index) => {
      const exerciseData = exercise.id ? exerciseService.getExerciseById(exercise.id.toString()) : null;
      
      return {
        ...(exercise as Exercise),
        id: Date.now() + index,
        icon: exerciseData?.image || (exercise as any).icon || '💪',
        image: exerciseData?.image || exercise.image,
        description: (exercise as any).description || '',
        restTime: (exercise as any).restTime || '',
        isExpanded: true,
        sets: exercise.sets.map((set: any, setIndex: number) => {
          const newSet: ExerciseSet = {
            id: setIndex + 1,
            weight: set.weight?.toString() || '0',
            reps: set.reps || '0',
            isCompleted: set.isCompleted || false,
            previousWeight: set.previousWeight?.toString(),
            previousReps: set.previousReps || undefined
          };
          return newSet;
        })
      };
    });
  }, [route.params.exercises]); // Only recalculate if route params change

  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);

  // 🔥 ARRAY MEMORY LEAK FIX: Use shallow copy instead of deep JSON copy
  const [originalExercises, setOriginalExercises] = useState<Exercise[]>(() => 
    initialExercises.map(ex => ({ ...ex, sets: ex.sets.map((set: ExerciseSet) => ({ ...set })) }))
  );
  
  // Workout değişiklikleri için state'ler
  const [hasWorkoutChanges, setHasWorkoutChanges] = useState(false);
  const [showWorkoutChangesModal, setShowWorkoutChangesModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<'complete' | 'back' | null>(null);

  // WorkoutInfo modal için state'ler
  const [showWorkoutInfoModal, setShowWorkoutInfoModal] = useState(false);
  const [selectedExerciseForInfo, setSelectedExerciseForInfo] = useState<any>(null);

  const [workoutStats, setWorkoutStats] = useState({
    startTime: 0, // Will be set when component mounts
    duration: 0,
    volume: 0,
    sets: 0,
  });

  // 🔥 ARRAY MEMORY LEAK FIX: More efficient refs with cleanup
  const statsRef = useRef(workoutStats);
  const exercisesRef = useRef<Exercise[]>([]);
  const exercisesLengthRef = useRef(0);
  
  // 🔥 ARRAY MEMORY LEAK FIX: Update refs efficiently and cleanup old references
  useEffect(() => {
    statsRef.current = workoutStats;
  }, [workoutStats]);
  
  useEffect(() => {
    // Clear old reference before setting new one
    exercisesRef.current = [];
    exercisesLengthRef.current = exercises.length;
    
    // Create shallow copy to avoid reference leaks
    exercisesRef.current = exercises.map((ex: Exercise) => ({ 
      ...ex, 
      sets: ex.sets.slice(0, 10) // Limit sets to prevent memory explosion
    }));
  }, [exercises]);

  // Workout başlatılırken storage'dan güncellenmiş routine'i yükle
  useEffect(() => {
    const loadUpdatedRoutine = async () => {
      try {
        const routineKey = `routine_${route.params.routineId}`;
        const storedRoutineData = await storage.getItem(routineKey);
        
        if (storedRoutineData) {
          const storedRoutine = JSON.parse(storedRoutineData);
          
          // Storage'dan gelen exercise'ları formatting'le
          const formattedExercises: Exercise[] = storedRoutine.exercises.map((exercise: any, index: number) => {
            const exerciseData = exercise.id ? exerciseService.getExerciseById(exercise.id.toString()) : null;
            
            return {
              ...exercise,
              id: Date.now() + index + Math.random(), // Unique ID
              icon: exerciseData?.image || exercise.icon || '💪',
              image: exerciseData?.image || exercise.image,
              isExpanded: true,
              sets: exercise.sets.map((set: any, setIndex: number) => ({
                id: setIndex + 1,
                weight: set.weight?.toString() || '0',
                reps: set.reps || '0',
                isCompleted: false, // Yeni workout'ta setler tamamlanmamış olarak başlar
                previousWeight: set.previousWeight?.toString() || set.weight?.toString(), // Önceki weight'i hatırla
                previousReps: set.previousReps || set.reps // Önceki reps'i hatırla
              }))
            };
          });
          
          setExercises(formattedExercises);
          // 🔥 ARRAY MEMORY LEAK FIX: Use shallow copy instead of deep JSON copy
          const shallowOriginalExercises = formattedExercises.slice(0, 50).map((ex: Exercise) => ({ 
            ...ex, 
            sets: ex.sets.slice(0, 20).map((set: ExerciseSet) => ({ ...set }))
          }));
          setOriginalExercises(shallowOriginalExercises);
        }
      } catch (error) {
        console.error('Error loading routine from storage:', error);
        // Hata durumunda default exercises'ı kullan
      }
    };

    if (route.params.routineId) {
      loadUpdatedRoutine();
    }
  }, [route.params.routineId]);

  // CreateWorkout'tan geri dönüş handling'i
  useFocusEffect(
    React.useCallback(() => {
      const checkForWorkoutUpdates = async () => {
        try {
          // Workout update kontrolü (tüm egzersizleri değiştir)
          const updatedWorkoutData = await AsyncStorage.getItem('updatedWorkoutExercises');
          if (updatedWorkoutData) {
            const updatedExercises = JSON.parse(updatedWorkoutData);
            
            // Mevcut workout'u tamamen güncelle
            const formattedExercises: Exercise[] = updatedExercises.map((selectedExercise: any, index: number) => {
              const exerciseData = selectedExercise.id ? exerciseService.getExerciseById(selectedExercise.id.toString()) : null;
              
              return {
                ...selectedExercise,
                id: Date.now() + index + Math.random(), // Unique ID
                name: selectedExercise.name,
                icon: exerciseData?.image || selectedExercise.icon || '🏋️‍♂️',
                image: exerciseData?.image || undefined,
                description: selectedExercise.description || `${selectedExercise.name} - ${selectedExercise.target || ''}`,
                restTime: selectedExercise.restTime || '',
                isExpanded: true,
                sets: [
                  {
                    id: 1,
                    weight: '0',
                    reps: '10',
                    isCompleted: false,
                    previousWeight: undefined,
                    previousReps: undefined
                  }
                ]
              };
            });
            
            setExercises(formattedExercises);
            await AsyncStorage.removeItem('updatedWorkoutExercises');
            return; // Early return, diğer kontrolü yapma
          }

          // Yeni egzersiz ekleme kontrolü (eski sistem için backward compatibility)
          const newExercisesData = await AsyncStorage.getItem('temporarySelectedExercises');
          if (newExercisesData) {
            const newExercises = JSON.parse(newExercisesData);
            
            // Mevcut egzersizleri al (fresh state)
            setExercises(currentExercises => {
              // Yeni egzersizleri ekle
              const exercisesToAdd: Exercise[] = [];
              
              newExercises.forEach((selectedExercise: any) => {
                const isExerciseExists = currentExercises.some(
                  exercise => exercise.name.toLowerCase() === selectedExercise.name.toLowerCase()
                );

                if (!isExerciseExists) {
                  const exerciseData = selectedExercise.id ? exerciseService.getExerciseById(selectedExercise.id.toString()) : null;
                  
                  exercisesToAdd.push({
                    ...selectedExercise,
                    id: Date.now() + Math.random(), // Unique ID
                    name: selectedExercise.name,
                    icon: exerciseData?.image || selectedExercise.icon || '🏋️‍♂️',
                    image: exerciseData?.image || undefined,
                    description: selectedExercise.description || `${selectedExercise.name} - ${selectedExercise.target || ''}`,
                    restTime: selectedExercise.restTime || '',
                    isExpanded: true,
                    sets: [
                      {
                        id: 1,
                        weight: '0',
                        reps: '10',
                        isCompleted: false,
                        previousWeight: undefined,
                        previousReps: undefined
                      }
                    ]
                  });
                }
              });
              
              return [...currentExercises, ...exercisesToAdd];
            });
            
            await AsyncStorage.removeItem('temporarySelectedExercises');
          }
        } catch (error) {
          console.error('Error loading workout updates:', error);
        }
      };

      checkForWorkoutUpdates();
    }, []) // dependency boş kalabilir çünkü setExercises callback kullanıyor
  );

  // 🔥 TIMER FIX: Proper startTime initialization and stable timer
  useEffect(() => {
    // Set the actual start time when component mounts
    const workoutStartTime = Date.now();
    setWorkoutStats(prev => ({ ...prev, startTime: workoutStartTime }));
    
    let timerRef: NodeJS.Timeout | null = null;
    let subscription: any = null;

    const updateTimer = () => {
      const now = Date.now();
      const duration = Math.floor((now - workoutStartTime) / 1000);
      setWorkoutStats(prev => ({ ...prev, duration }));
    };

    // Start timer after setting start time
    timerRef = setInterval(updateTimer, 1000);

    // AppState listener setup
    subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        updateTimer();
      }
    });

    // 🔥 CRITICAL: Comprehensive cleanup
    return () => {
      if (timerRef) {
        clearInterval(timerRef);
        timerRef = null;
      }
      if (subscription) {
        subscription.remove();
        subscription = null;
      }
    };
  }, []); // Empty dependency - stable timer

  useEffect(() => {
    if (showWorkoutChangesModal) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showWorkoutChangesModal]);

  // 🔥 PERFORMANCE FIX: Optimized calculateStats with memoization and memory efficiency
  const calculateStats = useCallback(() => {
    let totalVolume = 0;
    let completedSets = 0;

    // Use current exercises state directly instead of ref
    const currentExercises = exercises;
    const maxExercises = Math.min(currentExercises.length, 50); // Limit to prevent memory explosion
    
    // Optimized calculation - avoid nested forEach
    for (let i = 0; i < maxExercises; i++) {
      const exercise = currentExercises[i];
      if (!exercise || !exercise.sets) continue;
      
      const maxSets = Math.min(exercise.sets.length, 20); // Limit sets per exercise
      for (let j = 0; j < maxSets; j++) {
        const set = exercise.sets[j];
        if (set && set.isCompleted) {
          const reps = parseInt(set.reps) || 0;
          const weight = parseFloat(String(set.weight).replace(',', '.')) || 0;
          
          // Prevent extreme values that could cause memory issues
          if (reps <= 1000 && weight <= 10000) {
            totalVolume += weight * reps;
            completedSets += 1;
          }
        }
      }
    }

    setWorkoutStats(prev => ({
      ...prev,
      volume: Math.min(totalVolume, 999999), // Cap volume
      sets: Math.min(completedSets, 9999), // Cap sets
    }));

    return { volume: totalVolume, totalSets: completedSets };
  }, [exercises]); // Dependency on exercises state

  // calculateStats fonksiyonunu her exercises değiştiğinde otomatik çağır
  useEffect(() => {
    calculateStats();
  }, [exercises, calculateStats]);

  // Workout değişikliklerini kontrol et (kg/reps değişimi hariç)
  const checkWorkoutChanges = () => {
    try {
      // Egzersiz sayısı değişti mi?
      if (exercises.length !== originalExercises.length) {
        return true;
      }

      // Egzersiz isimleri değişti mi?
      for (let i = 0; i < exercises.length; i++) {
        if (exercises[i].name !== originalExercises[i].name) {
          return true;
        }
        
        // Set sayısı değişti mi?
        if (exercises[i].sets.length !== originalExercises[i].sets.length) {
          return true;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  };

  // Workout değişikliklerini takip et
  useEffect(() => {
    const hasChanges = checkWorkoutChanges();
    setHasWorkoutChanges(hasChanges);
  }, [exercises]);

  const toggleExercise = useCallback((exerciseId: number) => {
    setExercises(prevExercises => {
      return prevExercises.map(exercise => {
        if (exercise.id === exerciseId) {
          return { ...exercise, isExpanded: !exercise.isExpanded };
        }
        return exercise;
      });
    });
  }, []);

  // Egzersiz silme fonksiyonu
  const handleDeleteExercise = useCallback((exerciseId: number) => {
    const exerciseToDelete = exercises.find(ex => ex.id === exerciseId);
    
    Alert.alert(
      t('save_workout_delete_exercise_title'),
      t('save_workout_delete_exercise_message'),
      [
        {
          text: t('cancel'),
          style: "cancel"
        },
        {
          text: t('workout_delete_confirm'),
          style: "destructive",
          onPress: () => {
            setExercises(prevExercises => {
              const updatedExercises = prevExercises.filter(ex => ex.id !== exerciseId);
              return updatedExercises;
            });
            
            // İstatistikleri yeniden hesapla
            calculateStats();
          }
        }
      ]
    );
  }, [exercises, t, calculateStats]);

  // Egzersiz bilgilerini göster
  const showExerciseInfo = useCallback((exercise: Exercise) => {
    // exerciseService'den egzersizi isimle ara
    const allExercises = exerciseService.getAllExercises();
    const exerciseData = allExercises.find(ex => 
      ex.name.toLowerCase() === exercise.name.toLowerCase()
    );
    
    // WorkoutInfoScreen için gerekli format - gerçek egzersiz ID'sini kullan
    const exerciseForInfo = {
      id: exerciseData?.id || '1', // Gerçek UUID ID'yi kullan, bulunamazsa default ID
      name: exercise.name,
      target: exercise.target || exerciseData?.target || '',
      image: exercise.image || exerciseData?.image,
      equipment: exercise.equipment || exerciseData?.equipment || ''
    };
    
    setSelectedExerciseForInfo(exerciseForInfo);
    setShowWorkoutInfoModal(true);
  }, []);

  // 🔥 PERFORMANCE & MEMORY FIX: Optimized deleteSet function
  const deleteSet = useCallback((exerciseId: number, setId: number) => {
    setExercises(prevExercises => {
      const exerciseToUpdate = prevExercises.find(e => e.id === exerciseId);
      if (!exerciseToUpdate) return prevExercises;

      // Calculate volume to subtract BEFORE removing the set
      const setToRemove = exerciseToUpdate.sets.find(set => set.id === setId);
      let volumeToSubtract = 0;
      
      if (setToRemove?.isCompleted) {
        const reps = parseInt(setToRemove.reps) || 0;
        const weight = parseFloat(String(setToRemove.weight).replace(',', '.')) || 0;
        volumeToSubtract = weight * reps;
      }

      // Filter out the set
      const updatedSets = exerciseToUpdate.sets.filter(set => set.id !== setId);

      // If no sets remain, remove the entire exercise
      if (updatedSets.length === 0) {
        // Update stats immediately
        setWorkoutStats(prev => ({
          ...prev,
          volume: Math.max(0, prev.volume - volumeToSubtract),
          sets: setToRemove?.isCompleted ? Math.max(0, prev.sets - 1) : prev.sets
        }));
        
        return prevExercises.filter(e => e.id !== exerciseId);
      }

      // Re-index the remaining sets to maintain unique and sequential IDs
      const reIndexedSets = updatedSets.map((set, index) => ({
        ...set,
        id: Date.now() + index // Her zaman benzersiz ID
      }));

      // Update stats immediately to prevent cascading calculations
      setWorkoutStats(prev => ({
        ...prev,
        volume: Math.max(0, prev.volume - volumeToSubtract),
        sets: setToRemove?.isCompleted ? Math.max(0, prev.sets - 1) : prev.sets
      }));

      // Return updated exercises
      return prevExercises.map(exercise => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            sets: reIndexedSets
          };
        }
        return exercise;
      });
    });
  }, []);

  // 🔥 UI FREEZE FIX: Optimized updateSet with early return to prevent unnecessary renders
  const updateSet = useCallback((exerciseId: number, setId: number, weight: string | number, reps: string) => {
    setExercises(prevExercises => {
      const exerciseIndex = prevExercises.findIndex(ex => ex.id === exerciseId);
      if (exerciseIndex === -1) return prevExercises;
      
      const exercise = prevExercises[exerciseIndex];
      const setIndex = exercise.sets.findIndex(set => set.id === setId);
      if (setIndex === -1) return prevExercises;
      
      // Check if values actually changed to prevent unnecessary re-renders
      const currentSet = exercise.sets[setIndex];
      if (currentSet.weight === weight && currentSet.reps === reps) {
        return prevExercises; // Early return - no change needed
      }
      
      // Create minimal update - only change what's necessary
      const newExercises = [...prevExercises];
      const newSets = [...exercise.sets];
      newSets[setIndex] = { ...currentSet, weight, reps };
      newExercises[exerciseIndex] = { ...exercise, sets: newSets };
      
      return newExercises;
    });
    
    // Immediate stats calculation - no debounce bullshit!
    calculateStats();
  }, [calculateStats]);

  // 🔥 PERFORMANCE FIX: Optimized toggleSet function  
  const toggleSet = useCallback((exerciseId: number, setId: number) => {
    setExercises(prevExercises => {
      return prevExercises.map(exercise => {
        if (exercise.id === exerciseId) {
          const updatedSets = exercise.sets.map(set => {
            if (set.id === setId) {
              return { ...set, isCompleted: !set.isCompleted };
            }
            return set;
          });
          return { ...exercise, sets: updatedSets };
        }
        return exercise;
      });
    });
    
    // Immediate stats calculation - no debounce bullshit!
    calculateStats();
  }, [calculateStats]);

  // 🔥 PERFORMANCE FIX: Optimized addSet function
  const addSet = useCallback((exerciseId: number) => {
    setExercises(prevExercises => {
      return prevExercises.map(exercise => {
        if (exercise.id === exerciseId) {
          const lastSet = exercise.sets.length > 0 ? exercise.sets[exercise.sets.length - 1] : null;
          
          const newSet: ExerciseSet = {
            id: exercise.sets.length + 1, // Sequential ID
            weight: lastSet?.weight || 0,
            reps: lastSet?.reps || '0',
            isCompleted: false,
            previousWeight: lastSet?.weight?.toString() || '0',
            previousReps: lastSet?.reps || '0'
          };

          return {
            ...exercise,
            sets: [...exercise.sets, newSet]
          };
        }
        return exercise;
      });
    });
    
    // Immediate stats calculation - no debounce bullshit!
    calculateStats();
  }, [calculateStats]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const handleWorkoutComplete = async () => {
    const { volume, totalSets } = calculateStats();
    
    if (volume === 0) {
      Toast.show({
        type: 'error',
        text1: t('workout_tracking_zero_volume')
      });
      return;
    }
    
    try {
      // 🔥 ARRAY MEMORY LEAK FIX: Limit and optimize exercise data for saving
      const limitedExercises = exercises.slice(0, 50); // Limit exercises
      
      // 1. HER ZAMAN YENİ BİR COMPLETED WORKOUT KAYDI OLUŞTUR
      const completedWorkout = {
        routineId: route.params.routineId,
        routineName: route.params.routineName,
        duration: workoutStats.duration,
        volume: Math.min(volume, 999999), // Cap volume
        totalSets: Math.min(totalSets, 9999), // Cap sets
        exercises: limitedExercises.map((exercise: Exercise) => ({
          name: exercise.name,
          sets: exercise.sets.slice(0, 20).map((set: ExerciseSet) => ({ // Limit sets per exercise
            weight: parseFloat(String(set.weight).replace(',', '.')) || 0,
            reps: set.reps,
            isCompleted: set.isCompleted
          }))
        })),
        completedAt: new Date().toISOString()
      };

      // Completed workout'ı user_workouts array'ine kaydet
      await storage.saveUserWorkout(completedWorkout);

      // 2. ROUTINE TEMPLATE'İNİ GÜNCELLE (sadece previous values için)
      const updatedExercises = limitedExercises.map((exercise: Exercise) => ({
        ...exercise,
        sets: exercise.sets.slice(0, 20).map((set: ExerciseSet) => ({
          ...set,
          previousWeight: set.weight, // Mevcut string ağırlığı previous olarak kaydet
          previousReps: set.reps // Mevcut tekrarı previous olarak kaydet
        }))
      }));

      const updatedRoutine = {
        id: route.params.routineId,
        name: route.params.routineName,
        exercises: updatedExercises,
        updated_at: new Date().toISOString()
      };
      
      // Routine template'ini güncelle (sadece previous values için)
      const routineKey = `routine_${route.params.routineId}`;
      await storage.setItem(routineKey, JSON.stringify(updatedRoutine));
      
      // Redux store'u da güncelle
      await dispatch(updateWorkout({
        workoutId: route.params.routineId,
        updates: {
          exercises: updatedExercises.map(exercise => ({
            ...exercise,
            id: exercise.id,
            name: exercise.name,
            icon: exercise.icon,
            description: exercise.description,
            restTime: exercise.restTime,
            sets: exercise.sets.map(set => ({
              ...set,
              id: set.id,
              weight: set.weight,
              reps: set.reps,
              isCompleted: set.isCompleted,
              previousWeight: set.weight,
              previousReps: set.reps
            }))
          })),
          updated_at: new Date().toISOString()
        }
      }) as any);
      
    } catch (error) {
      console.error('Error saving completed workout:', error);
      Toast.show({
        type: 'error',
        text1: t('workout_tracking_save_error')
      });
      return;
    }
    
    navigation.navigate('WorkoutComplete', {
      routineName: route.params.routineName,
      duration: workoutStats.duration,
      volume,
      sets: totalSets,
      note: '',
      exercises: exercises.map(exercise => ({
        name: exercise.name,
        sets: exercise.sets
      })),
      shouldRefresh: true,
      nextScreen: 'Stats'
    });
  };

  const checkAndHandleWorkoutComplete = () => {
    const { volume } = calculateStats();
    
    if (volume === 0) {
      Toast.show({
        type: 'error',
        text1: t('workout_tracking_zero_volume')
      });
      return;
    }

    // Workout değişiklikleri varsa modal göster
    if (hasWorkoutChanges) {
      setPendingNavigation('complete');
      setShowWorkoutChangesModal(true);
    } else {
      handleWorkoutComplete();
    }
  };

  const checkAndHandleFinish = () => {
    // Workout değişiklikleri varsa modal göster
    if (hasWorkoutChanges) {
      setPendingNavigation('back');
      setShowWorkoutChangesModal(true);
    } else {
      navigation.goBack();
    }
  };

  // Workout değişiklikleri modalında kullanıcı seçimi
  const handleWorkoutChangesResponse = async (updateRoutine: boolean) => {
    // Önce animasyonlu kapanma
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowWorkoutChangesModal(false);
    });
    
    if (updateRoutine) {
      // Routin'i güncelle
      try {
        await updateRoutineWithChanges();
        Toast.show({
          type: 'success',
          text1: t('workout_tracking_changes_saved')
        });
      } catch (error) {
        console.error('Error updating routine:', error);
        Toast.show({
          type: 'error',
          text1: t('workout_tracking_save_error')
        });
      }
    } else {
      Toast.show({
        type: 'info',
        text1: t('workout_tracking_changes_discarded')
      });
    }

    // Pending navigation'ı gerçekleştir
    if (pendingNavigation === 'complete') {
      handleWorkoutComplete();
    } else if (pendingNavigation === 'back') {
      navigation.goBack();
    }
    
    setPendingNavigation(null);
  };

  // Routin'i güncelleyen fonksiyon
  const updateRoutineWithChanges = async () => {
    try {
      // 🔥 ARRAY MEMORY LEAK FIX: Avoid deep copy, use shallow copy with limits
      const limitedExercises = exercises.slice(0, 50).map((exercise: Exercise) => ({
        ...exercise,
        sets: exercise.sets.slice(0, 20).map((set: ExerciseSet) => ({
          ...set,
          previousWeight: set.weight,
          previousReps: set.reps
        }))
      }));

      // Updated routine'i oluştur
      const updatedRoutine = {
        id: route.params.routineId,
        name: route.params.routineName,
        exercises: limitedExercises,
        updated_at: new Date().toISOString()
      };
      
      // 1. Storage'a kaydet (routine_${routineId} key'i ile)
      const routineKey = `routine_${route.params.routineId}`;
      const success = await storage.setItem(routineKey, JSON.stringify(updatedRoutine));
      
      if (!success) {
        throw new Error('Storage save failed');
      }

      // 2. Redux store'u da güncelle (ana workout listesindeki exercise count'u güncellemek için)
      await dispatch(updateWorkout({
        workoutId: route.params.routineId,
        updates: {
          exercises: limitedExercises,
          updated_at: new Date().toISOString()
        }
      }) as any);

      // 3. 🔥 ARRAY MEMORY LEAK FIX: Use shallow copy instead of deep JSON copy
      const shallowOriginalExercises = exercises.slice(0, 50).map((ex: Exercise) => ({ 
        ...ex, 
        sets: ex.sets.slice(0, 20).map((set: ExerciseSet) => ({ ...set }))
      }));
      
      setOriginalExercises(shallowOriginalExercises);
      setHasWorkoutChanges(false);
      
    } catch (error) {
      throw error;
    }
  };

  // 🔥 UI FREEZE FIX: Better memoization to prevent excessive re-renders
  const memoizedExerciseList = useMemo(() => {
    // Limit exercises to prevent memory issues
    const limitedExercises = exercises.slice(0, 50);
    
    return limitedExercises.map((exercise, index) => (
      <View key={exercise.id} style={[styles.exerciseCard, { 
        backgroundColor: currentTheme === 'dark' ? colors.card : '#ffffff',
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
      }]}>
        {/* Exercise Header */}
        <View
          style={[
            styles.exerciseHeader,
            {
              paddingVertical: 16,
              paddingHorizontal: 16,
              borderBottomWidth: exercise.isExpanded
                ? StyleSheet.hairlineWidth
                : 0,
              borderBottomColor: colors.divider,
              backgroundColor:
                currentTheme === 'dark'
                  ? index % 2 === 0
                    ? colors.card
                    : colors.surface
                  : '#ffffff',
            },
          ]}
        >
          <TouchableOpacity
            style={styles.exerciseHeaderLeft}
            onPress={() => showExerciseInfo(exercise)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.exerciseIconContainer,
                {
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.primary + '15',
                  marginRight: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                },
              ]}
            >
              {exercise.image && !imageErrors[exercise.id] ? (
                <Image
                  source={{ uri: exercise.image }}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                  onError={() =>
                    setImageErrors((prev) => ({ ...prev, [exercise.id]: true }))
                  }
                />
              ) : (
                <Image
                  source={require('../../assets/logo.png')}
                  style={{
                    width: 32,
                    height: 32,
                    tintColor:
                      currentTheme === 'dark'
                        ? darkColors.text
                        : lightColors.primary,
                  }}
                  resizeMode="contain"
                />
              )}
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text
                style={[
                  styles.exerciseName,
                  {
                    color: colors.text,
                    fontSize: 17,
                    fontWeight: '600',
                    marginBottom: 4,
                  },
                ]}
                numberOfLines={1}
              >
                {exercise.name}
              </Text>
              <Text
                style={[
                  styles.exerciseDescription,
                  {
                    color: colors.textSecondary,
                    fontSize: 13,
                    opacity: 0.8,
                  },
                ]}
                numberOfLines={1}
              >
                {exercise.description ||
                  `${exercise.target || ''} • ${exercise.equipment || ''}`}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => handleDeleteExercise(exercise.id)}
            activeOpacity={0.7}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 16,
                fontWeight: 'bold',
              }}
            >
              ⋮
            </Text>
          </TouchableOpacity>
        </View>

        {/* Exercise Content */}
        {exercise.isExpanded && (
          <View style={styles.exerciseContent}>
            <View style={[styles.setsList, { paddingHorizontal: 16, paddingVertical: 12 }]}>
              <View style={[styles.setHeader, { 
                flexDirection: 'row', 
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                marginBottom: 8
              }]}>
                <Text style={[styles.setHeaderText, { 
                  flex: 0.5, 
                  color: colors.textSecondary, 
                  fontSize: 13, 
                  fontWeight: '500',
                  textAlign: 'center'
                }]}>{t('workout_tracking_set_header')}</Text>
                <Text style={[styles.setHeaderText, { 
                  flex: 1, 
                  color: colors.textSecondary, 
                  fontSize: 13, 
                  fontWeight: '500',
                  textAlign: 'center'
                }]}>{t('workout_tracking_previous_header')}</Text>
                <Text style={[styles.setHeaderText, { 
                  flex: 1, 
                  color: colors.textSecondary, 
                  fontSize: 13, 
                  fontWeight: '500',
                  textAlign: 'center'
                }]}>{t('workout_tracking_weight_header')}</Text>
                <Text style={[styles.setHeaderText, { 
                  flex: 1, 
                  color: colors.textSecondary, 
                  fontSize: 13, 
                  fontWeight: '500',
                  textAlign: 'center'
                }]}>{t('workout_tracking_reps_header')}</Text>
                <Text style={[styles.setHeaderText, { 
                  flex: 0.5, 
                  color: colors.textSecondary, 
                  fontSize: 13, 
                  fontWeight: '500',
                  textAlign: 'center'
                }]}>✓</Text>
              </View>
              
              {/* Limit sets to prevent memory issues */}
              {exercise.sets.slice(0, 20).map((set, index) => (
                <SetRow 
                  key={set.id} 
                  set={set} 
                  setNumber={index + 1}
                  exerciseId={exercise.id}
                  colors={colors}
                  currentTheme={currentTheme}
                  updateSet={updateSet}
                  toggleSet={toggleSet}
                  deleteSet={deleteSet}
                  isEven={index % 2 === 0}
                  t={t}
                />
              ))}
            </View>

            <View style={{
              marginTop: 8,
              marginBottom: 16,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              paddingBottom: 16
            }}>
              <TouchableOpacity 
                disabled={exercise.sets.length >= 20} // Limit sets
                style={{
                  backgroundColor: 'transparent',
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1.5,
                  borderColor: exercise.sets.length >= 20 ? colors.border : colors.primary + '30',
                  borderStyle: exercise.sets.length >= 20 ? 'solid' : 'dashed',
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: exercise.sets.length >= 20 ? 0 : 0.1,
                  shadowRadius: 2,
                  elevation: exercise.sets.length >= 20 ? 0 : 1,
                  opacity: exercise.sets.length >= 20 ? 0.5 : 1
                }}
                onPress={() => exercise.sets.length < 20 && addSet(exercise.id)}
                activeOpacity={0.6}
              >
                <Text style={{
                  color: exercise.sets.length >= 20 ? colors.textSecondary : colors.primary,
                  fontSize: 15,
                  fontWeight: '600'
                }}>
                  {exercise.sets.length >= 20 ? t('workout_tracking_max_sets') : t('workout_tracking_add_set')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    ));
  }, [exercises, colors, currentTheme, imageErrors, toggleExercise, updateSet, toggleSet, deleteSet, addSet, handleDeleteExercise, t]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { 
          backgroundColor: colors.background, 
          borderBottomWidth: 1, 
          borderBottomColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 3
        }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={checkAndHandleFinish}
          >
            <Text style={[styles.backButtonText, { color: colors.textSecondary, fontSize: 28 }]}>{'‹'}</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { 
            color: colors.text, 
            fontSize: 20, 
            fontWeight: '700',
            letterSpacing: 0.5
          }]}>{t('workout_tracking_save_workout')}</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Stats Bar */}
        <View style={[styles.statsBar, { 
          backgroundColor: colors.background,
          paddingVertical: 16,
          paddingHorizontal: 16,
          marginHorizontal: 16,
          marginBottom: 16,
          borderRadius: 12,
          flexDirection: 'row',
          justifyContent: 'space-around',
          elevation: 3,
        }]}>
          <View style={[styles.statItem, { flex: 1, alignItems: 'center' }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: 13, marginBottom: 4 }]}>{t('workout_tracking_duration')}</Text>
            <Text style={[styles.statValue, { color: colors.text, fontSize: 17, fontWeight: '600' }]}>{formatDuration(workoutStats.duration)}</Text>
          </View>
          <View style={[styles.statDivider, { width: 1, backgroundColor: colors.divider }]} />
          <View style={[styles.statItem, { flex: 1, alignItems: 'center' }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: 13, marginBottom: 4 }]}>{t('workout_tracking_volume')}</Text>
            <Text style={[styles.statValue, { color: colors.text, fontSize: 17, fontWeight: '600' }]}>{workoutStats.volume} kg</Text>
          </View>
          <View style={[styles.statDivider, { width: 1, backgroundColor: colors.divider }]} />
          <View style={[styles.statItem, { flex: 1, alignItems: 'center' }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: 13, marginBottom: 4 }]}>{t('workout_tracking_sets')}</Text>
            <Text style={[styles.statValue, { color: colors.text, fontSize: 17, fontWeight: '600' }]}>{workoutStats.sets}</Text>
          </View>
        </View>

        {/* Exercise List */}
        <ScrollView 
          style={[{ 
            flex: 1,
            backgroundColor: colors.background, 
            paddingHorizontal: 16 
          }]}
          contentContainerStyle={{ 
            paddingBottom: 24,
            flexGrow: 1
          }}
          showsVerticalScrollIndicator={false}
        >
          {exercises.length === 0 ? (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 40
            }}>
              <Text style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: '600',
                marginBottom: 8
              }}>
                Henüz egzersiz eklenmedi
              </Text>
              <Text style={{
                color: colors.textSecondary,
                fontSize: 14,
                textAlign: 'center'
              }}>
                Antrenmanını başlatmak için egzersiz ekle
              </Text>
            </View>
          ) : (
            memoizedExerciseList
          )}

          {/* Bottom Buttons */}
          <View style={[styles.bottomButtons, { 
            paddingHorizontal: 16,
            paddingBottom: 24,
            paddingTop: 8,
            gap: 12,
            marginTop: 16
          }]}>
            <TouchableOpacity 
              style={[styles.addExerciseButton, { 
                backgroundColor: colors.card,
                paddingVertical: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.primary,
                marginBottom: 8
              }]}
                            onPress={() => {
                // Mevcut egzersizlerin isimlerini çıkar  
                const existingExerciseNames = exercises.map(exercise => exercise.name.toLowerCase());
                
                (navigation as any).navigate('CreateWorkout', {
                  selectedExerciseNames: existingExerciseNames,
                  fromWorkoutTracking: true
                });
              }}
            >
              <Text style={[styles.addExerciseButtonText, { 
                color: colors.primary,
                fontSize: 17,
                fontWeight: '600',
                textAlign: 'center'
              }]}>{t('workout_tracking_add_exercise')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.completeWorkoutButton, { 
                backgroundColor: colors.primary,
                paddingVertical: 16,
                borderRadius: 12,
                marginBottom: 32
              }]}
              onPress={checkAndHandleWorkoutComplete}
            >
              <Text style={[styles.completeWorkoutButtonText, { 
                color: colors.buttonText,
                fontSize: 17,
                fontWeight: '600',
                textAlign: 'center'
              }]}>{t('workout_tracking_complete')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* WorkoutInfo Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showWorkoutInfoModal}
        onRequestClose={() => setShowWorkoutInfoModal(false)}
      >
        {selectedExerciseForInfo && (
          <WorkoutInfoScreen
            route={{ 
              params: { 
                exercise: selectedExerciseForInfo 
              } 
            }}
            navigation={{
              goBack: () => setShowWorkoutInfoModal(false),
              navigate: () => {},
              dispatch: () => {},
              setParams: () => {},
              addListener: () => ({ remove: () => {} }),
              removeListener: () => {},
              isFocused: () => true,
              canGoBack: () => true,
              getId: () => 'WorkoutInfo',
              getParent: () => undefined,
              getState: () => ({} as any),
              setOptions: () => {},
              reset: () => {},
              push: () => {},
              pop: () => {},
              popToTop: () => {},
              replace: () => {},
            } as any}
          />
        )}
      </Modal>

      {/* Workout Changes Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={showWorkoutChangesModal}
        onRequestClose={() => {
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setShowWorkoutChangesModal(false);
          });
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setShowWorkoutChangesModal(false);
          });
        }}>
          <View style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View
                style={[
                  {
                                    backgroundColor: colors.card,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 20,
                paddingBottom: 36,
                maxHeight: '55%',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -10 },
                    shadowOpacity: 0.25,
                    shadowRadius: 20,
                    elevation: 15,
                  },
                  {
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [500, 0], // Aşağıdan yukarı slide
                        }),
                      },
                    ],
                    opacity: slideAnim,
                  },
                ]}
              >
            {/* Drag Indicator */}
            <View style={{
              width: 40,
              height: 4,
              backgroundColor: colors.border,
              borderRadius: 2,
              alignSelf: 'center',
              marginBottom: 24,
            }} />
            
            {/* Icon */}
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.primary + '15',
              justifyContent: 'center',
              alignItems: 'center',
              alignSelf: 'center',
              marginBottom: 20,
            }}>
              <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25Z"
                  fill={colors.primary}
                />
                <Path
                  d="M20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z"
                  fill={colors.primary}
                />
              </Svg>
            </View>
            
            <Text style={{
              color: colors.text,
              fontSize: 22,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: 12,
            }}>
              {t('workout_tracking_changes_detected')}
            </Text>
            
            <Text style={{
              color: colors.textSecondary,
              fontSize: 15,
              textAlign: 'center',
              marginBottom: 28,
              lineHeight: 20,
              paddingHorizontal: 4,
            }}>
              {t('workout_tracking_changes_message')}
            </Text>

            <View style={{ gap: 12 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 15,
                  paddingHorizontal: 20,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
                onPress={() => handleWorkoutChangesResponse(true)}
                activeOpacity={0.9}
              >
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                  <Path
                    d="M12 4V1L8 5L12 9V6C15.31 6 18 8.69 18 12C18 13.01 17.75 13.97 17.3 14.8L18.76 16.26C19.54 15.03 20 13.57 20 12C20 7.58 16.42 4 12 4Z"
                    fill={colors.buttonText}
                  />
                  <Path
                    d="M12 18C8.69 18 6 15.31 6 12C6 10.99 6.25 10.03 6.7 9.2L5.24 7.74C4.46 8.97 4 10.43 4 12C4 16.42 7.58 20 12 20V23L16 19L12 15V18Z"
                    fill={colors.buttonText}
                  />
                </Svg>
                <Text style={{
                  color: colors.buttonText,
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                  {t('workout_tracking_update_routine')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: 'transparent',
                  paddingVertical: 15,
                  paddingHorizontal: 20,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => handleWorkoutChangesResponse(false)}
                activeOpacity={0.7}
              >
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                  <Path
                    d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z"
                    fill={colors.textSecondary}
                    fillOpacity="0.8"
                  />
                  <Path
                    d="M9 12L11 14L15 10"
                    stroke={colors.card}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={{
                  color: colors.text,
                  fontSize: 16,
                  fontWeight: '500',
                }}>
                  {t('workout_tracking_keep_original')}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
    </SafeAreaView>
  );
};

interface SetRowProps {
  set: ExerciseSet;
  setNumber: number;
  exerciseId: number;
  colors: any;
  currentTheme: string;
  updateSet: (exerciseId: number, setId: number, weight: string, reps: string) => void;
  toggleSet: (exerciseId: number, setId: number) => void;
  deleteSet: (exerciseId: number, setId: number) => void;
  isEven: boolean;
  t: (key: string) => string;
}

const SetRow: React.FC<SetRowProps> = ({ set, setNumber, exerciseId, colors, currentTheme, updateSet, toggleSet, deleteSet, isEven, t }) => {
  const [weight, setWeight] = useState(set.weight ? set.weight.toString() : '0');
  const [reps, setReps] = useState(set.reps || '0');
  const [isFocused, setIsFocused] = useState({ weight: false, reps: false });
  const weightInputRef = useRef<TextInput>(null);
  const repsInputRef = useRef<TextInput>(null);
  const pan = useRef(new Animated.ValueXY()).current;
  const [rowHeight] = useState(new Animated.Value(56));

  // 🔥 MEMORY LEAK FIX: Animated values cleanup
  useEffect(() => {
    return () => {
      // Cleanup animated values when component unmounts
      pan.removeAllListeners();
      rowHeight.removeAllListeners();
      pan.setValue({ x: 0, y: 0 });
      rowHeight.setValue(56);
    };
  }, []);

  // 🔥 MEMORY LEAK FIX: Stable PanResponder with proper cleanup
  const panResponder = useMemo(() => {
    const responder = PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 50;
      },
      onPanResponderGrant: () => {
        pan.setOffset({ x: 0, y: 0 });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          const resistance = Math.abs(gestureState.dx) > 80 ? 0.3 : 1;
          const moveValue = gestureState.dx * resistance;
          pan.setValue({ x: Math.max(moveValue, -120), y: 0 });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD) {
          // Delete animation
          Animated.sequence([
            Animated.timing(pan, {
              toValue: { x: -150, y: 0 },
              duration: 200,
              useNativeDriver: false
            }),
            Animated.timing(rowHeight, {
              toValue: 0,
              duration: 250,
              useNativeDriver: false
            })
          ]).start(() => {
            deleteSet(exerciseId, set.id);
          });
        } else {
          // Return to original position
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            tension: 80,
            friction: 8,
            restDisplacementThreshold: 0.1,
            restSpeedThreshold: 0.1
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          tension: 80,
          friction: 8
        }).start();
      }
    });

    // 🔥 CLEANUP: Return cleanup function for PanResponder
    return {
      ...responder,
      cleanup: () => {
        // Force cleanup PanResponder handlers
        pan.setValue({ x: 0, y: 0 });
      }
    };
  }, [exerciseId, set.id, deleteSet, pan, rowHeight]);

  // 🔥 MEMORY LEAK FIX: Cleanup PanResponder on unmount
  useEffect(() => {
    return () => {
      if (panResponder.cleanup) {
        panResponder.cleanup();
      }
    };
  }, [panResponder]);

  useEffect(() => {
    setReps(set.reps);
  }, [set.reps]);

  useEffect(() => {
    setWeight(set.weight ? set.weight.toString() : '0');
  }, [set.weight]);

  const handleWeightSubmit = () => {
    repsInputRef.current?.focus();
  };

  const handleRepsSubmit = () => {
    repsInputRef.current?.blur();
  };

  return (
    <Animated.View style={[styles.setRowContainer, { 
      height: rowHeight,
      backgroundColor: currentTheme === 'dark' ? colors.card : '#ffffff',
      marginBottom: 2,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme === 'dark' ? colors.divider : '#efefef'
    }]}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.setRowContent,
          {
            transform: [{ translateX: pan.x }],
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            borderRadius: 8,
            flex: 1
          }
        ]}
      >
        <View style={{ width: 40, alignItems: 'center' }}>
          <Text style={[styles.setText, { 
            color: set.isCompleted ? colors.primary : colors.text,
            fontSize: 15,
            fontWeight: '600',
            textAlign: 'center'
          }]}>{setNumber}</Text>
        </View>
        
        <View style={{ width: 80, alignItems: 'center' }}>
          <Text style={[styles.setText, { 
            color: colors.textSecondary,
            fontSize: 13,
            fontWeight: '600',
            textAlign: 'center'
          }]}>
            {set.previousWeight !== undefined && set.previousReps !== undefined 
              ? `${set.previousWeight} × ${set.previousReps}`
              : '-'
            }
          </Text>
        </View>

        <View style={{ width: 60, alignItems: 'center', marginHorizontal: 8 }}>
          <TextInput
            ref={weightInputRef}
            style={[
              styles.setInput,
              { 
                backgroundColor: currentTheme === 'dark' ? colors.surface : '#ffffff',
                color: set.isCompleted ? colors.primary : colors.text,
                fontSize: 15,
                height: 32,
                textAlign: 'center',
                borderRadius: 6,
                fontWeight: '600',
                width: '100%',
                borderWidth: 1,
                borderColor: isFocused.weight ? colors.primary : (currentTheme === 'dark' ? colors.border : '#efefef')
              }
            ]}
            placeholderTextColor={colors.placeholder}
            value={weight}
            onChangeText={(text) => {
              const cleanedText = text.replace(/[^0-9,]/g, '');
              const commaCount = (cleanedText.match(/,/g) || []).length;
              if (commaCount > 1) {
                return; 
              }
              setWeight(cleanedText);
              updateSet(exerciseId, set.id, cleanedText, set.reps);
            }}
            onFocus={() => {
              setIsFocused(prev => ({ ...prev, weight: true }));
              if (weight === '0') {
                setWeight('');
              }
              setTimeout(() => {
                weightInputRef.current?.setSelection(0, weight.length);
              }, 10);
            }}
            onBlur={() => {
              setIsFocused(prev => ({ ...prev, weight: false }));
              const trimmedWeight = weight.trim();
              if (trimmedWeight === '' || trimmedWeight === ',') {
                setWeight('0');
                updateSet(exerciseId, set.id, '0', set.reps);
              } else {
                updateSet(exerciseId, set.id, trimmedWeight, set.reps);
              }
            }}
            keyboardType="decimal-pad"
            maxLength={6}
            placeholder="0"
            returnKeyType="next"
            onSubmitEditing={handleWeightSubmit}
            blurOnSubmit={false}
            selectTextOnFocus={true}
          />
        </View>

        <View style={{ width: 60, alignItems: 'center', marginHorizontal: 8 }}>
          <TextInput
            ref={repsInputRef}
            style={[
              styles.setInput,
              { 
                backgroundColor: currentTheme === 'dark' ? colors.surface : '#ffffff',
                color: set.isCompleted ? colors.primary : colors.text,
                fontSize: 15,
                height: 32,
                textAlign: 'center',
                borderRadius: 6,
                fontWeight: '600',
                width: '100%',
                borderWidth: 1,
                borderColor: isFocused.reps ? colors.primary : (currentTheme === 'dark' ? colors.border : '#efefef')
              }
            ]}
            placeholderTextColor={colors.placeholder}
            value={reps}
            onChangeText={(text) => {
              const numericText = text.replace(/[^0-9-]/g, '');
              setReps(numericText);
              updateSet(exerciseId, set.id, weight, numericText);
            }}
            onFocus={() => {
              setIsFocused(prev => ({ ...prev, reps: true }));
              setTimeout(() => {
                repsInputRef.current?.setSelection(0, reps.length);
              }, 10);
            }}
            onBlur={() => {
              setIsFocused(prev => ({ ...prev, reps: false }));
              if (!reps || reps.trim() === '') {
                setReps('0');
                updateSet(exerciseId, set.id, weight, '0');
              } else {
                 updateSet(exerciseId, set.id, weight, reps);
              }
            }}
            keyboardType="number-pad"
            maxLength={5}
            placeholder="0"
            returnKeyType="done"
            onSubmitEditing={handleRepsSubmit}
            selectTextOnFocus={true}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.checkButton,
            { 
              backgroundColor: set.isCompleted ? colors.primary : (currentTheme === 'dark' ? colors.surface : '#ffffff'),
              width: 32,
              height: 32,
              borderRadius: 16,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: set.isCompleted ? colors.primary : (currentTheme === 'dark' ? colors.border : '#efefef'),
              elevation: 2
            }
          ]}
          onPress={() => toggleSet(exerciseId, set.id)}
        >
          <Text style={[
            styles.checkButtonText,
            { 
              color: set.isCompleted ? colors.buttonText : colors.textSecondary,
              fontSize: 18,
              fontWeight: '600'
            }
          ]}>✓</Text>
        </TouchableOpacity>
      </Animated.View>
      <Animated.View
        style={[
          styles.deleteSetButton,
          {
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: colors.error,
            justifyContent: 'center',
            alignItems: 'center',
            width: 75,
            opacity: pan.x.interpolate({
              inputRange: [-100, 0],
              outputRange: [1, 0]
            })
          }
        ]}
      >
        <Text style={{ color: colors.buttonText, fontSize: 15 }}>{t('workout_tracking_delete')}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontWeight: '300',
  },
  headerTitle: {
    textAlign: 'center',
  },
  statsBar: {},
  statItem: {},
  statLabel: {},
  statValue: {},
  statDivider: {},
  exerciseList: {},
  exerciseCard: {},
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseIconContainer: {},
  exerciseIconText: {},
  exerciseName: {},
  exerciseDescription: {},

  expandIcon: {},
  exerciseContent: {},

  setsList: {},
  setHeader: {},
  setHeaderText: {},
  setRowContainer: {},
  setRowContent: {},
  setText: {},
  setInput: {},
  checkButton: {},
  checkButtonText: {},
  deleteSetButton: {},
  addSetButton: {},
  addSetButtonText: {},
  bottomButtons: {},
  addExerciseButton: {},
  addExerciseButtonText: {},
  completeWorkoutButton: {},
  completeWorkoutButtonText: {},
  moreButton: {
    padding: 8,
  },
});

export default WorkoutTrackingScreen; 