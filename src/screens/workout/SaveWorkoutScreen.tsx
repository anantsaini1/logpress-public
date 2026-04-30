import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SavedExercise } from '../../navigation/types';
import { ExerciseSet } from '../../types/exercise';
import Toast from 'react-native-toast-message';
import { storage } from '../../services/storage';
import { useTheme } from '../../context/ThemeContext';
import { Svg, Path, Polyline, Line } from 'react-native-svg';
import { exerciseService } from '../../services/exerciseService';
import { useTranslation } from 'react-i18next';

type SaveWorkoutScreenProps = NativeStackScreenProps<any, 'SaveWorkout'>;

const SaveWorkoutScreen: React.FC<SaveWorkoutScreenProps> = ({ route, navigation }) => {
  const initialExercises = (route.params?.exercises || []).map((ex: SavedExercise) => ({
    ...ex,
    sets: ex.sets.map((s: ExerciseSet) => ({ ...s, reps: s.reps === '' || s.reps === null ? '0' : String(s.reps) }))
  }));

  const [exercises, setExercises] = useState<SavedExercise[]>(initialExercises);
  const [routineName, setRoutineName] = useState(route.params?.routineName || '');
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const inputRefs = useRef(new Map<string, TextInput>());
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Debug: Check received exercises
  React.useEffect(() => {
  }, [route.params?.exercises]);

  const handleAddSet = (exerciseIndex: number) => {
    setExercises(prevExercises => {
      const updatedExercises = [...prevExercises];
      const exercise = { ...updatedExercises[exerciseIndex] };
      const lastSet = exercise.sets.length > 0 ? exercise.sets[exercise.sets.length - 1] : null;

      const newSet: ExerciseSet = {
        id: Date.now(),
        weight: lastSet ? lastSet.weight : '0',
        reps: lastSet ? lastSet.reps : '0',
        isCompleted: false
      };
      
      exercise.sets = [...exercise.sets, newSet];
      updatedExercises[exerciseIndex] = exercise;
      
      return updatedExercises;
    });
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    setExercises(prevExercises => {
      const updatedExercises = [...prevExercises];
      const exercise = { ...updatedExercises[exerciseIndex] };
      
      // Silinen set'in ID'sini bul
      const setToDelete = exercise.sets[setIndex];
      
      // Set'i filtrele
      const filteredSets = exercise.sets.filter((_, index) => index !== setIndex);
      
      // ID'leri yeniden düzenle (1, 2, 3, ...)
      const reorderedSets = filteredSets.map((set, index) => ({
        ...set,
        id: index + 1
      }));
      
      // Eğer hiç set kalmadıysa egzersizi sil
      if (reorderedSets.length === 0) {
        return updatedExercises.filter((_, index) => index !== exerciseIndex);
      }
      
      exercise.sets = reorderedSets;
      updatedExercises[exerciseIndex] = exercise;
      return updatedExercises;
    });
  };

  const handleSetChange = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: string) => {
    setExercises(prevExercises => {
      const updatedExercises = [...prevExercises];
      const exercise = { ...updatedExercises[exerciseIndex] };
      const updatedSets = [...exercise.sets];
      const set = { ...updatedSets[setIndex] };
      
      if (field === 'weight') {
        const commaCount = (value.match(/,/g) || []).length;
        if (commaCount > 1) {
          return prevExercises; // Prevent more than one comma
        }
        set.weight = value;
      } else {
        set.reps = value;
      }
      
      updatedSets[setIndex] = set;
      exercise.sets = updatedSets;
      updatedExercises[exerciseIndex] = exercise;
      return updatedExercises;
    });
  };

  const handleDeleteExercise = (exerciseIndex: number) => {
    Alert.alert(
      t('save_workout_delete_exercise_title'),
      t('save_workout_delete_exercise_message'),
      [
        {
          text: t('cancel'),
          style: "cancel"
        },
        {
          text: t('save_workout_delete_button'),
          style: "destructive",
          onPress: () => {
            setExercises(prevExercises => 
              prevExercises.filter((_, index) => index !== exerciseIndex)
            );
          }
        }
      ]
    );
  };

  const handleComplete = async () => {
    if (exercises.length === 0) {
      Toast.show({
        type: 'error',
        text1: t('save_workout_no_exercises'),
        position: 'top',
        visibilityTime: 2000,
      });
      return;
    }

    if (!routineName.trim()) {
      Toast.show({
        type: 'error',
        text1: t('save_workout_please_enter_routine_name'),
        position: 'top',
        visibilityTime: 2000,
      });
      return;
    }

    // Toplam ağırlık ve set sayısını hesapla
    let totalWeight = 0;
    let totalSets = 0;

    exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        if (set.isCompleted) {
          const reps = parseInt(set.reps) || 0;
          const weight = parseFloat(String(set.weight).replace(',', '.')) || 0;
          totalWeight += weight * reps;
          totalSets += 1;
        }
      });
    });

    try {
      const workoutData = {
        id: Date.now(),
        routineName: routineName,
        duration: 0, // Bu değer WorkoutTrackingScreen'den gelmeli
        volume: totalWeight,
        totalSets: totalSets,
        exercises: exercises.map(exercise => ({
          id: exercise.id, // Egzersiz ID'sini kaydet
          name: exercise.name,
          sets: exercise.sets.map(set => ({
            weight: parseFloat(String(set.weight).replace(',', '.')) || 0,
            reps: set.reps,
            isCompleted: set.isCompleted
          }))
        })),
        createdAt: new Date().toISOString()
      };

      // Sadece local storage'a kaydet
      const savedLocally = await storage.saveWorkout(workoutData);

      if (!savedLocally) {
        console.warn(t('save_workout_could_not_save'));
        Toast.show({
          type: 'error',
          text1: t('save_workout_error'),
          position: 'top',
          visibilityTime: 2000,
        });
        return;
      }

      Toast.show({
        type: 'success',
        text1: t('save_workout_success'),
        position: 'top',
        visibilityTime: 2000,
      });

      // WorkoutScreen'e geri dön
      navigation.navigate('Home', { screen: 'Workout', merge: true });
    } catch (error) {
      console.error(t('save_workout_workout_save_error'), error);
      Toast.show({
        type: 'error',
        text1: t('save_workout_error'),
        position: 'top',
        visibilityTime: 2000,
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ backgroundColor: colors.card }}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.backButtonText, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('save_workout_title')}</Text>
        <TouchableOpacity onPress={handleComplete} style={[styles.finishButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.finishButtonText, { color: '#FFFFFF' }]}>{t('save_workout_finish_button')}</Text>
        </TouchableOpacity>
              </View>
      </SafeAreaView>

      <View style={[styles.routineNameContainer, { backgroundColor: colors.background }]}>
        <TextInput
          style={[
            styles.routineNameInput, 
            { 
              backgroundColor: colors.card,
              color: colors.text,
              borderWidth: 1,
              borderColor: colors.border
            }
          ]}
          value={routineName}
          onChangeText={setRoutineName}
          placeholder={t('save_workout_routine_name_placeholder')}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <ScrollView style={[styles.content, { backgroundColor: colors.background }]}>
        {exercises.map((exercise, exerciseIndex) => (
          <View key={exercise.id} style={[styles.exerciseContainer, { backgroundColor: colors.background }]}>
            <View style={[
              styles.exerciseCard, 
              { 
                backgroundColor: currentTheme === 'dark' ? colors.card : '#ffffff',
                borderColor: colors.border
              }
            ]}>
              <View style={styles.exerciseHeader}>
                <View style={[styles.exerciseIconContainer, { backgroundColor: currentTheme === 'dark' ? colors.background : colors.surface }]}>
                  {(() => {
                    // Egzersiz ID'sinden exerciseService'den gerçek image'ı çek
                    const exerciseData = exercise.id ? exerciseService.getExerciseById(exercise.id.toString()) : null;
                    const imageUrl = exerciseData?.image || exercise.image || exercise.icon;
                    
                    // HTTP URL'si ise network'den çek
                    if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
                      return (
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.exerciseIconImage}
                          resizeMode="cover"
                          onError={() => {}}
                        />
                      );
                    }
                    // Lokal asset ise (require ile gelen)
                    else if (imageUrl && typeof imageUrl === 'object') {
                      return (
                        <Image
                          source={imageUrl}
                          style={styles.exerciseIconImage}
                          resizeMode="cover"
                        />
                      );
                    }
                    // Hiçbiri yoksa default logo
                    else {
                      return (
                        <Image
                          source={require('../../assets/logo.png')}
                          style={[
                            styles.exerciseIconImage,
                            { 
                              tintColor: currentTheme === 'dark' ? '#FFFFFF' : colors.error
                            }
                          ]}
                          resizeMode="contain"
                        />
                      );
                    }
                  })()}
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={[styles.exerciseName, { color: colors.primary }]}>{exercise.name}</Text>
                  <Text style={[styles.exerciseDescription, { color: colors.textSecondary }]}>
                    {exercise.description && exercise.description.includes('-') 
                      ? exercise.description.split('-').pop()?.trim() 
                      : exercise.description}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.deleteExerciseButton, { backgroundColor: currentTheme === 'dark' ? colors.error + '33' : colors.error + '15' }]}
                  onPress={() => handleDeleteExercise(exerciseIndex)}
                >
                  <Text style={[styles.deleteExerciseButtonText, { color: colors.error }]}>{t('save_workout_delete_button')}</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.setHeaderContainer, { borderBottomColor: colors.border }]}>
                <View style={styles.setHeader}>
                  <Text style={[styles.setHeaderText, { color: colors.textSecondary }]}>{t('save_workout_set_header')}</Text>
                  <Text style={[styles.setHeaderText, { color: colors.textSecondary }]}>{t('save_workout_previous_header')}</Text>
                  <Text style={[styles.setHeaderText, { color: colors.textSecondary }]}>{t('save_workout_weight_header')}</Text>
                  <Text style={[styles.setHeaderText, { color: colors.textSecondary }]}>{t('save_workout_reps_header')}</Text>
                  <Text style={[styles.setHeaderText, { color: colors.textSecondary }]}>{t('save_workout_delete_header')}</Text>
                </View>
              </View>
              
              {exercise.sets.map((set, setIndex) => {
                const isLastExercise = exerciseIndex === exercises.length - 1;
                const isLastSet = setIndex === exercise.sets.length - 1;

                const focusNext = (currentField: 'weight' | 'reps') => {
                  if (currentField === 'weight') {
                    const nextInput = inputRefs.current.get(`${exerciseIndex}-${setIndex}-reps`);
                    nextInput?.focus();
                  } else { // currentField is 'reps'
                    if (!isLastSet) {
                      const nextInput = inputRefs.current.get(`${exerciseIndex}-${setIndex + 1}-weight`);
                      nextInput?.focus();
                    } else if (!isLastExercise) {
                      const nextInput = inputRefs.current.get(`${exerciseIndex + 1}-0-weight`);
                      nextInput?.focus();
                    } else {
                      const currentInput = inputRefs.current.get(`${exerciseIndex}-${setIndex}-reps`);
                      currentInput?.blur();
                    }
                  }
                };
                
                const weightFieldId = `${exerciseIndex}-${setIndex}-weight`;
                const repsFieldId = `${exerciseIndex}-${setIndex}-reps`;

                return (
                <View 
                  key={set.id} 
                  style={[
                    styles.setRowContainer,
                    { 
                      backgroundColor: currentTheme === 'dark' ? colors.surface : colors.card,
                      borderBottomWidth: setIndex < exercise.sets.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border
                    }
                  ]}
                >
                  <View style={styles.setRow}>
                  <Text style={[styles.setNumber, { color: colors.text }]}>{setIndex + 1}</Text>
                  <Text style={[styles.setPrevious, { color: colors.textSecondary }]}>0</Text>
                  <TextInput
                    ref={ref => {
                      if (ref) {
                        inputRefs.current.set(weightFieldId, ref);
                      } else {
                        inputRefs.current.delete(weightFieldId);
                      }
                    }}
                    style={[
                      styles.input,
                      { 
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: colors.border
                      }
                    ]}
                    value={focusedField === weightFieldId && String(set.weight) === '0' ? '' : String(set.weight)}
                    onFocus={() => setFocusedField(weightFieldId)}
                    onBlur={() => {
                        setFocusedField(null);
                        if (String(set.weight).trim() === '' || String(set.weight).trim() === ',') {
                            handleSetChange(exerciseIndex, setIndex, 'weight', '0');
                        }
                    }}
                    onChangeText={(value) => handleSetChange(exerciseIndex, setIndex, 'weight', value)}
                    keyboardType="decimal-pad"
                    placeholder={t('save_workout_weight_placeholder')}
                    placeholderTextColor={colors.textSecondary}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => focusNext('weight')}
                  />
                  <TextInput
                    ref={ref => {
                      if (ref) {
                        inputRefs.current.set(repsFieldId, ref);
                      } else {
                        inputRefs.current.delete(repsFieldId);
                      }
                    }}
                    style={[
                      styles.input,
                      { 
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: colors.border
                      }
                    ]}
                    value={focusedField === repsFieldId && set.reps === '0' ? '' : String(set.reps)}
                    onFocus={() => setFocusedField(repsFieldId)}
                    onChangeText={(value) => handleSetChange(exerciseIndex, setIndex, 'reps', value)}
                    onBlur={() => {
                        setFocusedField(null);
                        if (String(set.reps).trim() === '') {
                            handleSetChange(exerciseIndex, setIndex, 'reps', '0');
                        }
                    }}
                    keyboardType="numeric"
                    placeholder={t('save_workout_reps_placeholder')}
                    placeholderTextColor={colors.textSecondary}
                    returnKeyType={isLastExercise && isLastSet ? "done" : "next"}
                    blurOnSubmit={false}
                    onSubmitEditing={() => focusNext('reps')}
                  />
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleRemoveSet(exerciseIndex, setIndex)}
                    >
                      <Text style={[styles.deleteButtonText, { color: colors.error }]}>{t('save_workout_delete_set')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )})}
              
              <TouchableOpacity 
                onPress={() => handleAddSet(exerciseIndex)}
                style={[
                  styles.addSetButton, 
                  { 
                    backgroundColor: colors.card
                  }
                ]}
              >
                <Text style={[styles.addSetButtonText, { color: colors.primary }]}>{t('save_workout_add_set')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: '400',
    fontFamily: 'Outfit',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  finishButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  finishButtonText: {
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'Outfit',
  },
  routineNameContainer: {
    padding: 16,
  },
  routineNameInput: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Outfit',
  },
  content: {
    flex: 1,
  },
  exerciseContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  exerciseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  exerciseIconImage: {
    width: '100%',
    height: '100%',
  },
  exerciseIconText: {
    fontSize: 24,
    textAlign: 'center',
  },
  exerciseEmoji: {
    fontSize: 24,
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Outfit',
  },
  exerciseDescription: {
    fontSize: 13,
    fontFamily: 'Outfit',
  },
  deleteExerciseButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteExerciseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  setHeaderContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  setHeader: {
    flexDirection: 'row',
    marginLeft: -8,
  },
  setHeaderText: {
    width: '20%',
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Outfit',
  },
  setRowContainer: {
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    paddingVertical: 16,
    marginLeft: -8,
  },
  setNumber: {
    width: '20%',
    fontSize: 15,
    textAlign: 'center',
    fontFamily: 'Outfit',
  },
  setPrevious: {
    width: '20%',
    fontSize: 15,
    textAlign: 'center',
    fontFamily: 'Outfit',
  },
  input: {
    width: '18%',
    height: 40,
    borderRadius: 8,
    fontSize: 15,
    textAlign: 'center',
    marginHorizontal: 6,
    fontFamily: 'Outfit',
  },
  deleteButton: {
    width: '18%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  addSetButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  addSetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
});

export default SaveWorkoutScreen; 