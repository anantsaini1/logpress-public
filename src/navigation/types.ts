import { ExerciseSet } from '../types/exercise';

export interface SavedExercise {
  id: string | number;
  name: string;
  icon: string;
  image?: string;
  description: string;
  restTime: string;
  sets: ExerciseSet[];
  isExpanded: boolean;
}

export type RootStackParamList = {
  FirstScreen: undefined;
  NameScreen: undefined;
  genderScreen: undefined;
  Age: undefined;
  Height: undefined;
  Weight: undefined;
  Goal: undefined;
  Frequency: undefined;
  // Yeni onboarding ekranları (profile'dan)
  Environment: undefined;
  Experience: undefined;
  // Yeni BMI ve program ekranları
  BMICalculationLoading: undefined;
  BMIResultsScreen: { bmi: string; category: string };
  MotivationalLoadingScreen: undefined;
  BMIScreen: { bmi: string; onboardingData: any };
  PaywallScreen: { 
    source?: 'onboarding' | 'settings' | 'feature_lock' | 'general';
    returnRoute?: string;
    bmiData?: { bmi: string; onboardingData: any };
  };
  Login: { type: 'login' | 'register' };
  BadgesScreen: undefined;
  ReadyRoutines: undefined;
  WorkoutProgram: {
    title: string;
    weeks: number;
    daysPerWeek: number;
    workoutsCount: number;
    description: string;
  };
  CreateWorkout: {
    onExerciseSelect?: (selectedExercise: {
      id: string | number;
      name: string;
      icon?: string;
      description?: string;
      restTime?: string;
      target?: string;
      equipment?: string;
    }) => void;
  };
  WorkoutTracking: {
    routineId: string;
    routineName: string;
    exercises: any[];
    isFromStats: boolean;
  };
  SaveWorkout: {
    exercises: SavedExercise[];
    routineName?: string;
  };
  WorkoutInfo: {
    exercise: any;
  };
  WorkoutComplete: {
    routineName: string;
    duration: number;
    volume: number;
    sets: number;
    note: string;
    exercises: any[];
    shouldRefresh?: boolean;
    nextScreen?: string;
  };
  Stats: undefined;
  StatsForFreemium: undefined;
}; 