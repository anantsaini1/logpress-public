import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationProp } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import PointsScreen from '../screens/PointsScreen';
import BadgesScreen from '../screens/BadgesScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import LeaderboardProfileScreen from '../screens/LeaderboardProfileScreen';
import { WorkoutScreen, ReadyRoutinesScreen, CreateWorkoutScreen, SaveWorkoutScreen, WorkoutTrackingScreen, WorkoutCompleteScreen, WorkoutInfoScreen, WorkoutProgramScreen } from '../screens/workout';
import StatsScreen from '../screens/StatsScreen';
import StatsScreenForFreemium from '../screens/StatsScreenForFreemium';
import ProfileScreen from '../screens/ProfileScreen';
import { useUser } from '../context/UserContext';
import ProfileDetailsScreen from '../screens/ProfileDetailsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import {
  AboutScreen,
  DeveloperResourcesScreen,
  LanguageSettingsScreen,
  NotificationsSettingsScreen,
  PrivacySettingsScreen,
  ReferralCodeScreen,
  ThemeScreen,
  TrainerSettingsScreen,
  UnitsSettingsScreen,
  MotivationalLoadingScreen
} from '../screens/settings';
import {
  BioScreen,
  EnvironmentScreen,
  FavoriteSportsScreen,
  FitnessLevelScreen,
  FocusAreasScreen,
  FrequencyScreen,
  GoalScreen,
  HeightScreen,
  WeightScreen,
} from '../screens/profile';
import BottomTabBar from '../components/BottomTabBar';

