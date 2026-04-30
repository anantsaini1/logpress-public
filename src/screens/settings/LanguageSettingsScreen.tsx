import React from 'react';
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
import { useLanguage, LanguageType } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';

const backIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface Language {
  code: string;
  name: string;
  flag: string;
}

// Tüm desteklenen dilleri göster
const languages: Language[] = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
];

const LanguageSettingsScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { colors, currentTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const handleLanguageSelect = (code: string) => {
    setLanguage(code as LanguageType);
  };

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
          <Text style={[styles.headerTitle, { color: colors.headerText }]}>{t('settings_language')}</Text>
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
            <Text style={styles.infoIcon}>🌍</Text>
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, { 
              color: currentTheme === 'dark' ? colors.text : colors.buttonText 
            }]}>{t('language_settings_currently_active')}</Text>
            <Text style={[styles.infoDescription, { 
              color: currentTheme === 'dark' ? colors.textSecondary : colors.buttonText,
              opacity: currentTheme === 'dark' ? 1 : 0.9
            }]}>
              {t('language_settings_support_description')}
            </Text>
          </View>
        </View>

        <View style={styles.languageList}>
          {languages.map((languageItem) => (
            <TouchableOpacity
              key={languageItem.code}
              style={[
                styles.languageItem,
                { borderBottomColor: colors.cardBorder },
                language === languageItem.code && { backgroundColor: colors.surface }
              ]}
              onPress={() => handleLanguageSelect(languageItem.code)}
            >
              <View style={styles.languageInfo}>
                <Text style={styles.flag}>{languageItem.flag}</Text>
                <Text style={[
                  styles.languageName,
                  { color: colors.text },
                  language === languageItem.code && { color: colors.primary }
                ]}>
                  {languageItem.name}
                </Text>
              </View>
              {language === languageItem.code && (
                <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
              )}
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
  languageList: {
    paddingTop: 8,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 22,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    fontFamily: 'Outfit',
  },
  checkmark: {
    fontSize: 20,
    fontWeight: '600',
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

export default LanguageSettingsScreen; 