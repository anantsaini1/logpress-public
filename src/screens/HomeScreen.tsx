import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
  Platform,
  RefreshControl,
  StatusBar,
} from 'react-native';
import LottieView from 'lottie-react-native';
import Svg, { Circle, Path, G, Text as SvgText } from 'react-native-svg';
import { NavigationProp } from '@react-navigation/native';
import { Program } from '../services/api';
import { SvgXml } from 'react-native-svg';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { refreshUser, clearError } from '../store/slices/userSlice';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useToastService } from '../services/toast';
import { storage } from '../services/storage';
import { useTranslation } from 'react-i18next';

interface HomeScreenProps {
  navigation: NavigationProp<any>;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { colors, currentTheme } = useTheme();
  const { setUserRoleId } = useUser();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const toast = useToastService();
  
  // 🚀 Redux'dan instant user data al
  const { user, loading, error, initialized } = useSelector((state: RootState) => state.user);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [weeklyData, setWeeklyData] = useState([
    { day: t('day_monday_short'), value: 0 },
    { day: t('day_tuesday_short'), value: 0 },
    { day: t('day_wednesday_short'), value: 0 },
    { day: t('day_thursday_short'), value: 0 },
    { day: t('day_friday_short'), value: 0 },
    { day: t('day_saturday_short'), value: 0 },
    { day: t('day_sunday_short'), value: 0 },
  ]);

  // Redux'dan gelen user data
  const userName = user?.display_name || user?.name || t('default_user_name');
  const userPoint = user?.ls_score || 0;
  const leaderboardPoints = user?.leaderboard_points || 0;

  // Error handling (storage-rules'a göre)
  useEffect(() => {
    if (error) {
      toast.showToast('error', error);
      dispatch(clearError());
    }
  }, [error, dispatch, toast]);

  // User role context'e set et
  useEffect(() => {
    if (user?.user_role_id) {
      setUserRoleId(user.user_role_id);
    }
  }, [user?.user_role_id, setUserRoleId]);

  // Haftalık workout verilerini yükle
  useEffect(() => {
    loadWeeklyWorkoutData();
  }, []);

