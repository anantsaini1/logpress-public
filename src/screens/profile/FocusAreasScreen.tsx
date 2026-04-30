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

type FocusAreaId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface FocusAreasScreenProps {
  navigation: NavigationProps;
}

const FocusAreasScreen: React.FC<FocusAreasScreenProps> = ({ navigation }) => {
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const [selectedAreas, setSelectedAreas] = useState<FocusAreaId[]>([]);
  const { showToast } = useToastService();

  const FOCUS_AREAS = {
    SHOULDERS: { id: 1 as FocusAreaId, key: 'shoulders', text: t('focus_shoulders') },
    CHEST: { id: 2 as FocusAreaId, key: 'chest', text: t('focus_chest') },
    BACK: { id: 3 as FocusAreaId, key: 'back', text: t('focus_back') },
    ARMS: { id: 4 as FocusAreaId, key: 'arms', text: t('focus_arms') },
    ABS: { id: 5 as FocusAreaId, key: 'abs', text: t('focus_abs') },
    LEGS: { id: 6 as FocusAreaId, key: 'legs', text: t('focus_legs') },
    GLUTES: { id: 7 as FocusAreaId, key: 'glutes', text: t('focus_glutes') },
    CARDIO: { id: 8 as FocusAreaId, key: 'cardio', text: t('focus_cardio') }
  };

  useEffect(() => {
    loadInitialValue();
  }, []);

  const loadInitialValue = async () => {
    try {
      const userInfo = await storage.getUserInfo();
      if (userInfo?.focus_areas && Array.isArray(userInfo.focus_areas)) {
        setSelectedAreas(userInfo.focus_areas);
      }
    } catch (error) {
      console.error('Odak bölgeleri yüklenirken hata:', error);
    }
  };

  const handleAreaSelect = (areaId: FocusAreaId) => {
    setSelectedAreas(prev => {
      if (prev.includes(areaId)) {
        return prev.filter(id => id !== areaId);
      } else if (prev.length >= 3) {
        showToast('error', t('profile_focus_areas_max_selection'));
        return prev;
      } else {
        return [...prev, areaId];
      }
    });
  };

  const handleSave = async () => {
    if (selectedAreas.length === 0) {
      showToast('error', t('profile_focus_areas_select_at_least_one'));
      return;
    }

    try {
      const userInfo = await storage.getUserInfo();
      if (userInfo) {
        const updatedUserInfo = {
          ...userInfo,
          focus_areas: selectedAreas,
          updated_at: new Date().toISOString()
        };
        await storage.setUserInfo(updatedUserInfo);
      }

      showToast('success', t('profile_focus_areas_updated_success'));
      navigation.goBack();
    } catch (error) {
      console.error('Odak alanları güncellenirken hata:', error);
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile_focus_areas')}</Text>
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
            {t('profile_focus_areas_question')}
          </Text>
          <View style={styles.selectionInfoContainer}>
            <Text style={[styles.selectionInfoText, { color: colors.textSecondary }]}>
              <Text style={[styles.selectionCount, { color: colors.primary }]}>{selectedAreas.length} </Text>
              {t('profile_focus_areas_selected')}
            </Text>
          </View>
        </View>

        <View style={styles.optionsContainer}>
          {Object.values(FOCUS_AREAS).map((area) => (
            <TouchableOpacity
              key={area.key}
              style={[
                styles.optionButton,
                { 
                  backgroundColor: selectedAreas.includes(area.id) ? '#EF4444' : (currentTheme === 'dark' ? '#2C2C2E' : colors.background),
                  borderColor: selectedAreas.includes(area.id) ? '#EF4444' : colors.cardBorder 
                },
                selectedAreas.includes(area.id) && styles.selectedButton
              ]}
              onPress={() => handleAreaSelect(area.id)}
            >
              <Text style={[
                styles.optionText,
                { color: selectedAreas.includes(area.id) ? '#FFFFFF' : colors.text }
              ]}>{area.text}</Text>
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

export default FocusAreasScreen; 