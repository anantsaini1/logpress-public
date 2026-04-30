import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { optimisticAddUser } from '../../store/slices/userSlice';
import { NavigationProps } from '../../types/navigation';
import { storage } from '../../services/storage';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import LottieView from 'lottie-react-native';

const MotivationalLoadingScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute();
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  
  const [currentText, setCurrentText] = useState('');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [userBMI, setUserBMI] = useState<string>('');
  const [bmiCategory, setBMICategory] = useState<string>('');
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const heartAnimation = useRef(new Animated.Value(1)).current;
  const circularProgressAnimation = useRef(new Animated.Value(0)).current;
  
  // Step animations
  const step1Animation = useRef(new Animated.Value(0)).current;
  const step2Animation = useRef(new Animated.Value(0)).current;
  const step3Animation = useRef(new Animated.Value(0)).current;
  const step4Animation = useRef(new Animated.Value(0)).current;

  // Responsive değerler
  const isTablet = width >= 768;
  const titleFontSize = isTablet ? 32 : (width < 380 ? 24 : 28);
  const subtitleFontSize = isTablet ? 18 : (width < 380 ? 14 : 16);
  const bmiFontSize = isTablet ? 42 : (width < 380 ? 32 : 36);

  const motivationalTexts = [
    t('motivational_analyzing_your_profile'),
    t('motivational_creating_perfect_plan'),
    t('motivational_selecting_best_exercises'),
    t('motivational_calculating_nutrition'),
    t('motivational_almost_ready'),
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Modern BMI Display Styles - BMIScreen'den adapt edildi
    modernBmiContainer: {
      width: '100%',
      alignItems: 'center',
      marginBottom: 32,
    },
    circularProgressContainer: {
      marginBottom: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    circularProgressBackground: {
      width: 160,
      height: 160,
      borderRadius: 80,
      borderWidth: 8,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    circularProgressFill: {
      position: 'absolute',
      width: 160,
      height: 160,
      borderRadius: 80,
      borderWidth: 8,
      borderColor: 'transparent',
      borderTopColor: 'transparent', // Will be overridden dynamically
      transform: [{ rotate: '-90deg' }],
    },
    circularProgressInner: {
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 5,
    },
    circularProgressText: {
      fontSize: 32,
      fontWeight: '900',
      fontFamily: 'Outfit',
    },
    circularProgressUnit: {
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Outfit',
      marginTop: 2,
      letterSpacing: 1,
    },
    bmiInfoCard: {
      width: '100%',
      padding: 24,
      borderRadius: 20,
      borderWidth: 2,
      alignItems: 'center',
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    bmiCardLabel: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Outfit',
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    bmiValueContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: 12,
    },
    bmiUnit: {
      fontSize: 16,
      fontWeight: '500',
      fontFamily: 'Outfit',
      marginLeft: 4,
      marginBottom: 2,
    },
    bmiCategoryBadge: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 20,
      marginBottom: 16,
    },
    bmiCategoryText: {
      fontSize: 18,
      fontWeight: '700',
      fontFamily: 'Outfit',
    },
    motivationalElement: {
      alignItems: 'center',
      marginTop: 16,
    },
    bmiContainer: {
      alignItems: 'center',
      marginBottom: height * 0.06,
      padding: 24,
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colors.primary + '30',
      width: '100%',
    },
    bmiLabel: {
      fontSize: subtitleFontSize,
      fontFamily: 'Outfit',
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    bmiValue: {
      fontSize: bmiFontSize,
      fontFamily: 'Outfit',
      fontWeight: '800',
      color: colors.primary,
      marginBottom: 8,
    },
    bmiCategory: {
      fontSize: subtitleFontSize,
      fontFamily: 'Outfit',
      fontWeight: '600',
      color: colors.textSecondary,
    },
    motivationalContainer: {
      alignItems: 'center',
      marginBottom: height * 0.08,
    },
    title: {
      fontSize: titleFontSize,
      fontFamily: 'Outfit',
      fontWeight: '800',
      textAlign: 'center',
      color: colors.text,
      marginBottom: 16,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: subtitleFontSize,
      fontFamily: 'Outfit',
      textAlign: 'center',
      color: colors.primary,
      lineHeight: subtitleFontSize * 1.4,
      fontWeight: '600',
    },
    heartContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    heartEmoji: {
      fontSize: 24,
    },
    motivationalText: {
      fontSize: 16,
      fontWeight: '500',
      fontFamily: 'Outfit',
      textAlign: 'center',
      opacity: 0.8,
      paddingHorizontal: 20,
    },
    progressContainer: {
      width: '100%',
      marginBottom: height * 0.06,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.cardBorder,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    progressText: {
      fontSize: 18,
      fontFamily: 'Outfit',
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'center',
      marginTop: 16,
    },
    loadingText: {
      fontSize: subtitleFontSize,
      fontFamily: 'Outfit',
      fontWeight: '500',
      color: colors.text,
      textAlign: 'center',
    },
    mainTitle: {
      fontSize: 28,
      fontWeight: '700',
      fontFamily: 'Outfit',
      textAlign: 'center',
      marginBottom: 32,
      letterSpacing: -0.5,
    },
    analysisContainer: {
      width: '100%',
      marginBottom: 32,
    },
    analysisStep: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      paddingHorizontal: 4,
    },
    stepIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      borderWidth: 2,
    },
    checkMark: {
      fontSize: 16,
      fontWeight: '900',
      fontFamily: 'Outfit',
    },
    emptyCircle: {
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
    },
    stepText: {
      fontSize: 16,
      fontFamily: 'Outfit',
      flex: 1,
      lineHeight: 22,
    },
    reviewSection: {
      width: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.03)',
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
    },
    starsContainer: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    starIcon: {
      fontSize: 16,
      marginHorizontal: 1,
    },
    reviewAuthor: {
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'Outfit',
      marginBottom: 8,
    },
    reviewText: {
      fontSize: 15,
      fontWeight: '400',
      fontFamily: 'Outfit',
      textAlign: 'center',
      lineHeight: 22,
    },
    // AI Planning Styles
    aiPlanningSection: {
      width: '100%',
      alignItems: 'center',
      marginTop: 32,
      paddingHorizontal: 16,
    },
    aiIconContainer: {
      width: 110,
      height: 110,
      borderRadius: 55,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    aiIcon: {
      fontSize: 28,
    },
    aiPlanningTitle: {
      fontSize: 18,
      fontWeight: '600',
      fontFamily: 'Outfit',
      textAlign: 'center',
      opacity: 0.8,
    },
  });

  const getBMICategory = (category: string) => {
    switch (category) {
      case 'underweight':
        return t('bmi_category_underweight');
      case 'normal':
        return t('bmi_category_normal');
      case 'overweight':
        return t('bmi_category_overweight');
      case 'obese':
        return t('bmi_category_obese');
      default:
        return t('bmi_category_normal');
    }
  };

  const completeAndNavigateToSettings = async () => {
    try {
      // Route params'ı kontrol et - settings'den mi onboarding'den mi geliyoruz?
      const fromSettings = (route.params as any)?.fromSettings;
      
      if (fromSettings) {
        // Settings'den geliyorsa sadece geri dön
        navigation.goBack();
        return;
      }
      
      // Onboarding'den geliyorsa tamamlandı olarak işaretle ve direkt paywall'a git
      await storage.setOnboardingCompleted(true);
      
      // Redux'a kullanıcı bilgilerini güncelle
      const userData = await storage.getUserData();
      if (userData) {
        // Redux store'u güncelle ki HomeScreen'de doğru ad görünsün
        dispatch(optimisticAddUser(userData));
      }
      
      // RootNavigator seviyesinde direkt PaywallScreen'e git
      const rootNavigation = (navigation as any).getParent?.() || navigation;
      
      rootNavigation.reset({
        index: 0,
        routes: [
          { 
            name: 'PaywallScreen', 
            params: { 
              source: 'onboarding',
              returnRoute: 'Main' // Paywall kapandığında Main'e git
            } 
          }
        ],
      });
      
    } catch (error) {
      console.error('Motivational Loading completion error:', error);
      // Hata durumunda da ana ekrana git
      (navigation as any).reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  };

  useEffect(() => {
    // BMI verilerini al
    const loadBMIData = async () => {
      try {
        const userData = await storage.getUserData();
        if (userData?.bmi && userData?.bmi_category) {
          setUserBMI(userData.bmi.toFixed(1));
          setBMICategory(getBMICategory(userData.bmi_category));
        }
      } catch (error) {
        console.error('BMI data loading error:', error);
      }
    };

    loadBMIData();

    // Heart beat animasyonu - daha az sıklıkta
    const startHeartAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(heartAnimation, {
            toValue: 1.15, // Daha az büyütme
            duration: 1200, // Daha yavaş
            useNativeDriver: true,
          }),
          Animated.timing(heartAnimation, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startHeartAnimation();

    let textIndex = 0;
    setCurrentText(motivationalTexts[0]);

    // Circular progress animasyonu - native driver ile
    Animated.timing(circularProgressAnimation, {
      toValue: 1,
      duration: 5500,
      useNativeDriver: true, // Native driver kullan
    }).start();

    // Progress animasyonu - native driver kullan
    Animated.timing(progressAnimation, {
      toValue: 1,
      duration: 5500,
      useNativeDriver: false, // Progress bar için false gerekli
    }).start(() => {
      completeAndNavigateToSettings();
    });

    // Progress percentage güncelleme - throttle ile optimize et
    let lastUpdate = 0;
    const progressListener = progressAnimation.addListener(({ value }) => {
      const now = Date.now();
      if (now - lastUpdate > 50) { // 50ms throttle - daha az güncelleme
        setProgressPercentage(Math.round(value * 100));
        lastUpdate = now;
      }
    });

    // Text değişimi - daha az sıklıkta
    const textInterval = setInterval(() => {
      textIndex = (textIndex + 1) % motivationalTexts.length;
      setCurrentText(motivationalTexts[textIndex]);
    }, 1200); // 800ms'den 1200ms'ye çıkardık

    return () => {
      progressAnimation.removeListener(progressListener);
      clearInterval(textInterval);
    };
  }, []);

  // Step animations based on progress - optimize edildi
  useEffect(() => {
    // Sadece gerekli durumlarda animasyon çalıştır
    const animateStep = (animation: Animated.Value, threshold: number) => {
      if (progressPercentage >= threshold && animation._value === 0) {
        Animated.timing(animation, {
          toValue: 1,
          duration: 300, // Spring yerine timing - daha performanslı
          useNativeDriver: true,
        }).start();
      }
    };

    animateStep(step1Animation, 25);
    animateStep(step2Animation, 50);
    animateStep(step3Animation, 75);
    animateStep(step4Animation, 100);
  }, [progressPercentage]);

  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Circular progress rotation - native driver ile optimize
  const circularRotation = circularProgressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['-90deg', '180deg'], // 270 derece dönüş
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Circular Progress */}
        <View style={styles.circularProgressContainer}>
          <View style={[styles.circularProgressBackground, { borderColor: colors.cardBorder }]}>
            <Animated.View 
              style={[
                styles.circularProgressFill, 
                { 
                  borderTopColor: colors.primary,
                  transform: [{ rotate: circularRotation }] 
                }
              ]} 
            />
            <View style={[styles.circularProgressInner, { backgroundColor: colors.background }]}>
              <Text style={[styles.circularProgressText, { color: colors.primary }]}>
                {progressPercentage}%
              </Text>
            </View>
          </View>
        </View>

        {/* Main Title */}
        <Text style={[styles.mainTitle, { color: colors.text }]}>
          {t('motivational_personalizing_plan')}
        </Text>

        {/* Analysis Steps */}
        <View style={styles.analysisContainer}>
          {/* Step 1 - Analyzing answers */}
          <View style={styles.analysisStep}>
            <Animated.View style={[
              styles.stepIcon, 
              { 
                backgroundColor: progressPercentage >= 25 ? colors.primary : colors.cardBorder,
                borderColor: progressPercentage >= 25 ? colors.primary : colors.cardBorder,
                transform: [{ scale: step1Animation }]
              }
            ]}>
              {progressPercentage >= 25 ? (
                <Animated.Text style={[
                  styles.checkMark, 
                  { 
                    color: colors.background,
                    transform: [{ scale: step1Animation }]
                  }
                ]}>✓</Animated.Text>
              ) : (
                <View style={[styles.emptyCircle, { borderColor: colors.cardBorder }]} />
              )}
            </Animated.View>
            <Text style={[
              styles.stepText, 
              { 
                color: progressPercentage >= 25 ? colors.text : colors.textSecondary,
                fontWeight: progressPercentage >= 25 ? '600' : '400'
              }
            ]}>
              {t('motivational_analyzing_answers')}
            </Text>
          </View>

          {/* Step 2 - Defining requirements */}
          <View style={styles.analysisStep}>
            <Animated.View style={[
              styles.stepIcon, 
              { 
                backgroundColor: progressPercentage >= 50 ? colors.primary : colors.cardBorder,
                borderColor: progressPercentage >= 50 ? colors.primary : colors.cardBorder,
                transform: [{ scale: step2Animation }]
              }
            ]}>
              {progressPercentage >= 50 ? (
                <Animated.Text style={[
                  styles.checkMark, 
                  { 
                    color: colors.background,
                    transform: [{ scale: step2Animation }]
                  }
                ]}>✓</Animated.Text>
              ) : (
                <View style={[styles.emptyCircle, { borderColor: colors.cardBorder }]} />
              )}
            </Animated.View>
            <Text style={[
              styles.stepText, 
              { 
                color: progressPercentage >= 50 ? colors.text : colors.textSecondary,
                fontWeight: progressPercentage >= 50 ? '600' : '400'
              }
            ]}>
              {t('motivational_defining_requirements')}
            </Text>
          </View>

          {/* Step 3 - Weight progress */}
          <View style={styles.analysisStep}>
            <Animated.View style={[
              styles.stepIcon, 
              { 
                backgroundColor: progressPercentage >= 75 ? colors.primary : colors.cardBorder,
                borderColor: progressPercentage >= 75 ? colors.primary : colors.cardBorder,
                transform: [{ scale: step3Animation }]
              }
            ]}>
              {progressPercentage >= 75 ? (
                <Animated.Text style={[
                  styles.checkMark, 
                  { 
                    color: colors.background,
                    transform: [{ scale: step3Animation }]
                  }
                ]}>✓</Animated.Text>
              ) : (
                <View style={[styles.emptyCircle, { borderColor: colors.cardBorder }]} />
              )}
            </Animated.View>
            <Text style={[
              styles.stepText, 
              { 
                color: progressPercentage >= 75 ? colors.text : colors.textSecondary,
                fontWeight: progressPercentage >= 75 ? '600' : '400'
              }
            ]}>
              {t('motivational_estimating_progress')}
            </Text>
          </View>

          {/* Step 4 - Final adjustments */}
          <View style={styles.analysisStep}>
            <Animated.View style={[
              styles.stepIcon, 
              { 
                backgroundColor: progressPercentage >= 100 ? colors.primary : colors.cardBorder,
                borderColor: progressPercentage >= 100 ? colors.primary : colors.cardBorder,
                transform: [{ scale: step4Animation }]
              }
            ]}>
              {progressPercentage >= 100 ? (
                <Animated.Text style={[
                  styles.checkMark, 
                  { 
                    color: colors.background,
                    transform: [{ scale: step4Animation }]
                  }
                ]}>✓</Animated.Text>
              ) : (
                <View style={[styles.emptyCircle, { borderColor: colors.cardBorder }]} />
              )}
            </Animated.View>
            <Text style={[
              styles.stepText, 
              { 
                color: progressPercentage >= 100 ? colors.text : colors.textSecondary,
                fontWeight: progressPercentage >= 100 ? '600' : '400'
              }
            ]}>
              {t('motivational_adjusting_nutrition')}
            </Text>
          </View>
        </View>

        {/* AI Planning Section */}
        <View style={styles.aiPlanningSection}>
          <View style={[styles.aiIconContainer, { backgroundColor: colors.primary + '15' }]}>
            <LottieView
              source={require('../../assets/lotties/load.json')}
              autoPlay
              loop
              style={{ width: 100, height: 100 }}
              resizeMode="contain"
              renderMode="HARDWARE" // Hardware acceleration için
              cacheComposition={true} // Cache için
              speed={0.8} // Biraz daha yavaş - daha smooth
            />
          </View>
          <Text style={[styles.aiPlanningTitle, { color: colors.text }]}>
            {t('motivational_ai_planning')}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default MotivationalLoadingScreen; 