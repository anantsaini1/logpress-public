import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Alert,
  Platform,
  useWindowDimensions
} from 'react-native';
import { NavigationProps } from '../../../types/navigation';
import { storage } from '../../../services/storage';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const WeightScreen = ({ navigation }: { navigation: NavigationProps }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [selectedWeight, setSelectedWeight] = useState(60);
  const scrollViewRef = useRef<ScrollView | null>(null);
  
  const ITEM_WIDTH = 20;
  const SELECTED_ITEM_WIDTH = 3;
  
  // 30'dan 180'e kadar tam sayılar
  const weights = Array.from({ length: 151 }, (_, i) => i + 30);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    backButton: {
      fontSize: 24,
      fontFamily: 'Outfit',
      color: colors.text,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      padding: 16,
      paddingHorizontal: screenWidth < 380 ? 12 : 16,
    },
    titleContainer: {
      width: '100%',
      alignItems: 'center',
      paddingTop: screenHeight < 700 ? 10 : 20,
    },
    title: {
      fontSize: screenWidth < 380 ? 32 : 40,
      fontFamily: 'Outfit',
      fontWeight: '900',
      textAlign: 'center',
      marginBottom: screenHeight < 700 ? 4 : 8,
      color: colors.text,
    },
    subtitle: {
      fontSize: screenWidth < 380 ? 15 : 17,
      fontFamily: 'Outfit',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: screenWidth < 380 ? 20 : 24,
      marginBottom: screenHeight < 700 ? 20 : 40,
    },
    selectedWeightContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: screenHeight < 700 ? 20 : 40,
    },
    selectedWeightText: {
      fontSize: screenWidth < 380 ? 50 : 60,
      fontFamily: 'Outfit',
      fontWeight: '700',
      color: colors.text,
    },
    unitText: {
      fontSize: screenWidth < 380 ? 16 : 20,
      fontFamily: 'Outfit',
      marginLeft: 8,
      marginTop: 16,
      color: colors.textSecondary,
    },
    pickerWrapper: {
      height: 100,
      width: '100%',
      justifyContent: 'center',
      marginBottom: screenHeight < 700 ? 20 : 40,
    },
    centerLine: {
      position: 'absolute',
      left: '50%',
      width: SELECTED_ITEM_WIDTH,
      height: 80,
      marginLeft: -SELECTED_ITEM_WIDTH / 2,
      backgroundColor: colors.text,
    },
    scrollContent: {
      paddingHorizontal: screenWidth / 2 - ITEM_WIDTH / 2,
    },
    weightItem: {
      width: ITEM_WIDTH,
      height: 100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    weightLine: {
      width: 2,
      backgroundColor: colors.text,
    },
    weightLineShort: {
      height: 20,
      opacity: 0.3,
    },
    weightLineLong: {
      height: 40,
      opacity: 0.6,
    },
    continueButton: {
      width: '100%',
      height: screenHeight < 700 ? 48 : 56,
      backgroundColor: colors.primary,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 'auto',
      marginBottom: screenHeight < 700 ? 8 : 0,
    },
    continueButtonText: {
      color: colors.buttonText,
      fontSize: screenWidth < 380 ? 16 : 18,
      fontFamily: 'Outfit',
      fontWeight: '600',
    },
  });

  useEffect(() => {
    // Başlangıçta 60 kg'a scroll
    const initialIndex = weights.indexOf(60);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        x: initialIndex * ITEM_WIDTH - screenWidth / 2 + ITEM_WIDTH / 2,
        animated: false,
      });
    }, 100);
  }, []);

  const handleWeightSelection = async (selectedWeight: number) => {
    try {
      setSelectedWeight(selectedWeight);
      
      const currentData = await storage.getOnboardingData();
      
      const updatedData = {
        ...currentData,
        weight: selectedWeight,
        timestamp: new Date().toISOString()
      };

      const savedData = await storage.setOnboardingData(updatedData);
      
      if (!savedData) {
        throw new Error('Veriler kaydedilemedi');
      }

      // Kayıtlı veriyi kontrol et
      const checkSavedData = await storage.getOnboardingData();

      navigation.navigate('Height');
    } catch (error: any) {
      Alert.alert(
        t('error'),
        t('data_save_error'),
        [{ text: t('ok'), onPress: () => {} }]
      );
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round((offsetX + screenWidth / 2 - ITEM_WIDTH / 2) / ITEM_WIDTH);
    
    // İndeksin geçerli aralıkta olduğundan emin ol
    if (index >= 0 && index < weights.length) {
      setSelectedWeight(weights[index]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>{'←'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            <Text>{t('weight_screen_title_part1')}</Text>
            <Text style={{ color: colors.primary }}>{t('weight_screen_title_part2')}</Text>
            <Text>{t('weight_screen_title_part3')}</Text>
          </Text>
          <Text style={styles.subtitle}>
            {t('weight_screen_subtitle')}
          </Text>
        </View>

        <View style={styles.selectedWeightContainer}>
          <Text style={styles.selectedWeightText}>{selectedWeight}</Text>
          <Text style={styles.unitText}>{t('kg_unit')}</Text>
        </View>

        <View style={styles.pickerWrapper}>
          <View style={styles.centerLine} />
          <ScrollView 
            ref={scrollViewRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            decelerationRate="normal"
            snapToInterval={ITEM_WIDTH}
            snapToAlignment="center"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleScroll}
            onScrollEndDrag={handleScroll}
            pagingEnabled={false}
          >
            {weights.map((weight) => (
              <View key={weight} style={styles.weightItem}>
                <View style={[
                  styles.weightLine,
                  weight % 5 === 0 ? styles.weightLineLong : styles.weightLineShort
                ]} />
              </View>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => handleWeightSelection(selectedWeight)}
        >
          <Text style={styles.continueButtonText}>{t('continue_button')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default WeightScreen; 