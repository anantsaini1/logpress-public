import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NavigationProps } from '../../../types/navigation';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';

const BMIResultsScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  
  const { bmi, category } = route.params as { bmi: string; category: string };

  // Responsive değerler
  const isTablet = width >= 768;
  const titleFontSize = isTablet ? 32 : (width < 380 ? 24 : 28);
  const subtitleFontSize = isTablet ? 18 : (width < 380 ? 14 : 16);
  const bmiValueFontSize = isTablet ? 48 : (width < 380 ? 36 : 42);

  // BMI kategorisine göre renk ve mesaj
  const getBMIInfo = (category: string) => {
    switch (category) {
      case 'underweight':
        return {
          color: '#3B82F6',
          message: t('bmi_category_underweight'),
          description: t('bmi_description_underweight'),
        };
      case 'normal':
        return {
          color: '#10B981',
          message: t('bmi_category_normal'),
          description: t('bmi_description_normal'),
        };
      case 'overweight':
        return {
          color: '#F59E0B',
          message: t('bmi_category_overweight'),
          description: t('bmi_description_overweight'),
        };
      case 'obese':
        return {
          color: '#EF4444',
          message: t('bmi_category_obese'),
          description: t('bmi_description_obese'),
        };
      default:
        return {
          color: colors.primary,
          message: t('bmi_category_normal'),
          description: t('bmi_description_normal'),
        };
    }
  };

  const bmiInfo = getBMIInfo(category);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bmiContainer: {
      alignItems: 'center',
      marginBottom: height * 0.08,
      padding: 32,
      backgroundColor: colors.card,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: bmiInfo.color,
      width: '100%',
    },
    bmiLabel: {
      fontSize: subtitleFontSize,
      fontFamily: 'Outfit',
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    bmiValue: {
      fontSize: bmiValueFontSize,
      fontFamily: 'Outfit',
      fontWeight: '800',
      color: bmiInfo.color,
      marginBottom: 16,
    },
    bmiCategory: {
      fontSize: titleFontSize * 0.8,
      fontFamily: 'Outfit',
      fontWeight: '700',
      color: bmiInfo.color,
      textAlign: 'center',
      marginBottom: 12,
    },
    bmiDescription: {
      fontSize: subtitleFontSize,
      fontFamily: 'Outfit',
      textAlign: 'center',
      color: colors.textSecondary,
      lineHeight: subtitleFontSize * 1.4,
    },
    reassuranceContainer: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      marginBottom: height * 0.06,
      width: '100%',
    },
    reassuranceText: {
      fontSize: subtitleFontSize,
      fontFamily: 'Outfit',
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 8,
    },
    reassuranceSubtext: {
      fontSize: subtitleFontSize * 0.9,
      fontFamily: 'Outfit',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: subtitleFontSize * 1.3,
    },
    continueButton: {
      width: '100%',
      height: 56,
      backgroundColor: colors.primary,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    continueButtonText: {
      color: colors.buttonText,
      fontSize: 18,
      fontFamily: 'Outfit',
      fontWeight: '600',
    },
  });

  const handleContinue = () => {
    navigation.navigate('Environment');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.bmiContainer}>
          <Text style={styles.bmiLabel}>
            {t('your_bmi_is')}
          </Text>
          <Text style={styles.bmiValue}>
            {bmi}
          </Text>
          <Text style={styles.bmiCategory}>
            {bmiInfo.message}
          </Text>
          <Text style={styles.bmiDescription}>
            {bmiInfo.description}
          </Text>
        </View>

        <View style={styles.reassuranceContainer}>
          <Text style={styles.reassuranceText}>
            {t('dont_worry_we_will_help')}
          </Text>
          <Text style={styles.reassuranceSubtext}>
            {t('bmi_reassurance_message')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>
            {t('lets_continue')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default BMIResultsScreen; 