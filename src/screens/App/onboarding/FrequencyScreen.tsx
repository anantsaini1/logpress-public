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
import { backArrowThinIcon } from '../../../assets/icons';
import { useTranslation } from 'react-i18next';

// Frequency/Schedule icon SVG
const frequencyIcon = `
<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M60 16H52V12C52 10.9 51.1 10 50 10C48.9 10 48 10.9 48 12V16H32V12C32 10.9 31.1 10 30 10C28.9 10 28 10.9 28 12V16H20C16.7 16 14 18.7 14 22V62C14 65.3 16.7 68 20 68H60C63.3 68 66 65.3 66 62V22C66 18.7 63.3 16 60 16ZM62 62C62 63.1 61.1 64 60 64H20C18.9 64 18 63.1 18 62V28H62V62Z" fill="#E11D48"/>
  <path d="M24 34H30V40H24V34Z" fill="#E11D48"/>
  <path d="M34 34H40V40H34V34Z" fill="#E11D48"/>
  <path d="M44 34H50V40H44V34Z" fill="#E11D48"/>
  <path d="M54 34H60V40H54V34Z" fill="#E11D48"/>
  <path d="M24 44H30V50H24V44Z" fill="#E11D48"/>
  <path d="M34 44H40V50H34V44Z" fill="#E11D48"/>
  <path d="M44 44H50V50H44V44Z" fill="#E11D48"/>
  <path d="M24 54H30V60H24V54Z" fill="#E11D48"/>
  <path d="M34 54H40V60H34V54Z" fill="#E11D48"/>
  <path d="M44 54H50V60H44V54Z" fill="#E11D48"/>
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

interface FrequencyScreenProps {
  navigation: NavigationProps;
}

const FrequencyScreen: React.FC<FrequencyScreenProps> = ({ navigation }) => {
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const [selectedFrequency, setSelectedFrequency] = useState<number | null>(null);

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

  const handleFrequencySelect = async (frequency: number) => {
    setSelectedFrequency(frequency);
    try {
      const currentData = await storage.getOnboardingData();
      
      const updatedData = {
        ...currentData,
        exercise_hours: frequency,
        timestamp: new Date().toISOString()
      };

      const savedData = await storage.setOnboardingData(updatedData);
      
      if (!savedData) {
        throw new Error('Veriler kaydedilemedi');
      }

      // Kayıtlı veriyi kontrol et
      const checkSavedData = await storage.getOnboardingData();

      navigation.navigate('Environment');
    } catch (error: any) {
      console.error('FrequencyScreen: Error in handleFrequencySelect:', error);
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
          <SvgXml
            xml={backArrowThinIcon.replace(/currentColor/g, colors.text)}
            width={24}
            height={24}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <SvgXml xml={frequencyIcon.replace('#E11D48', colors.primary)} width={normalize(80)} height={normalize(80)} />
        </View>

        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            <Text>{t('frequency_screen_title_part1')}</Text>
            <Text style={{ color: colors.primary }}>{t('frequency_screen_title_part2')}</Text>
            <Text>{t('frequency_screen_title_part3')}</Text>
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('frequency_screen_subtitle')}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedFrequency === 1 && styles.selectedButton,
            ]}
            onPress={() => handleFrequencySelect(1)}
          >
            <Text style={[
              styles.optionText,
              selectedFrequency === 1 && styles.selectedOptionText,
            ]}>
              {t('frequency_1_2_times')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedFrequency === 2 && styles.selectedButton,
            ]}
            onPress={() => handleFrequencySelect(2)}
          >
            <Text style={[
              styles.optionText,
              selectedFrequency === 2 && styles.selectedOptionText,
            ]}>
              {t('frequency_3_4_times')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedFrequency === 3 && styles.selectedButton,
            ]}
            onPress={() => handleFrequencySelect(3)}
          >
            <Text style={[
              styles.optionText,
              selectedFrequency === 3 && styles.selectedOptionText,
            ]}>
              {t('frequency_5_6_times')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedFrequency === 4 && styles.selectedButton,
            ]}
            onPress={() => handleFrequencySelect(4)}
          >
            <Text style={[
              styles.optionText,
              selectedFrequency === 4 && styles.selectedOptionText,
            ]}>
              {t('frequency_everyday')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default FrequencyScreen; 