import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  StatusBar,
  useWindowDimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProps } from '../../types/navigation';
import LottieView from 'lottie-react-native';
import { useTheme } from '../../context/ThemeContext';
import { auth, authService } from '../../services/supabase';
import { useToastService } from '../../services/toast';
import { storage } from '../../services/storage';
import { FirebaseAnalyticsService } from '../../services/firebase-analytics';
import { FakeATTService } from '../../services/fake-att';
import { useTranslation } from 'react-i18next';

const FirstScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const lottieRef = useRef<LottieView>(null);
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const { showToast } = useToastService();

  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.play();
    }
    
    // Firebase Analytics - Screen View
    FirebaseAnalyticsService.logScreenView('FirstScreen', 'FirstScreen');
    
    // ATT kontrolü - sadece daha önce seçim yapılmamışsa göster
    setTimeout(() => {
      checkAndInitializeATT();
    }, 2000);
  }, []);

  const checkAndInitializeATT = async () => {
    try {
      // Önce mevcut ATT durumunu kontrol et
      const existingATTStatus = await FakeATTService.getATTStatus();
      
      // Eğer kullanıcı daha önce seçim yapmışsa, tekrar gösterme
      if (existingATTStatus !== null) {
        console.log('🔒 ATT zaten seçilmiş:', existingATTStatus);
        return;
      }
      
      // İlk kez ise ATT dialog göster
      await initializeRealATT();
      
    } catch (error) {
      console.error('🔒 ATT kontrol hatası:', error);
    }
  };

  const initializeRealATT = async () => {
    try {
      // Direkt ATT dialog göster (kesin çalışır)
      const hasPermission = await FakeATTService.showFallbackDialog();
      
      // Analytics event
      await FirebaseAnalyticsService.logEvent('att_flow_completed', {
        permission_granted: hasPermission,
        timestamp: new Date().toISOString(),
        screen: 'FirstScreen',
        att_type: 'real_with_fallback'
      });
      
    } catch (error) {
      console.error('🔒 Real ATT: Hata:', error);
    }
  };

  // UUID oluştur ve Supabase User oluştur - Component mount edildiğinde
  useEffect(() => {
    const createUUIDAndSupabaseUser = async () => {
      try {
        // 1. Önce UUID'yi kontrol et/oluştur (local storage için)
        let userUUID: string | null = null;
        const existingUser = await storage.getUserData();
        
        if (!existingUser || !existingUser.id) {
          await storage.setUserData({ temp: true }); // UUID otomatik oluşacak
          const newUser = await storage.getUserData();
          userUUID = newUser?.id;
        } else {
          userUUID = existingUser.id;
        }

        if (!userUUID) {
          return;
        }

        // 2. Auth session'ın oluşturulup oluşturulmadığını kontrol et
        const isAuthSessionCreated = await storage.isAuthSessionCreated();
        if (isAuthSessionCreated) {
          // Mevcut Supabase session'ı kontrol et
          const hasValidSession = await authService.hasValidSupabaseSession();
          if (hasValidSession) {
            return;
          }
        }

        // 3. Gerçek Supabase user oluştur
        const authResult = await authService.createSupabaseUser(userUUID);
        
        if (authResult.success) {
          // 4. Storage'a auth session oluşturuldu bilgisini kaydet
          await storage.setAuthSessionCreated(true);
        }
        
      } catch (error) {
      }
    };
    
    createUUIDAndSupabaseUser();
  }, []);



  const handleContinue = async () => {
    // Firebase Analytics - Button Click
    await FirebaseAnalyticsService.logEvent('first_screen_continue_clicked', {
      screen: 'FirstScreen',
      timestamp: new Date().toISOString()
    });
    
    // Debug: UUID'yi kontrol et
    const currentUUID = await storage.getUserUUID();
    
    // FirstScreen'den normal onboarding akışı başlasın - GenderScreen'e git
    navigation.navigate('genderScreen');
  };





  const lottieSize = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT * 0.6);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.content}>
        <View style={[styles.imageContainer, { height: lottieSize }]}>
          <LottieView
            ref={lottieRef}
            source={require('../../assets/lotties/fs.json')}
            autoPlay
            loop
            style={[styles.lottie, { width: lottieSize, height: lottieSize }]}
            resizeMode="contain"
          />
        </View>

        <View style={styles.mainContainer}>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.primary }]}>
              {t('first_screen_title')}
            </Text>
            
            <Text style={[styles.subtitle, { color: colors.text }]}>
              {t('first_screen_subtitle')}
            </Text>

            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {t('first_screen_description')}
            </Text>

            <View style={styles.lastDescriptionContainer}>
              <Text style={[styles.lastDescription, { color: colors.textSecondary }]}>
                {t('first_screen_last_description')}
              </Text>
            </View>
          </View>

          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleContinue}
            >
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                {t('continue_button')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 10 : 20,
  },
  lottie: {
    alignSelf: 'center',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  textContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Outfit',
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    fontFamily: 'Outfit',
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 17,
    fontFamily: 'Outfit',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  lastDescriptionContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  lastDescription: {
    fontSize: 17,
    fontFamily: 'Outfit',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 16 : 24,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 17,
    fontFamily: 'Outfit',
    fontWeight: '600',
  },
});

export default FirstScreen; 