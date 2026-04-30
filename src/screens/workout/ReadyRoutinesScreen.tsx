import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TabStackParamList } from '../../navigation/TabNavigator';
import { useTheme } from '../../context/ThemeContext';
import { exerciseService } from '../../services/exerciseService';
// Import for user data
import { useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/slices/userSlice';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<TabStackParamList, 'ReadyRoutines'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');





interface Program {
  id: number;
  name: string;
  description?: string;
  icon: string;
  image?: any;
  routine_count: number;
  level: string;
  goal_id: number;
  equipment_id: number;
  aiScore?: number;
}

// Dummy data
const dummyPrograms: Program[] = [
  {
    id: 1,
    name: "program_beginner_strength",
    description: "Yeni başlayanlar için temel kuvvet antrenmanı",
    icon: "💪",
    image: require('../../assets/ready/ready1.png'),
    routine_count: 12,
    level: "Başlangıç",
    goal_id: 1,
    equipment_id: 1
  },
  {
    id: 2,
    name: "program_cardio_crush",
    description: "Yoğun kardiyovasküler antrenman programı",
    icon: "🔥",
    image: require('../../assets/ready/ready2.jpg'),
    routine_count: 12,
    level: "Orta",
    goal_id: 2,
    equipment_id: 3
  },
  {
    id: 3,
    name: "program_bodyweight_master",
    description: "Ekipman gerektirmeyen tam vücut antrenmanı",
    icon: "🧘‍♂️",
    image: require('../../assets/ready/ready3.jpg'),
    routine_count: 12,
    level: "İleri",
    goal_id: 3,
    equipment_id: 3
  },
  {
    id: 4,
    name: "program_powerlifting_basics",
    description: "Squat, bench press ve deadlift odaklı program",
    icon: "🏋️‍♂️",
    image: require('../../assets/ready/ready4.jpg'),
    routine_count: 12,
    level: "İleri",
    goal_id: 1,
    equipment_id: 1
  },
  {
    id: 5,
    name: "program_dumbbell_dynamo",
    description: "Sadece dumbbell kullanarak tam vücut antrenmanı",
    icon: "🔨",
    image: require('../../assets/ready/ready5.jpg'),
    routine_count: 12,
    level: "Orta",
    goal_id: 2,
    equipment_id: 2
  }
];

// AI Routine Recommendation Logic
const getAIRecommendedRoutine = (user: any, programs: Program[]): Program | null => {
  if (!user || !programs.length) return null;
  
  // Score each program based on user profile
  const scoredPrograms = programs.map(program => {
    let score = 0;

    // Experience level matching
    if (user.experience) {
      if (user.experience === 'Beginner' && program.level === 'Başlangıç') score += 3;
      else if (user.experience === 'Intermediate' && program.level === 'Orta') score += 3;
      else if (user.experience === 'Advanced' && program.level === 'İleri') score += 3;
      else if (user.experience === 'Professional' && program.level === 'İleri') score += 2;
    }

    // Goal matching
    if (user.aim) {
      if (user.aim === 'Get Stronger' && program.goal_id === 1) score += 3;
      else if (user.aim === 'Gain Muscle' && program.goal_id === 2) score += 3;
      else if (user.aim === 'Stay Healthy' && program.goal_id === 3) score += 3;
      else if (user.aim === 'Lose Weight' && program.goal_id === 2) score += 2; // Cardio helps with weight loss
    }

    // Age-based recommendations
    if (user.age) {
      if (user.age < 25 && program.id === 2) score += 1; // Young people might like cardio
      else if (user.age >= 25 && user.age < 40 && program.goal_id === 1) score += 1; // Strength focus
      else if (user.age >= 40 && program.goal_id === 3) score += 1; // Health focus
    }

    // Exercise frequency matching
    if (user.exercise_hours) {
      if (user.exercise_hours === '1-2 times a week' && program.routine_count <= 12) score += 1;
      else if (user.exercise_hours === '3-4 times a week' && program.routine_count >= 12) score += 2;
      else if (user.exercise_hours === '5-6 times a week' && program.routine_count >= 12) score += 2;
    }

    // BMI-based recommendations
    if (user.weight && user.height) {
      const heightInM = user.height / 100;
      const bmi = user.weight / (heightInM * heightInM);
      
      if (bmi < 18.5 && program.goal_id === 2) score += 2; // Underweight -> muscle gain
      else if (bmi > 25 && program.id === 2) score += 2; // Overweight -> cardio
      else if (bmi >= 18.5 && bmi <= 25 && program.goal_id === 1) score += 1; // Normal -> strength
    }

    return { ...program, aiScore: score };
  });

  // Find the program with highest score
  const recommended = scoredPrograms.reduce((best, current) => 
    (current.aiScore || 0) > (best.aiScore || 0) ? current : best
  );

  return recommended.aiScore && recommended.aiScore > 0 ? recommended : programs[0]; // Fallback to first program
};



const ReadyRoutinesScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const user = useAppSelector(selectUser);
  const [programs, setPrograms] = useState<Program[]>(dummyPrograms);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllPrograms, setShowAllPrograms] = useState(false);

  useEffect(() => {
    // Simulated data loading
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);



  const getActiveFilterCount = useCallback(() => {
    return 0; // No filters active
  }, []);

  const filteredPrograms = useMemo(() => {
    return programs; // No filtering applied
  }, [programs]);

  const displayedPrograms = useMemo(() => {
    return showAllPrograms ? filteredPrograms : filteredPrograms.slice(0, 3);
  }, [filteredPrograms, showAllPrograms]);

  // Get AI recommended routine
  const aiRecommendedRoutine = useMemo(() => {
    return getAIRecommendedRoutine(user, programs);
  }, [user, programs]);

  // Get other routines (excluding the recommended one)
  const otherPrograms = useMemo(() => {
    if (!aiRecommendedRoutine) return displayedPrograms;
    return displayedPrograms.filter(program => program.id !== aiRecommendedRoutine.id);
  }, [displayedPrograms, aiRecommendedRoutine]);



  // Helper function to create unique set IDs
  const createUniqueSetId = (exerciseName: string, setIndex: number) => {
    return `${exerciseName.toLowerCase().replace(/\s+/g, '_')}_${setIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Helper function to create sets with unique IDs
  const createSets = (exerciseName: string, setsConfig: Array<{reps: string}>) => {
    return setsConfig.map((config, index) => ({
      id: createUniqueSetId(exerciseName, index + 1),
      weight: 0,
      reps: config.reps,
      isCompleted: false
    }));
  };

  const handleProgramSelect = (program: Program) => {
    // Her program için özel hareketler
    if (program.name === "program_beginner_strength") {
      // Database'den gerçek egzersizleri çek - isimlerine göre bul
      const allExercises = exerciseService.getAllExercises();
      const findExerciseByName = (name: string) => allExercises.find(ex => ex.name.toLowerCase().includes(name.toLowerCase()));
      
      const legPressExercise = findExerciseByName("Leg Press");
      const chestPressExercise = findExerciseByName("Chest Press");
      const seatedRowExercise = findExerciseByName("Seated Row");
      const latPulldownExercise = findExerciseByName("Lat Pulldown");
      const gluteBridgeExercise = findExerciseByName("Glute Bridge");
      const legCurlExercise = findExerciseByName("Leg Curl");
      const russianTwistExercise = findExerciseByName("Russian Twist");
      const hipAbductionExercise = findExerciseByName("Hip Abduction");
      const cableLateralRaiseExercise = findExerciseByName("Cable Lateral Raise");
      const plankExercise = findExerciseByName("Plank");

      const beginnerStrengthExercises = [
        {
          id: legPressExercise?.id || "leg_press",
          name: "Leg Press",
          image: legPressExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_leg_press'),
          restTime: "3:00",
          target: "Bacak - Kalça",
          equipment: "Leg Press Makinesi",
          sets: createSets("Leg Press", [{reps: "12"}, {reps: "12"}, {reps: "12"}])
        },
        {
          id: chestPressExercise?.id || "chest_press",
          name: "Chest Press",
          image: chestPressExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_chest_press'),
          restTime: "2:30",
          target: "Göğüs - Triceps",
          equipment: "Göğüs Press Makinesi",
          sets: createSets("Chest Press", [{reps: "10"}, {reps: "10"}, {reps: "10"}])
        },
        {
          id: seatedRowExercise?.id || "seated_row",
          name: "Seated Row",
          image: seatedRowExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_seated_row'),
          restTime: "2:30",
          target: "Sırt - Biceps",
          equipment: "Seated Row Makinesi",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "10", isCompleted: false }
          ]
        },
        {
          id: latPulldownExercise?.id || "lat_pulldown",
          name: "Lat Pulldown",
          image: latPulldownExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_lat_pulldown'),
          restTime: "2:30",
          target: "Sırt - Biceps",
          equipment: "Lat Pulldown Makinesi",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "10", isCompleted: false }
          ]
        },
        {
          id: gluteBridgeExercise?.id || "glute_bridge",
          name: "Glute Bridge",
          image: gluteBridgeExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_glute_bridge'),
          restTime: "2:00",
          target: "Kalça - Hamstring",
          equipment: "Ağırlık Plakası",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "15", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "15", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "15", isCompleted: false }
          ]
        },
        {
          id: "cable_face_pull",
          name: "Cable Face Pull",
          image: require('../../assets/logo.png'),
          description: t('exercise_description_cable_face_pull'),
          restTime: "2:00",
          target: "Arka Omuz - Trapez",
          equipment: "Kablo Makinesi",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "12", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "12", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "12", isCompleted: false }
          ]
        },
        {
          id: cableLateralRaiseExercise?.id || "cable_lateral_raise",
          name: "Cable Lateral Raise",
          image: cableLateralRaiseExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_cable_lateral_raise'),
          restTime: "1:30",
          target: "Yan Omuz",
          equipment: "Kablo Makinesi",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "12", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "12", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "12", isCompleted: false }
          ]
        },
        {
          id: "incline_walk",
          name: "Incline Walk",
          image: require('../../assets/logo.png'),
          description: t('exercise_description_incline_walk'),
          restTime: "0:30",
          target: "Kardiyovasküler",
          equipment: "Koşu Bandı",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "10", isCompleted: false }
          ]
        },
        {
          id: legCurlExercise?.id || "leg_curl",
          name: "Leg Curl",
          image: legCurlExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_leg_curl'),
          restTime: "2:00",
          target: "Hamstring",
          equipment: "Leg Curl Makinesi",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "12", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "12", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "12", isCompleted: false }
          ]
        },
        {
          id: russianTwistExercise?.id || "russian_twist",
          name: "Russian Twist",
          image: russianTwistExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_russian_twist'),
          restTime: "1:30",
          target: "Karın",
          equipment: "Ağırlık Plakası",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "20", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "20", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "20", isCompleted: false }
          ]
        },
        {
          id: hipAbductionExercise?.id || "hip_abduction",
          name: "Hip Abduction",
          image: hipAbductionExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_hip_abduction'),
          restTime: "1:30",
          target: "Kalça Yan Kasları",
          equipment: "Hip Abduction Makinesi",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "15", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "15", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "15", isCompleted: false }
          ]
        },
        {
          id: plankExercise?.id || "plank",
          name: "Plank",
          image: plankExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_plank'),
          restTime: "1:00",
          target: "Karın - Core",
          equipment: "Vücut Ağırlığı",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "30", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "30", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "30", isCompleted: false }
          ]
        }
      ];

      // SaveWorkout sayfasına git
      navigation.navigate('SaveWorkout', {
        exercises: beginnerStrengthExercises.map(ex => ({
          ...ex,
          isExpanded: false
        })),
        routineName: t(program.name)
      });
    } else if (program.name === "program_cardio_crush") {
      // Kardiyo Yıkımı programı için kardiyovasküler hareketler
      const allExercises = exerciseService.getAllExercises();
      const findExerciseByName = (name: string) => allExercises.find(ex => ex.name.toLowerCase().includes(name.toLowerCase()));
      
      const burpeeExercise = findExerciseByName("Burpee");
      const jumpRopeExercise = findExerciseByName("Jump Rope");
      const mountainClimberExercise = findExerciseByName("Mountain Climber");
      const jumpSquatExercise = findExerciseByName("Jump Squat");
      const jumpingJackExercise = findExerciseByName("Jumping Jack");
      const boxJumpExercise = findExerciseByName("Box Jump");
      const jumpingLungeExercise = findExerciseByName("Jumping Lunge");
      const cyclingExercise = findExerciseByName("Cycling");

      const cardioDestroyerExercises = [
        {
          id: burpeeExercise?.id || "burpee",
          name: "Burpee",
          image: burpeeExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_burpee'),
          restTime: "1:00",
          target: "Tüm Vücut",
          equipment: "Vücut Ağırlığı",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "10", isCompleted: false }
          ]
        },
        {
          id: jumpRopeExercise?.id || "jump_rope", 
          name: "Jump Rope",
          image: jumpRopeExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_jump_rope'),
          restTime: "1:00",
          target: "Kardiyo",
          equipment: "İp",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "100", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "100", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "100", isCompleted: false }
          ]
        },
        {
          id: mountainClimberExercise?.id || "mountain_climber",
          name: "Mountain Climber", 
          image: mountainClimberExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_mountain_climber'),
          restTime: "1:00",
          target: "Kardiyo - Core",
          equipment: "Vücut Ağırlığı",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "20", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "20", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "20", isCompleted: false }
          ]
        },
        {
          id: jumpSquatExercise?.id || "jump_squat",
          name: "Jump Squat",
          image: jumpSquatExercise?.image || require('../../assets/logo.png'), 
          description: t('exercise_description_jump_squat'),
          restTime: "1:30",
          target: "Bacak - Patlayıcı Güç",
          equipment: "Vücut Ağırlığı",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "15", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "15", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "15", isCompleted: false }
          ]
        },
        {
          id: jumpingJackExercise?.id || "jumping_jack",
          name: "Jumping Jack",
          image: jumpingJackExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_jumping_jack'),
          restTime: "1:00", 
          target: "Kardiyo",
          equipment: "Vücut Ağırlığı",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "25", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "25", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "25", isCompleted: false }
          ]
        },
        {
          id: boxJumpExercise?.id || "box_jump",
          name: "Box Jump",
          image: boxJumpExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_box_jump'),
          restTime: "2:00",
          target: "Bacak - Patlayıcı Güç", 
          equipment: "Kutu",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "10", isCompleted: false }
          ]
        },
        {
          id: "high_knees",
          name: "High Knees",
          image: require('../../assets/logo.png'),
          description: t('exercise_description_high_knees'),
          restTime: "1:00",
          target: "Kardiyo",
          equipment: "Vücut Ağırlığı",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "30", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "30", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "30", isCompleted: false }
          ]
        },
        {
          id: jumpingLungeExercise?.id || "jumping_lunge",
          name: "Jumping Lunge",
          image: jumpingLungeExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_jumping_lunge'),
          restTime: "1:30",
          target: "Bacak",
          equipment: "Vücut Ağırlığı",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "12", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "12", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "12", isCompleted: false }
          ]
        },
        {
          id: "running",
          name: "Running", 
          image: require('../../assets/logo.png'),
          description: t('exercise_description_running'),
          restTime: "2:00",
          target: "Kardiyo",
          equipment: "Koşu Bandı",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "5", isCompleted: false }
          ]
        },
        {
          id: cyclingExercise?.id || "cycling",
          name: "Cycling",
          image: cyclingExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_cycling'),
          restTime: "2:00", 
          target: "Kardiyo - Bacak",
          equipment: "Bisiklet",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "10", isCompleted: false }
          ]
        },
        {
          id: "swimming",
          name: "Swimming",
          image: require('../../assets/logo.png'),
          description: t('exercise_description_swimming'),
          restTime: "3:00",
          target: "Tüm Vücut", 
          equipment: "Havuz",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "200", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "200", isCompleted: false }
          ]
        },
        {
          id: "incline_walk_cardio",
          name: "Incline Walk",
          image: require('../../assets/logo.png'),
          description: t('exercise_description_incline_walk'), 
          restTime: "1:00",
          target: "Kardiyo",
          equipment: "Koşu Bandı",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "15", isCompleted: false }
          ]
        }
      ];

      navigation.navigate('SaveWorkout', {
        exercises: cardioDestroyerExercises.map(ex => ({
          ...ex,
          isExpanded: false,
          sets: ex.sets.map((set, setIndex) => ({
            ...set,
            id: createUniqueSetId(ex.name, setIndex + 1)
          }))
        })),
        routineName: t(program.name)
      });
    } else if (program.name === "program_bodyweight_master") {
      // Vücut Ağırlığı Maestrosu programı için bodyweight hareketler
      const allExercises = exerciseService.getAllExercises();
      const findExerciseByName = (name: string) => allExercises.find(ex => ex.name.toLowerCase().includes(name.toLowerCase()));
      
      const pushUpExercise = findExerciseByName("Push Up");
      const pullUpExercise = findExerciseByName("Pull Up");
      const sitUpExercise = findExerciseByName("Sit Up");
      const plankExerciseVA = findExerciseByName("Plank");
      const diamondPushUpExercise = findExerciseByName("Diamond Push Up");
      const pikePushUpExercise = findExerciseByName("Pike Pushup");
      const handstandPushUpExercise = findExerciseByName("Handstand Push Up");
      const widePullUpExercise = findExerciseByName("Wide Pull Up");
      const russianTwistExerciseVA = findExerciseByName("Russian Twist");
      const sideBendExercise = findExerciseByName("Side Bend");
      const declinePushUpExercise = findExerciseByName("Decline Push Up");
      const mountainClimberExerciseVA = findExerciseByName("Mountain Climber");

      const bodyweightMaestroExercises = [
        {
          id: pushUpExercise?.id || "push_up",
          name: "Push Up",
          image: pushUpExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_push_up'),
          restTime: "1:30",
          target: "Göğüs - Triceps",
          equipment: "Vücut Ağırlığı",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "12", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "12", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "12", isCompleted: false }
          ]
        },
        {
          id: pullUpExercise?.id || "pull_up",
          name: "Pull Up",
          image: pullUpExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_pull_up'),
          restTime: "2:00",
          target: "Sırt - Biceps",
          equipment: "Barfiks Çubuğu",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "8", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "8", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "8", isCompleted: false }
          ]
        },
        {
          id: sitUpExercise?.id || "sit_up",
          name: "Sit Up",
          image: sitUpExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_sit_up'),
          restTime: "1:30",
          target: "Karın",
          equipment: "Vücut Ağırlığı",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "15", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "15", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "15", isCompleted: false }
          ]
        },
        {
          id: plankExerciseVA?.id || "plank_va",
          name: "Plank",
          image: plankExerciseVA?.image || require('../../assets/logo.png'),
          description: t('exercise_description_plank_core'),
          restTime: "1:00",
          target: "Core",
          equipment: "Vücut Ağırlığı",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "45", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "45", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "45", isCompleted: false }
          ]
        },
        {
          id: diamondPushUpExercise?.id || "diamond_push_up",
          name: "Diamond Push Up",
          image: diamondPushUpExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_diamond_push_up'),
          restTime: "2:00",
          target: "Triceps",
          equipment: "Vücut Ağırlığı",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "10", isCompleted: false }
          ]
        },
        {
          id: pikePushUpExercise?.id || "pike_push_up",
          name: "Pike Push Up",
          image: pikePushUpExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_pike_push_up'),
          restTime: "2:00",
          target: "Omuz",
          equipment: "Vücut Ağırlığı",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "8", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "8", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "8", isCompleted: false }
          ]
        },
        {
          id: handstandPushUpExercise?.id || "handstand_push_up",
          name: "Handstand Push Up",
          image: handstandPushUpExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_handstand_push_up'),
          restTime: "3:00",
          target: "Omuz",
          equipment: "Vücut Ağırlığı",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "5", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "5", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "5", isCompleted: false }
          ]
        },
        {
          id: widePullUpExercise?.id || "wide_pull_up",
          name: "Wide Pull Up",
          image: widePullUpExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_wide_pull_up'),
          restTime: "2:30",
          target: "Sırt",
          equipment: "Barfiks Çubuğu",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "6", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "6", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "6", isCompleted: false }
          ]
        },
        {
          id: russianTwistExerciseVA?.id || "russian_twist_va",
          name: "Russian Twist",
          image: russianTwistExerciseVA?.image || require('../../assets/logo.png'),
          description: t('exercise_description_russian_twist'),
          restTime: "1:30",
          target: "Yan Karın",
          equipment: "Vücut Ağırlığı",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "20", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "20", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "20", isCompleted: false }
          ]
        },
        {
          id: sideBendExercise?.id || "side_bend",
          name: "Side Bend",
          image: sideBendExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_side_bend'),
          restTime: "1:30",
          target: "Yan Karın",
          equipment: "Vücut Ağırlığı",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "15", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "15", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "15", isCompleted: false }
          ]
        },
        {
          id: declinePushUpExercise?.id || "decline_push_up",
          name: "Decline Push Up",
          image: declinePushUpExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_decline_push_up'),
          restTime: "2:00",
          target: "Üst Göğüs",
          equipment: "Vücut Ağırlığı + Yükseltilmiş Yüzey",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "10", isCompleted: false }
          ]
        },
        {
          id: mountainClimberExerciseVA?.id || "mountain_climber_va",
          name: "Mountain Climber",
          image: mountainClimberExerciseVA?.image || require('../../assets/logo.png'),
          description: t('exercise_description_mountain_climber'),
          restTime: "1:30",
          target: "Core - Kardiyo",
          equipment: "Vücut Ağırlığı",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "20", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "20", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "20", isCompleted: false }
          ]
        }
      ];

      navigation.navigate('SaveWorkout', {
        exercises: bodyweightMaestroExercises.map(ex => ({
          ...ex,
          isExpanded: false,
          sets: ex.sets.map((set, setIndex) => ({
            ...set,
            id: createUniqueSetId(ex.name, setIndex + 1)
          }))
        })),
        routineName: t(program.name)
      });
    } else if (program.name === "program_powerlifting_basics") {
      // Powerlifting Temelleri programı için barbell hareketler
      const allExercises = exerciseService.getAllExercises();
      const findExerciseByName = (name: string) => allExercises.find(ex => ex.name.toLowerCase().includes(name.toLowerCase()));
      
      const barbellSquatExercise = findExerciseByName("Squat (Barbell)");
      const benchPressExercise = findExerciseByName("Bench Press (Barbell)");
      const deadliftExercise = findExerciseByName("Deadlift (Barbell)");
      const romanianDeadliftExercise = findExerciseByName("Romanian Deadlift");
      const inclineBenchPressExercise = findExerciseByName("Incline Bench Press");
      const boxSquatExercise = findExerciseByName("Box Squat");
      const sumoSquatExercise = findExerciseByName("Sumo Squat");
      const closeGripBenchExercise = findExerciseByName("Close Grip");
      const pauseSquatExercise = findExerciseByName("Pause Squat");
      const wideGripBenchExercise = findExerciseByName("Wide Grip");
      const cleanAndJerkExercise = findExerciseByName("Clean and Jerk");
      const overheadPressExercise = findExerciseByName("Overhead Press");

      const powerliftingBasicsExercises = [
        {
          id: barbellSquatExercise?.id || "barbell_squat",
          name: "Squat (Barbell)",
          image: barbellSquatExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_squat'),
          restTime: "3:00",
          target: "Bacak - Kalça",
          equipment: "Barbell",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "5", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "5", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "5", isCompleted: false }
          ]
        },
        {
          id: benchPressExercise?.id || "bench_press",
          name: "Bench Press (Barbell)",
          image: benchPressExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_bench_press'),
          restTime: "3:00",
          target: "Göğüs - Triceps",
          equipment: "Barbell",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "5", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "5", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "5", isCompleted: false }
          ]
        },
        {
          id: deadliftExercise?.id || "deadlift",
          name: "Deadlift (Barbell)",
          image: deadliftExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_deadlift'),
          restTime: "3:00",
          target: "Sırt - Hamstring",
          equipment: "Barbell",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "5", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "5", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "5", isCompleted: false }
          ]
        },
        {
          id: romanianDeadliftExercise?.id || "romanian_deadlift",
          name: "Romanian Deadlift (Barbell)",
          image: romanianDeadliftExercise?.image || require('../../assets/logo.png'),
          description: "Romanian Deadlift - Hamstring & Kalça",
          restTime: "2:30",
          target: "Hamstring - Kalça",
          equipment: "Barbell",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "8", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "8", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "8", isCompleted: false }
          ]
        },
        {
          id: inclineBenchPressExercise?.id || "incline_bench_press",
          name: "Incline Bench Press (Barbell)",
          image: inclineBenchPressExercise?.image || require('../../assets/logo.png'),
          description: "Eğimli Bench Press - Üst Göğüs",
          restTime: "2:30",
          target: "Üst Göğüs",
          equipment: "Barbell",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "8", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "8", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "8", isCompleted: false }
          ]
        },
        {
          id: boxSquatExercise?.id || "box_squat",
          name: "Box Squat (Barbell)",
          image: boxSquatExercise?.image || require('../../assets/logo.png'),
          description: "Box Squat - Teknik & Güç",
          restTime: "3:00",
          target: "Bacak - Teknik",
          equipment: "Barbell + Kutu",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "6", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "6", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "6", isCompleted: false }
          ]
        },
        {
          id: sumoSquatExercise?.id || "sumo_squat",
          name: "Sumo Squat (Barbell)",
          image: sumoSquatExercise?.image || require('../../assets/logo.png'),
          description: "Sumo Squat - Geniş Duruş",
          restTime: "2:30",
          target: "İç Bacak - Kalça",
          equipment: "Barbell",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "8", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "8", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "8", isCompleted: false }
          ]
        },
        {
          id: closeGripBenchExercise?.id || "close_grip_bench",
          name: "Close Grip Bench Press",
          image: closeGripBenchExercise?.image || require('../../assets/logo.png'),
          description: "Dar Tutuş Bench Press - Triceps",
          restTime: "2:30",
          target: "Triceps - Göğüs",
          equipment: "Barbell",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "8", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "8", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "8", isCompleted: false }
          ]
        },
        {
          id: pauseSquatExercise?.id || "pause_squat",
          name: "Pause Squat (Barbell)",
          image: pauseSquatExercise?.image || require('../../assets/logo.png'),
          description: "Duraklamalı Squat - Güç & Stabilite",
          restTime: "3:00",
          target: "Bacak - Stabilite",
          equipment: "Barbell",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "5", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "5", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "5", isCompleted: false }
          ]
        },
        {
          id: wideGripBenchExercise?.id || "wide_grip_bench",
          name: "Wide Grip Bench Press",
          image: wideGripBenchExercise?.image || require('../../assets/logo.png'),
          description: "Geniş Tutuş Bench Press - Göğüs",
          restTime: "2:30",
          target: "Göğüs",
          equipment: "Barbell",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "8", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "8", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "8", isCompleted: false }
          ]
        },
        {
          id: cleanAndJerkExercise?.id || "clean_and_jerk",
          name: "Clean and Jerk",
          image: cleanAndJerkExercise?.image || require('../../assets/logo.png'),
          description: "Clean and Jerk - Olimpik Kaldırış",
          restTime: "3:00",
          target: "Tüm Vücut",
          equipment: "Barbell",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "3", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "3", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "3", isCompleted: false }
          ]
        },
        {
          id: "overhead_press",
          name: "Overhead Press (Barbell)",
          image: require('../../assets/logo.png'),
          description: "Omuz Press - Omuz & Triceps",
          restTime: "2:30",
          target: "Omuz - Triceps",
          equipment: "Barbell",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "8", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "8", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "8", isCompleted: false }
          ]
        }
      ];

      navigation.navigate('SaveWorkout', {
        exercises: powerliftingBasicsExercises.map(ex => ({
          ...ex,
          isExpanded: false,
          sets: ex.sets.map((set, setIndex) => ({
            ...set,
            id: createUniqueSetId(ex.name, setIndex + 1)
          }))
        })),
        routineName: t(program.name)
      });
    } else if (program.name === "program_dumbbell_dynamo") {
      // Dumbbell Dinamosu programı için dumbbell hareketler
      const allExercises = exerciseService.getAllExercises();
      const findExerciseByName = (name: string) => allExercises.find(ex => ex.name.toLowerCase().includes(name.toLowerCase()));
      
      const dumbbellSquatExercise = findExerciseByName("Squat (Dumbbell)");
      const dumbbellBenchExercise = findExerciseByName("Bench Press (Dumbbell)");
      const dumbbellDeadliftExercise = findExerciseByName("Deadlift (Dumbbell)");
      const dumbbellRowExercise = findExerciseByName("Dumbbell Row");
      const dumbbellShoulderPressExercise = findExerciseByName("Shoulder Press (Dumbbell)");
      const dumbbellBicepCurlExercise = findExerciseByName("Bicep Curl (Dumbbell)");
      const dumbbellLungeExercise = findExerciseByName("Lunge (Dumbbell)");
      const dumbbellPulloverExercise = findExerciseByName("Pullover (Dumbbell)");
      const inclineDumbbellPressExercise = findExerciseByName("Incline Press (Dumbbell)");
      const dumbbellSideBendExercise = findExerciseByName("Side Bend (Dumbbell)");
      const walkingLungeExercise = findExerciseByName("Walking Lunge");
      const curtsyLungeExercise = findExerciseByName("Curtsy Lunge");

      const dumbbellDynamiteExercises = [
        {
          id: dumbbellSquatExercise?.id || "dumbbell_squat",
          name: "Squat (Dumbbell)",
          image: dumbbellSquatExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_dumbbell_squat'),
          restTime: "2:00",
          target: "Bacak - Kalça",
          equipment: "Dumbbell",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "12", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "12", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "12", isCompleted: false }
          ]
        },
        {
          id: dumbbellBenchExercise?.id || "dumbbell_bench",
          name: "Bench Press (Dumbbell)",
          image: dumbbellBenchExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_dumbbell_press'),
          restTime: "2:00",
          target: "Göğüs",
          equipment: "Dumbbell",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "10", isCompleted: false }
          ]
        },
        {
          id: dumbbellDeadliftExercise?.id || "dumbbell_deadlift",
          name: "Deadlift (Dumbbell)",
          image: dumbbellDeadliftExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_dumbbell_deadlift'),
          restTime: "2:00",
          target: "Hamstring - Sırt",
          equipment: "Dumbbell",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "10", isCompleted: false }
          ]
        },
        {
          id: "dumbbell_row",
          name: "Dumbbell Row",
          image: require('../../assets/logo.png'),
          description: t('exercise_description_dumbbell_row'),
          restTime: "2:00",
          target: "Sırt - Biceps",
          equipment: "Dumbbell",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "10", isCompleted: false }
          ]
        },
        {
          id: "dumbbell_shoulder_press",
          name: "Shoulder Press (Dumbbell)",
          image: require('../../assets/logo.png'),
          description: "Dumbbell Shoulder Press - Omuz",
          restTime: "2:00",
          target: "Omuz",
          equipment: "Dumbbell",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "10", isCompleted: false }
          ]
        },
        {
          id: dumbbellBicepCurlExercise?.id || "dumbbell_bicep_curl",
          name: "Bicep Curl (Dumbbell)",
          image: dumbbellBicepCurlExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_dumbbell_curl'),
          restTime: "1:30",
          target: "Biceps",
          equipment: "Dumbbell",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "12", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "12", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "12", isCompleted: false }
          ]
        },
        {
          id: dumbbellLungeExercise?.id || "dumbbell_lunge",
          name: "Lunge (Dumbbell)",
          image: dumbbellLungeExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_dumbbell_lunge'),
          restTime: "2:00",
          target: "Bacak - Kalça",
          equipment: "Dumbbell",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "10", isCompleted: false }
          ]
        },
        {
          id: dumbbellPulloverExercise?.id || "dumbbell_pullover",
          name: "Pullover (Dumbbell)",
          image: dumbbellPulloverExercise?.image || require('../../assets/logo.png'),
          description: t('exercise_description_dumbbell_pullover'),
          restTime: "2:00",
          target: "Göğüs - Sırt",
          equipment: "Dumbbell",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "12", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "12", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "12", isCompleted: false }
          ]
        },
        {
          id: inclineDumbbellPressExercise?.id || "incline_dumbbell_press",
          name: "Incline Press (Dumbbell)",
          image: inclineDumbbellPressExercise?.image || require('../../assets/logo.png'),
          description: "Eğimli Dumbbell Press - Üst Göğüs",
          restTime: "2:00",
          target: "Üst Göğüs",
          equipment: "Dumbbell",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "10", isCompleted: false }
          ]
        },
        {
          id: dumbbellSideBendExercise?.id || "dumbbell_side_bend",
          name: "Side Bend (Dumbbell)",
          image: dumbbellSideBendExercise?.image || require('../../assets/logo.png'),
          description: "Dumbbell Yana Eğilme - Yan Karın",
          restTime: "1:30",
          target: "Yan Karın",
          equipment: "Dumbbell",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "15", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "15", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "15", isCompleted: false }
          ]
        },
        {
          id: walkingLungeExercise?.id || "walking_lunge",
          name: "Walking Lunge (Dumbbell)",
          image: walkingLungeExercise?.image || require('../../assets/logo.png'),
          description: "Yürüyen Lunge - Dinamik Bacak",
          restTime: "2:00",
          target: "Bacak - Dinamik",
          equipment: "Dumbbell",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "12", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "12", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "12", isCompleted: false }
          ]
        },
        {
          id: curtsyLungeExercise?.id || "curtsy_lunge",
          name: "Curtsy Lunge (Dumbbell)",
          image: curtsyLungeExercise?.image || require('../../assets/logo.png'),
          description: "Curtsy Lunge - İç Bacak & Kalça",
          restTime: "2:00",
          target: "İç Bacak - Kalça",
          equipment: "Dumbbell",
          sets: [
            { id: `set_1_${Date.now()}_${Math.random()}`, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 1, weight: 0, reps: "10", isCompleted: false },
            { id: Date.now() + 2, weight: 0, reps: "10", isCompleted: false }
          ]
        }
      ];

      navigation.navigate('SaveWorkout', {
        exercises: dumbbellDynamiteExercises.map(ex => ({
          ...ex,
          isExpanded: false,
          sets: ex.sets.map((set, setIndex) => ({
            ...set,
            id: createUniqueSetId(ex.name, setIndex + 1)
          }))
        })),
        routineName: t(program.name)
      });
    } else {
      // Diğer programlar için normal akış
          navigation.navigate('WorkoutProgram', {
      title: t(program.name),
      weeks: 4,
      daysPerWeek: 3,
      workoutsCount: program.routine_count,
      description: program.description || ''
    });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.mainScroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.backButtonText, { color: colors.text }]}>{'←'}</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('ready_routines_title')}</Text>
          </View>
          <View style={styles.content}>
            {/* AI Recommended Routine Spotlight */}
            {aiRecommendedRoutine && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('ready_routines_ai_spotlight_title') || 'AI Önerisi'}
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  {t('ready_routines_ai_recommendation') || 'Yapay zeka senin için bu antrenmanı önerdi'}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.programCard, 
                    styles.recommendedCard,
                    { 
                      backgroundColor: colors.card,
                      borderColor: '#E11D48',
                      borderWidth: 2
                    }
                  ]}
                  onPress={() => handleProgramSelect(aiRecommendedRoutine)}
                >
                  <View style={[styles.recommendedBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.recommendedBadgeText}>
                      {t('ready_routines_ai_spotlight_title') || 'AI Önerisi'}
                    </Text>
                  </View>
                  <View style={[styles.programIcon, { backgroundColor: colors.primary }]}>
                    <Text style={styles.programIconText}>
                      {t(aiRecommendedRoutine.name).split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2)}
                    </Text>
                  </View>
                  <View style={styles.programInfo}>
                    <Text style={[styles.programTitle, { color: colors.text }]}>{t(aiRecommendedRoutine.name)}</Text>
                    <Text style={[styles.routineCount, { color: colors.textSecondary }]}>
                      {aiRecommendedRoutine.routine_count} {t('ready_routines_routine') || 'Rutin'}
                    </Text>
                    <Text style={[styles.recommendedText, { color: colors.primary }]}>
                      {t('ready_routines_ai_explanation') || 'Profiline göre bu rutin sana en uygun olanı'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {aiRecommendedRoutine ? 
                  (t('ready_routines_other_routines') || 'Diğer Rutinler') : 
                  t('ready_routines_programs')
                }
              </Text>

              <View style={styles.programGrid}>
                {otherPrograms.length > 0 ? (
                  <>
                    {otherPrograms.map((program) => (
                      <TouchableOpacity
                        key={program.id}
                        style={[styles.programCard, { 
                          backgroundColor: colors.card,
                          borderColor: colors.border 
                        }]}
                        onPress={() => handleProgramSelect(program)}>
                        <View style={[styles.programIcon, { backgroundColor: colors.primary }]}>
                          <Text style={styles.programIconText}>
                            {t(program.name).split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2)}
                          </Text>
                        </View>
                        <View style={styles.programInfo}>
                          <Text style={[styles.programTitle, { color: colors.text }]}>{t(program.name)}</Text>
                          <Text style={[styles.routineCount, { color: colors.textSecondary }]}>
                            {program.routine_count} {t('ready_routines_routine')}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                    {filteredPrograms.length > (aiRecommendedRoutine ? 2 : 3) && !showAllPrograms && (
                      <TouchableOpacity
                        style={[styles.showAllButton, { 
                          backgroundColor: 'transparent',
                          borderWidth: 0
                        }]}
                        onPress={() => setShowAllPrograms(true)}
                      >
                        <Text style={[styles.showAllButtonText, { color: colors.primary }]}>
                          + {filteredPrograms.length - (aiRecommendedRoutine ? 2 : 3)} {t('ready_routines_more_programs')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('ready_routines_no_programs')}</Text>
                )}
              </View>
            </View>

          </View>
        </ScrollView>
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
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    justifyContent: 'space-between',
  },
  mainFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
  },
  filterIcon: {
    marginRight: 4,
    fontSize: 16,
  },
  filterText: {
    fontSize: 13,
  },
  filterTextActive: {
    color: '#fff',
  },
  programGrid: {
    gap: 12,
  },
  programCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 0,
  },
  programIcon: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  programIconText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 20,
    textAlign: 'center',
  },
  programInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  programTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  routineCount: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  mainScroll: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    marginTop: 'auto',
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  closeButtonText: {
    fontSize: 28,
  },
  modalBody: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    paddingTop: 60,
  },
  filterSection: {
    marginBottom: 32,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  filterOption: {
    width: '30%',
    aspectRatio: 0.85,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333333', // Fallback color, will be overridden dynamically
  },
  filterOptionActive: {
    backgroundColor: '#E11D48',
  },
  filterOptionIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  filterOptionText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 16,
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 16,
    marginLeft: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  modalDragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
  },

  backButtonText: {
    fontSize: 24,
  },
  iconText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  showAllButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  showAllButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  programImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  // AI Recommendation styles
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    fontFamily: 'Outfit',
  },
  recommendedCard: {
    position: 'relative',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  recommendedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  recommendedText: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Outfit',
  },
});

export default ReadyRoutinesScreen; 