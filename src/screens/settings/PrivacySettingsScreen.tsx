import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
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

interface SettingItemProps {
  title: string;
  subtitle?: string;
  value?: string;
  hasToggle?: boolean;
  isToggled?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
}

const SettingItem = ({
  title,
  subtitle,
  value,
  hasToggle,
  isToggled,
  onToggle,
  onPress,
}: SettingItemProps) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.settingItem, { 
        backgroundColor: colors.card,
        borderBottomColor: colors.cardBorder 
      }]}
      onPress={onPress}
      disabled={!onPress && !hasToggle}
    >
      <View style={styles.settingTextContainer}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {hasToggle ? (
        <Switch
          value={isToggled}
          onValueChange={onToggle}
          trackColor={{ false: colors.cardBorder, true: colors.primary }}
          thumbColor={colors.buttonText}
        />
      ) : value ? (
        <View style={styles.valueContainer}>
          <Text style={[styles.valueText, { color: colors.textSecondary }]}>{value}</Text>
          <Text style={[styles.chevron, { color: colors.icon }]}>{'>'}</Text>
        </View>
      ) : (
        <Text style={[styles.chevron, { color: colors.icon }]}>{'>'}</Text>
      )}
    </TouchableOpacity>
  );
};

const PrivacySettingsScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    privateProfile: false,
    hideRecommended: false,
  });

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
          <Text style={[styles.headerTitle, { color: colors.headerText }]}>{t('privacy_title')}</Text>
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
            <Text style={styles.infoIcon}>🔒</Text>
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, { 
              color: currentTheme === 'dark' ? colors.text : colors.buttonText 
            }]}>{t('privacy_coming_soon')}</Text>
            <Text style={[styles.infoDescription, { 
              color: currentTheme === 'dark' ? colors.textSecondary : colors.buttonText,
              opacity: currentTheme === 'dark' ? 1 : 0.9
            }]}>
              {t('privacy_coming_soon_description')}
            </Text>
          </View>
        </View>

        <View style={[styles.section, { opacity: 0.5 }]}>
          <SettingItem
            title={t('privacy_private_profile')}
            subtitle={t('privacy_private_profile_subtitle')}
            hasToggle
            isToggled={settings.privateProfile}
            onToggle={(value) => setSettings(prev => ({ ...prev, privateProfile: value }))}
          />
          <SettingItem
            title={t('privacy_hide_recommended')}
            subtitle={t('privacy_hide_recommended_subtitle')}
            hasToggle
            isToggled={settings.hideRecommended}
            onToggle={(value) => setSettings(prev => ({ ...prev, hideRecommended: value }))}
          />
          <SettingItem
            title={t('privacy_default_workout_visibility')}
            value={t('privacy_default_workout_visibility_value')}
            subtitle={t('privacy_default_workout_visibility_subtitle')}
            onPress={() => {}}
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
  section: {
    paddingTop: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: 'Outfit',
  },
  settingSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Outfit',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 16,
    marginRight: 8,
    fontFamily: 'Outfit',
  },
  chevron: {
    fontSize: 16,
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

export default PrivacySettingsScreen; 