import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';
import { storage } from '../services/storage';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BadgesScreenProps {
  navigation: NavigationProp<RootStackParamList>;
}

const BadgesScreen: React.FC<BadgesScreenProps> = ({ navigation }) => {
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);
  const [skillLevel, setSkillLevel] = useState('');

  const getBadgeLevel = (level: string) => {
    const levels: Record<string, number> = {
      // Turkish levels
      'Bronz': 0,
      'Gümüş': 1,
      'Altın': 2,
      'Platin': 3,
      'Elmas': 4,
      'Şampiyon': 5,
      // English levels
      'Bronze': 0,
      'Silver': 1,
      'Gold': 2,
      'Platinum': 3,
      'Diamond': 4,
      'Champion': 5
    };
    return levels[level] || 0;
  };

  const userBadgeLevel = getBadgeLevel(skillLevel);

  const badges = [
    {
      id: 0,
      title: t('badge_bronze_title'),
      description: t('badge_bronze_description'),
      isUnlocked: userBadgeLevel >= 0,
      icon: require('../assets/badges/bronze.png'),
    },
    {
      id: 1,
      title: t('badge_silver_title'),
      description: t('badge_silver_description'),
      isUnlocked: userBadgeLevel >= 1,
      icon: require('../assets/badges/silver.png'),
    },
    {
      id: 2,
      title: t('badge_gold_title'),
      description: t('badge_gold_description'),
      isUnlocked: userBadgeLevel >= 2,
      icon: require('../assets/badges/gold.png'),
    },
    {
      id: 3,
      title: t('badge_platinum_title'),
      description: t('badge_platinum_description'),
      isUnlocked: userBadgeLevel >= 3,
      icon: require('../assets/badges/platinum.png'),
    },
    {
      id: 4,
      title: t('badge_diamond_title'),
      description: t('badge_diamond_description'),
      isUnlocked: userBadgeLevel >= 4,
      icon: require('../assets/badges/diamond.png'),
    },
    {
      id: 5,
      title: t('badge_champion_title'),
      description: t('badge_champion_description'),
      isUnlocked: userBadgeLevel >= 5,
      icon: require('../assets/badges/champion.png'),
    }
  ];

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const storedUserInfo = await storage.getUserInfo();
      if (storedUserInfo) {
        setUserInfo(storedUserInfo);
        if (storedUserInfo.skill_level !== undefined) {
          setSkillLevel(storedUserInfo.skill_level);
          
          // Kullanıcının seviyesine göre başlangıç rozetini ayarla
          const badgeLevel = getBadgeLevel(storedUserInfo.skill_level);
          setCurrentBadgeIndex(badgeLevel);
        }
      }
    } catch (error) {
      console.error('Kullanıcı bilgileri alınamadı:', error);
    }
  };

  const onBadgeScroll = (event: any) => {
    const slideWidth = SCREEN_WIDTH - 40; // Same as snapToInterval
    const index = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    setCurrentBadgeIndex(Math.max(0, Math.min(index, badges.length - 1)));
  };



  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={[styles.backText, { color: colors.text }]}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('badges_screen_title')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topSection}>
          <Image 
            source={badges[currentBadgeIndex].icon}
            style={styles.mainBadge}
            resizeMode="contain"
          />
        </View>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onBadgeScroll}
          style={styles.badgeScrollView}
          snapToInterval={SCREEN_WIDTH - 60} // Better spacing for container padding
          decelerationRate="fast"
          snapToAlignment="start"
          contentContainerStyle={styles.badgeScrollContent}
        >
          {badges.map((badge) => (
            <View key={badge.id} style={[styles.badgeSlideContainer, { width: SCREEN_WIDTH - 60 }]}>
              <View 
                style={[
                  styles.badgeCard, 
                  { 
                    backgroundColor: colors.card, 
                    borderColor: colors.cardBorder,
                    opacity: badge.isUnlocked ? 1 : 0.5 
                  }
                ]}
              >
                <View style={styles.badgeHeader}>
                  <Text style={[styles.badgeTitle, { color: colors.text }]}>{badge.title}</Text>
                  {badge.isUnlocked ? (
                    <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  ) : (
                    <View style={[styles.lockIcon, { borderColor: colors.textSecondary }]}>
                      <Text style={[styles.lockText, { color: colors.textSecondary }]}>🔒</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.badgeDescription, { color: colors.textSecondary }]}>
                  {badge.isUnlocked ? badge.description : t('badge_locked_description')}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.paginationDots}>
          {badges.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: index === currentBadgeIndex ? colors.primary : colors.cardBorder }
              ]}
            />
          ))}
        </View>

        <View style={styles.rulesSection}>
          <Text style={[styles.rulesTitle, { color: colors.text }]}>{t('badges_rules_title')}</Text>
          <View style={styles.ruleItem}>
            <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
              {t('badges_rule_1')}
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
              {t('badges_rule_2')}
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
              {t('badges_rule_3')}
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
              {t('badges_rule_4')}
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
              {t('badges_rule_5')}
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
  },
  content: {
    flex: 1,
    padding: 20,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mainBadge: {
    width: SCREEN_WIDTH * 0.4,
    height: SCREEN_WIDTH * 0.4,
    marginBottom: 16,
  },
  pointsText: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    fontFamily: 'Inter-ExtraBold',
  },
  userTitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  badgeSlideContainer: {
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  badgeScrollContent: {
    paddingHorizontal: 10,
  },
  badgeCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    marginHorizontal: 8,
  },
  badgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  badgeDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rulesSection: {
    marginTop: 16,
    paddingBottom: 32,
  },
  rulesTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    fontFamily: 'Inter-Bold',
  },
  ruleItem: {
    marginBottom: 16,
  },
  ruleText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  backButton: {
    padding: 8,
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  backText: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  badgeScrollView: {
    marginBottom: 20,
    marginHorizontal: -10,
  },
  lockIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  lockText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default BadgesScreen; 