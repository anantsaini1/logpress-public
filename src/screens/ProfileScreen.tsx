import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { NavigationProp, CommonActions, useNavigation } from '@react-navigation/native';
import Svg, { Circle, Path, LinearGradient, Defs, Stop } from 'react-native-svg';
import { storage } from '../services/storage';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../store/hooks';
import { selectUser } from '../store/slices/userSlice';

const settingsIcon = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.87653 6.85425 4.02405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface UserInfo {
  id: string;
  email: string;
  display_name: string;
  profile_percentage: number;
  skill_level: string;
  [key: string]: any;
}

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const stackNavigation = useNavigation();
  const currentUser = useAppSelector(selectUser);
  
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  // Animation refs
  const profileAnimation = useRef(new Animated.Value(0)).current;
  const percentageAnimation = useRef(new Animated.Value(0)).current;

  const getLevelColor = (level: string): string => {
    switch (level?.toLowerCase()) {
      case 'bronze': return '#CD7F32';
      case 'silver': return '#71809C';
      case 'gold': return '#E6C200';
      case 'platinum': return '#4F5B93';
      case 'diamond': return '#3AA3D9';
      case 'champion': return '#FF4081';
      default: return '#CD7F32';
    }
  };

  const getBadgeIcon = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'bronze': return require('../assets/badges/bronze.png');
      case 'silver': return require('../assets/badges/silver.png');
      case 'gold': return require('../assets/badges/gold.png');
      case 'platinum': return require('../assets/badges/platinum.png');
      case 'diamond': return require('../assets/badges/diamond.png');
      case 'champion': return require('../assets/badges/champion.png');
      default: return require('../assets/badges/bronze.png');
    }
  };

  const loadUserInfo = async () => {
    try {
      const storedUserInfo = await storage.getUserInfo();
      if (storedUserInfo) {
        // Redux'tan güncel display_name'i al
        const displayName = currentUser?.display_name || storedUserInfo.display_name || 'Kullanıcı';
        
        setUserInfo({
          ...storedUserInfo,
          display_name: displayName,
          skill_level: storedUserInfo.skill_level || 'Bronze',
          profile_percentage: storedUserInfo.profile_percentage || 75
        } as UserInfo);
      } else {
        // Default user info
        setUserInfo({
          id: '1',
          email: 'user@logpress.com',
          display_name: currentUser?.display_name || 'Kullanıcı',
          profile_percentage: 75,
          skill_level: 'Bronze'
        } as UserInfo);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Kullanıcı bilgileri yüklenirken hata:', error);
      setIsLoading(false);
    }
  };

  const loadProfileImage = async () => {
    try {
      // 1. Önce Redux'tan kontrol et
      if (currentUser?.profile_image_url) {
        setProfileImage(currentUser.profile_image_url);
        return;
      }
      
      // 2. Local storage'dan kontrol et (fallback)
      const localProfileImage = await storage.getItem('profile_image_url');
      if (localProfileImage) {
        setProfileImage(localProfileImage);
      }
    } catch (error) {
      console.error('Profil fotoğrafı yüklenirken hata:', error);
    }
  };

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(profileAnimation, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(percentageAnimation, {
        toValue: userInfo?.profile_percentage || 0,
        duration: 1200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();
  };

  useEffect(() => {
    const loadData = async () => {
      await loadUserInfo();
      await loadProfileImage();
    };
    
    loadData();

    const unsubscribe = navigation.addListener('focus', loadData);
    return () => unsubscribe();
  }, [navigation, currentUser]); // currentUser dependency eklendi

  useEffect(() => {
    if (userInfo && !isLoading) {
      startAnimations();
    }
  }, [userInfo, isLoading]);

  const handlePremiumPurchase = async () => {
    if (isPremium) {
      Alert.alert(t('success'), t('profile_premium_already_active'));
      return;
    }

    try {
      // CommonActions ile PaywallScreen'e git
      navigation.dispatch(
        CommonActions.navigate({
          name: 'PaywallScreen',
          params: {
            source: 'settings',
            returnRoute: 'Profile'
          }
        })
      );
    } catch (error) {
      console.error('PaywallScreen açılırken hata:', error);
      Alert.alert(t('error'), 'PaywallScreen açılamadı. Lütfen tekrar deneyin.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      
      <ScrollView 
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.scrollViewContent, { paddingBottom: Platform.OS === 'ios' ? 100 : 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <Animated.View 
          style={[
            styles.profileSection, 
            { backgroundColor: colors.background },
            { opacity: profileAnimation, transform: [{ translateY: profileAnimation.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] }
          ]}
        >
          <TouchableOpacity 
            style={[styles.avatarContainer, {
              backgroundColor: colors.card,
              borderColor: getLevelColor(userInfo?.skill_level || 'Bronze'),
              borderWidth: 3,
              padding: 8,
              borderRadius: 58,
              ...Platform.select({
                ios: {
                  shadowColor: getLevelColor(userInfo?.skill_level || 'Bronze'),
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                },
                android: {
                  elevation: 8,
                },
              }),
            }]}
          >
            <Image
              source={profileImage ? { uri: profileImage } : require('../assets/logo.png')}
              style={[
                styles.profileImage,
                !profileImage && { tintColor: currentTheme === 'light' ? colors.primary : colors.text }
              ]}
            />
            <Svg width={116} height={116} style={styles.progressCircle}>
              <Circle
                cx="58"
                cy="58"
                r="54"
                stroke={colors.border}
                strokeWidth="2"
                fill="none"
              />
            </Svg>

          </TouchableOpacity>
          
          <Text style={[styles.userName, { color: colors.text }]}>
            {userInfo?.display_name || t('default_user_name')}
          </Text>
          
          <View style={[
            styles.levelBadge,
            { 
              borderColor: getLevelColor(userInfo?.skill_level || 'Bronze'),
              backgroundColor: colors.card,
              borderWidth: 1.5,
            }
          ]}>
            <Image 
              source={getBadgeIcon(userInfo?.skill_level || 'Bronze')}
              style={styles.badgeIcon}
            />
            <Text style={[
              styles.levelText,
              { color: getLevelColor(userInfo?.skill_level || 'Bronze'), fontWeight: '600' }
            ]}>{userInfo?.skill_level || 'Bronze'} {t('stats_level_text')}</Text>
          </View>

          <TouchableOpacity 
            style={[styles.completeButton, { 
              backgroundColor: colors.primary,
              ...Platform.select({
                ios: {
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                },
                android: {
                  elevation: 6,
                },
              })
            }]}
            onPress={() => stackNavigation.navigate('ProfileDetails' as never)}
          >
            <Text style={styles.completeButtonText}>{t('profile_complete')}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Premium Section */}
        <View style={[styles.premiumSection, { 
          backgroundColor: colors.card,
          borderColor: currentTheme === 'dark' ? colors.border : '#efefef',
          marginHorizontal: 16,
          borderRadius: 20,
          borderWidth: 1,
          overflow: 'hidden'
        }]}>
          <View style={styles.premiumHeader}>
            <View style={styles.premiumHeaderContent}>
              <Text style={[styles.premiumTitle, { color: colors.text }]}>
                {isPremium ? t('profile_premium_active') : t('profile_premium_title')}
              </Text>
              {isPremium && (
                <View style={[styles.premiumActiveBadge, { backgroundColor: `${colors.primary}15` }]}>
                  <Text style={[styles.premiumActiveText, { color: colors.primary }]}>✨ {t('profile_premium_active')}</Text>
                </View>
              )}
            </View>
            
          </View>
          
          <Text style={[styles.premiumDescription, { color: colors.textSecondary }]}>
            {isPremium 
              ? t('profile_premium_active_description')
              : t('profile_premium_description')}
          </Text>
          
                     <TouchableOpacity 
             style={[styles.upgradeButton, { 
               backgroundColor: isPremium ? `${colors.primary}15` : colors.primary,
               borderColor: colors.primary,
               borderWidth: isPremium ? 1 : 0,
             }]}
             onPress={handlePremiumPurchase}
             disabled={isPremium}
           >
             <Text style={[styles.upgradeButtonText, { 
               color: isPremium ? colors.primary : '#FFFFFF' 
             }]}>
               {isPremium ? t('profile_premium_active') : t('profile_upgrade_now')}
             </Text>
           </TouchableOpacity>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16, marginHorizontal: 16 }]}>
            {t('profile_premium_features')}
          </Text>
          
          {[
            { key: 'profile_feature_ai_score', icon: 'ai' },
            { key: 'profile_feature_advanced_analytics', icon: 'chart' },
            { key: 'profile_feature_ad_free', icon: 'shield' },
            { key: 'profile_feature_unlimited_access', icon: 'unlimited' }
          ].map((feature, index) => (
            <View 
              key={feature.key}
              style={[styles.featureCard, { 
                backgroundColor: colors.card,
                borderColor: isPremium ? `${colors.primary}30` : (currentTheme === 'dark' ? colors.border : '#efefef'),
                borderWidth: isPremium ? 2 : 1,
              }]}
            >
              <View style={[styles.featureIconContainer, { 
                backgroundColor: isPremium ? `${colors.primary}15` : colors.background 
              }]}>
                <Svg width="24" height="24" viewBox="0 0 24 24">
                  {feature.icon === 'ai' && (
                    <Path
                      d="M12 2L2 7V10C2 16 6 20.88 12 22C18 20.88 22 16 22 10V7L12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
                      stroke={isPremium ? colors.primary : colors.textSecondary}
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {feature.icon === 'chart' && (
                    <Path
                      d="M3 3V21H21M7 14L11 10L15 14L19 8"
                      stroke={isPremium ? colors.primary : colors.textSecondary}
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {feature.icon === 'unlimited' && (
                    <Path
                      d="M18.36 6.64C19.15 7.43 19.15 8.68 18.36 9.47L12 15.83L5.64 9.47C4.85 8.68 4.85 7.43 5.64 6.64C6.43 5.85 7.68 5.85 8.47 6.64L12 10.17L15.53 6.64C16.32 5.85 17.57 5.85 18.36 6.64ZM18.36 17.36C17.57 18.15 16.32 18.15 15.53 17.36L12 13.83L8.47 17.36C7.68 18.15 6.43 18.15 5.64 17.36C4.85 16.57 4.85 15.32 5.64 14.53L12 8.17L18.36 14.53C19.15 15.32 19.15 16.57 18.36 17.36Z"
                      stroke={isPremium ? colors.primary : colors.textSecondary}
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {feature.icon === 'shield' && (
                    <Path
                      d="M12 22S8 18 8 12V7L12 5L16 7V12C16 18 12 22 12 22Z"
                      stroke={isPremium ? colors.primary : colors.textSecondary}
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </Svg>
              </View>
              <Text style={[styles.featureTitle, { 
                color: colors.text,
                opacity: isPremium ? 1 : 0.8,
                fontWeight: isPremium ? '700' : '600'
              }]}>
                {t(feature.key)}
              </Text>
              {isPremium && (
                <View style={styles.featureCheck}>
                  <Svg width="16" height="16" viewBox="0 0 24 24">
                    <Path
                      d="M20 6L9 17L4 12"
                      stroke={colors.primary}
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              )}
            </View>
          ))}
        </View>
        
        {isPremium && (
          <View style={[styles.subscriptionCard, { 
            backgroundColor: colors.card,
            borderColor: currentTheme === 'dark' ? colors.border : '#efefef',
          }]}>
            <View style={styles.subscriptionHeader}>
              <View style={[styles.subscriptionIconContainer, { backgroundColor: colors.background }]}>
                <Svg width="24" height="24" viewBox="0 0 24 24">
                  <Path
                    d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"
                    fill={colors.primary}
                  />
                </Svg>
              </View>
              <View style={styles.subscriptionInfo}>
                <Text style={[styles.subscriptionTitle, { color: colors.text }]}>
                  {t('profile_subscription_info')}
                </Text>
                <Text style={[styles.subscriptionPlan, { color: colors.primary }]}>
                  {t('profile_subscription_yearly')}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.manageButton, { borderColor: colors.border }]}
              onPress={() => Alert.alert(t('success'), t('profile_manage_subscription'))}
            >
              <Text style={[styles.manageButtonText, { color: colors.text }]}>
                {t('profile_manage_subscription')}
              </Text>
              <Svg width="16" height="16" viewBox="0 0 24 24">
                <Path
                  d="M9 18L15 12L9 6"
                  stroke={colors.textSecondary}
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  progressCircle: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }],
  },

  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Outfit',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 24,
  },
  badgeIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  completeButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Outfit',
  },
  premiumSection: {
    marginBottom: 24,
    padding: 24,
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  premiumHeaderContent: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'Outfit',
  },
  premiumActiveBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  premiumActiveText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  premiumIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    fontFamily: 'Outfit',
  },
  upgradeButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Outfit',
  },
  featuresGrid: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Outfit',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  featureCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF5020',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  subscriptionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Outfit',
  },
  subscriptionPlan: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  manageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
});

export default ProfileScreen; 