  const loadWeeklyWorkoutData = async () => {
    try {
      // Bu haftanın başlangıç ve bitiş tarihlerini hesapla
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Pazar, 1 = Pazartesi, ...
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Pazartesi'yi hafta başı olarak al
      const monday = new Date(today.setDate(diff));
      monday.setHours(0, 0, 0, 0);

      // Completed workouts'ları al
      const completedWorkouts = await storage.getUserWorkouts();
      
      // Bu hafta için her günün verilerini hesapla
      const weekData = [];
      const dayNames = [
        t('day_monday_short'),
        t('day_tuesday_short'), 
        t('day_wednesday_short'),
        t('day_thursday_short'),
        t('day_friday_short'),
        t('day_saturday_short'),
        t('day_sunday_short')
      ];

      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(monday);
        currentDay.setDate(monday.getDate() + i);
        currentDay.setHours(0, 0, 0, 0);
        
        const nextDay = new Date(currentDay);
        nextDay.setDate(currentDay.getDate() + 1);

        // Bu güne ait workout'ları filtrele
        const dayWorkouts = completedWorkouts.filter(workout => {
          const workoutDate = new Date(workout.completedAt);
          return workoutDate >= currentDay && workoutDate < nextDay;
        });

        // Toplam süreyi hesapla (saniye → dakika)
        const totalMinutes = dayWorkouts.reduce((total, workout) => {
          return total + (workout.duration / 60); // duration saniye cinsinden
        }, 0);

        weekData.push({
          day: dayNames[i],
          value: totalMinutes / 60 // Grafikte saat cinsinden gösterebilmek için 60'a böl
        });
      }

      setWeeklyData(weekData);
    } catch (error) {
      console.error('Error loading weekly workout data:', error);
    }
  };



  const onRefresh = async () => {
    setRefreshing(true);
    // User data ve haftalık workout verilerini refresh et
    await Promise.all([
      dispatch(refreshUser() as any),
      loadWeeklyWorkoutData()
    ]);
    setRefreshing(false);
  };

  const handleProgramSelect = (program: Program) => {
    navigation.navigate('WorkoutProgram', {
      title: program.name,
      weeks: 4, // Varsayılan değer
      daysPerWeek: 3, // Varsayılan değer
      workoutsCount: program.routine_count || 3,
      description: program.description || ''
    });
  };

  const WeeklyChart = ({ data }: { data: { day: string; value: number }[] }) => {
    const dataMaxValue = Math.max(...data.map(d => d.value));
    // Dinamik max value hesapla (saat cinsinden)
    let maxValue = 1; // Minimum 1 saat göster
    if (dataMaxValue > 2) maxValue = 3;
    else if (dataMaxValue > 1.5) maxValue = 2;
    else if (dataMaxValue > 1) maxValue = 1.5;
    else if (dataMaxValue > 0.5) maxValue = 1;
    
    const chartWidth = SCREEN_WIDTH - 60;
    const chartHeight = SCREEN_WIDTH * 0.6;
    const yAxisWidth = 50;
    const yAxisValues = Array.from({ length: 5 }, (_, i) => (maxValue / 4) * i);
    const gridHeight = chartHeight - 50;
    const availableWidth = chartWidth - yAxisWidth - 20;
    const barCount = data.length;
    const totalSpacing = availableWidth * 0.3;
    const barWidth = (availableWidth - totalSpacing) / barCount;
    const barSpacing = totalSpacing / (barCount - 1);

    const formatDuration = (hours: number) => {
      const minutes = Math.round(hours * 60);
      return `${minutes}${t('time_minutes_short_unit')}`;
    };

    return (
              <View style={[styles.barChartContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.yAxisContainer, { width: yAxisWidth }]}>
          {yAxisValues.reverse().map((value, index) => (
            <View key={index} style={styles.yAxisLabelContainer}>
              <Text style={[styles.yAxisLabel, { color: colors.textSecondary }]}>
                {formatDuration(value)}
              </Text>
            </View>
          ))}
        </View>

        <Svg width={chartWidth - yAxisWidth} height={chartHeight}>
          {yAxisValues.map((_, index) => {
            const y = (index * gridHeight) / (yAxisValues.length - 1);
            return (
              <Path
                key={`grid-${index}`}
                d={`M 0 ${y + 15} H ${chartWidth - yAxisWidth}`}
                stroke={`${colors.primary}15`}
                strokeWidth="1"
                strokeDasharray="3,3"
              />
            );
          })}

          {data.map((item, index) => {
            const barHeight = (item.value / maxValue) * (gridHeight - 20);
            const x = index * (barWidth + barSpacing);
            const isHighValue = item.value > 0.5;
            
            return (
              <G key={index}>
                <Path
                  d={`M ${x} ${chartHeight - barHeight - 35} 
                     q 6 0 6 -6 
                     h ${barWidth - 12} 
                     q 6 0 6 6 
                     v ${barHeight}
                     h -${barWidth} Z`}
                  fill={item.value > 0 ? colors.primary : `${colors.primary}20`}
                />
                <SvgText
                  x={x + (barWidth / 2)}
                  y={chartHeight - 15}
                  fill={colors.textSecondary}
                  fontSize={SCREEN_WIDTH * 0.032}
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {item.day}
                </SvgText>
                {item.value > 0 && (
                  <SvgText
                    x={x + (barWidth / 2)}
                    y={chartHeight - barHeight - 45}
                    fill={isHighValue ? '#fff' : colors.textSecondary}
                    fontSize={SCREEN_WIDTH * 0.028}
                    textAnchor="middle"
                    fontWeight="700"
                  >
                    {formatDuration(item.value)}
                  </SvgText>
                )}
              </G>
            );
          })}
        </Svg>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <View style={styles.headerContent}>
            <View>
              <View style={styles.greetingContainer}>
                <Text style={[styles.greeting, { color: colors.text }]}>
                  <Text style={[styles.greetingHighlight, { color: colors.primary }]}>{t('home_greeting')} </Text>
                  {userName}
                </Text>
              </View>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('home_subtitle')}</Text>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
          <TouchableOpacity 
            style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('LeaderboardScreen' as never)}
          >
            <Text style={[styles.statsTitle, { color: colors.textSecondary }]}>{t('leaderboard_points')}</Text>
            <Text style={[styles.statsValue, { color: colors.primary }]}>{leaderboardPoints.toLocaleString()}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('BadgesScreen' as never)}
          >
            <Text style={[styles.statsTitle, { color: colors.textSecondary }]}>{t('badges')}</Text>
            <View style={[styles.badgeContainer, { backgroundColor: 'transparent' }]}>
              <View style={styles.badgeRow}>
                <Image 
                  source={require('../assets/badges/silver.png')}
                  style={styles.badge}
                  resizeMode="contain"
                />
                <Image 
                  source={require('../assets/badges/gold.png')}
                  style={styles.badge}
                  resizeMode="contain"
                />
                <Image 
                  source={require('../assets/badges/champion.png')}
                  style={styles.badge}
                  resizeMode="contain"
                />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border, minWidth: 120 }]}
            onPress={() => navigation.navigate('PointsScreen' as never)}
          >
            <Text style={[styles.statsTitle, { color: colors.textSecondary }]}>{t('earn_points')}</Text>
            <Text style={[styles.statsValue, { color: colors.primary }]}>?</Text>
            <Text style={[styles.statsSubtitle, { color: colors.textSecondary }]}>{t('click_for_info')}</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Weekly Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('weekly_activity')}</Text>
          <WeeklyChart data={weeklyData} />
        </View>

        {/* Daily Quest */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontWeight: '800' }]}>{t('daily_tasks')}</Text>
          <View style={{ alignItems: 'center' }}>
            <LottieView
              source={require('../assets/lotties/monkey.json')}
              autoPlay
              loop
              style={styles.questLottie}
            />
            <Text style={[styles.questText, { color: colors.textSecondary }]}>
              {t('no_daily_tasks')}
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  greeting: {
    fontFamily: 'Outfit',
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  greetingHighlight: {
    fontFamily: 'Outfit',
    fontWeight: '700',
    color: '#E11D48',
  },
  subtitle: {
    fontFamily: 'Outfit',
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  statsScroll: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 140,
    borderWidth: 1,
  },
  statsTitle: {
    fontFamily: 'Outfit',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  statsValue: {
    fontFamily: 'Outfit',
    fontSize: 28,
    fontWeight: '800',
    color: '#E11D48',
    marginTop: 12,
    marginBottom: 2,
  },
  statsSubtitle: {
    fontFamily: 'Outfit',
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  badgeContainer: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    marginLeft: -4,
  },
  badge: {
    width: 32,
    height: 32,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    marginBottom: 12,
  },
  chartCard: {
    borderRadius: 16,
    padding: 8,
    marginTop: 8,
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
  questContent: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  questLottie: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  questText: {
    fontFamily: 'Outfit',
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  barChartContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    height: SCREEN_WIDTH * 0.6,
    borderRadius: 16,
    borderWidth: 1,
  },
  yAxisContainer: {
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 12,
    paddingVertical: 15,
  },
  yAxisLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  yAxisLabel: {
    fontSize: SCREEN_WIDTH * 0.033,
    fontFamily: 'Outfit',
  },
});

export default HomeScreen; 