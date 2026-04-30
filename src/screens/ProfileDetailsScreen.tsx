import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SvgXml } from 'react-native-svg';
import Svg, { Circle } from 'react-native-svg';
import { NavigationProps } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { storage } from '../services/storage';
import { useToastService } from '../services/toast';
import { useUser } from '../context/UserContext';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { refreshUser } from '../store/slices/userSlice';

const backIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const settingsIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.87653 6.85425 4.02405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const arrowRightIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const newBadge = (text: string) => `
<svg width="36" height="20" viewBox="0 0 36 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="36" height="20" rx="10" fill="#F43F5E"/>
  <text x="18" y="14" text-anchor="middle" fill="white" font-size="12" font-weight="600">${text}</text>
</svg>
`;

interface ProfileDetailsScreenProps {
  navigation: NavigationProps;
}

type SportId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type FocusAreaId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface UserInfo {
  id: string;
  email: string;
  display_name?: string;
  gender?: string;
  age?: number;
  weight?: number;
  height?: number;
  aim?: string;
  experience?: string;
  exercise_hours?: string;
  focus_areas: FocusAreaId[];
  sports: SportId[];
  environment_preference?: string;
  profile_percentage?: number;
  user_role_id?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: string | number | undefined | FocusAreaId[] | SportId[];
}

const getSports = (t: any) => ({
  RUNNING: { id: 1 as SportId, key: 'running', text: t('sport_running') },
  SWIMMING: { id: 2 as SportId, key: 'swimming', text: t('sport_swimming') },
  CYCLING: { id: 3 as SportId, key: 'cycling', text: t('sport_cycling') },
  YOGA: { id: 4 as SportId, key: 'yoga', text: t('sport_yoga') },
  PILATES: { id: 5 as SportId, key: 'pilates', text: t('sport_pilates') },
  BOXING: { id: 6 as SportId, key: 'boxing', text: t('sport_boxing') },
  TENNIS: { id: 7 as SportId, key: 'tennis', text: t('sport_tennis') },
  BASKETBALL: { id: 8 as SportId, key: 'basketball', text: t('sport_basketball') },
  FOOTBALL: { id: 9 as SportId, key: 'football', text: t('sport_football') },
  VOLLEYBALL: { id: 10 as SportId, key: 'volleyball', text: t('sport_volleyball') }
});

const getFocusAreas = (t: any) => ({
  SHOULDERS: { id: 1 as FocusAreaId, key: 'shoulders', text: t('focus_shoulders') },
  CHEST: { id: 2 as FocusAreaId, key: 'chest', text: t('focus_chest') },
  BACK: { id: 3 as FocusAreaId, key: 'back', text: t('focus_back') },
  ARMS: { id: 4 as FocusAreaId, key: 'arms', text: t('focus_arms') },
  ABS: { id: 5 as FocusAreaId, key: 'abs', text: t('focus_abs') },
  LEGS: { id: 6 as FocusAreaId, key: 'legs', text: t('focus_legs') },
  GLUTES: { id: 7 as FocusAreaId, key: 'glutes', text: t('focus_glutes') },
  CARDIO: { id: 8 as FocusAreaId, key: 'cardio', text: t('focus_cardio') }
});

