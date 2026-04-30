import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Platform,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Dimensions,
  useWindowDimensions
} from 'react-native';
import { NavigationProps } from '../../../types/navigation';
import { storage } from '../../../services/storage';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

// Responsive tasarım için ekran boyutları ve oranları
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ASPECT_RATIO = SCREEN_HEIGHT / SCREEN_WIDTH;
const isTablet = ASPECT_RATIO < 1.6;

// Responsive ölçeklendirme fonksiyonu
const scale = SCREEN_WIDTH / 375; // iPhone 11 Pro baz alındı
const normalize = (size: number) => {
  const newSize = size * scale;
  return isTablet ? newSize * 0.8 : newSize;
};

// Picker sabitleri
const ITEM_HEIGHT = normalize(45);
const VISIBLE_ITEMS = 11;
const PICKER_HEIGHT = ITEM_HEIGHT * 7;
const SELECTION_LINE_HEIGHT = 2;

interface OnboardingHeightScreenProps {
  navigation: NavigationProps;
}

const HeightScreen: React.FC<OnboardingHeightScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [selectedHeight, setSelectedHeight] = useState(165);
  const flatListRef = useRef<FlatList>(null);
  const itemHeight = 45;
  
  const heights = Array.from({ length: 81 }, (_, i) => i + 140);

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
    pickerContainer: {
      height: screenHeight < 700 ? 280 : 360,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      marginBottom: screenHeight < 700 ? 20 : 40,
      overflow: 'visible',
    },
    heightValueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heightItem: {
      height: itemHeight,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    heightText: {
      fontSize: screenWidth < 380 ? 20 : 24,
      fontFamily: 'Outfit',
    },
    selectedUnitText: {
      fontFamily: 'Outfit',
      marginLeft: 8,
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
    scrollContent: {
      paddingVertical: screenHeight < 700 ? 117.5 : 157.5,
    },
  });

  useEffect(() => {
    // Başlangıçta 165 cm'e scroll
    const initialIndex = heights.findIndex(height => height === 165);
    flatListRef.current?.scrollToIndex({
      index: initialIndex,
      animated: false,
    });
  }, []);

  const handleHeightSelection = async (selectedHeight: number) => {
    try {
      setSelectedHeight(selectedHeight);
      
      const currentData = await storage.getOnboardingData();
      
      const updatedData = {
        ...currentData,
        height: selectedHeight,
        timestamp: new Date().toISOString()
      };

      const savedData = await storage.setOnboardingData(updatedData);
      
      if (!savedData) {
        throw new Error('Veriler kaydedilemedi');
      }

      // Kayıtlı veriyi kontrol et
      const checkSavedData = await storage.getOnboardingData();

      navigation.navigate('Goal');
    } catch (error: any) {
      console.error('HeightScreen: Error in handleHeightSelection:', error);
      Alert.alert(
        t('error'),
        t('data_save_error'),
        [{ text: t('ok'), onPress: () => {} }]
      );
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    if (heights[index]) {
      setSelectedHeight(heights[index]);
    }
  };

  const renderItem = ({ item: height }: { item: number }) => {
    const isSelected = selectedHeight === height;

    return (
      <View style={styles.heightItem}>
        <TouchableOpacity
          onPress={() => {
            setSelectedHeight(height);
            const index = heights.indexOf(height);
            flatListRef.current?.scrollToOffset({
              offset: index * itemHeight,
              animated: true
            });
          }}
        >
          <View style={styles.heightValueContainer}>
            <Text
              style={[
                styles.heightText,
                {
                  color: colors.textSecondary,
                },
                isSelected && {
                  color: colors.text,
                  fontWeight: '700',
                  fontSize: screenWidth < 380 ? 28 : 34,
                },
              ]}
            >
              {height}
            </Text>
            {isSelected && (
              <Text
                style={[
                  styles.selectedUnitText,
                  {
                    color: colors.textSecondary,
                    fontSize: screenWidth < 380 ? 16 : 20,
                  }
                ]}
              >
                {t('cm_unit')}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const getItemLayout = (_: any, index: number) => ({
    length: itemHeight,
    offset: itemHeight * index,
    index,
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.text }]}>{'←'}</Text>
        </TouchableOpacity>
      </View>

            <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            <Text>{t('height_screen_title_part1')}</Text>
            <Text style={{ color: colors.primary }}>{t('height_screen_title_part2')}</Text>
            <Text>{t('height_screen_title_part3')}</Text>
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('height_screen_subtitle')}
          </Text>
        </View>

        <View style={styles.pickerContainer}>
          <FlatList
            ref={flatListRef}
            data={heights}
            renderItem={renderItem}
            keyExtractor={(item) => item.toString()}
            showsVerticalScrollIndicator={false}
            snapToInterval={itemHeight}
            decelerationRate="fast"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            scrollEnabled={true}
            onMomentumScrollEnd={handleScroll}
            getItemLayout={getItemLayout}
            contentContainerStyle={styles.scrollContent}
          />
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => handleHeightSelection(selectedHeight)}
        >
          <Text style={styles.continueButtonText}>{t('continue_button')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default HeightScreen; 