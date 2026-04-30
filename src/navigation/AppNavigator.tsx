import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FirstScreen, BMIScreen, GenderScreen, AgeScreen, HeightScreen, WeightScreen, GoalScreen, FrequencyScreen, ExperienceScreen, BMICalculationLoadingScreen, BMIResultsScreen } from '../screens/App';
import { MotivationalLoadingScreen } from '../screens/settings';
import NameScreen from '../screens/App/onboarding/NameScreen';
import PaywallScreen from '../screens/PaywallScreen';
import LoserPaywallScreen from '../screens/LoserPaywallScreen';
// Profile ekranlarını onboarding için import et (sadece Environment)
import EnvironmentScreen from '../screens/profile/EnvironmentScreen';

export type AppStackParamList = {
  FirstScreen: undefined;
  NameScreen: undefined;
  BMIScreen: { bmi: string; onboardingData: any };
  PaywallScreen: {
    source?: 'onboarding' | 'settings' | 'feature_lock' | 'general';
    returnRoute?: string;
    bmiData?: { bmi: string; onboardingData: any };
  };
  LoserPaywallScreen: undefined;
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
};

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="FirstScreen"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="FirstScreen"
        component={FirstScreen}
      />
      <Stack.Screen
        name="NameScreen"
        component={NameScreen}
      />
      <Stack.Screen
        name="BMIScreen"
        component={BMIScreen}
      />
      <Stack.Screen
        name="PaywallScreen"
        component={PaywallScreen}
      />
      <Stack.Screen
        name="LoserPaywallScreen"
        component={LoserPaywallScreen}
      />
      <Stack.Screen
        name="genderScreen"
        component={GenderScreen}
      />
      <Stack.Screen
        name="Age"
        component={AgeScreen}
      />
      <Stack.Screen
        name="Height"
        component={HeightScreen}
      />
      <Stack.Screen
        name="Weight"
        component={WeightScreen}
      />
      <Stack.Screen
        name="Goal"
        component={GoalScreen}
      />
      <Stack.Screen
        name="Frequency"
        component={FrequencyScreen}
      />
      {/* Yeni onboarding ekranları - Frequency'den sonra */}
      <Stack.Screen
        name="Environment"
        component={EnvironmentScreen}
      />
      <Stack.Screen
        name="Experience"
        component={ExperienceScreen}
      />
      <Stack.Screen
        name="BMICalculationLoading"
        component={BMICalculationLoadingScreen}
      />
      <Stack.Screen
        name="BMIResultsScreen"
        component={BMIResultsScreen}
      />
      <Stack.Screen
        name="MotivationalLoadingScreen"
        component={MotivationalLoadingScreen}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator; 