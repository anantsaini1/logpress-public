import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { storage } from '../../../services/storage';
import { NavigationProps } from '../../../types/navigation';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const AgeScreen = ({ navigation }: { navigation: NavigationProps }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [selectedAge, setSelectedAge] = useState(25);
  const flatListRef = useRef<FlatList>(null);
  const itemHeight = 45;
  const ages = Array.from({ length: 82 }, (_, i) => i + 18); // 18-99 yaş arası

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
      letterSpacing: -1,
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
    pickerContainer: {
      height: screenHeight < 700 ? 280 : 360,
      width: '100%',
      marginBottom: screenHeight < 700 ? 20 : 40,
      overflow: 'visible',
    },
    selectionOverlay: {
      position: 'absolute',
      top: '50%',
      width: '100%',
      height: 45,
      marginTop: -22.5,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.primary,
      zIndex: 1,
      pointerEvents: 'none',
    },
    scrollContent: {
      paddingVertical: screenHeight < 700 ? 117.5 : 157.5,
    },
    ageItem: {
      width: '100%',
      height: 45,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
    },
    selectedAge: {},
    ageText: {
      fontSize: screenWidth < 380 ? 20 : 24,
      fontFamily: 'Outfit',
    },
    selectedAgeText: {
      fontSize: screenWidth < 380 ? 28 : 34,
      fontFamily: 'Outfit',
      color: colors.text,
      fontWeight: '700',
    },
    unselectedAgeText: {
      fontFamily: 'Outfit',
      color: colors.textSecondary,
      fontWeight: '400',
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
    // Başlangıçta 25 yaşına scroll
    const initialIndex = ages.findIndex(age => age === 25);
    flatListRef.current?.scrollToIndex({
      index: initialIndex,
      animated: false,
    });
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    if (ages[index]) {
      setSelectedAge(ages[index]);
    }
  };

  const handleAgeSelection = async (selectedAge: number) => {
    try {
      setSelectedAge(selectedAge);
      
      const currentData = await storage.getOnboardingData();
      
      const updatedData = {
        ...currentData,
        age: selectedAge,
        timestamp: new Date().toISOString()
      };

      const savedData = await storage.setOnboardingData(updatedData);
      
      if (!savedData) {
        throw new Error('Veriler kaydedilemedi');
      }

      // Kayıtlı veriyi kontrol et
      const checkSavedData = await storage.getOnboardingData();

      navigation.navigate('Weight');
    } catch (error: any) {
      console.error('AgeScreen: Error in handleAgeSelection:', error);
      Alert.alert(
        t('error'),
        t('data_save_error'),
        [{ text: t('ok'), onPress: () => {} }]
      );
    }
  };

  const renderItem = ({ item: age }: { item: number }) => (
    <View
      style={[
        styles.ageItem,
        selectedAge === age && styles.selectedAge,
      ]}
    >
      <Text
        style={[
          styles.ageText,
          selectedAge === age ? styles.selectedAgeText : styles.unselectedAgeText,
        ]}
      >
        {age}
      </Text>
    </View>
  );

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
            <Text>{t('age_screen_title_part1')}</Text>
            <Text style={{ color: colors.primary }}>{t('age_screen_title_part2')}</Text>
            <Text>{t('age_screen_title_part3')}</Text>
          </Text>
          <Text style={styles.subtitle}>
            {t('age_screen_subtitle')}
          </Text>
        </View>

        <View style={styles.pickerContainer}>
          <View style={styles.selectionOverlay} />
          <FlatList
            ref={flatListRef}
            data={ages}
            renderItem={renderItem}
            keyExtractor={(item) => item.toString()}
            showsVerticalScrollIndicator={false}
            snapToInterval={itemHeight}
            decelerationRate="fast"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            scrollEnabled={true}
            onMomentumScrollEnd={handleScroll}
            getItemLayout={(data, index) => ({
              length: itemHeight,
              offset: itemHeight * index,
              index,
            })}
            contentContainerStyle={styles.scrollContent}
          />
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => handleAgeSelection(selectedAge)}
        >
          <Text style={styles.continueButtonText}>{t('continue_button')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AgeScreen; 