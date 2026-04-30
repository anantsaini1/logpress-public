import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProps } from '../../types/navigation';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';

const backIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface UnitSelectorProps {
  title: string;
  leftOptionKey: string;
  rightOptionKey: string;
  selectedOptionKey: string;
  onSelect: (option: string) => void;
}

const UnitSelector = ({
  title,
  leftOptionKey,
  rightOptionKey,
  selectedOptionKey,
  onSelect,
}: UnitSelectorProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.selectorContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.selectorTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.option,
            {
              backgroundColor: selectedOptionKey === leftOptionKey ? colors.primary : 'transparent',
              borderColor: selectedOptionKey === leftOptionKey ? colors.primary : colors.cardBorder,
            },
          ]}
          onPress={() => onSelect(leftOptionKey)}
        >
          <Text
            style={[
              styles.optionText,
              {
                color: selectedOptionKey === leftOptionKey ? colors.buttonText : colors.text,
              },
            ]}
          >
            {t(leftOptionKey)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.option,
            {
              backgroundColor: selectedOptionKey === rightOptionKey ? colors.primary : 'transparent',
              borderColor: selectedOptionKey === rightOptionKey ? colors.primary : colors.cardBorder,
            },
          ]}
          onPress={() => onSelect(rightOptionKey)}
        >
          <Text
            style={[
              styles.optionText,
              {
                color: selectedOptionKey === rightOptionKey ? colors.buttonText : colors.text,
              },
            ]}
          >
            {t(rightOptionKey)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const UnitsSettingsScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const [weightUnitKey, setWeightUnitKey] = useState('units_kg');
  const [distanceUnitKey, setDistanceUnitKey] = useState('units_km');
  const [bodyUnitKey, setBodyUnitKey] = useState('units_cm');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.headerBackground}
      />
      <View style={[styles.header, { 
        backgroundColor: colors.headerBackground,
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
        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: colors.headerText }]}>{t('units_title')}</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.infoSection, { 
          backgroundColor: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : colors.primary,
          borderWidth: currentTheme === 'dark' ? 1 : 0,
          borderColor: 'rgba(255, 255, 255, 0.2)'
        }]}>
          <View style={[styles.infoIconContainer, {
            backgroundColor: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.2)'
          }]}>
            <Text style={styles.infoIcon}>📏</Text>
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, { 
              color: currentTheme === 'dark' ? colors.text : colors.buttonText 
            }]}>{t('units_coming_soon')}</Text>
            <Text style={[styles.infoDescription, { 
              color: currentTheme === 'dark' ? colors.textSecondary : colors.buttonText,
              opacity: currentTheme === 'dark' ? 1 : 0.9
            }]}>
              {t('units_coming_soon_description')}
            </Text>
          </View>
        </View>

                 <View style={[styles.mainContent, { opacity: 0.5 }]}>
           <View style={styles.mainTitleContainer}>
             <Text style={[styles.mainTitle, { color: colors.text }]}>
               {t('units_settings_select_preferred')}
             </Text>
             <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
               {t('units_settings_used_throughout')}
             </Text>
           </View>

          <UnitSelector
            title={t('units_weight')}
            leftOptionKey="units_kg"
            rightOptionKey="units_lbs"
            selectedOptionKey={weightUnitKey}
            onSelect={setWeightUnitKey}
          />

          <UnitSelector
            title={t('units_distance')}
            leftOptionKey="units_km"
            rightOptionKey="units_miles"
            selectedOptionKey={distanceUnitKey}
            onSelect={setDistanceUnitKey}
          />

          <UnitSelector
            title={t('units_height')}
            leftOptionKey="units_cm"
            rightOptionKey="units_inch"
            selectedOptionKey={bodyUnitKey}
            onSelect={setBodyUnitKey}
          />
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
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  content: {
    flex: 1,
  },
  mainContent: {
    padding: 16,
  },
  mainTitleContainer: {
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Outfit',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Outfit',
  },
  selectorContainer: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    fontFamily: 'Outfit',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Outfit',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Outfit',
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Outfit',
  },
});

export default UnitsSettingsScreen; 