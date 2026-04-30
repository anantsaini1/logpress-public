import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

interface PointsScreenProps {
  navigation: NavigationProp<any>;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;

const PointsScreen: React.FC<PointsScreenProps> = ({ navigation }) => {
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();

  // SVG Icons
  const DumbbellIcon = ({ color = colors.primary }: { color?: string }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path d="M6.5 12H17.5M4 9V15M20 9V15M2 10V14M22 10V14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );

  const FireIcon = ({ color = colors.primary }: { color?: string }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C8 2 5 5 5 9C5 12 6 14 8 16C10 18 12 19 12 22C12 19 14 18 16 16C18 14 19 12 19 9C19 5 16 2 12 2Z" fill={color} stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M12 6C10 6 8.5 7.5 8.5 9.5C8.5 11.5 10 13 10 15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </Svg>
  );

  const MuscleIcon = ({ color = colors.primary }: { color?: string }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path d="M6 12C6 10 8 8 10 8C11 8 12 8.5 12 9.5C12 8.5 13 8 14 8C16 8 18 10 18 12C18 14 16 16 14 16C13 16 12 15.5 12 14.5C12 15.5 11 16 10 16C8 16 6 14 6 12Z" fill={color}/>
      <Circle cx="8.5" cy="10.5" r="1.5" fill="white"/>
      <Circle cx="15.5" cy="10.5" r="1.5" fill="white"/>
    </Svg>
  );

  const TargetIcon = ({ color = colors.primary }: { color?: string }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
      <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2"/>
      <Circle cx="12" cy="12" r="2" fill={color}/>
    </Svg>
  );

  const TrophyIcon = ({ color = colors.primary }: { color?: string }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path d="M6 9H4.5C3.67157 9 3 9.67157 3 10.5V12C3 13.1046 3.89543 14 5 14H6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M18 9H19.5C20.3284 9 21 9.67157 21 10.5V12C21 13.1046 20.1046 14 19 14H18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M8 21L16 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M12 17L12 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M6 3H18V14C18 15.1046 17.1046 16 16 16H8C6.89543 16 6 15.1046 6 14V3Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );

  const pointItems = [
    {
      title: t('points_workout_completion_title'),
      description: t('points_workout_completion_description'),
      icon: <DumbbellIcon color="#FF6B6B" />,
      backgroundColor: '#FF6B6B15'
    },
    {
      title: t('points_regular_workout_title'),
      description: t('points_regular_workout_description'),
      icon: <FireIcon color="#4FACFE" />,
      backgroundColor: '#4FACFE15'
    },
    {
      title: t('points_muscle_development_title'),
      description: t('points_muscle_development_description'),
      icon: <MuscleIcon color="#43E97B" />,
      backgroundColor: '#43E97B15'
    },
    {
      title: t('points_exercise_variety_title'),
      description: t('points_exercise_variety_description'),
      icon: <TargetIcon color="#FA709A" />,
      backgroundColor: '#FA709A15'
    },
    {
      title: t('points_level_progression_title'),
      description: t('points_level_progression_description'),
      icon: <TrophyIcon color="#F6D365" />,
      backgroundColor: '#F6D36515'
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Text style={[styles.backText, { color: colors.text }]}>{'<'}</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('points_screen_title')}</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      {/* Points Cards */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardsContainer}>
          {pointItems.map((item, index) => (
            <View 
              key={index} 
              style={[
                styles.pointCard,
                { 
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                }
              ]}
            >
              {/* Icon Container */}
              <View style={[styles.iconContainer, { backgroundColor: item.backgroundColor }]}>
                {item.icon}
              </View>

              {/* Content */}
              <View style={styles.cardContent}>
                <Text style={[styles.pointTitle, { color: colors.text }]}>
                  {item.title}
                </Text>
                <Text style={[styles.pointDescription, { color: colors.textSecondary }]}>
                  {item.description}
                </Text>
              </View>
            </View>
          ))}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  cardsContainer: {
    padding: 16,
  },
  pointCard: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  pointTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  pointDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
});

export default PointsScreen; 