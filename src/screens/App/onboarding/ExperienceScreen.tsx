import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Alert,
  Dimensions
} from 'react-native';
import { NavigationProps } from '../../../types/navigation';
import { storage } from '../../../services/storage';
import { profiles, authService, supabase } from '../../../services/supabase';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useAppDispatch } from '../../../store/hooks';
import { addUser } from '../../../store/slices/userSlice';
import { backArrowIcon } from '../../../assets/icons';
import { useTranslation } from 'react-i18next';

// Experience/Skill Level icon SVG  
const experienceIcon = `
<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 60H26V44H12C10.9 44 10 44.9 10 46V58C10 59.1 10.9 60 12 60Z" fill="#E11D48"/>
  <path d="M30 60H44V36H30C28.9 36 28 36.9 28 38V58C28 59.1 28.9 60 30 60Z" fill="#E11D48"/>
  <path d="M48 60H62V28H48C46.9 28 46 28.9 46 30V58C46 59.1 46.9 60 48 60Z" fill="#E11D48"/>
  <path d="M66 60H70C71.1 60 72 59.1 72 58V22C72 20.9 71.1 20 70 20H66C64.9 20 64 20.9 64 22V58C64 59.1 64.9 60 66 60Z" fill="#E11D48"/>
  <path d="M40 16C38.34 16 37 14.66 37 13C37 11.34 38.34 10 40 10C41.66 10 43 11.34 43 13C43 14.66 41.66 16 40 16Z" fill="#E11D48"/>
  <path d="M36 18H44C45.1 18 46 18.9 46 20V22C46 23.1 45.1 24 44 24H36C34.9 24 34 23.1 34 22V20C34 18.9 34.9 18 36 18Z" fill="#E11D48"/>
  <path d="M38 26H42V30H38V26Z" fill="#E11D48"/>
</svg>
`;

// Responsive tasarım için ekran boyutları ve oranları
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ASPECT_RATIO = SCREEN_HEIGHT / SCREEN_WIDTH;
const isTablet = ASPECT_RATIO < 1.6;

// Responsive ölçeklendirme fonksiyonu
const scale = SCREEN_WIDTH / 375;
const normalize = (size: number) => {
  const newSize = size * scale;
  return isTablet ? newSize * 0.8 : newSize;
};

interface ExperienceScreenProps {
  navigation: NavigationProps;
}

