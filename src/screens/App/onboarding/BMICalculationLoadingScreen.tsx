import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProps } from '../../../types/navigation';
import { storage } from '../../../services/storage';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const BMICalculationLoadingScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  
  const [currentText, setCurrentText] = useState('');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const progressAnimation = useRef(new Animated.Value(0)).current;

  // Responsive değerler
  const isTablet = width >= 768;
  const titleFontSize = isTablet ? 32 : (width < 380 ? 24 : 28);
  const subtitleFontSize = isTablet ? 18 : (width < 380 ? 14 : 16);

  const loadingTexts = [
    t('bmi_loading_calculating'),
    t('bmi_loading_analyzing'),
    t('bmi_loading_preparing'),
    t('bmi_loading_almost_done'),
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
    titleContainer: {
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
      color: colors.textSecondary,
      lineHeight: subtitleFontSize * 1.4,
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
  });

  const calculateBMIAndNavigate = async () => {
    try {
      const userData = await storage.getUserData();
      
      if (userData?.weight && userData?.height) {
        const heightInMeters = userData.height / 100;
        const bmiValue = userData.weight / (heightInMeters * heightInMeters);
        
        // BMI kategorisini belirle
        let bmiCategory = '';
        if (bmiValue < 18.5) {
          bmiCategory = 'underweight';
        } else if (bmiValue >= 18.5 && bmiValue < 25) {
          bmiCategory = 'normal';
        } else if (bmiValue >= 25 && bmiValue < 30) {
          bmiCategory = 'overweight';
        } else {
          bmiCategory = 'obese';
        }

        // BMI verilerini kaydet
        await storage.updateUserData({
          bmi: bmiValue,
          bmi_category: bmiCategory,
          updated_at: new Date().toISOString()
        });

        // BMI Results Screen'e git
        (navigation as any).navigate('BMIResultsScreen', {
          bmi: bmiValue.toFixed(1),
          category: bmiCategory
        });
      }
    } catch (error) {
      console.error('BMI calculation error:', error);
      // Hata durumunda direkt Environment'a git
      navigation.navigate('Environment');
    }
  };

  useEffect(() => {
    let textIndex = 0;
    setCurrentText(loadingTexts[0]);

    // Progress animasyonu
    Animated.timing(progressAnimation, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start(() => {
      calculateBMIAndNavigate();
    });

    // Progress percentage güncelleme
    const progressListener = progressAnimation.addListener(({ value }) => {
      setProgressPercentage(Math.round(value * 100));
    });

    // Text değişimi
    const textInterval = setInterval(() => {
      textIndex = (textIndex + 1) % loadingTexts.length;
      setCurrentText(loadingTexts[textIndex]);
    }, 750);

    return () => {
      progressAnimation.removeListener(progressListener);
      clearInterval(textInterval);
    };
  }, []);

  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {t('bmi_loading_title')}
          </Text>
          <Text style={styles.subtitle}>
            {t('bmi_loading_subtitle')}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.progressText}>
            {progressPercentage}%
          </Text>
        </View>

        <Text style={styles.loadingText}>
          {currentText}
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default BMICalculationLoadingScreen; 