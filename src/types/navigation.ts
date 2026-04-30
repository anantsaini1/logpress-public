import { NativeStackNavigationProp } from '@react-navigation/native-stack';

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
  CreateWorkout: undefined;
  WorkoutTracking: {
    routineId: string;
    routineName: string;
    exercises: any[];
    isFromStats: boolean;
  };
  WorkoutComplete: {
    routineName?: string;
    duration: number;
    volume: number;
    sets: number;
    note?: string;
    exercises: any[];
    shouldRefresh?: boolean;
    nextScreen?: string;
  };
  MainTabs: {
    screen?: string;
  };
  Stats: undefined;
  Home: {
    screen?: string;
  };
  LeaderboardScreen: undefined;
  LeaderboardProfile: {
    userId: string;
    display_name: string;
    avatar_url: string | null;
  };
  // Settings screens
  Settings: undefined;
  NotificationsSettings: undefined;
  TrainerSettings: undefined;
  ThemeSettings: undefined;
  PrivacySettings: undefined;
  UnitsSettings: undefined;
  LanguageSettings: undefined;
  ReferralCode: undefined;
  About: undefined;
  DeveloperResources: undefined;
};

export type NavigationProps = NativeStackNavigationProp<RootStackParamList>; 