const ProfileDetailsScreen: React.FC<ProfileDetailsScreenProps> = ({ navigation }) => {
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const { user_role_id } = useUser();
  const stackNavigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux'tan user data'yı al
  const reduxUser = useSelector((state: RootState) => state.user.user);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // Redux user'ını UserInfo formatına dönüştür
  const userInfo: UserInfo | null = reduxUser ? {
    id: reduxUser.id,
    email: reduxUser.display_name || 'user@example.com',
    display_name: reduxUser.display_name,
    gender: reduxUser.gender,
    age: reduxUser.age,
    weight: reduxUser.weight,
    height: reduxUser.height,
    aim: reduxUser.aim,
    experience: reduxUser.experience,
    exercise_hours: reduxUser.exercise_hours,
    focus_areas: (reduxUser.focus_areas || []) as FocusAreaId[],
    sports: (reduxUser.sports || []) as SportId[],
    environment_preference: reduxUser.environment_preference,
    profile_percentage: reduxUser.profile_percentage,
    user_role_id: reduxUser.user_role_id,
    created_at: reduxUser.created_at,
    updated_at: reduxUser.updated_at
  } : null;

  // Profil fotoğrafını yükle
  const loadProfileImage = async () => {
    try {
      const localProfileImage = await storage.getItem('profile_image_url');
      if (localProfileImage) {
        setProfileImage(localProfileImage);
      }
    } catch (error) {
      console.error('Profil fotoğrafı yüklenirken hata:', error);
    }
  };

  // Sayfa focus olduğunda Redux'u refresh et
  useFocusEffect(
    useCallback(() => {
      dispatch(refreshUser());
    }, [dispatch])
  );

  // Sadece profil fotoğrafını yükle
  useEffect(() => {
    loadProfileImage();
  }, []);



  const getExperienceText = (level: number) => {
    switch (level) {
      case 1: return t('experience_beginner');
      case 2: return t('experience_intermediate');
      case 3: return t('experience_advanced');
      case 4: return t('experience_professional');
      default: return t('profile_not_specified');
    }
  };

  const getAimText = (aim: string | number) => {
    const aimNumber = typeof aim === 'string' ? Number(aim) : aim;
    switch (aimNumber) {
      case 1: return t('goal_lose_weight');
      case 2: return t('goal_stay_fit');
      case 3: return t('goal_build_muscle');
      case 4: return t('goal_feel_energetic');
      case 5: return t('goal_strengthen_mind');
      case 6: return t('goal_relieve_stress');
      case 7: return t('goal_increase_endurance');
      default: return t('profile_not_specified');
    }
  };

  const getFrequencyText = (frequency: string) => {
    const frequencies: Record<string, string> = {
      '1': t('frequency_1_2_times'),
      '2': t('frequency_3_4_times'),
      '3': t('frequency_5_6_times'),
      '4': t('frequency_everyday')
    };
    return frequencies[frequency] || t('profile_not_specified');
  };

  const getEnvironmentText = (env: string) => {
    const environments: Record<string, string> = {
      '1': t('environment_gym'),
      '2': t('environment_home'),
      '3': t('environment_outdoor')
    };
    return environments[env] || t('profile_not_specified');
  };

  const getSportsText = (sports: number[]) => {
    const SPORTS = getSports(t);
    return sports.map(sportId => {
      const sport = Object.values(SPORTS).find(s => s.id === sportId);
      return sport?.text || '';
    }).filter(text => text !== '').join(', ');
  };

  const getFocusAreasText = (areas: number[]) => {
    const FOCUS_AREAS = getFocusAreas(t);
    return areas.map(areaId => {
      const area = Object.values(FOCUS_AREAS).find(a => a.id === areaId);
      return area?.text || '';
    }).filter(text => text !== '').join(', ');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme === 'dark' ? '#1C1C1E' : colors.background }]}>
      <StatusBar
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={currentTheme === 'dark' ? '#1C1C1E' : colors.background}
      />
      <View style={[styles.header, { 
        backgroundColor: currentTheme === 'dark' ? '#1C1C1E' : colors.background, 
        borderBottomColor: colors.cardBorder 
      }]}>
        {user_role_id !== 1 && (
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
        )}
        <TouchableOpacity 
          onPress={() => stackNavigation.navigate('Settings' as never)}
          style={styles.settingsButton}
        >
          <SvgXml 
            xml={settingsIcon.replace(/#000000/g, currentTheme === 'dark' ? '#FFFFFF' : '#000000')} 
            width={24} 
            height={24} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={[styles.content, { 
          backgroundColor: currentTheme === 'dark' ? '#1C1C1E' : colors.background 
        }]} 
        contentContainerStyle={{
          paddingBottom: 120 // Tab bar + ekstra space için
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.profileSection, { 
          backgroundColor: currentTheme === 'dark' ? '#1C1C1E' : colors.background 
        }]}>
          <View style={[styles.profileImageContainer, {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 0,
              padding: 0,
              borderRadius: 58,
              position: 'relative',
              width: 116,
              height: 116,
              alignItems: 'center',
              justifyContent: 'center',
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                },
                android: {
                  elevation: 4,
                },
              }),
            }]}>
            <Image
              source={profileImage ? { uri: profileImage } : require('../assets/logo.png')}
              style={[
                styles.profileImage, 
                {
                  width: 116,
                  height: 116,
                  borderRadius: 58,
                },
                !profileImage && { tintColor: currentTheme === 'light' ? colors.primary : colors.text }
              ]}
            />
            <Svg width={116} height={116} style={[styles.progressCircle, {
              position: 'absolute',
              top: 0,
              left: 0,
            }]}>
              <Circle
                cx="58"
                cy="58"
                r="56"
                stroke={colors.primary}
                strokeWidth="3"
                fill="none"
                strokeDasharray={2 * Math.PI * 56}
                strokeDashoffset={2 * Math.PI * 56 * (1 - Number(userInfo?.profile_percentage || 0) / 100)}
                strokeLinecap="round"
              />
            </Svg>
            <View style={[styles.progressRing, { 
              backgroundColor: colors.background,
              borderColor: colors.primary,
              position: 'absolute',
              bottom: -5,
              right: -5,
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 2.5,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 3,
              elevation: 3
            }]}>
              <Text style={[styles.progressText, { 
                color: colors.primary,
                fontSize: 14,
                fontWeight: '700',
                fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
                includeFontPadding: false,
                textAlign: 'center'
              }]}>{userInfo?.profile_percentage || 0}%</Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colors.text }]}>
              {userInfo?.display_name || t('default_user_name')}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.editBioButton, { 
              backgroundColor: colors.primary,
              marginTop: 16,
              marginBottom: 8,
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center'
            }]}
            onPress={() => navigation.navigate('BioScreen' as never)}
          >
            <Text style={[styles.editBioText, { 
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: '600',
              marginRight: 8
            }]}>{t('profile_edit_bio')}</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 18 }}>✎</Text>
          </TouchableOpacity>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('profile_personal_info')}</Text>
        </View>

        <View style={[styles.section, { 
          backgroundColor: currentTheme === 'dark' ? '#1C1C1E' : colors.background 
        }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile_personal_data')}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('WeightScreen' as never)}
          >
            <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile_weight')}</Text>
            <View style={styles.menuItemRight}>
              {userInfo?.weight && userInfo.weight > 0 ? (
                <>
                  <Text style={[styles.menuItemSubtext, { color: colors.primary }]}>{userInfo.weight} kg</Text>
                  <Text style={[styles.menuItemAction, { color: colors.textSecondary }]}>{t('profile_change')}</Text>
                </>
              ) : (
                <Text style={[styles.menuItemAction, { color: colors.textSecondary, opacity: 0.7 }]}>{t('profile_add')}</Text>
              )}
              <SvgXml xml={arrowRightIcon.replace(/currentColor/g, currentTheme === 'dark' ? '#FFFFFF' : '#000000')} width={24} height={24} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('HeightScreen' as never)}
          >
            <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile_height')}</Text>
            <View style={styles.menuItemRight}>
              {userInfo?.height && userInfo.height > 0 ? (
                <>
                  <Text style={[styles.menuItemSubtext, { color: colors.primary }]}>{userInfo.height} cm</Text>
                  <Text style={[styles.menuItemAction, { color: colors.textSecondary }]}>{t('profile_change')}</Text>
                </>
              ) : (
                <Text style={[styles.menuItemAction, { color: colors.textSecondary, opacity: 0.7 }]}>{t('profile_add')}</Text>
              )}
              <SvgXml xml={arrowRightIcon.replace(/currentColor/g, currentTheme === 'dark' ? '#FFFFFF' : '#000000')} width={24} height={24} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { 
          backgroundColor: currentTheme === 'dark' ? '#1C1C1E' : colors.background 
        }]}>
                      <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile_goals')}</Text>
            </View>
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('GoalScreen' as never)}
          >
            <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile_goal')}</Text>
            <View style={styles.menuItemRight}>
              {userInfo?.aim && userInfo.aim !== '' && userInfo.aim !== '0' ? (
                <>
                  <Text style={[styles.menuItemSubtext, { color: colors.primary }]}>{getAimText(userInfo.aim)}</Text>
                  <Text style={[styles.menuItemAction, { color: colors.textSecondary }]}>{t('profile_change')}</Text>
                </>
              ) : (
                <Text style={[styles.menuItemAction, { color: colors.textSecondary, opacity: 0.7 }]}>{t('profile_add')}</Text>
              )}
              <SvgXml xml={arrowRightIcon.replace(/currentColor/g, currentTheme === 'dark' ? '#FFFFFF' : '#000000')} width={24} height={24} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { 
          backgroundColor: currentTheme === 'dark' ? '#1C1C1E' : colors.background 
        }]}>
                      <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile_preferences')}</Text>
            </View>
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('FitnessLevelScreen' as never)}
          >
            <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile_fitness_level')}</Text>
            <View style={styles.menuItemRight}>
              {userInfo?.experience && userInfo.experience !== '' && userInfo.experience !== '0' ? (
                <>
                  <Text style={[styles.menuItemSubtext, { color: colors.primary }]}>{getExperienceText(Number(userInfo.experience))}</Text>
                  <Text style={[styles.menuItemAction, { color: colors.textSecondary }]}>{t('profile_change')}</Text>
                </>
              ) : (
                <Text style={[styles.menuItemAction, { color: colors.textSecondary, opacity: 0.7 }]}>{t('profile_add')}</Text>
              )}
              <SvgXml xml={arrowRightIcon.replace(/currentColor/g, currentTheme === 'dark' ? '#FFFFFF' : '#000000')} width={24} height={24} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('FocusAreasScreen' as never)}
          >
            <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile_focus_areas')}</Text>
            <View style={styles.menuItemRight}>
              {userInfo && userInfo.focus_areas && userInfo.focus_areas.length > 0 ? (
                <>
                  <Text style={[styles.menuItemSubtext, { color: colors.primary }]}>{getFocusAreasText(userInfo.focus_areas)}</Text>
                  <Text style={[styles.menuItemAction, { color: colors.textSecondary }]}>{t('profile_change')}</Text>
                </>
              ) : (
                <Text style={[styles.menuItemAction, { color: colors.textSecondary, opacity: 0.7 }]}>{t('profile_add')}</Text>
              )}
              <SvgXml xml={arrowRightIcon.replace(/currentColor/g, currentTheme === 'dark' ? '#FFFFFF' : '#000000')} width={24} height={24} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('FavoriteSportsScreen' as never)}
          >
            <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile_favorite_sports')}</Text>
            <View style={styles.menuItemRight}>
              {userInfo && userInfo.sports && userInfo.sports.length > 0 ? (
                <>
                  <Text style={[styles.menuItemSubtext, { color: colors.primary }]}>{getSportsText(userInfo.sports)}</Text>
                  <Text style={[styles.menuItemAction, { color: colors.textSecondary }]}>{t('profile_change')}</Text>
                </>
              ) : (
                <Text style={[styles.menuItemAction, { color: colors.textSecondary, opacity: 0.7 }]}>{t('profile_add')}</Text>
              )}
              <SvgXml xml={arrowRightIcon.replace(/currentColor/g, currentTheme === 'dark' ? '#FFFFFF' : '#000000')} width={24} height={24} />
            </View>
          </TouchableOpacity>



          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('FrequencyScreen' as never)}
          >
            <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile_workout_frequency')}</Text>
            <View style={styles.menuItemRight}>
              {userInfo?.exercise_hours && userInfo.exercise_hours !== '' && userInfo.exercise_hours !== '0' ? (
                <>
                  <Text style={[styles.menuItemSubtext, { color: colors.primary }]}>{getFrequencyText(userInfo.exercise_hours)}</Text>
                  <Text style={[styles.menuItemAction, { color: colors.textSecondary }]}>{t('profile_change')}</Text>
                </>
              ) : (
                <Text style={[styles.menuItemAction, { color: colors.textSecondary, opacity: 0.7 }]}>{t('profile_add')}</Text>
              )}
              <SvgXml xml={arrowRightIcon.replace(/currentColor/g, currentTheme === 'dark' ? '#FFFFFF' : '#000000')} width={24} height={24} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('EnvironmentScreen' as never)}
          >
            <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile_environment_preference')}</Text>
            <View style={styles.menuItemRight}>
              {userInfo?.environment_preference && userInfo.environment_preference !== '' && userInfo.environment_preference !== '0' ? (
                <>
                  <Text style={[styles.menuItemSubtext, { color: colors.primary }]}>{getEnvironmentText(userInfo.environment_preference)}</Text>
                  <Text style={[styles.menuItemAction, { color: colors.textSecondary }]}>{t('profile_change')}</Text>
                </>
              ) : (
                <Text style={[styles.menuItemAction, { color: colors.textSecondary, opacity: 0.7 }]}>{t('profile_add')}</Text>
              )}
              <SvgXml xml={arrowRightIcon.replace(/currentColor/g, currentTheme === 'dark' ? '#FFFFFF' : '#000000')} width={24} height={24} />
            </View>
          </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  profileImageContainer: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  progressCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
    transform: [{ rotate: '-90deg' }],
  },
  progressRing: {
    position: 'absolute',
    right: -5,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  profileInfo: {
    marginTop: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
    fontFamily: 'Outfit',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginRight: 8,
    fontFamily: 'Outfit',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: 'Outfit',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemValue: {
    fontSize: 14,
    marginRight: 8,
    fontFamily: 'Outfit',
  },
  menuItemSubtext: {
    fontSize: 14,
    marginRight: 8,
    fontFamily: 'Outfit',
  },
  menuItemAction: {
    fontSize: 14,
    marginRight: 4,
    fontFamily: 'Outfit',
  },
  selectedValueContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  editBioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  editBioText: {
    textAlign: 'center',
    fontFamily: 'Outfit',
  },
});

export default ProfileDetailsScreen; 