import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useToastService } from '../services/toast';
import { supabase } from '../services/supabase';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LeaderboardEntry {
  user_id: string;
  points: number;
  workout_count: number;
  streak_days: number;
  rank: number;
  display_name: string;
  avatar_url: string | null;
  last_workout_date: string;
}

interface LeaderboardScreenProps {
  navigation: NavigationProp<RootStackParamList>;
}

const TopThreeItem = ({ entry, position, navigation }: { entry: LeaderboardEntry, position: number, navigation: NavigationProp<RootStackParamList> }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const isFirst = position === 1;
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const isCurrentUser = entry.user_id === currentUserId;
  
  return (
    <TouchableOpacity 
      style={[
        styles.topThreeItem,
        isFirst && styles.firstPlaceItem,
        isCurrentUser && { transform: [{ scale: isFirst ? 1.15 : 0.95 }] }
      ]}
      onPress={() => navigation.navigate('LeaderboardProfile', { 
        userId: entry.user_id,
        display_name: entry.display_name || t('leaderboard_anonymous_user'),
        avatar_url: entry.avatar_url
      })}
    >
      <View style={[
        styles.topThreeAvatar,
        { 
          borderColor: isCurrentUser ? '#F43F5E' : colors.cardBorder,
          borderWidth: isCurrentUser ? 3 : 2
        },
        isFirst && styles.firstPlaceAvatar
      ]}>
        <Image 
          source={entry.avatar_url ? { uri: entry.avatar_url } : require('../assets/logo.png')} 
          style={[
            styles.avatarImage,
            isFirst && styles.firstPlaceAvatarImage
          ]}
        />
      </View>
      <View style={styles.medalContainer}>
        {position === 1 && <Text style={styles.medalEmoji}>🥇</Text>}
        {position === 2 && <Text style={styles.medalEmoji}>🥈</Text>}
        {position === 3 && <Text style={styles.medalEmoji}>🥉</Text>}
      </View>
      <Text style={[
        styles.topThreeName,
        { color: isCurrentUser ? '#F43F5E' : colors.text },
        isFirst && styles.firstPlaceName
      ]} numberOfLines={1}>
        {entry.display_name || t('leaderboard_anonymous_user')}
      </Text>
      <Text style={[
        styles.topThreePoints,
        { color: isCurrentUser ? '#F43F5E' : colors.textSecondary },
        isFirst && styles.firstPlacePoints
      ]}>
        {entry.points} {t('leaderboard_points_suffix')}
      </Text>
    </TouchableOpacity>
  );
};

