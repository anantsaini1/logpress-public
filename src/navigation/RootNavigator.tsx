import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import AppNavigator from './AppNavigator';
import TabNavigator from './TabNavigator';
import PaywallScreen from '../screens/PaywallScreen';
import LoserPaywallScreen from '../screens/LoserPaywallScreen';
import { BMIScreen } from '../screens/App';
import { storage } from '../services/storage';
import { useTheme } from '../context/ThemeContext';

export type RootStackParamList = {
  App: undefined;
  Main: undefined;
  BMIScreen: { bmi: string; onboardingData: any };
  PaywallScreen: {
    source?: 'onboarding' | 'settings' | 'feature_lock' | 'general';
    returnRoute?: string;
    bmiData?: { bmi: string; onboardingData: any };
  };
  LoserPaywallScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        // Timeout ile storage okumayı sınırla (bazı cihazlarda sonsuz beklemesini önle)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Storage timeout')), 3000)
        );

        const storagePromise = storage.hasSeenOnboarding();

        const hasCompleted = await Promise.race([storagePromise, timeoutPromise])
          .catch((error) => {
            // Hata durumunda güvenli default: onboarding göster
            return false;
          });

        setHasSeenOnboarding(hasCompleted as boolean);
      } catch (error) {
        // Hata durumunda onboarding'i göster (güvenli fallback)
        setHasSeenOnboarding(false);
      } finally {
        // Maksimum loading süresi: 3.5 saniye
        setTimeout(() => {
          setIsLoading(false);
        }, 500); // Storage işleminin tamamlanması için kısa bekle
      }
    };

    checkOnboardingStatus();
  }, []);

  // Loading durumunda minimal loading screen
  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const initialRouteName = hasSeenOnboarding ? 'Main' : 'App';

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="App"
        component={AppNavigator}
      />
      <Stack.Screen
        name="Main"
        component={TabNavigator}
      />
      <Stack.Screen
        name="BMIScreen"
        component={BMIScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="PaywallScreen"
        component={PaywallScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="LoserPaywallScreen"
        component={LoserPaywallScreen}
        options={{
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator; 