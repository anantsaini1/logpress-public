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
import { useToastService } from '../../services/toast';
import { storage } from '../../services/storage';
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

const frequencyIcon = `
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M26 7H22V5C22 4.45 21.55 4 21 4C20.45 4 20 4.45 20 5V7H12V5C12 4.45 11.55 4 11 4C10.45 4 10 4.45 10 5V7H6C4.9 7 4 7.9 4 9V25C4 26.1 4.9 27 6 27H26C27.1 27 28 26.1 28 25V9C28 7.9 27.1 7 26 7ZM26 25H6V11H26V25Z" fill="currentColor"/>
  <path d="M8 13H10V15H8V13Z" fill="currentColor"/>
  <path d="M12 13H14V15H12V13Z" fill="currentColor"/>
  <path d="M16 13H18V15H16V13Z" fill="currentColor"/>
  <path d="M20 13H22V15H20V13Z" fill="currentColor"/>
  <path d="M8 17H10V19H8V17Z" fill="currentColor"/>
  <path d="M12 17H14V19H12V17Z" fill="currentColor"/>
  <path d="M16 17H18V19H16V17Z" fill="currentColor"/>
  <path d="M8 21H10V23H8V21Z" fill="currentColor"/>
  <path d="M12 21H14V23H12V21Z" fill="currentColor"/>
  <path d="M16 21H18V23H16V21Z" fill="currentColor"/>
</svg>
`;

const backIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface FrequencyScreenProps {
  navigation: NavigationProps;
}

const FrequencyScreen: React.FC<FrequencyScreenProps> = ({ navigation }) => {
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const [selectedFrequency, setSelectedFrequency] = useState<string | null>(null);
  const { showToast } = useToastService();
  const [isLoading, setIsLoading] = useState(false);

  const frequencies = [
    { id: '1', key: 'frequency_1_2_times', name: t('frequency_1_2_times') },
    { id: '2', key: 'frequency_3_4_times', name: t('frequency_3_4_times') },
    { id: '3', key: 'frequency_5_6_times', name: t('frequency_5_6_times') },
    { id: '4', key: 'frequency_everyday', name: t('frequency_everyday') },
  ];

  useEffect(() => {
    loadInitialValue();
  }, []);

  const loadInitialValue = async () => {
    try {
      const userInfo = await storage.getUserInfo();
      if (userInfo?.exercise_hours) {
        setSelectedFrequency(String(userInfo.exercise_hours));
      }
    } catch (error) {
      console.error('Antrenman sıklığı yüklenirken hata:', error);
    }
  };

  const handleFrequencySelect = async (frequencyId: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setSelectedFrequency(frequencyId);

    try {
      const userInfo = await storage.getUserInfo();
      if (userInfo) {
        const updatedUserInfo = {
          ...userInfo,
          exercise_hours: frequencyId,
          updated_at: new Date().toISOString()
        };
        await storage.setUserInfo(updatedUserInfo);
      }

      showToast('success', t('profile_frequency_updated_success'));
      navigation.goBack();
    } catch (error) {
      console.error('Antrenman sıklığı güncellenirken hata:', error);
      showToast('error', t('data_save_error'));
    } finally {
      setIsLoading(false);
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile_workout_frequency')}</Text>
        <View style={styles.placeholderButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <SvgXml 
            xml={frequencyIcon.replace(/currentColor/g, currentTheme === 'dark' ? '#FFFFFF' : '#000000')} 
            width={normalize(60)} 
            height={normalize(60)} 
          />
        </View>

        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('profile_frequency_question')}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {frequencies.map((frequency) => (
            <TouchableOpacity 
              key={frequency.id}
              style={[
                styles.optionButton,
                { 
                  backgroundColor: selectedFrequency === frequency.id ? colors.primary : currentTheme === 'dark' ? '#2C2C2E' : colors.background,
                  borderColor: colors.cardBorder 
                }
              ]}
              onPress={() => handleFrequencySelect(frequency.id)}
              disabled={isLoading}
            >
              <Text style={[
                styles.optionText,
                { 
                  color: selectedFrequency === frequency.id ? '#FFFFFF' : colors.text 
                }
              ]}>{frequency.name}</Text>
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
  placeholderButton: {
    width: 40,
    height: 40,
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
});

export default FrequencyScreen; 