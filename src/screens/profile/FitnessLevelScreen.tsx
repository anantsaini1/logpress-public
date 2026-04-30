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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ASPECT_RATIO = SCREEN_HEIGHT / SCREEN_WIDTH;
const isTablet = ASPECT_RATIO < 1.6;

const scale = SCREEN_WIDTH / 375;
const normalize = (size: number) => {
  const newSize = size * scale;
  return isTablet ? newSize * 0.8 : newSize;
};

interface FitnessLevelScreenProps {
  navigation: NavigationProps;
}

const FitnessLevelScreen: React.FC<FitnessLevelScreenProps> = ({ navigation }) => {
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const { showToast } = useToastService();
  const [isLoading, setIsLoading] = useState(false);

  const levels = [
    { id: '1', key: 'beginner', name: t('experience_beginner') },
    { id: '2', key: 'intermediate', name: t('experience_intermediate') },
    { id: '3', key: 'advanced', name: t('experience_advanced') },
    { id: '4', key: 'professional', name: t('experience_professional') },
  ];

  useEffect(() => {
    loadInitialValue();
  }, []);

  const loadInitialValue = async () => {
    try {
      const userInfo = await storage.getUserInfo();
      if (userInfo?.experience) {
        setSelectedLevel(String(userInfo.experience));
      }
    } catch (error) {
      console.error('Form seviyesi yüklenirken hata:', error);
    }
  };

  const handleLevelSelect = async (levelId: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setSelectedLevel(levelId);

    try {
      const userInfo = await storage.getUserInfo();
      if (userInfo) {
        const updatedUserInfo = {
          ...userInfo,
          experience: levelId,
          updated_at: new Date().toISOString()
        };
        await storage.setUserInfo(updatedUserInfo);
      }

      showToast('success', t('profile_fitness_level_updated_success'));
      navigation.goBack();
    } catch (error) {
      console.error('Form seviyesi güncellenirken hata:', error);
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile_fitness_level')}</Text>
        <View style={styles.placeholderButton} />
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
            {t('profile_fitness_level_question')}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {levels.map((level) => (
            <TouchableOpacity 
              key={level.id}
              style={[
                styles.optionButton,
                { 
                  backgroundColor: selectedLevel === level.id ? colors.primary : currentTheme === 'dark' ? '#2C2C2E' : colors.background,
                  borderColor: colors.cardBorder 
                }
              ]}
              onPress={() => handleLevelSelect(level.id)}
            >
              <Text style={[
                styles.optionText,
                { 
                  color: selectedLevel === level.id ? '#FFFFFF' : colors.text 
                }
              ]}>{level.name}</Text>
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

export default FitnessLevelScreen; 