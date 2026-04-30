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
  value?: string;
  subtitle?: string;
  isPro?: boolean;
  hasToggle?: boolean;
  isToggled?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  disabled?: boolean;
}

const SettingItem = ({
  title,
  value,
  subtitle,
  isPro,
  hasToggle,
  isToggled,
  onToggle,
  onPress,
  disabled,
}: SettingItemProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={[styles.settingItem, { 
        borderBottomColor: colors.cardBorder,
        backgroundColor: colors.card 
      }]}
      onPress={onPress}
      disabled={!onPress && !hasToggle || disabled}
    >
      <View style={styles.settingTextContainer}>
        <View style={styles.settingTitleContainer}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
          {isPro && (
            <View style={[styles.proTag, { backgroundColor: colors.primary }]}>
              <Text style={[styles.proTagText, { color: colors.buttonText }]}>{t('trainer_settings_pro_tag')}</Text>
            </View>
          )}
        </View>
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

const TrainerSettingsScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    keepScreenOn: false,
    plateMath: true,
    rpeTracking: false,
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
          <Text style={[styles.headerTitle, { color: colors.headerText }]}>{t('trainer_title')}</Text>
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
            <Text style={styles.infoIcon}>🚀</Text>
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, { 
              color: currentTheme === 'dark' ? colors.text : colors.buttonText 
            }]}>{t('trainer_coming_soon')}</Text>
            <Text style={[styles.infoDescription, { 
              color: currentTheme === 'dark' ? colors.textSecondary : colors.buttonText,
              opacity: currentTheme === 'dark' ? 1 : 0.9
            }]}>
              {t('trainer_coming_soon_description')}
            </Text>
          </View>
        </View>

        <View style={[styles.section, { opacity: 0.5 }]}>
          <SettingItem
            title={t('trainer_settings_timer_sound')}
            value={t('trainer_settings_timer_sound_default')}
            onPress={() => {}}
            disabled={true}
          />
          <SettingItem
            title={t('trainer_settings_timer_sound')}
            value={t('trainer_settings_timer_sound_high')}
            onPress={() => {}}
            disabled={true}
          />
          <SettingItem
            title={t('trainer_settings_default_rest_timer')}
            value={t('trainer_settings_rest_timer_off')}
            onPress={() => {}}
            disabled={true}
          />
          <SettingItem
            title={t('trainer_settings_first_day_of_week')}
            value={t('trainer_settings_first_day_monday')}
            onPress={() => {}}
            disabled={true}
          />
          <SettingItem
            title={t('trainer_settings_previous_workout_values')}
            value={t('trainer_settings_timer_sound_default')}
            onPress={() => {}}
            disabled={true}
          />
          <SettingItem
            title={t('trainer_settings_warmup_calculator')}
            isPro={true}
            onPress={() => {}}
            disabled={true}
          />
          <SettingItem
            title={t('trainer_settings_keep_screen_on')}
            subtitle={t('trainer_settings_keep_screen_on_subtitle')}
            hasToggle
            isToggled={settings.keepScreenOn}
            onToggle={(value) => setSettings(prev => ({ ...prev, keepScreenOn: value }))}
          />
          <SettingItem
            title={t('trainer_settings_plate_calculator')}
            subtitle={t('trainer_settings_plate_calculator_subtitle')}
            hasToggle
            isToggled={settings.plateMath}
            onToggle={(value) => setSettings(prev => ({ ...prev, plateMath: value }))}
          />
          <SettingItem
            title={t('trainer_settings_rpe_tracking')}
            subtitle={t('trainer_settings_rpe_tracking_subtitle')}
            hasToggle
            isToggled={settings.rpeTracking}
            onToggle={(value) => setSettings(prev => ({ ...prev, rpeTracking: value }))}
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
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
  settingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Outfit',
  },
  proTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  proTagText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  settingSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
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
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Outfit',
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
    fontFamily: 'Outfit',
  },
});

export default TrainerSettingsScreen; 