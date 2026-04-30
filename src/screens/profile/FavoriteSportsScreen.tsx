import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import { NavigationProps } from '../../types/navigation';
import { SvgXml } from 'react-native-svg';
import { useToastService } from '../../services/toast';
import { storage } from '../../services/storage';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
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

type SportId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

interface FavoriteSportsScreenProps {
  navigation: NavigationProps;
}

const FavoriteSportsScreen: React.FC<FavoriteSportsScreenProps> = ({ navigation }) => {
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const [selectedSports, setSelectedSports] = useState<SportId[]>([]);
  const { showToast } = useToastService();

  const SPORTS = {
    RUNNING: { id: 1 as SportId, key: 'running', text: t('sport_running') },
    SWIMMING: { id: 2 as SportId, key: 'swimming', text: t('sport_swimming') },
    CYCLING: { id: 3 as SportId, key: 'cycling', text: t('sport_cycling') },
    YOGA: { id: 4 as SportId, key: 'yoga', text: t('sport_yoga') },
    PILATES: { id: 5 as SportId, key: 'pilates', text: t('sport_pilates') },
    BOXING: { id: 6 as SportId, key: 'boxing', text: t('sport_boxing') },
    TENNIS: { id: 7 as SportId, key: 'tennis', text: t('sport_tennis') },
    BASKETBALL: { id: 8 as SportId, key: 'basketball', text: t('sport_basketball') },
    FOOTBALL: { id: 9 as SportId, key: 'football', text: t('sport_football') },
    VOLLEYBALL: { id: 10 as SportId, key: 'volleyball', text: t('sport_volleyball') }
  };

  useEffect(() => {
    loadInitialValue();
  }, []);

  const loadInitialValue = async () => {
    try {
      const userInfo = await storage.getUserInfo();
      if (userInfo?.sports) {
        setSelectedSports(Array.isArray(userInfo.sports) ? userInfo.sports : []);
      }
    } catch (error) {
      console.error('Favori sporlar yüklenirken hata:', error);
    }
  };

  const handleSportSelect = (sportId: SportId) => {
    setSelectedSports(prev => {
      if (prev.includes(sportId)) {
        return prev.filter(id => id !== sportId);
      } else if (prev.length >= 3) {
        showToast('error', t('profile_sports_max_selection'));
        return prev;
      } else {
        return [...prev, sportId];
      }
    });
  };

  const handleSave = async () => {
    if (selectedSports.length === 0) {
      showToast('error', t('profile_sports_select_at_least_one'));
      return;
    }

    try {
      const userInfo = await storage.getUserInfo();
      if (userInfo) {
        const updatedUserInfo = {
          ...userInfo,
          sports: selectedSports,
          updated_at: new Date().toISOString()
        };
        await storage.setUserInfo(updatedUserInfo);
      }

      showToast('success', t('profile_sports_updated_success'));
      navigation.goBack();
    } catch (error) {
      console.error('Favori sporlar güncellenirken hata:', error);
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile_favorite_sports')}</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={[styles.saveButtonText, { color: colors.primary }]}>
            {t('continue_button')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <SvgXml 
            xml={targetIcon.replace(/currentColor/g, currentTheme === 'dark' ? '#FFFFFF' : '#000000')} 
            width={normalize(60)} 
            height={normalize(60)} 
          />
        </View>

        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('profile_sports_question')}
          </Text>
          <View style={styles.selectionInfoContainer}>
            <Text style={[styles.selectionInfoText, { color: colors.textSecondary }]}>
              <Text style={[styles.selectionCount, { color: colors.primary }]}>{selectedSports.length} </Text>
              {t('profile_sports_selected')}
            </Text>
          </View>
        </View>

        <View style={styles.optionsContainer}>
          {Object.values(SPORTS).map((sport) => (
            <TouchableOpacity
              key={sport.key}
              style={[
                styles.optionButton,
                { 
                  backgroundColor: selectedSports.includes(sport.id) ? '#EF4444' : (currentTheme === 'dark' ? '#2C2C2E' : colors.background),
                  borderColor: selectedSports.includes(sport.id) ? '#EF4444' : colors.cardBorder 
                },
                selectedSports.includes(sport.id) && styles.selectedButton
              ]}
              onPress={() => handleSportSelect(sport.id)}
            >
              <Text style={[
                styles.optionText,
                { color: selectedSports.includes(sport.id) ? '#FFFFFF' : colors.text }
              ]}>{sport.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Outfit',
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
  selectionInfoContainer: {
    marginTop: normalize(8),
  },
  selectionInfoText: {
    fontSize: normalize(14),
    textAlign: 'center',
    fontFamily: 'Outfit',
  },
  selectionCount: {
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(12),
    justifyContent: 'space-between',
    marginBottom: normalize(100),
  },
  optionButton: {
    width: '47%',
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

export default FavoriteSportsScreen; 