export type TabStackParamList = {
  Home: { screen?: string } | undefined;
  Workout: undefined;
  Stats: undefined;
  Profile: undefined;
  ProfileDetails: undefined;
  Settings: undefined;
  PointsScreen: undefined;
  BadgesScreen: undefined;
  LeaderboardScreen: undefined;
  LeaderboardProfile: {
    userId: string;
    display_name: string;
    avatar_url: string | null;
  };
  About: undefined;
  DeveloperResources: undefined;
  LanguageSettings: undefined;
  NotificationsSettings: undefined;
  PrivacySettings: undefined;
  ReferralCode: undefined;
  ThemeSettings: undefined;
  TrainerSettings: undefined;
  UnitsSettings: undefined;
  // Workout screens
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
  SaveWorkout: {
    exercises: any[];
    routineName?: string;
  };
  WorkoutTracking: {
    routineId: string;
    routineName: string;
    exercises: any[];
    isFromStats: boolean;
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
  WorkoutInfo: {
    exercise: any;
  };
  // Profile screens
  BioScreen: undefined;
  EnvironmentScreen: undefined;
  FavoriteSportsScreen: undefined;
  FitnessLevelScreen: undefined;
  FocusAreasScreen: undefined;
  GoalScreen: undefined;
  WeightScreen: undefined;
  HeightScreen: undefined;
  FrequencyScreen: undefined;
  // Yeni onboarding screen'leri (Tab navigator için)
  BMICalculationLoading: undefined;
  BMIResultsScreen: { bmi: string; category: string };
  MotivationalLoadingScreen: undefined;
  // BMI Screen settings için
  BMIScreen: undefined;
};

const Stack = createNativeStackNavigator<TabStackParamList>();

// Ana tab sayfaları wrapper'ı
const MainTabsWrapper: React.FC<{ navigation: NavigationProp<TabStackParamList>, route: any }> = ({ navigation, route }) => {
  const [currentTab, setCurrentTab] = useState('Home');
  const { user_role_id } = useUser();

  React.useEffect(() => {
    if (route.params?.screen) {
      setCurrentTab(route.params.screen);
    }
  }, [route.params?.screen]);

  // Ana tab sayfaları
  const renderMainTabContent = () => {
    switch(currentTab) {
      case 'Home':
        return <HomeScreen navigation={navigation} />;
      case 'Workout':
        return <WorkoutScreen navigation={navigation} />;
      case 'Stats':
        // user_role_id 0 ise freemium stats, 1 ise normal stats
        return user_role_id === 0 
          ? <StatsScreenForFreemium navigation={navigation} />
          : <StatsScreen navigation={navigation} />;
      case 'Profile':
        return <ProfileScreen navigation={navigation} />;
      case 'ProfileDetails':
        return <ProfileDetailsScreen navigation={navigation as any} />;
      default:
        return <HomeScreen navigation={navigation} />;
    }
  };

  // user_role_id'ye göre tab listesini belirle
  const getTabRoutes = () => {
    const baseRoutes = [
      { key: 'Home', name: 'Home' },
      { key: 'Workout', name: 'Workout' },
      { key: 'Stats', name: 'Stats' },
    ];

    if (user_role_id === 1) {
      // Premium user - ProfileDetails göster
      return [...baseRoutes, { key: 'ProfileDetails', name: 'ProfileDetails' }];
    } else {
      // Freemium user - Profile göster
      return [...baseRoutes, { key: 'Profile', name: 'Profile' }];
    }
  };

  const tabRoutes = getTabRoutes();
  const currentTabIndex = tabRoutes.findIndex(route => route.name === currentTab);

  return (
    <View style={{ flex: 1 }}>
      {renderMainTabContent()}
      
      {/* Sabit Bottom Tab Bar */}
      <BottomTabBar 
        state={{
          index: currentTabIndex,
          routes: tabRoutes
        }}
        navigation={{
          navigate: (tabName: string) => {
            setCurrentTab(tabName);
          }
        } as any}
      />
    </View>
  );
};

const TabNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Ana tab wrapper'ı */}
      <Stack.Screen
        name="Home"
        component={MainTabsWrapper}
      />
      
      {/* İç sayfalar - Tab bar olmadan */}
      <Stack.Screen
        name="PointsScreen"
        component={PointsScreen}
      />
      <Stack.Screen
        name="BadgesScreen"
        component={BadgesScreen}
      />
      <Stack.Screen
        name="LeaderboardScreen"
        component={LeaderboardScreen}
      />
      <Stack.Screen
        name="LeaderboardProfile"
        component={LeaderboardProfileScreen}
      />
      <Stack.Screen
        name="ProfileDetails"
        component={ProfileDetailsScreen}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
      />
      <Stack.Screen
        name="DeveloperResources"
        component={DeveloperResourcesScreen}
      />
      <Stack.Screen
        name="LanguageSettings"
        component={LanguageSettingsScreen}
      />
      <Stack.Screen
        name="NotificationsSettings"
        component={NotificationsSettingsScreen}
      />
      <Stack.Screen
        name="PrivacySettings"
        component={PrivacySettingsScreen}
      />
      <Stack.Screen
        name="ReferralCode"
        component={ReferralCodeScreen}
      />
      <Stack.Screen
        name="ThemeSettings"
        component={ThemeScreen}
      />
      <Stack.Screen
        name="TrainerSettings"
        component={TrainerSettingsScreen}
      />
      <Stack.Screen
        name="UnitsSettings"
        component={UnitsSettingsScreen}
      />
      <Stack.Screen
        name="MotivationalLoadingScreen"
        component={MotivationalLoadingScreen}
      />
      
      {/* Workout screens */}
      <Stack.Screen
        name="ReadyRoutines"
        component={ReadyRoutinesScreen}
      />
      <Stack.Screen
        name="WorkoutProgram"
        component={WorkoutProgramScreen}
      />
      <Stack.Screen
        name="CreateWorkout"
        component={CreateWorkoutScreen}
      />
      <Stack.Screen
        name="SaveWorkout"
        component={SaveWorkoutScreen}
      />
      <Stack.Screen
        name="WorkoutTracking"
        component={WorkoutTrackingScreen}
      />
      <Stack.Screen
        name="WorkoutComplete"
        component={WorkoutCompleteScreen}
      />
      <Stack.Screen
        name="WorkoutInfo"
        component={WorkoutInfoScreen}
      />
      
      {/* Profile screens */}
      <Stack.Screen
        name="BioScreen"
        component={BioScreen}
      />
      <Stack.Screen
        name="FavoriteSportsScreen"
        component={FavoriteSportsScreen}
      />
      <Stack.Screen
        name="FitnessLevelScreen"
        component={FitnessLevelScreen}
      />
      <Stack.Screen
        name="FocusAreasScreen"
        component={FocusAreasScreen}
      />
      <Stack.Screen
        name="GoalScreen"
        component={GoalScreen}
      />
      <Stack.Screen
        name="WeightScreen"
        component={WeightScreen}
      />
      <Stack.Screen
        name="HeightScreen"
        component={HeightScreen}
      />
      <Stack.Screen
        name="FrequencyScreen"
        component={FrequencyScreen}
      />
      <Stack.Screen
        name="EnvironmentScreen"
        component={EnvironmentScreen}
      />
    </Stack.Navigator>
  );
};

export default TabNavigator; 