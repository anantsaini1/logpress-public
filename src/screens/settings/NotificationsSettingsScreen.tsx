import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
  Linking,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProps } from '../../types/navigation';
import { useTheme } from '../../context/ThemeContext';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

const backIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface NotificationSettingProps {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const NotificationSetting = ({ title, subtitle, value, onValueChange }: NotificationSettingProps) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.settingItem, { borderBottomColor: colors.cardBorder }]}>
      <View style={styles.settingTextContainer}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.cardBorder, true: colors.primary }}
        thumbColor={'#FFF'}
      />
    </View>
  );
};

const NotificationsSettingsScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState({
    followers: true,
    workoutLikes: true,
    workoutComments: true,
    commentMentions: true,
    workoutDiscussions: true,
    emailSubscription: false,
    monthlyReport: false,
    restTimer: true,
  });

  const handlePhoneSettings = () => {
    Linking.openSettings();
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
        <Text style={[styles.headerTitle, { color: colors.headerText }]}>{t('notifications_title')}</Text>
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
            <Text style={styles.infoIcon}>🔔</Text>
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, { 
              color: currentTheme === 'dark' ? colors.text : colors.buttonText 
            }]}>{t('notifications_coming_soon')}</Text>
            <Text style={[styles.infoDescription, { 
              color: currentTheme === 'dark' ? colors.textSecondary : colors.buttonText,
              opacity: currentTheme === 'dark' ? 1 : 0.9
            }]}>
              {t('notifications_coming_soon_description')}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <NotificationSetting
            title={t('notifications_settings_followers')}
            value={notifications.followers}
            onValueChange={(value) => setNotifications(prev => ({ ...prev, followers: value }))}
          />

          <NotificationSetting
            title={t('notifications_settings_workout_likes')}
            value={notifications.workoutLikes}
            onValueChange={(value) => setNotifications(prev => ({ ...prev, workoutLikes: value }))}
          />

          <NotificationSetting
            title={t('notifications_settings_workout_comments')}
            value={notifications.workoutComments}
            onValueChange={(value) => setNotifications(prev => ({ ...prev, workoutComments: value }))}
          />

          <NotificationSetting
            title={t('notifications_settings_comment_mentions')}
            subtitle={t('notifications_settings_comment_mentions_subtitle')}
            value={notifications.commentMentions}
            onValueChange={(value) => setNotifications(prev => ({ ...prev, commentMentions: value }))}
          />

          <NotificationSetting
            title={t('notifications_settings_workout_discussions')}
            subtitle={t('notifications_settings_workout_discussions_subtitle')}
            value={notifications.workoutDiscussions}
            onValueChange={(value) => setNotifications(prev => ({ ...prev, workoutDiscussions: value }))}
          />

          <NotificationSetting
            title={t('notifications_settings_email_subscription')}
            subtitle={t('notifications_settings_email_subscription_subtitle')}
            value={notifications.emailSubscription}
            onValueChange={(value) => setNotifications(prev => ({ ...prev, emailSubscription: value }))}
          />

          <NotificationSetting
            title={t('notifications_settings_monthly_report')}
            subtitle={t('notifications_settings_monthly_report_subtitle')}
            value={notifications.monthlyReport}
            onValueChange={(value) => setNotifications(prev => ({ ...prev, monthlyReport: value }))}
          />

          <NotificationSetting
            title={t('notifications_settings_rest_timer')}
            value={notifications.restTimer}
            onValueChange={(value) => setNotifications(prev => ({ ...prev, restTimer: value }))}
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
    marginLeft: 12,
    fontFamily: 'Outfit',
  },
  content: {
    flex: 1,
  },
  warningContainer: {
    padding: 16,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    textDecorationLine: 'underline',
  },
  section: {
    paddingHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
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

export default NotificationsSettingsScreen; 