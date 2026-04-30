import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StatusBar,
  FlatList,
  Platform,
} from 'react-native';
import { NavigationProps } from '../../types/navigation';
import { storage } from '../../services/storage';
import { useToastService } from '../../services/toast';
import { useTheme } from '../../context/ThemeContext';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

const ITEM_WIDTH = 40;

const backIcon = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface WeightScreenProps {
  navigation: NavigationProps;
}

const WeightScreen: React.FC<WeightScreenProps> = ({ navigation }) => {
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const [selectedWeight, setSelectedWeight] = useState(60);
  const [isLoading, setIsLoading] = useState(true);
  const [initialIndex, setInitialIndex] = useState(30);
  const flatListRef = useRef<FlatList | null>(null);
  const { showToast } = useToastService();
  const weights = Array.from({ length: 131 }, (_, i) => i + 30);

  useEffect(() => {
    loadInitialValue();
  }, []);

  const loadInitialValue = async () => {
    try {
      setIsLoading(true);
      
      // Hem USER_DATA hem ONBOARDING_DATA'yı kontrol et
      let userInfo = await storage.getUserInfo();
      const onboardingData = await storage.getOnboardingData();
      
      // Eğer userInfo yoksa ama onboardingData varsa, onu kullan
      if (!userInfo && onboardingData) {
        userInfo = onboardingData;
      }
      
      if (userInfo?.weight) {
        const currentWeight = Math.min(Math.max(30, parseInt(userInfo.weight)), 160);
        setSelectedWeight(currentWeight);
        setInitialIndex(currentWeight - 30);
      }
    } catch (error) {
      console.error('Kilo bilgisi yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / ITEM_WIDTH);
    const weight = index + 30;
    
    if (weight >= 30 && weight <= 160) {
      setSelectedWeight(weight);
    }
  };

  const handleSave = async () => {
    try {
      // Hem USER_DATA hem ONBOARDING_DATA'dan veri al
      let userInfo = await storage.getUserInfo();
      const onboardingData = await storage.getOnboardingData();
      
      // Eğer userInfo yoksa ama onboardingData varsa, onu kullan
      if (!userInfo && onboardingData) {
        userInfo = onboardingData;
      }
      
      // Eğer hiç veri yoksa, yeni bir obje oluştur
      if (!userInfo) {
        userInfo = {
          id: 'local_user',
          email: 'user@example.com',
          display_name: 'Kullanıcı'
        };
      }
      
      const updatedUserInfo = {
        ...userInfo,
        weight: selectedWeight,
        updated_at: new Date().toISOString()
      };
      
      // Cache'i temizle ve kaydet
      storage.cache.invalidateUserData();
      await storage.setUserInfo(updatedUserInfo);

      showToast('success', t('profile_weight_updated_success'));
      navigation.goBack();
    } catch (error) {
      console.error('Kilo güncellenirken hata:', error);
      showToast('error', t('data_save_error'));
    }
  };

  const renderWeightItem = ({ item }: { item: number }) => (
    <View style={styles.weightItem}>
      <View style={[
        styles.weightLine,
        item % 5 === 0 ? styles.weightLineLong : styles.weightLineShort,
        item === selectedWeight && styles.weightLineSelected,
        { 
          backgroundColor: item === selectedWeight 
            ? colors.primary 
            : currentTheme === 'dark' 
              ? 'rgba(255, 255, 255, 0.3)' 
              : 'rgba(0, 0, 0, 0.2)' 
        }
      ]} />
      {item % 5 === 0 && (
        <Text style={[
          styles.weightText,
          { color: item === selectedWeight ? colors.primary : colors.textSecondary }
        ]}>{item}</Text>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme === 'dark' ? '#1C1C1E' : colors.background }]}>
        <StatusBar
          barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={currentTheme === 'dark' ? '#1C1C1E' : colors.background}
        />
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text }}>{t('loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme === 'dark' ? '#1C1C1E' : colors.background }]}>
      <StatusBar
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={currentTheme === 'dark' ? '#1C1C1E' : colors.background}
      />
      
      <View style={[styles.header, { 
        backgroundColor: currentTheme === 'dark' ? '#1C1C1E' : colors.background, 
        borderBottomColor: colors.cardBorder 
      }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <SvgXml 
            xml={backIcon.replace(/currentColor/g, currentTheme === 'dark' ? '#FFFFFF' : '#000000')} 
            width={24} 
            height={24} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile_weight')}</Text>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
        >
          <Text style={[styles.saveButtonText, { color: colors.primary }]}>
            {t('profile_save')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('profile_weight_question')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('profile_weight_subtitle')}</Text>
      </View>

      <View style={styles.selectedWeightContainer}>
        <Text style={[styles.selectedWeightText, { color: colors.text }]}>{selectedWeight}</Text>
        <Text style={[styles.unitText, { color: colors.textSecondary }]}>{t('kg_unit')}</Text>
      </View>

      <View style={styles.pickerContainer}>
        <View style={[styles.selectionLine, { backgroundColor: colors.primary }]} />
        <FlatList
          ref={flatListRef}
          data={weights}
          renderItem={renderWeightItem}
          keyExtractor={(item) => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_WIDTH}
          decelerationRate="fast"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          snapToAlignment="center"
          getItemLayout={(data, index) => ({
            length: ITEM_WIDTH,
            offset: ITEM_WIDTH * index,
            index,
          })}
          initialScrollIndex={initialIndex}
          contentContainerStyle={{
            paddingHorizontal: (width - ITEM_WIDTH) / 2,
          }}
        />
      </View>

      <TouchableOpacity 
        style={[
          styles.continueButton, 
          { backgroundColor: colors.primary }
        ]} 
        onPress={handleSave}
        activeOpacity={0.8}
      >
        <Text style={styles.continueButtonText}>{t('profile_save')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(6),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  headerContainer: {
    marginTop: hp(2),
    marginBottom: hp(4),
    alignItems: 'center',
  },
  title: {
    fontSize: wp(7),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: hp(1),
    letterSpacing: -0.5,
    fontFamily: 'Outfit',
  },
  subtitle: {
    fontSize: wp(4),
    textAlign: 'center',
    opacity: 0.8,
    paddingHorizontal: wp(5),
    fontFamily: 'Outfit',
  },
  selectedWeightContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: hp(6),
    marginTop: hp(2),
  },
  selectedWeightText: {
    fontSize: wp(20),
    fontWeight: '700',
    lineHeight: wp(20),
    letterSpacing: -1,
    fontFamily: 'Outfit',
  },
  unitText: {
    fontSize: wp(6),
    marginLeft: wp(2),
    marginBottom: wp(2),
    fontWeight: '500',
    fontFamily: 'Outfit',
  },
  pickerContainer: {
    height: 150,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(4),
    flexDirection: 'row',
  },
  selectionLine: {
    position: 'absolute',
    width: 3,
    height: 70,
    zIndex: 1,
    borderRadius: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  weightItem: {
    width: ITEM_WIDTH,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightLine: {
    width: 1.5,
    borderRadius: 0.75,
  },
  weightLineShort: {
    height: 15,
  },
  weightLineLong: {
    height: 35,
  },
  weightLineSelected: {
    width: 2.5,
    borderRadius: 1.25,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  weightText: {
    position: 'absolute',
    bottom: 20,
    fontSize: wp(3.5),
    fontWeight: '500',
    fontFamily: 'Outfit',
  },
  continueButton: {
    width: '80%',
    alignSelf: 'center',
    height: hp(7),
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: Platform.OS === 'ios' ? hp(4) : hp(3),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  continueButtonText: {
    color: 'white',
    fontSize: wp(4.5),
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: 'Outfit',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WeightScreen; 