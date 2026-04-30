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
  Modal,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, G, Line, Text as SvgText } from 'react-native-svg';
import LottieView from 'lottie-react-native';
import PlayerBadgeModal from '../components/PlayerBadgeModal';
import GitHubStyleCalendar from '../components/GitHubStyleCalendar';
import ProgressTrendsSection from '../components/ProgressTrendsSection';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { storage } from '../services/storage';
import { workoutHistoryService, WorkoutData, CalendarCell } from '../services/workoutHistoryService';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadUserStats, selectUserStats, selectUserLoading, selectUser } from '../store/slices/userSlice';
import { RootState } from '../store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StatsScreenProps {
  navigation: any;
}

interface WeeklyDataItem {
  day: string;
  value: number;
}

// Muscle data artık AI tarafından hesaplanacak

const StatsScreen: React.FC<StatsScreenProps> = ({ navigation }) => {
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  // Redux state
  const userStats = useAppSelector(selectUserStats);
  const isStatsLoading = useAppSelector(selectUserLoading);
  const currentUser = useAppSelector(selectUser);
  


  // Local state
  const [isPlayerBadgeVisible, setIsPlayerBadgeVisible] = useState(false);
  const [displayedValue, setDisplayedValue] = useState('0');
  const [displayedExercises, setDisplayedExercises] = useState('0');
  const [displayedWeight, setDisplayedWeight] = useState('0');
  const [displayedTime, setDisplayedTime] = useState('0');
  const [displayedStreak, setDisplayedStreak] = useState('0');
  const [displayedTotalWeight, setDisplayedTotalWeight] = useState('0');
  const [weightBoxVisible, setWeightBoxVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Workout History states
  const [workoutHistoryData, setWorkoutHistoryData] = useState<WorkoutData[]>([]);
  const [calendarData, setCalendarData] = useState<CalendarCell[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  const scrollViewRef = useRef<ScrollView>(null);
  const weightBoxY = useRef(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const animatedExercises = useRef(new Animated.Value(0)).current;
  const animatedWeight = useRef(new Animated.Value(0)).current;
  const animatedTime = useRef(new Animated.Value(0)).current;
  const animatedStreak = useRef(new Animated.Value(0)).current;
  const animatedTotalWeight = useRef(new Animated.Value(0)).current;

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

  // Load user stats from Redux
  const loadUserStatsFromRedux = async () => {
    try {
      await dispatch(loadUserStats()).unwrap();
    } catch (error) {
      console.error('Redux\'tan stats yüklenirken hata:', error);
    }
  };



  const loadUserInfo = async () => {
    try {
      const storedUserInfo = await storage.getUserInfo();
      // Redux'tan güncel display_name'i al
      const displayName = currentUser?.display_name || storedUserInfo?.display_name || t('stats_user_name') || 'Kullanıcı';

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
        display_name: currentUser?.display_name || t('stats_user_name') || 'Kullanıcı',
        skill_level: 'Bronze'
      });
    }
  };

  const handleScroll = useCallback((event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const screenHeight = Dimensions.get('window').height;

    requestAnimationFrame(() => {
      if (!weightBoxVisible && scrollY + screenHeight > weightBoxY.current - 100) {
        setWeightBoxVisible(true);
        startWeightAnimation();
      }
    });
  }, [weightBoxVisible]);

  const optimizedProps = useMemo(() => ({
    scrollEventThrottle: 32,
    removeClippedSubviews: true,
    maxToRenderPerBatch: 5,
    windowSize: 5,
    onScroll: handleScroll,
    decelerationRate: 'fast' as const,
  }), [handleScroll]);

  const startWeightAnimation = useCallback(() => {
    if (!userStats) return;

    animatedTotalWeight.setValue(0);

    const totalWeight = Math.max(0, userStats.total_weight || 0);

    Animated.timing(animatedTotalWeight, {
      toValue: totalWeight,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [userStats]);

  const animationConfig = useMemo(() => ({
    duration: 800,
    easing: Easing.out(Easing.ease),
    useNativeDriver: false,
  }), []);

  const startMainAnimations = useCallback(() => {
    if (!userStats) return;

    // NaN değerlerini önlemek için her değeri kontrol et ve 0'a çevir
    const targetValue = Math.max(0, userStats.overall_rating || 0);
    const totalExercises = Math.max(0, userStats.total_exercises || 0);
    const totalWeight = Math.max(0, userStats.total_weight || 0);
    const totalTime = Math.max(0, userStats.total_time || 0);
    const currentStreak = Math.max(0, userStats.current_streak || 0);

    const averageWeight = totalExercises > 0 ? Math.round(totalWeight / totalExercises) : 0;



    Animated.parallel([
      Animated.timing(animatedValue, {
        toValue: targetValue,
        ...animationConfig,
      }),
      Animated.timing(animatedExercises, {
        toValue: totalExercises,
        ...animationConfig,
      }),
      Animated.timing(animatedWeight, {
        toValue: averageWeight,
        ...animationConfig,
      }),
      Animated.timing(animatedTime, {
        toValue: totalTime,
        ...animationConfig,
      }),
      Animated.timing(animatedStreak, {
        toValue: currentStreak,
        ...animationConfig,
      }),
    ]).start();
  }, [userStats, animationConfig]);

  const animatedStyles = React.useMemo(() => ({
    ratingProgressFill: {
      transform: [{
        scaleX: animatedValue.interpolate({
          inputRange: [0, 100],
          outputRange: [0, 1],
          extrapolate: 'clamp'
        })
      }],
      width: '100%' as const,
      height: '100%' as const,
      position: 'absolute' as const,
      left: 0,
      right: 0,
      backgroundColor: colors.primary,
      borderRadius: 2
    },
    ratingValue: {
      opacity: 1
    }
  }), [animatedValue, colors.primary]);

  // UseEffects and load functions
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserStatsFromRedux();

      // Profil fotoğrafını da kontrol et
      if (currentUser?.profile_image_url) {
        setProfileImage(currentUser.profile_image_url);
      }
    });
    return unsubscribe;
  }, [navigation, currentUser]);

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

  // İlk yükleme useEffect'i
  useEffect(() => {
    const initializeData = async () => {
      loadUserStatsFromRedux();
      loadUserInfo();
      // loadCompletedWorkouts ve loadWorkoutHistory aşağıda tanımlanacak
    };
    initializeData();
  }, []);

  useEffect(() => {
    const listeners = [
      animatedValue.addListener(({ value }) => {
        const safeValue = isNaN(value) ? 0 : Math.max(0, Math.floor(value));
        setDisplayedValue(safeValue.toString());
      }),
      animatedExercises.addListener(({ value }) => {
        const safeValue = isNaN(value) ? 0 : Math.max(0, Math.floor(value));
        setDisplayedExercises(safeValue.toString());
      }),
      animatedWeight.addListener(({ value }) => {
        const safeValue = isNaN(value) ? 0 : Math.max(0, Math.floor(value));
        setDisplayedWeight(safeValue.toString());
      }),
      animatedTime.addListener(({ value }) => {
        const safeValue = isNaN(value) ? 0 : Math.max(0, Math.floor(value));
        setDisplayedTime(safeValue.toString());
      }),
      animatedStreak.addListener(({ value }) => {
        const safeValue = isNaN(value) ? 0 : Math.max(0, Math.floor(value));
        setDisplayedStreak(safeValue.toString());
      }),
      animatedTotalWeight.addListener(({ value }) => {
        const safeValue = isNaN(value) ? 0 : Math.max(0, Math.floor(value));
        setDisplayedTotalWeight(safeValue.toString());
      }),
    ];

    return () => {
      listeners.forEach((listener, index) => {
        switch (index) {
          case 0: animatedValue.removeListener(listener); break;
          case 1: animatedExercises.removeListener(listener); break;
          case 2: animatedWeight.removeListener(listener); break;
          case 3: animatedTime.removeListener(listener); break;
          case 4: animatedStreak.removeListener(listener); break;
          case 5: animatedTotalWeight.removeListener(listener); break;
        }
      });
      

    };
  }, []);

  useEffect(() => {
    if (userStats) {
      startMainAnimations();
      startWeightAnimation();
    }
  }, [userStats]);





  // Workout History functions
  const loadWorkoutHistory = useCallback(async () => {
    try {
      const workouts = await workoutHistoryService.loadWorkoutData();
      setWorkoutHistoryData(workouts);

      // Generate calendar data for current month
      const calendarCells = workoutHistoryService.generateCalendarData(workouts, currentMonth);
      setCalendarData(calendarCells);
    } catch (error) {
      console.error('Error loading workout history:', error);
    }
    }, [currentMonth]);

  // İlk kez yükleme için useEffect
  useEffect(() => {
    loadWorkoutHistory();
  }, [loadWorkoutHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    await loadUserStatsFromRedux();
    await loadWorkoutHistory(); // Workout history'yi de refresh et

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
        console.error('Refresh profil fotoğrafı yüklenirken hata:', error);
      }
    }

    setRefreshing(false);
  }, [currentUser]);

  // Chart Components
  const BarChart = ({ data }: { data: WeeklyDataItem[] }) => {
    if (!data || data.length === 0) return null;
    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = (SCREEN_WIDTH - 80) / data.length;

    return (
      <View style={styles.barChartContainer}>
        <Svg width={SCREEN_WIDTH - 48} height={120}>
          {data.map((item: WeeklyDataItem, index: number) => {
            const barHeight = (item.value / maxValue) * 100;
            return (
              <G key={index}>
                <Path
                  d={`M ${index * barWidth + 20} ${120 - barHeight} 
                     q 8 0 8 -8 
                     h ${barWidth - 26} 
                     q 8 0 8 8 
                     v ${barHeight} 
                     h -${barWidth - 10} Z`}
                  fill={item.value > 70 ? colors.primary : colors.card}
                />
                <SvgText
                  x={index * barWidth + barWidth / 2 + 10}
                  y={135}
                  fill={colors.textSecondary}
                  textAnchor="middle"
                  fontSize="12"
                >
                  {item.day}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    );
  };

  const RadarChart = useCallback(() => {
    const center = { x: (SCREEN_WIDTH - 64) / 2, y: 150 };
    const radius = 100;

    const getPoint = (angle: number, value: number) => {
      const radian = ((angle - 90) * Math.PI) / 180;
      const distance = (value / 100) * radius;
      return {
        x: center.x + distance * Math.cos(radian),
        y: center.y + distance * Math.sin(radian),
      };
    };

    const getLabelPosition = (angle: number) => {
      const radian = ((angle - 90) * Math.PI) / 180;
      const distance = radius + 30;
      return {
        x: center.x + distance * Math.cos(radian),
        y: center.y + distance * Math.sin(radian),
      };
    };

    // Muscle data AI'dan gelecek - userStats'dan al
    const muscleGroups = userStats?.muscle_groups;
    const muscleValues = [
      { name: t('stats_muscle_shoulder') || 'Omuz', value: muscleGroups?.shoulder || 0 },
      { name: t('stats_muscle_chest') || 'Göğüs', value: muscleGroups?.chest || 0 },
      { name: t('stats_muscle_biceps') || 'Ön Kol', value: muscleGroups?.biceps || 0 },
      { name: t('stats_muscle_triceps') || 'Arka Kol', value: muscleGroups?.triceps || 0 },
      { name: t('stats_muscle_hamstring') || 'Hamstring', value: muscleGroups?.hamstring || 0 },
      { name: t('stats_muscle_calf') || 'Calf', value: muscleGroups?.calf || 0 }
    ];

    const angles = [0, 60, 120, 180, 240, 300];
    const points = muscleValues.map((muscle, i) => getPoint(angles[i], muscle.value));
    const path = points.map((point, i) =>
      i === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
    ).join(' ') + ' Z';

    const getPolygonPath = (percent: number) => {
      const polygonPoints = angles.map(angle => getPoint(angle, percent));
      return polygonPoints.map((point, i) =>
        i === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
      ).join(' ') + ' Z';
    };

    return (
      <View style={[styles.radarContainer, { backgroundColor: colors.card }]}>
        <Svg width={SCREEN_WIDTH - 64} height={300}>
          <Path
            d={getPolygonPath(100)}
            stroke={`${colors.primary}15`}
            strokeWidth="1"
            fill={currentTheme === 'dark' ? colors.card : '#FAFBFC'}
          />

          {[25, 50, 75].map((percent, i) => (
            <Path
              key={i}
              d={getPolygonPath(percent)}
              stroke={`${colors.primary}10`}
              strokeWidth="0.5"
              fill={`${colors.primary}02`}
            />
          ))}

          {angles.map((angle, i) => {
            const point = getPoint(angle, 100);
            return (
              <Line
                key={i}
                x1={center.x}
                y1={center.y}
                x2={point.x}
                y2={point.y}
                stroke={`${colors.primary}10`}
                strokeWidth="0.5"
                strokeDasharray="4,4"
              />
            );
          })}

          <Path
            d={path}
            fill={`${colors.primary}15`}
            stroke={colors.primary}
            strokeWidth="1.5"
          />

          {points.map((point, i) => (
            <Circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="3"
              fill={colors.primary}
            />
          ))}

          {muscleValues.map((muscle, i) => {
            const labelPos = getLabelPosition(angles[i]);
            return (
              <SvgText
                key={i}
                x={labelPos.x}
                y={labelPos.y}
                fill={colors.text}
                textAnchor="middle"
                alignmentBaseline="middle"
                fontSize="12"
                fontWeight="700"
              >
                {muscle.name}
              </SvgText>
            );
          })}

          {muscleValues.map((muscle, i) => {
            const valuePos = getPoint(angles[i], muscle.value + 10);
            return (
              <SvgText
                key={`value-${i}`}
                x={valuePos.x}
                y={valuePos.y}
                fill={colors.primary}
                textAnchor="middle"
                alignmentBaseline="middle"
                fontSize="10"
                fontWeight="600"
              >
                {Math.round(muscle.value)}
              </SvgText>
            );
          })}
        </Svg>
      </View>
    );
  }, [colors, currentTheme]); // muscle_data dependency kaldırıldı, artık AI'dan gelecek

  const MuscleStats = ({ title, value, data }: { title: string; value: number; data: WeeklyDataItem[] }) => (
    <View style={styles.muscleStatsContainer}>
      <View style={styles.muscleStatsHeader}>
        <Text style={[styles.muscleTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.muscleValue, { color: colors.primary }]}>{value}</Text>
      </View>
      <Text style={[styles.pastDaysText, { color: colors.textSecondary }]}>{t('general_past_days')}</Text>
      <BarChart data={data} />
    </View>
  );

  // Return complete JSX
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <ScrollView
        ref={scrollViewRef}
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
        {...optimizedProps}
      >
        {/* Profile Section */}
        <View style={[styles.profileSection, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.avatarContainer, {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 3,
              padding: 8,
              borderRadius: 58,
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
          <Text style={[styles.userName, { color: colors.text }]}>{userInfo?.display_name || t('stats_user_name') || 'Kullanıcı'}</Text>
          <View style={[
            styles.levelBadge,
            {
              borderColor: colors.border,
              backgroundColor: colors.card
            }
          ]}>
            <Image
              source={require('../assets/badges/bronze.png')}
              style={styles.badgeIcon}
            />
            <Text style={[
              styles.levelText,
              { color: colors.text }
            ]}>{userInfo?.skill_level || 'Bronze'} {t('stats_level_text') || 'Level'}</Text>
          </View>
        </View>

        {/* Player Badge Modal */}
        <PlayerBadgeModal
          visible={isPlayerBadgeVisible}
          onClose={() => setIsPlayerBadgeVisible(false)}
          playerName={userInfo?.display_name || 'Kullanıcı'}
          playerImage={profileImage ? { uri: profileImage } : require('../assets/logo.png')}
          overallRating={userStats?.overall_rating || 0}
          stats={{
            biceps: userStats?.muscle_groups?.biceps || 0,
            triceps: userStats?.muscle_groups?.triceps || 0,
            shoulder: userStats?.muscle_groups?.shoulder || 0,
            chest: userStats?.muscle_groups?.chest || 0,
            back: userStats?.muscle_groups?.back || 0,
            leg: userStats?.muscle_groups?.hamstring || 0,
          }}
        />

        {/* Overall Rating */}
        <View style={[styles.ratingSection, {
          backgroundColor: colors.card,
          borderColor: colors.border
        }]}>
          <View style={styles.ratingTitleContainer}>
            <Text style={[
              styles.ratingTitle,
              { color: getLevelColor(userInfo?.skill_level || 'Bronze') }
            ]}>{t('stats_overall_rating') || 'Overall Rating'}</Text>
            <TouchableOpacity
              onPress={() => setIsInfoModalVisible(true)}
              style={[styles.infoButton, { borderColor: colors.textSecondary }]}
            >
              <Text style={[styles.infoIcon, { color: colors.textSecondary }]}>?</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ratingContent}>
            <Animated.View style={[styles.ratingValueContainer, animatedStyles.ratingValue]}>
              <Text style={[styles.ratingValue, { color: getLevelColor(userInfo?.skill_level || 'Bronze') }]}>
                {userStats?.overall_rating ?? 0}
              </Text>
              <View style={[styles.ratingProgress, { backgroundColor: colors.background }]}>
                <Animated.View style={animatedStyles.ratingProgressFill} />
              </View>
            </Animated.View>
            <View style={[styles.ratingDetails, { borderTopColor: colors.border }]}>
              <View style={styles.ratingInfo}>
                <View style={[styles.ratingIconContainer, { backgroundColor: colors.background }]}>
                  <Svg width="24" height="24" viewBox="0 0 24 24">
                    <Path
                      d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
                      fill={colors.primary}
                      stroke={colors.primary}
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <Text style={[styles.ratingInfoLabel, { color: colors.textSecondary }]}>{t('stats_total_exercises') || 'Toplam Egzersiz'} ⚡️</Text>
                <Text style={[styles.ratingInfoValue, { color: colors.text }]}>{displayedExercises}</Text>
              </View>
              <View style={styles.ratingInfo}>
                <View style={[styles.ratingIconContainer, { backgroundColor: colors.background }]}>
                  <Svg width="24" height="24" viewBox="0 0 24 24">
                    <Path
                      d="M5 10H2M22 10H19M5 14H2M22 14H19M6 18H18C19.1046 18 20 17.1046 20 16V8C20 6.89543 19.1046 6 18 6H6C4.89543 6 4 6.89543 4 8V16C4 17.1046 4.89543 18 6 18ZM9 12C9 13.1046 8.10457 14 7 14C5.89543 14 5 13.1046 5 12C5 10.8954 5.89543 10 7 10C8.10457 10 9 10.8954 9 12ZM19 12C19 13.1046 18.1046 14 17 14C15.8954 14 15 13.1046 15 12C15 10.8954 15.8954 10 17 10C18.1046 10 19 10.8954 19 12Z"
                      fill={colors.primary}
                      stroke={colors.primary}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <Text style={[styles.ratingInfoLabel, { color: colors.textSecondary }]}>{t('stats_average_weight') || 'Ortalama Ağırlık'} 🏋️‍♂️</Text>
                <Text style={[styles.ratingInfoValue, { color: colors.text }]}>{displayedWeight} {t('stats_kg_unit') || 'kg'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.background }]}>
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke={colors.primary}
                  strokeWidth="2"
                  fill="none"
                />
                <Path
                  d="M12 6V12L16 14"
                  stroke={colors.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </Svg>
            </View>
            <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{t('stats_time') || 'Time'}</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {displayedTime} {t('stats_minutes_unit') || 'dk'}
            </Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.background }]}>
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
                  fill={colors.primary}
                  stroke={colors.primary}
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{t('stats_streak') || 'Streak'} 🔥</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{displayedStreak}</Text>
          </View>

          <View
            style={[styles.statBox, styles.weightBox, { backgroundColor: colors.card, borderColor: colors.border }]}
            onLayout={(event) => {
              weightBoxY.current = event.nativeEvent.layout.y;
            }}
          >
            <Text style={[styles.weightTitle, { color: colors.text }]}>{t('stats_total_weight_lifted') || 'Kaldırılan Ağırlık'}</Text>
            <View style={styles.weightValueContainer}>
              <Text style={[styles.weightValue, { color: colors.text }]}>{displayedTotalWeight}</Text>
              <Text style={[styles.weightUnit, { color: colors.textSecondary }]}>{t('stats_kg_unit') || 'kg'}</Text>
            </View>
            <Text style={[styles.weightAchievement, { color: colors.textSecondary }]}>
              {Number(displayedTotalWeight) / 100 < 1
                ? (t('stats_weight_achievement_low') || "İyi gidiyorsun! Ama seni daha iyi tanımak istiyoruz. Biraz daha ağırlık ekleyelim mi? 🙃")
                : (t('stats_weight_achievement_high')?.replace('{count}', Math.floor(Number(displayedTotalWeight) / 100).toString()) || `Şu ana kadar ${Math.floor(Number(displayedTotalWeight) / 100)} adet büyük kaplumbağa kaldırdınız! 🐢`)
              }
            </Text>
            <View style={styles.weightLottieContainer}>
              <LottieView
                source={require('../assets/lotties/turtle.json')}
                autoPlay
                loop
                style={styles.lottieAnimation}
              />
            </View>
          </View>
        </View>

        {/* Radar Chart */}
        <View style={[styles.chartContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>{t('stats_chart_title') || 'Chart'}</Text>
          <RadarChart />
        </View>

        {/* Workout History Calendar */}
        {workoutHistoryData.length > 0 ? (
          <GitHubStyleCalendar
            workoutData={calendarData}
            currentMonth={currentMonth}
          />
        ) : (
          <View style={[styles.emptyStateContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <LottieView
              source={require('../assets/lotties/stats.json')}
              autoPlay
              loop
              style={styles.emptyStateLottie}
            />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              {t('workout_history_empty_title') || 'Henüz Workout Geçmişin Yok'}
            </Text>
            <Text style={[styles.emptyStateDescription, { color: colors.textSecondary }]}>
              {t('workout_history_empty_description') || 'İlk antrenmanını tamamladığında burada görünecek!'}
            </Text>
          </View>
        )}

        {/* Progress Trends */}
        <ProgressTrendsSection
          workoutData={workoutHistoryData}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />





        {/* Info Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isInfoModalVisible}
          onRequestClose={() => setIsInfoModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsInfoModalVisible(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <TouchableOpacity
                onPress={() => setIsInfoModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.closeButtonContainer}
              >
                <Text style={[styles.closeButton, { color: colors.text }]}>×</Text>
              </TouchableOpacity>
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
            </View>
          </TouchableOpacity>
        </Modal>

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
    paddingVertical: 24,
  },
  avatarContainer: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  ratingSection: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ratingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  ratingContent: {
    alignItems: 'center',
  },
  ratingValueContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingValue: {
    fontSize: 64,
    fontWeight: '800',
  },
  ratingProgress: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  ratingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 24,
  },
  ratingInfo: {
    alignItems: 'center',
  },
  ratingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ratingInfoLabel: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  ratingInfoValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '30%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  chartContainer: {
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  muscleStatsContainer: {
    marginBottom: 24,
  },
  muscleStatsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  muscleTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  muscleValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  pastDaysText: {
    fontSize: 14,
    marginBottom: 12,
  },
  barChartContainer: {
    height: 120,
  },
  radarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
  },
  weightBox: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  weightTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  weightValueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  weightValue: {
    fontSize: 40,
    fontWeight: '800',
  },
  weightUnit: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 4,
    marginBottom: 6,
  },
  weightAchievement: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  weightLottieContainer: {
    marginTop: 8,
  },
  lottieAnimation: {
    width: 120,
    height: 120,
  },
  infoButton: {
    marginLeft: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  closeButtonContainer: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
  },
  closeButton: {
    fontSize: 24,
    fontWeight: '300',
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
  },
  modalText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    fontWeight: '400',
    textAlign: 'center',
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
  },
  emptyStateContainer: {
    borderRadius: 16,
    padding: 32,
    marginHorizontal: 20,
    marginVertical: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyStateLottie: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default StatsScreen; 