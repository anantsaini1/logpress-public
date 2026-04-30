import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
  StatusBar,
  RefreshControl,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, G, Line, Text as SvgText } from 'react-native-svg';
import LottieView from 'lottie-react-native';
import PlayerBadgeModal from '../components/PlayerBadgeModal';
import { useTheme } from '../context/ThemeContext';
import { storage } from '../services/storage';
import { useAppSelector } from '../store/hooks';
import { selectUser } from '../store/slices/userSlice';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StatsScreenForFreemiumProps {
  navigation: any;
}

const StatsScreenForFreemium: React.FC<StatsScreenForFreemiumProps> = ({ navigation }) => {
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const currentUser = useAppSelector(selectUser);
  
  const [isPlayerBadgeVisible, setIsPlayerBadgeVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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

  const loadUserInfo = async () => {
    try {
      const storedUserInfo = await storage.getUserInfo();
      // Redux'tan güncel display_name'i al
      const displayName = currentUser?.display_name || storedUserInfo?.display_name || 'Kullanıcı';
      
      setUserInfo(storedUserInfo ? {
        ...storedUserInfo,
        display_name: displayName
      } : {
        display_name: displayName,
        skill_level: 'Bronze'
      });
    } catch (error) {
      console.error('Kullanıcı bilgileri alınamadı:', error);
      // Set safe default values
      setUserInfo({
        display_name: currentUser?.display_name || 'Kullanıcı',
        skill_level: 'Bronze'
      });
    }
  };

  // Redux'tan profil fotoğrafını yükle
  useEffect(() => {
    if (currentUser?.profile_image_url) {
      setProfileImage(currentUser.profile_image_url);
    } else {
      // Fallback: Local storage'dan yükle
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
      loadProfileImage();
    }
  }, [currentUser]);

  useEffect(() => {
    loadUserInfo();
    
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.elastic(1),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentUser]); // currentUser dependency eklendi

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    
    await loadUserInfo();
    
    // Profil fotoğrafını da force refresh
    if (currentUser?.profile_image_url) {
      setProfileImage(currentUser.profile_image_url);
    } else {
      // Fallback: Local storage'dan yükle
      try {
        const localProfileImage = await storage.getItem('profile_image_url');
        if (localProfileImage) {
          setProfileImage(localProfileImage);
        }
      } catch (error) {
      }
    }
    
    setRefreshing(false);
  }, [currentUser]);

  const handleUpgradeToPremium = () => {
    navigation.navigate('PaywallScreen', { source: 'settings' });
  };

  const LockIcon = ({ size = 20 }: { size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z"
        fill="none"
        stroke={colors.textSecondary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11"
        fill="none"
        stroke={colors.textSecondary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const CheckIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" fill="#10B981" />
      <Path
        d="M16 9L11 14L8 11"
        stroke="#FFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );

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
        keyboardShouldPersistTaps="handled"
        bounces={true}
        alwaysBounceVertical={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Profile Section */}
        <Animated.View 
          style={[
            styles.profileSection, 
            { 
              backgroundColor: colors.background,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
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
            onPress={() => setIsPlayerBadgeVisible(true)}
          >
            <Image
              source={profileImage ? { uri: profileImage } : require('../assets/logo.png')}
              style={[
                styles.avatar,
                !profileImage && { tintColor: currentTheme === 'light' ? colors.primary : colors.text }
              ]}
            />
          </TouchableOpacity>
          <Text style={[styles.userName, { color: colors.text }]}>{userInfo?.display_name || 'Kullanıcı'}</Text>
          <View style={[
            styles.levelBadge,
            { 
              borderColor: getLevelColor(userInfo?.skill_level || 'Bronze'),
              backgroundColor: colors.card,
              ...Platform.select({
                ios: {
                  shadowColor: getLevelColor(userInfo?.skill_level || 'Bronze'),
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                },
                android: {
                  elevation: 3,
                },
              }),
            }
          ]}>
            <Image 
              source={require('../assets/badges/bronze.png')}
              style={styles.badgeIcon}
            />
            <Text style={[
              styles.levelText,
              { color: colors.text }
            ]}>{userInfo?.skill_level || 'Bronze'} Level</Text>
          </View>
        </Animated.View>

        {/* Player Badge Modal */}
        <PlayerBadgeModal
          visible={isPlayerBadgeVisible}
          onClose={() => setIsPlayerBadgeVisible(false)}
          playerName={userInfo?.display_name || 'Kullanıcı'}
          playerImage={profileImage ? { uri: profileImage } : require('../assets/logo.png')}
          overallRating={0}
          stats={{
            biceps: 0,
            triceps: 0,
            shoulder: 0,
            chest: 0,
            back: 0,
            leg: 0,
          }}
        />

        {/* Premium Upgrade Card */}
        <Animated.View 
          style={[
            styles.premiumCard, 
            { 
              backgroundColor: colors.card,
              borderColor: colors.border,
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim
            }
          ]}
        >
          
          <View style={styles.premiumHeader}>
              <View style={[styles.premiumBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.premiumBadgeText}>{t('general_pro_badge')}</Text>
              </View>
              <Text style={[styles.premiumTitle, { color: colors.text }]}>
                {t('stats_premium_title') || 'Premium Required'}
              </Text>
            </View>
          
          <Text style={[styles.premiumDescription, { color: colors.textSecondary }]}>
            {t('stats_premium_description') || 'Upgrade to premium membership to see your detailed statistics'}
          </Text>

          <LottieView
            source={require('../assets/lotties/ai.json')}
            autoPlay
            loop
            style={styles.premiumLottie}
          />

          <View style={styles.premiumFeatures}>
            {[
              t('stats_feature_overall_rating') || 'Overall Rating display',
              t('stats_feature_detailed_analytics') || 'Detailed analysis reports',
              t('stats_feature_muscle_progress') || 'Muscle group progress tracking',
              t('stats_feature_unlimited_access') || 'Unlimited data access'
            ].map((feature, index) => (
              <Animated.View 
                key={index}
                style={[
                  styles.featureItem,
                  {
                    opacity: fadeAnim,
                    transform: [{
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, index * 10],
                      })
                    }]
                  }
                ]}
              >
                <CheckIcon />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  {feature}
                </Text>
              </Animated.View>
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
            onPress={handleUpgradeToPremium}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.upgradeButtonText, 
              { 
                color: currentTheme === 'dark' ? '#FFFFFF' : colors.background 
              }
            ]}>
              {t('stats_get_premium') || 'Get Premium'}
            </Text>
            <Svg width="20" height="20" viewBox="0 0 24 24" style={{ marginLeft: 8 }}>
              <Path
                d="M5 12H19M19 12L13 6M19 12L13 18"
                stroke={currentTheme === 'dark' ? '#FFFFFF' : colors.background}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </TouchableOpacity>
        </Animated.View>

        {/* Info Card - Always Visible */}
        <Animated.View 
          style={[
            styles.infoCard,
            { 
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.lottieContainer}>
            <LottieView
              source={require('../assets/lotties/stats.json')}
              autoPlay
              loop
              style={styles.lottie}
            />
          </View>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{t('stats_overall_rating_title')}</Text>
          <Text style={[styles.modalText, { color: colors.text }]}>
            {t('stats_overall_rating_intro')}
          </Text>
          <View style={styles.bulletPoints}>
            <Text style={[styles.bulletPoint, { color: colors.text }]}>{t('stats_overall_rating_point1')}</Text>
            <Text style={[styles.bulletPoint, { color: colors.text }]}>{t('stats_overall_rating_point2')}</Text>
            <Text style={[styles.bulletPoint, { color: colors.text }]}>{t('stats_overall_rating_point3')}</Text>
          </View>
          <Text style={[styles.modalText, { color: colors.text }]}>
            {t('stats_overall_rating_conclusion')}
          </Text>
        </Animated.View>

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
    minHeight: '100%',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    borderRadius: 50,
    borderWidth: 2,
  },
  badgeIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  levelText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  premiumCard: {
    marginHorizontal: 20,
    marginBottom: 32,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#efefef',
  },
  premiumHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
    fontFamily: 'Outfit',
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  premiumBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: 'Outfit',
  },
  premiumDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    fontWeight: '500',
    fontFamily: 'Outfit',
  },
  premiumFeatures: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 4,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 12,
    fontWeight: '500',
    flex: 1,
    fontFamily: 'Outfit',
  },
  upgradeButton: {
    paddingVertical: 16,
    paddingHorizontal: 84,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Outfit',
  },
  premiumLottie: {
    width: 160,
    height: 160,
    marginBottom: 16,
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 32,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#efefef',
  },
  lottieContainer: {
    height: 160,
    width: '100%',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Outfit',
  },
  modalText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    fontWeight: '400',
    textAlign: 'center',
    fontFamily: 'Outfit',
  },
  bulletPoints: {
    width: '100%',
    marginVertical: 12,
    paddingHorizontal: 8,
  },
  bulletPoint: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 8,
    fontWeight: '500',
    fontFamily: 'Outfit',
  },
});

export default StatsScreenForFreemium; 