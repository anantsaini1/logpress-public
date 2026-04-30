import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Image
} from 'react-native';
import { CustomText as Text } from '../../components/common';
import { NavigationProps } from '../../types/navigation';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { storage } from '../../services/storage';
// import { supabase } from '../../services/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useUser } from '../../context/UserContext';
import LottieView from 'lottie-react-native';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// BMI target icon - özel animasyon görünümü için
const targetIcon = `
<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="3"/>
  <circle cx="32" cy="32" r="22" stroke="currentColor" stroke-width="3"/>
  <circle cx="32" cy="32" r="14" stroke="currentColor" stroke-width="3"/>
  <circle cx="32" cy="32" r="6" fill="currentColor"/>
</svg>
`;

// BMI chart icon
const chartIcon = `
<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="8" y="8" width="48" height="48" rx="4" stroke="currentColor" stroke-width="3"/>
  <path d="M16 42L24 34L32 38L40 26L48 20" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="16" cy="42" r="4" fill="currentColor"/>
  <circle cx="24" cy="34" r="4" fill="currentColor"/>
  <circle cx="32" cy="38" r="4" fill="currentColor"/>
  <circle cx="40" cy="26" r="4" fill="currentColor"/>
  <circle cx="48" cy="20" r="4" fill="currentColor"/>
</svg>
`;

interface BMIScreenProps {
  navigation: NavigationProps;
  route: RouteProp<RootStackParamList, 'BMIScreen'>;
}

const getBMICategory = (bmi: number, t: (key: string) => string) => {
  if (bmi < 16) return { category: t('bmi_category_severe_underweight'), color: '#E74C3C' };
  if (bmi >= 16 && bmi < 17) return { category: t('bmi_category_moderate_underweight'), color: '#E67E22' };
  if (bmi >= 17 && bmi < 18.5) return { category: t('bmi_category_mild_underweight'), color: '#F39C12' };
  if (bmi >= 18.5 && bmi < 25) return { category: t('bmi_category_healthy_weight'), color: '#2ECC71' };
  if (bmi >= 25 && bmi < 30) return { category: t('bmi_category_overweight'), color: '#F39C12' };
  if (bmi >= 30 && bmi < 35) return { category: t('bmi_category_obesity_class_1'), color: '#E67E22' };
  if (bmi >= 35 && bmi < 40) return { category: t('bmi_category_obesity_class_2'), color: '#E74C3C' };
  return { category: t('bmi_category_obesity_class_3'), color: '#C0392B' };
};