const ExperienceScreen: React.FC<ExperienceScreenProps> = ({ navigation }) => {
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const [selectedExperience, setSelectedExperience] = useState<number | null>(null);
  const dispatch = useAppDispatch();

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
    },
    content: {
      flex: 1,
      paddingHorizontal: normalize(20),
    },
    iconContainer: {
      alignItems: 'center',
      marginTop: normalize(20),
      marginBottom: normalize(40),
    },
    titleContainer: {
      alignItems: 'center',
      marginBottom: normalize(40),
    },
    title: {
      fontSize: normalize(28),
      fontFamily: 'Outfit',
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: normalize(8),
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: normalize(15),
      fontFamily: 'Outfit',
      textAlign: 'center',
      lineHeight: normalize(20),
    },
    optionsContainer: {
      gap: normalize(20),
      marginBottom: normalize(40),
    },
    optionButton: {
      height: normalize(60),
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.cardBorder,
      marginHorizontal: 4,
    },
    optionText: {
      fontSize: normalize(16),
      fontFamily: 'Outfit',
      fontWeight: '500',
      color: colors.text,
    },
    selectedButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    selectedOptionText: {
      fontFamily: 'Outfit',
      color: colors.buttonText,
      fontWeight: '600',
    },
  });

  const registerUserInBackground = async (onboardingData: any, bmiValue: number, bmiInfo: any) => {
    try {
      // Mevcut user data'dan UUID'yi al
      const currentUserData = await storage.getUserData();
      const userId = currentUserData?.id;
      
      if (!userId) {
        return;
      }

      // Display name'i mevcut user data'dan al (NameScreen'de girilmiş olmalı)
      const displayName = currentUserData?.display_name || currentUserData?.name || 'User';

      // Profile completion percentage hesapla
      const totalFields = 7; // gender, age, weight, height, aim, experience, exercise_hours
      let completedFields = 0;
      
      if (onboardingData.gender) completedFields++;
      if (onboardingData.age) completedFields++;
      if (onboardingData.weight) completedFields++;
      if (onboardingData.height) completedFields++;
      if (onboardingData.aim) completedFields++;
      if (onboardingData.experience) completedFields++;
      if (onboardingData.exercise_hours) completedFields++;
      
      const calculatedRating = 63;

      // Experience level mapping for database
      const getExperienceText = (exp: number) => {
        switch(exp) {
          case 1: return 'Beginner';
          case 2: return 'Intermediate';
          case 3: return 'Advanced';
          case 4: return 'Professional';
          default: return 'Beginner';
        }
      };

      // 🎯 Supabase profiles tablosu için data hazırla - function signature'ına uygun
      const profileDataForSupabase = {
        gender: Number(onboardingData.gender ?? 1), // 🐛 ?? kullan - 0 değeri için || operatörü yanlış çalışır
        age: Number(onboardingData.age ?? 0), // integer field
        weight: Number(onboardingData.weight ?? 0), // numeric field
        height: Number(onboardingData.height ?? 0), // numeric field
        aim: Number(onboardingData.aim ?? 1), // function signature number bekliyor
        experience: Number(onboardingData.experience ?? 1), // function signature number bekliyor
        exercise_hours: Number(onboardingData.exercise_hours ?? 1), // function signature number bekliyor
        profile_percentage: 63, // 🎯 Her zaman 63 olarak ayarla
      };



      // Final user data güncelle (local storage için)
      const finalUserData = {
        ...onboardingData,
        id: userId, // UUID korunuyor
        display_name: displayName, // NameScreen'den gelen isim korunuyor
        name: displayName, // NameScreen'den gelen isim korunuyor
        gender: String(onboardingData.gender ?? '0'), // 🐛 ?? kullan - 0 değeri için || operatörü yanlış çalışır
        age: Number(onboardingData.age ?? 0),
        weight: Number(onboardingData.weight ?? 0),
        height: Number(onboardingData.height ?? 0),
        aim: String(onboardingData.aim ?? ''),
        experience: String(onboardingData.experience ?? ''),
        exercise_hours: String(onboardingData.exercise_hours ?? ''),
        profile_percentage: 63,
        ls_score: calculatedRating,
        user_role_id: 0, // 🎯 Default olarak 0 (free user)
        skill_level: 'Bronze',
        leaderboard_points: 0, // 🚫 Başlangıçta 0 
        overall_rating: 0, // 🎯 Hiç antrenman yoksa 0, AI doldurucak
        bmi: bmiValue,
        bmi_category: bmiInfo.category,
        onboarding_completed: true,
        created_at: currentUserData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };



      // User stats data oluştur
      const userStatsData = {
        user_id: userId,
        over_all_rating: 0, // 🚫 Default 0 - hiçbir şey hesaplanmıyor
        biceps: 0,
        triceps: 0,
        back: 0,
        chest: 0,
        shoulder: 0,
        upper_chest: 0,
        hamstring: 0,
        calf: 0,
        total_exercise: 0,
        total_weight_lifted: 0,
        total_workouts: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 🔐 ÖNCELİKLE SUPABASE AUTH SESSION KONTROLÜ VE OLUŞTURMA
      let hasValidSession = await authService.hasValidSupabaseSession();
      
      if (!hasValidSession) {
        const authResult = await authService.createSupabaseUser(userId);
        
        if (authResult.success) {
          hasValidSession = true;
          
          // Auth session oluşturuldu bilgisini kaydet
          await storage.setAuthSessionCreated(true);
        }
      }
      
             // 🎯 AUTH SESSION VARSA SUPABASE PROFILES TABLOSUNA KAYDET
       if (hasValidSession) {
         try {
           // Supabase auth user ID'sini al (RLS policy için gerekli)
           const { data: { user }, error: userError } = await supabase.auth.getUser();
           const supabaseUserId = user?.id;
           
           if (supabaseUserId) {
             const profileResult = await profiles.createProfile(supabaseUserId, profileDataForSupabase);
           }
         } catch (profileError) {
         }
       }

      // Kullanıcı bilgilerini tekilleştirilmiş storage'a kaydet
      await storage.setUserData(finalUserData);

      // User stats bilgilerini de kaydet
      await storage.saveUserStats(userStatsData);

      // Redux store'a kaydet
      dispatch(addUser(finalUserData));
      
    } catch (error) {
      console.error('❌ ExperienceScreen: User registration failed:', error);
      // Registration hatası olsa bile devam et
    }
  };

  const getBMIInfo = (bmi: number) => {
    if (bmi < 18.5) {
      return { category: t('bmi_underweight'), color: '#3B82F6', description: t('bmi_underweight_desc') };
    } else if (bmi >= 18.5 && bmi < 25) {
      return { category: t('bmi_normal'), color: '#10B981', description: t('bmi_normal_desc') };
    } else if (bmi >= 25 && bmi < 30) {
      return { category: t('bmi_overweight'), color: '#F59E0B', description: t('bmi_overweight_desc') };
    } else {
      return { category: t('bmi_obese'), color: '#EF4444', description: t('bmi_obese_desc') };
    }
  };

  const handleExperienceSelect = async (experience: number) => {
    setSelectedExperience(experience);
    try {
      const currentData = await storage.getUserData();
      
      const updatedData = {
        ...currentData,
        experience: experience,
        updated_at: new Date().toISOString()
      };

      const savedData = await storage.updateUserData({ experience: experience });
      
      if (!savedData) {
        throw new Error('Veriler kaydedilemedi');
      }

      // Experience seçildikten sonra BMI Calculation'a git
      (navigation as any).navigate('BMICalculationLoading');
      
    } catch (error: any) {
      console.error('ExperienceScreen: Error in handleExperienceSelect:', error);
      Alert.alert(
        t('error'),
        t('data_save_error'),
        [{ text: t('ok'), onPress: () => {} }]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <SvgXml
            xml={backArrowIcon.replace(/currentColor/g, colors.text)}
            width={24}
            height={24}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <SvgXml xml={experienceIcon.replace('#E11D48', colors.primary)} width={normalize(80)} height={normalize(80)} />
        </View>

        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            <Text>{t('experience_screen_title_part1')}</Text>
            <Text style={{ color: colors.primary }}>{t('experience_screen_title_part2')}</Text>
            <Text>{t('experience_screen_title_part3')}</Text>
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('experience_screen_subtitle')}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedExperience === 1 && styles.selectedButton,
            ]}
            onPress={() => handleExperienceSelect(1)}
          >
            <Text style={[
              styles.optionText,
              selectedExperience === 1 && styles.selectedOptionText,
            ]}>
              {t('experience_beginner')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedExperience === 2 && styles.selectedButton,
            ]}
            onPress={() => handleExperienceSelect(2)}
          >
            <Text style={[
              styles.optionText,
              selectedExperience === 2 && styles.selectedOptionText,
            ]}>
              {t('experience_intermediate')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedExperience === 3 && styles.selectedButton,
            ]}
            onPress={() => handleExperienceSelect(3)}
          >
            <Text style={[
              styles.optionText,
              selectedExperience === 3 && styles.selectedOptionText,
            ]}>
              {t('experience_advanced')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedExperience === 4 && styles.selectedButton,
            ]}
            onPress={() => handleExperienceSelect(4)}
          >
            <Text style={[
              styles.optionText,
              selectedExperience === 4 && styles.selectedOptionText,
            ]}>
              {t('experience_professional')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ExperienceScreen; 