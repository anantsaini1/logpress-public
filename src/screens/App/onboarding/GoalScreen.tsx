import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Alert,
  Dimensions
} from 'react-native';
import { NavigationProps } from '../../../types/navigation';
import { storage } from '../../../services/storage';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useTranslation } from 'react-i18next';

// Fitness icon SVG
const fitnessIcon = `
<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M40 13.3333C26.3183 13.3333 15.2381 24.4135 15.2381 38.0952C15.2381 51.777 26.3183 62.8571 40 62.8571C53.6817 62.8571 64.7619 51.777 64.7619 38.0952C64.7619 24.4135 53.6817 13.3333 40 13.3333ZM40 57.1429C29.4683 57.1429 20.9524 48.627 20.9524 38.0952C20.9524 27.5635 29.4683 19.0476 40 19.0476C50.5317 19.0476 59.0476 27.5635 59.0476 38.0952C59.0476 48.627 50.5317 57.1429 40 57.1429Z" fill="#E11D48"/>
  <path d="M40 23.8095C32.1048 23.8095 25.7143 30.2 25.7143 38.0952C25.7143 45.9905 32.1048 52.381 40 52.381C47.8952 52.381 54.2857 45.9905 54.2857 38.0952C54.2857 30.2 47.8952 23.8095 40 23.8095ZM40 46.6667C35.2587 46.6667 31.4286 42.8365 31.4286 38.0952C31.4286 33.3539 35.2587 29.5238 40 29.5238C44.7413 29.5238 48.5714 33.3539 48.5714 38.0952C48.5714 42.8365 44.7413 46.6667 40 46.6667Z" fill="#E11D48"/>
  <path d="M40 34.2857C37.8857 34.2857 36.1905 35.981 36.1905 38.0952C36.1905 40.2095 37.8857 41.9048 40 41.9048C42.1143 41.9048 43.8095 40.2095 43.8095 38.0952C43.8095 35.981 42.1143 34.2857 40 34.2857Z" fill="#E11D48"/>
</svg>
`;

// Responsive tasarım için ekran boyutları ve oranları
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ASPECT_RATIO = SCREEN_HEIGHT / SCREEN_WIDTH;
const isTablet = ASPECT_RATIO < 1.6;

// Responsive ölçeklendirme fonksiyonu
const scale = SCREEN_WIDTH / 375;
const normalize = (size: number) => {
  const newSize = size * scale;
  return isTablet ? newSize * 0.8 : newSize;
};

interface GoalScreenProps {
  navigation: NavigationProps;
}

const GoalScreen: React.FC<GoalScreenProps> = ({ navigation }) => {
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    backButton: {
      fontSize: 24,
      fontFamily: 'Outfit',
    },
    content: {
      flex: 1,
      paddingHorizontal: normalize(20),
    },
    iconContainer: {
      alignItems: 'center',
      marginTop: normalize(20),
      marginBottom: normalize(40),
    },
    titleContainer: {
      alignItems: 'center',
      marginBottom: normalize(40),
    },
    title: {
      fontSize: normalize(28),
      fontFamily: 'Outfit',
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: normalize(8),
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: normalize(15),
      fontFamily: 'Outfit',
      textAlign: 'center',
      lineHeight: normalize(20),
    },
    optionsContainer: {
      gap: normalize(20),
      marginBottom: normalize(40),
    },
    optionButton: {
      height: normalize(60),
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.cardBorder,
      marginHorizontal: 4,
      // Buton press efekti için opacity
      transform: [{ scale: 1 }],
    },
    optionText: {
      fontSize: normalize(16),
      fontFamily: 'Outfit',
      fontWeight: '600',
      color: colors.text,
      letterSpacing: 0.2,
    },
    selectedButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      borderWidth: 2,
      transform: [{ scale: 1.02 }],
    },
    selectedOptionText: {
      fontFamily: 'Outfit',
      color: colors.buttonText,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  });

  const handleGoalSelect = async (goal: number) => {
    setSelectedGoal(goal);
    try {
      const currentData = await storage.getOnboardingData();
      
      const updatedData = {
        ...currentData,
        aim: goal,
        timestamp: new Date().toISOString()
      };

      const savedData = await storage.setOnboardingData(updatedData);
      
      if (!savedData) {
        throw new Error('Veriler kaydedilemedi');
      }

      // Kayıtlı veriyi kontrol et
      const checkSavedData = await storage.getOnboardingData();

      navigation.navigate('Frequency');
    } catch (error: any) {
      console.error('GoalScreen: Error in handleGoalSelect:', error);
      Alert.alert(
        t('error'),
        t('data_save_error'),
        [{ text: t('ok'), onPress: () => {} }]
      );
    }
      };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.text }]}>{'←'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <SvgXml xml={fitnessIcon.replace('#E11D48', colors.primary)} width={normalize(80)} height={normalize(80)} />
        </View>

        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            <Text>{t('goal_screen_title_part1')}</Text>
            <Text style={{ color: colors.primary }}>{t('goal_screen_title_part2')}</Text>
            <Text>{t('goal_screen_title_part3')}</Text>
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('goal_screen_subtitle')}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedGoal === 1 && styles.selectedButton,
            ]}
            onPress={() => handleGoalSelect(1)}
          >
            <Text style={[
              styles.optionText,
              selectedGoal === 1 && styles.selectedOptionText,
            ]}>
              {t('goal_lose_weight')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedGoal === 2 && styles.selectedButton,
            ]}
            onPress={() => handleGoalSelect(2)}
          >
            <Text style={[
              styles.optionText,
              selectedGoal === 2 && styles.selectedOptionText,
            ]}>
              {t('goal_gain_muscle')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedGoal === 3 && styles.selectedButton,
            ]}
            onPress={() => handleGoalSelect(3)}
          >
            <Text style={[
              styles.optionText,
              selectedGoal === 3 && styles.selectedOptionText,
            ]}>
              {t('goal_get_stronger')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedGoal === 4 && styles.selectedButton,
            ]}
            onPress={() => handleGoalSelect(4)}
          >
            <Text style={[
              styles.optionText,
              selectedGoal === 4 && styles.selectedOptionText,
            ]}>
              {t('goal_stay_healthy')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default GoalScreen; 