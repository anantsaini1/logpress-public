import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;

interface PlayerStats {
  biceps: number;
  triceps: number;
  shoulder: number;
  chest: number;
  back: number;
  leg: number;
}

interface PlayerBadgeModalProps {
  visible: boolean;
  onClose: () => void;
  playerName: string;
  playerImage: any;
  overallRating: number;
  stats: PlayerStats;
}

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

const getLevel = (rating: number): string => {
  if (rating < 20) return 'Bronze';
  if (rating < 40) return 'Silver';
  if (rating < 60) return 'Gold';
  if (rating < 80) return 'Platinum';
  if (rating < 90) return 'Diamond';
  return 'Champion';
};

const StatItem = ({ label, value, levelColor }: { label: string; value: number, levelColor: string }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.statItem, { 
      backgroundColor: colors.card,
      borderColor: colors.border
    }]}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.text }]}>{label}</Text>
      <View style={[styles.statBar, { width: `${value}%`, backgroundColor: levelColor }]} />
    </View>
  );
};

const PlayerBadgeModal: React.FC<PlayerBadgeModalProps> = ({
  visible,
  onClose,  
  playerName,
  playerImage,
  overallRating,
  stats,
}) => {
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const level = getLevel(overallRating);
  const levelColor = getLevelColor(level);
  
  // Debug için stats değerlerini kontrol et
  React.useEffect(() => {
    if (visible) {
    }
  }, [visible, stats, overallRating]);
  const translatedLevelName = t('player_badge_level_' + level.toLowerCase());
  const levelText = t('player_badge_level').replace('{level}', translatedLevelName);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={[styles.cardContainer, { backgroundColor: colors.background }]}>
            <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.border }]} onPress={onClose}>
              <Svg width="20" height="20" viewBox="0 0 24 24">
                <Path
                  d="M6 6l12 12M6 18L18 6"
                  stroke={colors.text}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </Svg>
            </TouchableOpacity>

            <View style={styles.playerSection}>
              <View style={[styles.imageContainer, { 
                backgroundColor: colors.card,
                borderColor: colors.border,
              }]}>
                <Image
                  source={playerImage}
                  style={[
                    styles.playerImage,
                    // Sadece light mode'da ve playerImage'da uri yok ise tintColor ekle
                    !playerImage.uri && currentTheme === 'light' && { tintColor: colors.primary }
                  ]}
                />
              </View>
              <View style={[styles.nameRow, {
                padding: 12,
                paddingHorizontal: 20,
              }]}>
                <Text style={[styles.playerName, { color: colors.text }]}>{playerName}</Text>
              </View>
              <View style={styles.ratingContainer}>
                <Text style={[styles.rating, { color: levelColor }]}>{overallRating}</Text>
                <Text style={[styles.ratingLabel, { color: colors.text }]}>{t('player_badge_overall_rating')}</Text>
              </View>
              <View style={[styles.levelBadge, { 
                backgroundColor: colors.card,
                borderColor: colors.border
              }]}>
                <Image 
                  source={
                    level === 'Bronze' ? require('../assets/badges/bronze.png') :
                    level === 'Silver' ? require('../assets/badges/silver.png') :
                    level === 'Gold' ? require('../assets/badges/gold.png') :
                    level === 'Platinum' ? require('../assets/badges/platinum.png') :
                    level === 'Diamond' ? require('../assets/badges/diamond.png') :
                    require('../assets/badges/champion.png')
                  }
                  style={{width: 16, height: 16, marginRight: 4}}
                />
                <Text style={[styles.levelText, { color: colors.text }]}>{levelText}</Text>
              </View>
            </View>

            <View style={styles.statsSection}>
              <View style={styles.statsRow}>
                <StatItem label={t('player_badge_stat_biceps')} value={stats.biceps} levelColor={levelColor} />
                <StatItem label={t('player_badge_stat_triceps')} value={stats.triceps} levelColor={levelColor} />
              </View>
              <View style={styles.statsRow}>
                <StatItem label={t('player_badge_stat_shoulder')} value={stats.shoulder} levelColor={levelColor} />
                <StatItem label={t('player_badge_stat_leg')} value={stats.leg} levelColor={levelColor} />
              </View>
              <View style={styles.statsRow}>
                <StatItem label={t('player_badge_stat_chest')} value={stats.chest} levelColor={levelColor} />
                <StatItem label={t('player_badge_stat_back')} value={stats.back} levelColor={levelColor} />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: CARD_WIDTH,
    maxWidth: 400,
    borderRadius: 32,
    overflow: 'hidden',
  },
  cardContainer: {
    width: '100%',
    borderRadius: 32,
    padding: 24,
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
  },
  playerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  imageContainer: {
    width: SCREEN_WIDTH * 0.28,
    height: SCREEN_WIDTH * 0.28,
    borderRadius: SCREEN_WIDTH * 0.14,
    borderWidth: 3,
    marginBottom: 16,
    padding: 4,
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
  },
  playerImage: {
    width: '100%',
    height: '100%',
    borderRadius: SCREEN_WIDTH * 0.14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  playerName: {
    fontSize: 28,
    fontWeight: '700',
  },
  flag: {
    width: 24,
    height: 16,
    borderRadius: 4,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  rating: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 56,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  levelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsSection: {
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    opacity: 0.3,
  },
  shareButton: {
    alignSelf: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});

export default PlayerBadgeModal; 