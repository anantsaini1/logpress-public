import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  StatusBar,
  useWindowDimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProps } from '../../../types/navigation';
import { storage } from '../../../services/storage';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const GenderScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  
  // Ekran boyutuna göre responsive değerler
  const isTablet = width >= 768;
  const buttonSize = isTablet ? Math.min(width * 0.18, 200) : 180;
  const buttonGap = isTablet ? 40 : 32;
  const contentMaxWidth = isTablet ? 500 : '100%';
  const titleFontSize = isTablet ? 48 : (width < 380 ? 32 : 40);
  const subtitleFontSize = isTablet ? 20 : (width < 380 ? 15 : 17);
  const topPadding = height < 700 ? 10 : 20; // AgeScreen standardı

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    backButton: {
      fontSize: 24,
      fontFamily: 'Outfit',
      fontWeight: '400',
    },
    content: {
      flex: 1,
      alignItems: 'center',
      padding: 16,
      paddingHorizontal: width < 380 ? 12 : 16,
    },
    titleContainer: {
      width: '100%',
      alignItems: 'center',
      marginBottom: height < 700 ? 20 : 40,
    },
    title: {
      fontFamily: 'Outfit',
      fontWeight: '900',
      textAlign: 'center',
      marginBottom: 8,
      letterSpacing: -1,
    },
    subtitle: {
      fontFamily: 'Outfit',
      textAlign: 'center',
      lineHeight: 24,
    },
    buttonsContainer: {
      alignItems: 'center',
    },
    genderButton: {
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    genderIcon: {
      fontSize: 40,
      marginBottom: 8,
    },
    genderText: {
      fontSize: 20,
      fontFamily: 'Outfit',
      fontWeight: '600',
    }
  });

  useEffect(() => {
  }, []);

  const handleGenderSelect = async (gender: string) => {
    try {
      const genderValue = gender === 'male' ? 0 : 1;

      // Mevcut user data'yı al veya yeni oluştur
      const existingUserData = await storage.getUserData() || {};
      
      const onboardingData = {
        ...existingUserData,
        gender: genderValue,
        // Diğer default değerler sadece yoksa eklenir
        age: existingUserData.age || 25,
        aim: existingUserData.aim || 1,
        experience: existingUserData.experience || 1,
        exercise_hours: existingUserData.exercise_hours || 1,
        onboarding_completed: false, // Henüz tamamlanmadı
        updated_at: new Date().toISOString()
      };

      const savedData = await storage.setUserData(onboardingData);

      if (!savedData) {
        throw new Error('Veriler kaydedilemedi');
      }

      // Kayıtlı veriyi kontrol et
      const checkSavedData = await storage.getUserData();

      navigation.navigate('Age');
    } catch (error: any) {
      console.error('GenderScreen: Error in handleGenderSelect:', error);
      Alert.alert(
        t('error'),
        t('data_save_error'),
        [{ text: t('ok'), onPress: () => {} }]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.backButton, { color: colors.text }]}>{'←'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={[styles.titleContainer, { paddingTop: topPadding }]}>
          <Text style={[styles.title, { 
            color: colors.text,
            fontSize: titleFontSize
          }]}>
            {t('gender_screen_title')}
          </Text>
          <Text style={[styles.subtitle, { 
            color: colors.textSecondary,
            fontSize: subtitleFontSize
          }]}>
            {t('gender_screen_subtitle')}
          </Text>
        </View>

        <View style={[styles.buttonsContainer, { gap: buttonGap }]}>
          <TouchableOpacity
            style={[
              styles.genderButton, 
              { 
                backgroundColor: colors.genderMale,
                width: buttonSize,
                height: buttonSize,
                borderRadius: buttonSize / 2
              }
            ]}
            onPress={() => handleGenderSelect('male')}
          >
            <Text style={[styles.genderIcon, { color: colors.buttonText }]}>♂</Text>
            <Text style={[styles.genderText, { color: colors.buttonText }]}>{t('male')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderButton, 
              { 
                backgroundColor: colors.genderFemale,
                width: buttonSize,
                height: buttonSize,
                borderRadius: buttonSize / 2
              }
            ]}
            onPress={() => handleGenderSelect('female')}
          >
            <Text style={[styles.genderIcon, { color: colors.buttonText }]}>♀</Text>
            <Text style={[styles.genderText, { color: colors.buttonText }]}>{t('female')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default GenderScreen; 