import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { NavigationProps } from '../../types/navigation';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { useRoute } from '@react-navigation/native';
import { backArrowThinIcon } from '../../assets/icons';
import { useTranslation } from 'react-i18next';
import { storage } from '../../services/storage';

// Environment icon SVG (kırmızıya boyalı)
const environmentIcon = `
<svg width="80" height="80" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 20C4 14.5 8.5 10 14 10H18C23.5 10 28 14.5 28 20V24C28 25.1 27.1 26 26 26H6C4.9 26 4 25.1 4 24V20Z" stroke="#E11D48" stroke-width="2" fill="none"/>
  <path d="M10 6C10 4.9 10.9 4 12 4H20C21.1 4 22 4.9 22 6V10H10V6Z" stroke="#E11D48" stroke-width="2" fill="none"/>
  <circle cx="14" cy="16" r="2" fill="#E11D48"/>
  <circle cx="18" cy="16" r="2" fill="#E11D48"/>
  <path d="M8 28L24 28" stroke="#E11D48" stroke-width="2" stroke-linecap="round"/>
</svg>
`;

// Responsive tasarım için ekran boyutları ve oranları
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ASPECT_RATIO = SCREEN_HEIGHT / SCREEN_WIDTH;
const isTablet = ASPECT_RATIO < 1.6;
const scale = SCREEN_WIDTH / 375;
const normalize = (size: number) => {
  const newSize = size * scale;
  return isTablet ? newSize * 0.8 : newSize;
};

interface EnvironmentScreenProps {
  navigation: NavigationProps;
}

const EnvironmentScreen: React.FC<EnvironmentScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute();
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sadece onboarding header ve onboarding style kullanılacak
  const environments = [
    { id: '1', key: 'environment_gym', name: t('environment_gym') },
    { id: '2', key: 'environment_home', name: t('environment_home') },
    { id: '3', key: 'environment_outdoor', name: t('environment_outdoor') },
  ];

  const handleEnvironmentSelect = async (environment: string) => {
    setSelectedEnvironment(environment);
    try {
      const currentData = await storage.getUserData();
      const updatedData = {
        ...currentData,
        environment: environment,
        updated_at: new Date().toISOString()
      };
      const savedData = await storage.updateUserData({ environment: environment });
      if (!savedData) {
        throw new Error(t('data_save_error'));
      }
      navigation.navigate('NameScreen');
    } catch (error: any) {
      Alert.alert(
        t('error'),
        error.message || t('data_save_error'),
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
          <SvgXml xml={environmentIcon.replace('#E11D48', colors.primary)} width={normalize(80)} height={normalize(80)} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}> 
            <Text>{t('environment_onboarding_title_part1')}</Text>
            <Text style={{ color: colors.primary }}>{t('environment_onboarding_title_part2')}</Text>
            <Text>{t('environment_onboarding_title_part3')}</Text>
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}> 
            {t('environment_onboarding_subtitle')}
          </Text>
        </View>
        <View style={styles.optionsContainer}>
          {environments.map((environment) => (
            <TouchableOpacity
              key={environment.id}
              style={[
                styles.optionButton,
                selectedEnvironment === environment.id && styles.selectedButton,
              ]}
              onPress={() => handleEnvironmentSelect(environment.id)}
              disabled={isLoading}
            >
              <Text style={[
                styles.optionText,
                selectedEnvironment === environment.id && styles.selectedOptionText,
              ]}>{environment.name}</Text>
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
    paddingHorizontal: 20,
    paddingTop: 10,
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
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ececec',
    marginHorizontal: 4,
    transform: [{ scale: 1 }],
  },
  optionText: {
    fontSize: normalize(16),
    fontFamily: 'Outfit',
    fontWeight: '600',
    color: '#111',
    letterSpacing: 0.2,
  },
  selectedButton: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default EnvironmentScreen; 