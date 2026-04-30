import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TabStackParamList } from '../../navigation/TabNavigator';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<TabStackParamList, 'WorkoutProgram'>;

const WorkoutProgramScreen = ({ navigation, route }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { title, weeks, daysPerWeek, workoutsCount, description } = route.params;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: colors.text }]}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>{description}</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('workout_program_weeks') || 'Hafta'}</Text>
              <Text style={[styles.infoValue, { color: colors.primary }]}>{weeks}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('workout_program_days_per_week') || 'Gün/Hafta'}</Text>
              <Text style={[styles.infoValue, { color: colors.primary }]}>{daysPerWeek}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('workout_program_workouts') || 'Antrenman'}</Text>
              <Text style={[styles.infoValue, { color: colors.primary }]}>{workoutsCount}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('CreateWorkout', {})}
        >
          <Text style={styles.startButtonText}>{t('workout_program_start') || 'Antrenmana Başla'}</Text>
        </TouchableOpacity>
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
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Outfit',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'Outfit',
  },
  infoDescription: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
    fontFamily: 'Outfit',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'Outfit',
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  startButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
});

export default WorkoutProgramScreen; 