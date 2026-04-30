import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProps } from '../types/navigation';
import { storage } from '../services/storage';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';
import AIAnalysisService from '../services/ai-analysis';
import Toast from 'react-native-toast-message';

const backIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const SettingItem = ({ title, onPress, icon, showArrow, disabled }: { title: string; onPress: () => void; icon?: string; showArrow?: boolean; disabled?: boolean }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity 
      style={[
        styles.settingItem, 
        { 
          backgroundColor: colors.card, 
          borderBottomColor: colors.cardBorder,
          opacity: disabled ? 0.5 : 1 
        }
      ]} 
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
      {showArrow && <Text style={[styles.chevron, { color: colors.icon }]}>{'>'}</Text>}
    </TouchableOpacity>
  );
};

const SectionTitle = ({ title }: { title: string }) => {
  const { colors } = useTheme();
  return (
    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
  );
};

const SettingsScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const { user_role_id } = useUser();
  
  // URL bağlantıları
  const privacyPolicyUrl = 'https://github.com/hasaneyldrm/PrivacyPolicy/tree/main';
  const termsOfUseUrl = 'https://github.com/hasaneyldrm/PrivacyPolicy/tree/main';
  
  // URL'yi açmak için fonksiyon
  const openURL = useCallback(async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.error(`URL açılamıyor: ${url}`);
    }
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      t('alert_logout_title'),
      t('alert_logout_message'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('alert_logout_yes'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Local storage'ı temizle
              await storage.clear();
              
              Alert.alert(t('success'), t('alert_logout_success'));
              
              // Geri git
              navigation.goBack();
            } catch (error) {
              console.error('Çıkış yapılırken hata:', error);
              Alert.alert(t('error'), t('alert_logout_error'));
            }
          },
        },
      ],
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      t('alert_delete_title'),
      t('alert_delete_message'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('alert_delete_confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Local storage'ı temizle
              await storage.clear();
              
              Alert.alert(t('success'), t('alert_delete_success'));
              
              // Geri git
              navigation.goBack();
            } catch (error) {
              console.error('Hesap silinirken hata:', error);
              Alert.alert(t('error'), t('alert_delete_error'));
            }
          }
        },
      ]
    );
  };

  const handleTestAIAnalysis = async () => {
    // Premium kontrolü
    if (user_role_id < 1) {
      Alert.alert(
        'Premium Gerekli',
        'AI analiz özelliği sadece premium kullanıcılar için mevcut.',
        [{ text: 'Tamam' }]
      );
      return;
    }

    try {
      // Loading toast göster
      Toast.show({
        type: 'info',
        text1: 'AI Analiz Testi',
        text2: 'Test workout\'u AI\'ya gönderiliyor...',
        position: 'top',
        visibilityTime: 3000,
      });

      // User bilgilerini al
      const userData = await storage.getUserData();
      const userUUID = await storage.getUserUUID();

      if (!userData) {
        Alert.alert('Hata', 'User data bulunamadı');
        return;
      }

      // Sample workout data
      const sampleWorkoutData = {
        workout_name: 'Test Push Workout',
        duration_minutes: 45,
        exercises: [
          {
            name: 'Bench Press',
            sets: 4,
            weight: 80,
            reps: 10
          },
          {
            name: 'Shoulder Press',
            sets: 3,
            weight: 30,
            reps: 12
          },
          {
            name: 'Push-ups',
            sets: 3,
            weight: 0,
            reps: 15
          }
        ],
        total_sets: 10,
        total_volume: 2280
      };

      // User context
      const userContext = AIAnalysisService.formatUserContext(userData);

      Toast.show({
        type: 'info',
        text1: 'AI Analizi Başladı',
        text2: 'ChatGPT analiz yapıyor...',
        position: 'top',
        visibilityTime: 3000,
      });

      // Direkt OpenAI analizi yap (userId ile)
      const result = await AIAnalysisService.analyzeWorkout(sampleWorkoutData, userContext, userUUID || undefined);

      Toast.show({
        type: 'success',
        text1: 'AI Analizi Tamamlandı! 🎉',
        text2: `Genel Rating: ${result.overall_rating}/100`,
        position: 'top',
        visibilityTime: 4000,
      });

      // Sonucu göster
      Alert.alert(
        'AI Analiz Tamamlandı!',
        `Genel Rating: ${result.overall_rating}/100\nAntrenman Etkisi: ${result.workout_effectiveness}/100\n\nÖzet: ${result.summary}`,
        [{ text: 'Harika!' }]
      );

    } catch (error) {
      console.error('AI Test hatası:', error);
      Alert.alert('Hata', 'AI analiz testi başarısız oldu: ' + error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={[styles.header, { 
        backgroundColor: colors.background,
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings_title')}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <SettingItem 
            title={t('settings_notifications')} 
            onPress={() => navigation.navigate('NotificationsSettings')} 
          />
        </View>

        <View style={styles.section}>
          <SectionTitle title={t('settings_preferences')} />
          <SettingItem 
            title={t('settings_workout')} 
            onPress={() => navigation.navigate('TrainerSettings')} 
          />
          <SettingItem 
            title={t('settings_theme')} 
            onPress={() => navigation.navigate('ThemeSettings')} 
          />
          <SettingItem 
            title={t('settings_privacy_social')} 
            onPress={() => navigation.navigate('PrivacySettings')} 
          />
          <SettingItem 
            title={t('settings_units')} 
            onPress={() => navigation.navigate('UnitsSettings')} 
          />
          <SettingItem 
            title={t('settings_language')} 
            onPress={() => navigation.navigate('LanguageSettings')} 
          />
          <SettingItem 
            title={t('settings_referral_code')} 
            onPress={() => navigation.navigate('ReferralCode')} 
          />
        </View>

        <View style={styles.section}>
          <SectionTitle title={t('settings_other')} />
          <SettingItem 
            title={t('settings_support')} 
            onPress={() => openURL('https://logpress.featurebase.app/dashboard/posts')} 
          />
          <SettingItem 
            title={t('settings_about')} 
            onPress={() => navigation.navigate('About')} 
          />
        </View>
        
        <View style={styles.section}>
          <SectionTitle title={t('settings_legal')} />
          <SettingItem 
            title={t('settings_privacy_policy')} 
            onPress={() => openURL(privacyPolicyUrl)} 
          />
          <SettingItem 
            title={t('settings_terms_of_use')} 
            onPress={() => openURL(termsOfUseUrl)} 
          />
        </View>
        
        <View style={styles.section}>
          <SettingItem
            title={t('settings_logout')}
            onPress={handleLogout}
            showArrow={false}
          />
          <SettingItem
            title={t('settings_delete_account')}
            onPress={handleDeleteAccount}
            showArrow={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 8,
    marginTop: 8,
    fontFamily: 'Outfit',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Outfit',
  },
  chevron: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'Outfit',
  },
});

export default SettingsScreen; 