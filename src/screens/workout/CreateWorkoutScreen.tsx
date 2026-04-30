import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Image,
  PixelRatio,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SvgXml } from 'react-native-svg';
import { equipmentData } from '../../types/equipment';
import { muscleGroupData } from '../../types/muscleGroups';
import { infoIcon } from '../../assets/icons';
import { Exercise, SelectedExercise, ExerciseData } from '../../types/exercise';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, SavedExercise } from '../../navigation/types';
import { getAllExercises } from '../../services/api';
import { exerciseService } from '../../services/exerciseService';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  route: {
    params?: {
      onExerciseSelect?: (exercise: {
        id: string | number;
        name: string;
        icon?: string;
        description?: string;
        restTime?: string;
        target?: string;
        equipment?: string;
      }) => void;
      selectedExerciseNames?: string[];
      fromWorkoutTracking?: boolean;
    };
  };
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ASPECT_RATIO = SCREEN_HEIGHT / SCREEN_WIDTH;
const isTablet = ASPECT_RATIO < 1.6;

const scale = SCREEN_WIDTH / 414; // iPhone 11'i baz alarak ölçeklendirme yapıyoruz (414x896)

function normalize(size: number): number {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
}

const CreateWorkoutScreen = ({ route, navigation }: Props) => {
  const { onExerciseSelect, selectedExerciseNames = [], fromWorkoutTracking = false } = route.params || {};
  const [routineName, setRoutineName] = useState('');
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showMuscleModal, setShowMuscleModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [removedExercises, setRemovedExercises] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const exerciseAnims = useRef<{ [key: number]: Animated.Value }>({}).current;
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();

  const [equipmentList, setEquipmentList] = useState<Array<{ id: string; translationKey: string; icon: string }>>([]);
  const [muscleGroups, setMuscleGroups] = useState<Array<{ id: string; translationKey: string; icon: string }>>([]);

  // 🔥 MEMORY LEAK FIX: Cleanup exerciseAnims on unmount
  useEffect(() => {
    return () => {
      // Cleanup all exercise animations
      Object.values(exerciseAnims).forEach(anim => {
        anim.removeAllListeners();
        anim.setValue(0);
      });
      // Clear the exerciseAnims object
      Object.keys(exerciseAnims).forEach(key => {
        delete exerciseAnims[key as any];
      });
    };
  }, []);

  useEffect(() => {
    fetchExercises();
  }, []);

  // Mevcut egzersizleri başlangıçta seçili olarak ayarla
  useEffect(() => {
    if (fromWorkoutTracking && selectedExerciseNames.length > 0 && exercises.length > 0) {
      const existingExercises = exercises.filter(exercise => 
        selectedExerciseNames.includes(exercise.name.toLowerCase())
      );
      
      const formattedExistingExercises = existingExercises.map(exercise => ({
        ...exercise,
        sets: [{
          id: 1,
          weight: 0,
          reps: '',
          isCompleted: false
        }],
        restTime: '2:30'
      }));
      
      setSelectedExercises(formattedExistingExercises);
    }
  }, [exercises, selectedExerciseNames, fromWorkoutTracking]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      
      // ExerciseService'den tüm egzersizleri al
      const allExercises = exerciseService.getAllExercises();
      
      // Debug: İlk birkaç egzersizin image data'sını kontrol et
      allExercises.slice(0, 3).forEach((exercise: ExerciseData, index: number) => {
      });
      
      // ExerciseData formatını Exercise formatına dönüştür
      const formattedExercises: Exercise[] = allExercises.map((exercise: ExerciseData, index: number) => ({
        id: exercise.id || `exercise-${index}-${Date.now()}`,
        name: exercise.name,
        target: exercise.target,
        equipment: exercise.equipment,
        muscle_group: exercise.muscle_group ? [exercise.muscle_group] : [],
        image: exercise.image || undefined,
        description: exercise.instructions,
        category: exercise.category
      }));
      
      setExercises(formattedExercises);
      
      // Ekipman ve kas gruplarını service'den al
      const equipmentTypes = exerciseService.getEquipmentTypes();
      const muscleTargets = exerciseService.getTargetMuscles();
      
      // Ekipman listesini uygun formata dönüştür
      const formattedEquipment = equipmentTypes.map((equipment: string) => ({
        id: equipment.toLowerCase().replace(/\s+/g, '_'),
        translationKey: `equipment_${equipment.toLowerCase().replace(/\s+/g, '_')}`,
        icon: getEquipmentIcon(equipment)
      }));
      
      // Hedef kas listesini uygun formata dönüştür  
      const formattedMuscles = muscleTargets.map((target: string) => ({
        id: target.toLowerCase().replace(/\s+/g, '_'),
        translationKey: `target_${target.toLowerCase().replace(/\s+/g, '_')}`,
        icon: getMuscleIcon(target)
      }));
      
      setEquipmentList(formattedEquipment);
      setMuscleGroups(formattedMuscles);
      
    } catch (error) {
      console.error('Egzersizler yüklenirken hata:', error);
      Alert.alert(t('create_workout_error_title'), t('create_workout_unexpected_error'));
    } finally {
      setLoading(false);
    }
  };

  // Ekipman için ikon belirleme
  const getEquipmentIcon = (equipment: string): string => {
    const icons: { [key: string]: string } = {
      'Barbell': '🏋️‍♂️',
      'Dumbbell': '🏋️‍♀️', 
      'Machine': '⚙️',
      'Kettlebell': '🔗',
      'Resistance Band': '🎗️',
      'None': '🤸‍♂️',
      'Other': '🏃‍♂️',
      'Suspension': '🪢'
    };
    return icons[equipment] || '💪';
  };

  // Hedef kas için ikon belirleme
  const getMuscleIcon = (target: string): string => {
    const icons: { [key: string]: string } = {
      'Biceps': '💪',
      'Triceps': '🦾',
      'Chest': '🫁',
      'Shoulders': '🤷‍♂️',
      'Quadriceps': '🦵',
      'Hamstrings': '🏃‍♂️',
      'Calves': '👟',
      'Glutes': '🍑',
      'Abdominals': '🏋️‍♂️',
      'Forearms': '👊',
      'Traps': '🤷‍♀️',
      'Cardio': '❤️',
      'Full Body': '🏃‍♂️',
      'Lats': '🕸️',
      'Upper Back': '🔙',
      'Adductors': '🦵'
    };
    return icons[target] || '💪';
  };

  useEffect(() => {
    if (showEquipmentModal || showMuscleModal) {
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
  }, [showEquipmentModal, showMuscleModal]);

  const ExerciseIcon = React.memo(({ image }: { image?: string }) => (
    <View style={styles.exerciseIconContainer}>
      {image ? (
        <Image 
          source={{ uri: image }} 
          style={styles.exerciseIcon} 
          resizeMode="contain"
        />
      ) : (
        <Image 
          source={require('../../assets/logo.png')} 
          style={[styles.exerciseIcon, { tintColor: currentTheme === 'dark' ? colors.text : colors.primary }]}
          resizeMode="contain"
        />
      )}
    </View>
  ));

  const FilterModal = ({ 
    visible, 
    onClose, 
    title, 
    items,
    selectedItems,
    onSelectItem,
  }: { 
    visible: boolean; 
    onClose: () => void; 
    title: string;
    items: Array<{ id: string; translationKey: string; icon: string }>;
    selectedItems: string[];
    onSelectItem: (id: string) => void;
  }) => {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalDragIndicator} />
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={[styles.closeButtonText, { color: colors.text }]}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              <TouchableOpacity
                style={[
                  styles.modalListItem,
                  { borderBottomColor: colors.border },
                  selectedItems.length === 0 && [
                    styles.modalListItemSelected,
                    { backgroundColor: currentTheme === 'dark' ? '#881337' : '#FEE2E2' }
                  ]
                ]}
                onPress={() => {
                  onSelectItem('all');
                  onClose();
                }}
              >
                <View style={styles.modalListItemContent}>
                  <Text style={styles.modalListItemIcon}>🔄</Text>
                  <Text 
                    style={[
                      styles.modalListItemText,
                      { color: colors.text },
                      selectedItems.length === 0 && styles.modalListItemTextSelected
                    ]}
                  >
                    {t('create_workout_all')}
                  </Text>
                </View>
                {selectedItems.length === 0 && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
              {items.map((item: any) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.modalListItem,
                    { borderBottomColor: colors.border },
                    selectedItems.includes(item.id) && [
                      styles.modalListItemSelected,
                      { backgroundColor: currentTheme === 'dark' ? '#881337' : '#FEE2E2' }
                    ]
                  ]}
                  onPress={() => {
                    onSelectItem(item.id);
                    onClose();
                  }}
                >
                  <View style={styles.modalListItemContent}>
                    <Text style={styles.modalListItemIcon}>{item.icon}</Text>
                    <Text 
                      style={[
                        styles.modalListItemText,
                        { color: colors.text },
                        selectedItems.includes(item.id) && styles.modalListItemTextSelected
                      ]}
                    >
                      {t(item.translationKey)}
                    </Text>
                  </View>
                  {selectedItems.includes(item.id) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const animateExercise = (index: number, isSelected: boolean) => {
    if (!exerciseAnims[index]) {
      exerciseAnims[index] = new Animated.Value(0);
    }

    Animated.spring(exerciseAnims[index], {
      toValue: isSelected ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const renderExerciseItem = React.useCallback(({item, index}: {item: Exercise; index: number}) => {
    if (!exerciseAnims[index]) {
      exerciseAnims[index] = new Animated.Value(0);
    }
    
    const isSelected = selectedExercises.some(e => e.id === item.id);
    
    return (
      <Animated.View
        style={[
          { transform: [{ translateX: exerciseAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0, 20]
          })}] }
        ]}
      >
        <TouchableOpacity 
          style={[
            styles.exerciseItem,
            { 
              backgroundColor: currentTheme === 'dark' 
                ? (index % 2 === 0 ? colors.card : colors.surface) 
                : '#ffffff',
              borderBottomColor: colors.border
            },
            isSelected && {
              borderLeftWidth: 4,
              borderLeftColor: '#E11D48',
              paddingLeft: 12,
            }
          ]}
          onPress={() => toggleExerciseSelection(item)}
        >
          <ExerciseIcon image={item.image} />
          <View style={styles.exerciseInfo}>
            <View style={styles.exerciseMainInfo}>
              <Text style={[styles.exerciseName, { color: colors.text }]}>
                {item.name}
              </Text>
              <Text style={[styles.targetText, { color: colors.textSecondary }]}>{item.target}</Text>
            </View>
            <TouchableOpacity 
              style={styles.infoIconContainer}
              onPress={() => navigation.navigate('WorkoutInfo', { exercise: item })}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <SvgXml xml={infoIcon} width={normalize(20)} height={normalize(20)} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [selectedExercises, colors, currentTheme, navigation]);

  const handleExerciseRemove = (exerciseId: string | number) => {
    setSelectedExercises(prev => prev.filter(ex => ex.id !== exerciseId));
    
    const exerciseIndex = exercises.findIndex(ex => ex.id === exerciseId);
    if (exerciseIndex !== -1) {
      exerciseAnims[exerciseIndex].setValue(0);
    }
  };

  const navigateToSaveWorkout = async () => {
    if (fromWorkoutTracking) {
      // WorkoutTracking'den geldiyse TÜM seçili egzersizleri AsyncStorage'a yaz ve geri dön
      try {
        const allSelectedExercises = selectedExercises.map(exercise => ({
          id: exercise.id,
          name: exercise.name,
          icon: '🏋️‍♂️',
          image: exercise.image,
          description: `${exercise.name} - ${exercise.target}`,
          target: exercise.target,
          equipment: exercise.equipment,
          restTime: '2:30'
        }));
        
        await AsyncStorage.setItem('updatedWorkoutExercises', JSON.stringify(allSelectedExercises));
        navigation.goBack();
      } catch (error) {
        console.error('Error saving exercises:', error);
      }
    } else {
      // Normal SaveWorkout flow
      const savedExercises: SavedExercise[] = selectedExercises.map(exercise => ({
        id: exercise.id, // Gerçek egzersiz ID'sini gönder (exerciseService için)
        name: exercise.name,
        icon: '🏋️‍♂️', // Emoji yeterli, gerçek fotoğraf ID'den çekilecek
        image: exercise.image, // Image field'ını da ekle (yedek için)
        description: `${exercise.name} - ${exercise.target}`,
        restTime: '60',
        sets: exercise.sets || [{
          id: Date.now(),
          weight: 0,
          reps: '',
          isCompleted: false
        }],
        isExpanded: false,
      }));


      
      navigation.navigate('SaveWorkout', {
        exercises: savedExercises
      });
    }
  };

  const toggleExerciseSelection = (exercise: Exercise) => {
    if (onExerciseSelect) {
      onExerciseSelect({
        id: exercise.id, // Gerçek egzersiz ID'sini gönder
        name: exercise.name,
        icon: '🏋️‍♂️', // Emoji yeterli, gerçek fotoğraf ID'den çekilecek
        description: exercise.target,
        target: exercise.target,
        equipment: exercise.equipment,
        restTime: '2:30'
      });
      navigation.goBack();
    } else {
      setSelectedExercises(prev => {
        const isSelected = prev.some(e => e.id === exercise.id);
        
        if (isSelected) {
          return prev.filter(e => e.id !== exercise.id);
        } else {
          return [...prev, {
            ...exercise,
            sets: [{
              id: 1,
              weight: 0,
              reps: '',
              isCompleted: false
            }],
            restTime: '60'
          }];
        }
      });
    }
  };

  const normalizeText = (text: string): string => {
    return text.toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/i̇/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ğ/g, 'g')
      .replace(/ç/g, 'c')
      .replace(/İ/g, 'i')
      .replace(/I/g, 'i')
      .replace(/Ö/g, 'o')
      .replace(/Ü/g, 'u')
      .replace(/Ş/g, 's')
      .replace(/Ğ/g, 'g')
      .replace(/Ç/g, 'c');
  };

  // Ekipman ve kas grubu eşleştirme fonksiyonları
  const mapEquipmentToUI = (dbEquipment: string): string => {
    const mapping: { [key: string]: string } = {
      'barbell': 'barbell',
      'dumbbell': 'dumbbell',
      'machine': 'machine',
      'bodyweight': 'bodyweight',
      'pullup-bar': 'pullup-bar',
      'treadmill': 'treadmill'
    };
    return mapping[dbEquipment] || dbEquipment;
  };

  const mapMuscleGroupToUI = (dbMuscleGroup: string[]): string => {
    const mapping: { [key: string]: string } = {
      'chest': 'chest',
      'arms': 'arms',
      'back': 'back',
      'shoulders': 'shoulders',
      'legs': 'legs',
      'core': 'abs',
      'cardio': 'cardio'
    };
    return mapping[dbMuscleGroup[0]] || dbMuscleGroup[0];
  };

  // Filtreleme işlemini optimize edelim
  // useMemo kullanarak gereksiz hesaplamaları önleyelim
  const filteredExercises = React.useMemo(() => {
    return exercises.filter(exercise => {
      // Arama filtrelemesi
      const searchFilter = normalizeText(routineName);
      const exerciseName = normalizeText(exercise.name);
      const exerciseTarget = normalizeText(exercise.target);
      
      const matchesSearch = routineName === '' || 
        exerciseName.includes(searchFilter) ||
        exerciseTarget.includes(searchFilter);

      // Kas grubu filtrelemesi (hedef kas bazında)
      const matchesMuscle = selectedMuscles.length === 0 || 
        selectedMuscles.includes('all') || 
        selectedMuscles.some((muscleId: string) => {
          const targetId = muscleId.replace(/[^a-z_]/g, '');
          const exerciseTargetId = normalizeText(exercise.target).replace(/\s+/g, '_');
          return exerciseTargetId.includes(targetId) || targetId.includes(exerciseTargetId);
        });

      // Ekipman filtrelemesi
      const matchesEquipment = selectedEquipment.length === 0 || 
        selectedEquipment.includes('all') || 
        selectedEquipment.some((equipId: string) => {
          const equipmentId = equipId.replace(/[^a-z_]/g, '');
          const exerciseEquipmentId = normalizeText(exercise.equipment || '').replace(/\s+/g, '_');
          return exerciseEquipmentId.includes(equipmentId) || equipmentId.includes(exerciseEquipmentId);
        });

      return matchesSearch && matchesMuscle && matchesEquipment;
    });
  }, [exercises, routineName, selectedMuscles, selectedEquipment]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const handleMuscleSelect = (id: string) => {
    if (id === 'all') {
      setSelectedMuscles([]);
      setShowMuscleModal(false);
    } else {
      setSelectedMuscles([id]);
      setShowMuscleModal(false);
    }
  };

  const handleEquipmentSelect = (id: string) => {
    if (id === 'all') {
      setSelectedEquipment([]);
      setShowEquipmentModal(false);
    } else {
      setSelectedEquipment([id]);
      setShowEquipmentModal(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            // Önce navigasyon işlemini gerçekleştir
            navigation.goBack();
            
            // Sonra animasyonları ve state'i temizle
            setTimeout(() => {
              exercises.forEach((_, index) => {
                if (exerciseAnims[index]) {
                  exerciseAnims[index].setValue(0);
                }
              });
              setSelectedExercises([]);
            }, 0);
          }}
        >
          <Text style={[styles.backButtonText, { color: colors.text }]}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('create_workout_title')}</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        {/* Search Input */}
        <View style={[styles.searchContainer, { backgroundColor: currentTheme === 'dark' ? colors.surface : '#ffffff', borderColor: currentTheme === 'dark' ? colors.border : '#efefef' }]}>
          <Text style={[styles.searchIcon, { color: colors.textSecondary }]}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('create_workout_routine_name')}
            placeholderTextColor={colors.placeholder}
            value={routineName}
            onChangeText={setRoutineName}
          />
          {routineName.length > 0 && (
            <TouchableOpacity onPress={() => setRoutineName('')} style={styles.closeIcon}>
              <Text style={{ color: colors.text, fontSize: 22, fontWeight: '500' }}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filters Row */}
        <View style={styles.filtersContainer}>
          <View style={styles.filtersRow}>
            <TouchableOpacity 
              style={[
                styles.filterButton,
                { backgroundColor: currentTheme === 'dark' ? colors.surface : '#ffffff', borderColor: currentTheme === 'dark' ? colors.border : '#efefef' },
                selectedEquipment.length > 0 && styles.filterButtonActive
              ]}
              onPress={() => setShowEquipmentModal(true)}
            >
              <Text style={[
                styles.filterText,
                { color: colors.text },
                selectedEquipment.length > 0 && styles.filterTextActive
              ]}>
                {selectedEquipment.length > 0 
                  ? t(equipmentList.find(item => item.id === selectedEquipment[0])?.translationKey || 'create_workout_select_equipment')
                  : t('create_workout_all_equipment')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.filterButton,
                { backgroundColor: currentTheme === 'dark' ? colors.surface : '#ffffff', borderColor: currentTheme === 'dark' ? colors.border : '#efefef' },
                selectedMuscles.length > 0 && styles.filterButtonActive
              ]}
              onPress={() => setShowMuscleModal(true)}
            >
              <Text style={[
                styles.filterText,
                { color: colors.text },
                selectedMuscles.length > 0 && styles.filterTextActive
              ]}>
                {selectedMuscles.length > 0 
                  ? t(muscleGroups.find(item => item.id === selectedMuscles[0])?.translationKey || 'create_workout_select_muscle')
                  : t('create_workout_all_muscles')}
              </Text>
            </TouchableOpacity>
          </View>

          {(selectedEquipment.length > 0 || selectedMuscles.length > 0 || routineName.length > 0) && (
            <TouchableOpacity 
              style={styles.clearAllButton}
              onPress={() => {
                setSelectedEquipment([]);
                setSelectedMuscles([]);
                setRoutineName('');
              }}
            >
              <Text style={styles.clearAllButtonText}>{t('create_workout_clear_filters')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Exercise List */}
        <View style={[styles.card, { backgroundColor: currentTheme === 'dark' ? colors.surface : '#ffffff', borderColor: currentTheme === 'dark' ? colors.border : '#efefef' }]}>
          <Text style={[styles.cardTitle, { color: colors.text, borderBottomColor: colors.border }]}>{t('create_workout_all_exercises')}</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('create_workout_loading')}</Text>
            </View>
          ) : (
            <FlatList
              data={filteredExercises}
              keyExtractor={(item, index) => `exercise-${String(item.id)}-${index}`}
              renderItem={renderExerciseItem}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews={true}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.exerciseList}
              ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {t('create_workout_no_exercises')}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>

      {/* Filter Modals */}
      <FilterModal 
        visible={showEquipmentModal} 
        onClose={() => setShowEquipmentModal(false)}
        title={t('create_workout_select_equipment')}
        items={equipmentList}
        selectedItems={selectedEquipment}
        onSelectItem={handleEquipmentSelect}
      />

      <FilterModal 
        visible={showMuscleModal} 
        onClose={() => setShowMuscleModal(false)}
        title={t('create_workout_select_muscle')}
        items={muscleGroups}
        selectedItems={selectedMuscles}
        onSelectItem={handleMuscleSelect}
      />

      {/* Bottom Button */}
      {selectedExercises.length > 0 && (
        <View style={[styles.bottomButtonContainer, { backgroundColor: colors.background }]}>
          <TouchableOpacity 
            style={styles.addExercisesButton}
            onPress={navigateToSaveWorkout}
          >
            <Text style={styles.addExercisesButtonText}>
              {selectedExercises.length} {t('create_workout_add_exercises')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  backButton: {
    padding: 8,
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Outfit',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: 18,
    padding: 12,
    color: '#6B7280',
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'Outfit',
  },
  closeIcon: {
    padding: 12,
  },
  filtersContainer: {
    marginBottom: 16,
    gap: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterButtonActive: {
    borderColor: '#E11D48',
    backgroundColor: '#FEF2F2',
  },
  filterText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'Outfit',
  },
  filterTextActive: {
    color: '#E11D48',
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  filterArrow: {
    fontSize: 16,
    color: '#6B7280',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    padding: 16,
    borderBottomWidth: 1,
    fontFamily: 'Outfit',
  },
  exerciseList: {
    padding: 8,
    paddingBottom: 100,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: normalize(12),
    borderBottomWidth: 1,
    marginBottom: 1,
  },
  exerciseIconContainer: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(12),
    overflow: 'hidden',
  },
  exerciseIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  exerciseInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 4,
  },
  exerciseMainInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  exerciseName: {
    fontSize: normalize(15),
    fontWeight: '600',
    color: '#111827',
    marginBottom: normalize(2),
    fontFamily: 'Outfit',
  },
  exerciseTarget: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetText: {
    fontSize: normalize(14),
    color: '#6B7280',
    fontFamily: 'Outfit',
  },
  infoIconContainer: {
    marginLeft: normalize(8),
    padding: normalize(4),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: SCREEN_HEIGHT * 0.8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    position: 'relative',
  },
  modalDragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  closeButtonText: {
    fontSize: 28,
    color: '#000',
    fontFamily: 'Outfit',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Outfit',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    padding: 16,
    fontFamily: 'Outfit',
  },
  modalList: {
    flex: 1,
  },
  modalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalListItemSelected: {
    backgroundColor: '#FEE2E2',
  },
  modalListItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalListItemIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  modalListItemText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
    fontFamily: 'Outfit',
  },
  modalListItemTextSelected: {
    color: '#E11D48',
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  checkmark: {
    fontSize: 20,
    color: '#E11D48',
    fontWeight: 'bold',
  },
  addButtonSelected: {
    backgroundColor: '#16A34A',
  },
  clearAllButton: {
    backgroundColor: '#E11D48',
    padding: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E11D48',
  },
  clearAllButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  addExercisesButton: {
    backgroundColor: '#E11D48',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#E11D48',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  addExercisesButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  selectedExerciseItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#E11D48',
    paddingLeft: 12,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Outfit',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Outfit',
  },
});

export default CreateWorkoutScreen; 