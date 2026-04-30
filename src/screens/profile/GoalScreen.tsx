import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { NavigationProps } from '../../types/navigation';
import { SvgXml } from 'react-native-svg';
import { storage } from '../../services/storage';
import { useToastService } from '../../services/toast';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ASPECT_RATIO = SCREEN_HEIGHT / SCREEN_WIDTH;
const isTablet = ASPECT_RATIO < 1.6;

const scale = SCREEN_WIDTH / 375;
const normalize = (size: number) => {
  const newSize = size * scale;
  return isTablet ? newSize * 0.8 : newSize;
};

const targetIcon = `
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="15" stroke="currentColor" stroke-width="2"/>
  <circle cx="16" cy="16" r="11" stroke="currentColor" stroke-width="2"/>
  <circle cx="16" cy="16" r="7" stroke="currentColor" stroke-width="2"/>
  <circle cx="16" cy="16" r="3" fill="currentColor"/>
</svg>
`;

const backIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface GoalScreenProps {
  navigation: NavigationProps;
}

const GoalScreen: React.FC<GoalScreenProps> = ({ navigation }) => {
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const { showToast } = useToastService();

  const GOALS = [
    { id: '1', key: 'lose_weight', text: t('goal_lose_weight') },
    { id: '2', key: 'stay_fit', text: t('goal_stay_fit') },
    { id: '3', key: 'build_muscle', text: t('goal_build_muscle') },
    { id: '4', key: 'feel_energetic', text: t('goal_feel_energetic') },
    { id: '5', key: 'strengthen_mind', text: t('goal_strengthen_mind') },
    { id: '6', key: 'relieve_stress', text: t('goal_relieve_stress') },
    { id: '7', key: 'increase_endurance', text: t('goal_increase_endurance') }
  ];

  useEffect(() => {
    loadInitialValue();
  }, []);

  const loadInitialValue = async () => {
    try {
      const userInfo = await storage.getUserInfo();
      if (userInfo?.aim) {
        setSelectedGoal(String(userInfo.aim));
      }
    } catch (error) {
      console.error('Hedef yüklenirken hata:', error);
    }
  };

  const handleGoalSelect = async (goalId: string) => {
    setSelectedGoal(goalId);
    
    try {
      // Storage'ı güncelle
      const currentUserInfo = await storage.getUserInfo();
      if (currentUserInfo) {
        await storage.setUserInfo({
          ...currentUserInfo,
          aim: goalId
        });
      }

      showToast('success', t('profile_goal_updated_success'));
      navigation.goBack();
    } catch (error) {
      console.error('Hedef güncellenirken hata:', error);
      showToast('error', t('data_save_error'));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme === 'dark' ? '#1C1C1E' : colors.background }]}>
      <StatusBar
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={currentTheme === 'dark' ? '#1C1C1E' : colors.background}
      />
      
      <View style={[styles.header, { 
        backgroundColor: currentTheme === 'dark' ? '#1C1C1E' : colors.background, 
        borderBottomColor: colors.cardBorder 
      }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <SvgXml 
            xml={backIcon.replace(/currentColor/g, currentTheme === 'dark' ? '#FFFFFF' : '#000000')} 
            width={24} 
            height={24} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile_goal')}</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <SvgXml 
            xml={targetIcon.replace(/currentColor/g, currentTheme === 'dark' ? '#FFFFFF' : '#000000')} 
            width={normalize(60)} 
            height={normalize(60)} 
          />
        </View>

        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('profile_goal_question')}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {GOALS.map((goal) => (
            <TouchableOpacity 
              key={goal.key}
              style={[
                styles.optionButton,
                { 
                  backgroundColor: selectedGoal === goal.id ? '#EF4444' : (currentTheme === 'dark' ? '#2C2C2E' : colors.background),
                  borderColor: selectedGoal === goal.id ? '#EF4444' : colors.cardBorder 
                },
                selectedGoal === goal.id && styles.selectedButton
              ]}
              onPress={() => handleGoalSelect(goal.id)}
            >
              <Text style={[
                styles.optionText,
                { color: selectedGoal === goal.id ? '#FFFFFF' : colors.text }
              ]}>{goal.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: normalize(20),
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: normalize(20),
    marginBottom: normalize(20),
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: normalize(32),
  },
  title: {
    fontSize: normalize(28),
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'Outfit',
  },
  optionsContainer: {
    gap: normalize(12),
  },
  optionButton: {
    height: normalize(52),
    borderRadius: normalize(12),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  optionText: {
    fontSize: normalize(16),
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'Outfit',
  },
  selectedButton: {
    borderWidth: 2,
  },
});

export default GoalScreen; 