const LeaderboardContent: React.FC<LeaderboardScreenProps> = ({ navigation }) => {
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const { showError, showInfo } = useToastService();
  const [selectedTab, setSelectedTab] = useState<'all' | 'friends'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    fetchLeaderboardData();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchLeaderboardData = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select(`
          user_id,
          points,
          workout_count,
          streak_days,
          last_workout_date,
          display_name,
          avatar_url,
          ispremium
        `)
        .order('points', { ascending: false });

      if (error) {
        console.error('Leaderboard error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        setLeaderboardData([]);
        return;
      }

      // Rank'i manuel hesapla ve verileri düzenle
      const processedData: LeaderboardEntry[] = data.map((item: any, index: number) => ({
        user_id: item.user_id,
        points: item.points,
        workout_count: item.workout_count,
        streak_days: item.streak_days,
        last_workout_date: item.last_workout_date,
        rank: index + 1,
        display_name: item.display_name || t('leaderboard_anonymous_user'),
        avatar_url: item.avatar_url,
      }));

      setLeaderboardData(processedData);
    } catch (error) {
      console.error('Fetch error:', error);
      showError(t('leaderboard_loading_error'));
      setLeaderboardData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFriendsTabPress = () => {
    showInfo(t('leaderboard_coming_soon'));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboardData();
    setRefreshing(false);
  };

  const renderTopThree = () => {
    if (leaderboardData.length === 0) return null;
    
    // En fazla 3 kullanıcıyı al, az olsa bile göster
    const topUsers = leaderboardData.slice(0, Math.min(3, leaderboardData.length));

    return (
      <View style={[styles.topThreeContainer, { backgroundColor: colors.card }]}>
        <View style={styles.topThreeLayout}>
          {/* İkinci (eğer varsa) */}
          {topUsers[1] && (
            <View style={styles.secondPlace}>
              <TopThreeItem entry={topUsers[1]} position={2} navigation={navigation} />
            </View>
          )}
          
          {/* Birinci (her zaman var) */}
          <View style={styles.firstPlace}>
            <TopThreeItem entry={topUsers[0]} position={1} navigation={navigation} />
          </View>
          
          {/* Üçüncü (eğer varsa) */}
          {topUsers[2] && (
            <View style={styles.thirdPlace}>
              <TopThreeItem entry={topUsers[2]} position={3} navigation={navigation} />
            </View>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Text style={[styles.backText, { color: colors.text }]}>{'<'}</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('leaderboard_title')}</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            selectedTab === 'all' && styles.selectedTab
          ]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'all' && styles.selectedTabText
          ]}>{t('leaderboard_all_members')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tabButton,
            selectedTab === 'friends' && styles.selectedTab
          ]}
          onPress={handleFriendsTabPress}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'friends' && styles.selectedTabText
          ]}>{t('leaderboard_friends')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {renderTopThree()}
        
        {/* Alt liste: Sadece 3'ten fazla kullanıcı varsa göster */}
        {leaderboardData.length > 3 && leaderboardData.slice(3).map((entry, index) => (
          <TouchableOpacity
            key={entry.user_id}
            style={[
              styles.listItem, 
              { 
                backgroundColor: index % 2 === 0 ? colors.card : colors.cardAlt
              }
            ]}
            onPress={() => navigation.navigate('LeaderboardProfile', { 
              userId: entry.user_id,
              display_name: entry.display_name || t('leaderboard_anonymous_user'),
              avatar_url: entry.avatar_url
            })}
          >
            <Text style={[
              styles.rankNumber,
              { color: entry.user_id === currentUserId ? '#F43F5E' : colors.textSecondary }
            ]}>
              {entry.rank}
            </Text>
            <View style={[
              styles.avatarContainer,
              { backgroundColor: colors.card },
              entry.user_id === currentUserId && { borderColor: '#F43F5E' }
            ]}>
              <Image 
                source={entry.avatar_url ? { uri: entry.avatar_url } : require('../assets/logo.png')} 
                style={[
                  styles.avatarImage,
                  !entry.avatar_url && { tintColor: currentTheme === 'light' ? colors.primary : colors.text }
                ]}
              />
            </View>
            <View style={styles.userInfoContainer}>
              <Text style={[
                styles.userName,
                { color: entry.user_id === currentUserId ? '#F43F5E' : colors.text }
              ]}>
                {entry.display_name || t('leaderboard_anonymous_user')}
              </Text>
            </View>
            <Text style={[
              styles.points,
              { color: entry.user_id === currentUserId ? '#F43F5E' : colors.textSecondary }
            ]}>
              {entry.points} {t('leaderboard_points_suffix')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  backButton: {
    width: 24,
  },
  backText: {
    fontSize: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F43F5E',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectedTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#F43F5E',
  },
  tabText: {
    color: '#666',
    fontSize: 16,
  },
  selectedTabText: {
    color: '#F43F5E',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  topThreeContainer: {
    margin: 16,
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  topThreeLayout: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 200,
    paddingBottom: 20,
  },
  firstPlace: {
    zIndex: 3,
    marginBottom: 20,
    transform: [{scale: 1.1}],
  },
  secondPlace: {
    zIndex: 2,
    marginRight: -15,
    marginBottom: 0,
    transform: [{scale: 0.9}],
  },
  thirdPlace: {
    zIndex: 1,
    marginLeft: -15,
    marginBottom: 0,
    transform: [{scale: 0.9}],
  },
  topThreeItem: {
    alignItems: 'center',
    width: 100,
  },
  firstPlaceItem: {
    width: 120,
  },
  topThreeAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  firstPlaceAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  firstPlaceAvatarImage: {
    width: '100%',
    height: '100%',
  },
  medalContainer: {
    marginBottom: 4,
  },
  medalEmoji: {
    fontSize: 20,
  },
  topThreeName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
    width: '100%',
  },
  firstPlaceName: {
    fontSize: 16,
    fontWeight: '700',
  },
  topThreePoints: {
    fontSize: 14,
    fontWeight: '600',
  },
  firstPlacePoints: {
    fontSize: 16,
    fontWeight: '700',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rankNumber: {
    width: 30,
    fontSize: 18,
    fontWeight: '600',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfoContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
  },
  points: {
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 8,
  },
});

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ navigation }) => {
  return <LeaderboardContent navigation={navigation} />;
};

export default LeaderboardScreen; 