const BMIScreen: React.FC<BMIScreenProps> = ({ navigation, route }) => {
  const { bmi, onboardingData, onComplete } = route.params as any;
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // const { setIsRegistered } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [animationReady, setAnimationReady] = useState(false);
  const [trophyAnimationVisible, setTrophyAnimationVisible] = useState(false);
  const trophyRef = useRef<View>(null);
  
  const bmiValue = parseFloat(bmi);
  const bmiInfo = getBMICategory(bmiValue, t);

  const handleScroll = useCallback((event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const screenHeight = Dimensions.get('window').height;
    
    // Trophy bölümüne gelince animasyonu başlat
    if (!trophyAnimationVisible && scrollY + screenHeight > 800) { // Trophy bölümünün yaklaşık konumu
      setTrophyAnimationVisible(true);
    }
  }, [trophyAnimationVisible]);

  // Animasyon efektleri
  useEffect(() => {
    // Animasyonun yüklenmesi için timer
    const animTimer = setTimeout(() => {
      setAnimationReady(true);
    }, 200);

    return () => {
      clearTimeout(animTimer);
    };
  }, []);

  const handleContinue = async () => {
    setIsLoading(true);
    
    try {
      // onComplete callback varsa (modal modunda) onu çağır
      if (onComplete) {
        onComplete();
      } 
      // Referral code'dan gelidiyse (modal modunda) sadece kapat
      else if (onboardingData?.referralCodeUsed) {
        navigation.goBack();
      } else {
        // Normal onboarding'den gelen kullanıcıyı ana uygulamaya yönlendir
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' as never }],
        });
      }
      
    } catch (error) {
      console.error('BMIScreen: Navigasyon hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) }
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.content}>
          {/* Success Animation (Konfeti) - EN ÜSTTE */}
          <View style={styles.successAnimationContainer}>
            {!animationReady ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <LottieView
                source={require('../../assets/lotties/success.json')} 
                autoPlay
                loop={false}
                style={styles.successLottieAnimation}
              />
            )}
          </View>

          {/* Success Message */}
          <View style={styles.successMessageContainer}>
            <Text style={[styles.successTitle, { color: colors.primary }]}>
               {t('bmi_screen_premium_activated')}
            </Text>
          </View>

          {/* What's Next Section */}
          <View style={styles.whatsNextSection}>
            <Text style={[styles.whatsNextMainTitle, { color: colors.text }]}>
              {t('bmi_screen_whats_next')}
            </Text>
            
            <View style={styles.whatsNextContent}>
              <Text style={[styles.whatsNextMainDescription, { color: colors.textSecondary }]}>
                {t('bmi_screen_whats_next_description')}
              </Text>
            </View>
          </View>

          {/* BMI Animation */}
          <View style={styles.animationContainer}>
            {!animationReady ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <LottieView
                source={require('../../assets/lotties/bmi.json')} 
                autoPlay
                loop
                style={styles.lottieAnimation}
              />
            )}
          </View>

          <Text style={[styles.infoNote, { color: colors.textSecondary }]}>
            {t('bmi_screen_trust_info')}
          </Text>

          <Text style={[styles.title, { color: colors.text }]}>
            {t('bmi_screen_your_bmi')}
          </Text>
          
          <View style={styles.bmiValueContainer}>
            <Text style={[styles.bmiValue, { color: bmiInfo.color }]}>
              {bmiValue.toFixed(1)}
            </Text>
            <Text style={[styles.bmiUnit, { color: colors.textSecondary }]}>{t('bmi_screen_unit')}</Text>
          </View>
          
          <View style={[styles.categoryContainer, { backgroundColor: bmiInfo.color + '20' }]}>
            <Text style={[styles.categoryText, { color: bmiInfo.color }]}>
              {bmiInfo.category}
            </Text>
          </View>
          
          <View style={styles.descriptionContainer}>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
             {t('bmi_screen_description')}
            </Text>
          </View>
          
          <View style={styles.scaleContainer}>
            <View style={styles.scaleBar}>
              <View style={[styles.scaleSegment, { backgroundColor: '#E74C3C' }]} />
              <View style={[styles.scaleSegment, { backgroundColor: '#E67E22' }]} />
              <View style={[styles.scaleSegment, { backgroundColor: '#F39C12' }]} />
              <View style={[styles.scaleSegment, { backgroundColor: '#2ECC71' }]} />
              <View style={[styles.scaleSegment, { backgroundColor: '#F39C12' }]} />
              <View style={[styles.scaleSegment, { backgroundColor: '#E67E22' }]} />
              <View style={[styles.scaleSegment, { backgroundColor: '#E74C3C' }]} />
              <View style={[styles.scaleSegment, { backgroundColor: '#C0392B' }]} />
            </View>
            
            <View style={styles.scaleLabelsContainer}>
              <Text style={[styles.scaleLabel, { color: colors.textSecondary }]}>16</Text>
              <Text style={[styles.scaleLabel, { color: colors.textSecondary }]}>18.5</Text>
              <Text style={[styles.scaleLabel, { color: colors.textSecondary }]}>25</Text>
              <Text style={[styles.scaleLabel, { color: colors.textSecondary }]}>30</Text>
              <Text style={[styles.scaleLabel, { color: colors.textSecondary }]}>40</Text>
            </View>
            
            {/* BMI göstergesi */}
            <View style={[
              styles.indicatorContainer, 
              { 
                left: `${Math.min(100, Math.max(0, (bmiValue - 16) / (40 - 16) * 100))}%`,
              }
            ]}>
              <View style={[styles.indicator, { backgroundColor: bmiInfo.color }]} />
            </View>
          </View>
        </View>

        {/* AI Score Info - EN AŞAĞIDA */}
        <View style={styles.aiScoreInfoSection}>
          {/* Trophy Animation */}
          <View style={styles.trophyAnimationContainer}>
            {!animationReady ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <LottieView
                source={require('../../assets/lotties/monkey2.json')} 
                autoPlay
                loop={false}
                speed={0.7}
                style={styles.trophyLottieAnimation}
              />
            )}
          </View>

                    <Text style={[styles.aiScoreInfoTitle, { color: colors.text }]}>
            {t('bmi_screen_score_title')}
          </Text>
          
          <View style={styles.aiScoreInfoContent}>
            <Text style={[styles.aiScoreInfoDescription, { color: colors.textSecondary }]}>
              {t('bmi_screen_score_description')}
            </Text>
          </View>
          </View>

          {/* Leaderboard Info Section */}
          <View style={styles.leaderboardInfoSection} ref={trophyRef}>
            {/* Trophy Animation */}
            <View style={styles.leaderboardAnimationContainer}>
              {!animationReady ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <LottieView
                  source={require('../../assets/lotties/trophy.json')} 
                  autoPlay={trophyAnimationVisible}
                  loop={false}
                  speed={0.4}
                  style={styles.leaderboardLottieAnimation}
                />
              )}
            </View>

            <Text style={[styles.leaderboardInfoTitle, { color: colors.text }]}>
              {t('bmi_screen_leaderboard_title')}
            </Text>

            <View style={styles.leaderboardInfoContent}>
              <Text style={[styles.leaderboardInfoDescription, { color: colors.textSecondary }]}>
               {t('bmi_screen_leaderboard_description')}
              </Text>
            </View>
          </View>
        
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: colors.primary },
            isLoading && { opacity: 0.7 }
          ]}
          onPress={handleContinue}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.buttonText} />
          ) : (
            <Text style={[styles.continueButtonText, { color: colors.buttonText }]}>
              {t('continue_button')}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  animationContainer: {
    width: 200,
    height: 200,
    marginTop: 8,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
    marginBottom: 24,
  },
  bmiValueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bmiValue: {
    fontSize: 42,
    fontWeight: '900',
    fontFamily: 'Outfit-Bold',
    lineHeight: 50,
  },
  bmiUnit: {
    fontSize: 20,
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
    marginBottom: 8,
    marginLeft: 4,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  categoryText: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
  },
  descriptionContainer: {
    marginTop: 32,
    marginBottom: 32,
  },
  description: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'Outfit-Regular',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  scaleContainer: {
    width: '100%',
    marginBottom: 40,
    position: 'relative',
  },
  scaleBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scaleSegment: {
    flex: 1,
    height: '100%',
  },
  scaleLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 0,
  },
  scaleLabel: {
    fontSize: 12,
  },
  indicatorContainer: {
    position: 'absolute',
    top: -6,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -10 }],
  },
  indicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    gap: 8,
  },
  processingText: {
    fontSize: 14,
  },
  continueButton: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 20,
    height: 56,
  },
  continueButtonText: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Outfit-SemiBold',
  },
  // Success Animation Styles
  successAnimationContainer: {
    width: 200,
    height: 200,
    marginTop: 16,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successLottieAnimation: {
    width: '100%',
    height: '100%',
  },
  successMessageContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  successDescription: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  // What's Next Styles - BMI tasarım diliyle tutarlı
  whatsNextSection: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  whatsNextMainTitle: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  whatsNextContent: {
    alignItems: 'center',
    marginBottom: 8,
  },
  whatsNextMainDescription: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'Outfit-Regular',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  // Eski stiller - geriye dönük uyumluluk için
  whatsNextContainer: {
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.02)',
    paddingVertical: 20,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  whatsNextTitle: {
    fontSize: 28,
    fontWeight: '600',
    fontFamily: 'Outfit-Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  whatsNextDescription: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 12,
  },
  // Info Note Style
  infoNote: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Outfit-Regular',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    opacity: 0.7,
  },
  // AI Score Info Styles - BMI tasarım diliyle tutarlı
  aiScoreInfoSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    width: '100%',
  },
  // Trophy Animation Styles
  trophyAnimationContainer: {
    width: 280,
    height: 280,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trophyLottieAnimation: {
    width: '100%',
    height: '100%',
  },
  aiScoreInfoTitle: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 34,
  },
  aiScoreInfoContent: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  aiScoreInfoDescription: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'Outfit-Regular',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  // Leaderboard Info Styles
  leaderboardInfoSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
    width: '100%',
  },
  leaderboardAnimationContainer: {
    width: 280,
    height: 280,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderboardInfoTitle: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 34,
  },
  leaderboardLottieAnimation: {
    width: '100%',
    height: '100%',
  },
  leaderboardInfoContent: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  leaderboardInfoDescription: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'Outfit-Regular',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  // Eski stiller - geriye dönük uyumluluk için
  aiScoreInfoContainer: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 16,
  },
  aiScoreInfoText: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Outfit-Medium',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default BMIScreen; 