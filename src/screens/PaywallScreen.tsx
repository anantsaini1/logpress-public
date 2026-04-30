import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Dimensions,
  Animated,
  Image,
  Modal,
  Linking,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext';
import { adaptyService } from '../services/adapty';
import { ADAPTY_CONFIG } from '../config/adapty';
import BMIScreen from './App/BMIScreen';
import { SvgXml } from 'react-native-svg';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateUser } from '../store/slices/userSlice';
import { storage } from '../services/storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive design helpers
const isTablet = SCREEN_WIDTH >= 768;
const isSmallScreen = SCREEN_WIDTH < 375;
const getResponsiveSize = (size: number) => {
  if (isTablet) return size * 1.3;
  if (isSmallScreen) return size * 0.9;
  return size;
};
const getResponsivePadding = (padding: number) => {
  if (isTablet) return padding * 1.5;
  if (isSmallScreen) return padding * 0.8;
  return padding;
};

// SVG Icons
const closeIcon = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="18" y1="6" x2="6" y2="18"></line>
  <line x1="6" y1="6" x2="18" y2="18"></line>
</svg>
`;

const featuredIconSvg = (color: string) => `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 11C12 8.23858 13.7909 6 16 6C18.2091 6 20 8.23858 20 11" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
<path d="M10 17C10 20.3137 12.6863 23 16 23C19.3137 23 22 20.3137 22 17C22 13.6863 19.3137 11 16 11C12.6863 11 10 13.6863 10 17Z" stroke="${color}" stroke-width="1.5"/>
</svg>
`;

const starSvg = (color: string) => `<svg height="24px" viewBox="0 0 24 24" width="24px" fill="${color}"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z"/></svg>`;

const analyticsIconSvg = (color: string) => `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3 3V21H21" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M9 9L12 6L16 10L20 6" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="7" y="13" width="2" height="6" fill="${color}"/>
<rect x="11" y="11" width="2" height="8" fill="${color}"/>
<rect x="15" y="15" width="2" height="4" fill="${color}"/>
</svg>`;

const adFreeIconSvg = (color: string) => `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="12" cy="12" r="10" stroke="${color}" stroke-width="2"/>
<path d="M8 8L16 16" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
<path d="M16 8L8 16" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const unlimitedIconSvg = (color: string) => `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="${color}" stroke-width="2"/>
<path d="M8 12L11 15L16 9" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const heartIconSvg = (color: string) => `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.5783 8.50903 2.9987 7.05 2.9987C5.59096 2.9987 4.19169 3.5783 3.16 4.61C2.1283 5.6417 1.5487 7.04097 1.5487 8.5C1.5487 9.95903 2.1283 11.3583 3.16 12.39L12 21.23L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.06211 22.0329 6.39467C21.7563 5.72723 21.351 5.1208 20.84 4.61V4.61Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const chevronLeftSvg = (color: string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 6L9 12L15 18" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const chevronRightSvg = (color:string) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 6L15 12L9 18" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

interface SlideData {
  id: number;
  title: string;
  description: string;
  icon?: string;
  svgIcon?: (color: string) => string;
  isAIScore?: boolean;
}

interface ProductData {
  id: string;
  title: string;
  description: string;
  price: {
    amount?: number;
    currencyCode?: string;
    currencySymbol?: string;
    localizedString?: string;
  };
  localizedPrice: string; // Ana fiyat buradan gelecek
  currencyCode: string;
  subscriptionPeriod: any;
  originalProduct: any;
}

interface PaywallScreenProps {
  source?: 'onboarding' | 'settings' | 'feature_lock' | 'general';
  returnRoute?: string;
}

const PaywallScreen = ({ route }: { route: any }) => {
  const navigation = useNavigation();
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const { setUserRoleId } = useUser();
  const { source, returnRoute, bmiData } = route?.params || {};

  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [showBMIModal, setShowBMIModal] = useState(false);
  
  const sliderRef = useRef<ScrollView>(null);
  const buzzAnimation = useRef(new Animated.Value(1)).current;

  // Slider verileri - çok dilli
  const slides = [
    {
      id: 1,
      title: t('paywall_slide_1_title'),
      description: t('paywall_slide_1_description'),
      icon: 'score', // Özel AI Score gösterimi
      isAIScore: true
    },
    {
      id: 2,
      title: t('paywall_slide_2_title'),
      description: t('paywall_slide_2_description'),
      svgIcon: analyticsIconSvg
    },
    {
      id: 4,
      title: t('paywall_slide_4_title'),
      description: t('paywall_slide_4_description'),
      svgIcon: unlimitedIconSvg
    },
    {
      id: 5,
      title: t('paywall_slide_5_title'),
      description: t('paywall_slide_5_description'),
      svgIcon: heartIconSvg
    }
  ];

  const dispatch = useAppDispatch();

  useEffect(() => {
    initializePaywall();
  }, []);

  // Initialize paywall with user identification
  const initializePaywall = async () => {
    try {
      setLoading(true);
      
      // 1. UUID'yi al veya oluştur
      let userUUID = await storage.getUserUUID();
      
      if (!userUUID) {
        // HATA DURUMU: Paywall'a gelinmeden önce kullanıcı UUID'sinin oluşturulmuş olması gerekir.
        // Yeni bir kullanıcı oluşturmak yerine hatayı loglayıp işlemi durduruyoruz.
        // Bu, veri kaybını önler ve akış hatasını ortaya çıkarır.
        setError(t('paywall_user_not_found_error') || 'User profile could not be loaded. Please restart the app.');
        setLoading(false);
        return; // Fonksiyondan çık
      }
      
      // 2. UUID'yi Adapty'e gönder
      await adaptyService.identifyUser(userUUID);
      
      // 3. Ürünleri yükle
      await loadProducts();
      
    } catch (error) {
      console.error('❌ PaywallScreen initialization error:', error);
      setError(t('paywall_initialization_error') || 'Initialization failed');
    } finally {
      setLoading(false);
    }
  };

  // Auto slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        const nextSlide = (prev + 1) % slides.length;
        sliderRef.current?.scrollTo({ 
          x: nextSlide * SCREEN_WIDTH,
          y: 0, 
          animated: true 
        });
        return nextSlide;
      });
    }, 3000); // 3 saniyede bir değiş

    return () => clearInterval(timer);
  }, [slides.length]);

  // Buzz animation for AI Score
  useEffect(() => {
    const startBuzzAnimation = () => {
      Animated.sequence([
        Animated.timing(buzzAnimation, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(buzzAnimation, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buzzAnimation, {
          toValue: 1.05,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buzzAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Animasyon bitince 2 saniye bekle ve tekrar başlat
        setTimeout(startBuzzAnimation, 2000);
      });
    };

    // İlk animasyonu başlat
    setTimeout(startBuzzAnimation, 1000);
  }, [buzzAnimation]);

  const onSlideChange = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    const slideIndex = Math.round(contentOffset.x / SCREEN_WIDTH);
    if (slideIndex >= 0 && slideIndex < slides.length) {
      setCurrentSlide(slideIndex);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    sliderRef.current?.scrollTo({ 
      x: index * SCREEN_WIDTH, 
      y: 0,
      animated: true 
    });
  };

  const loadProducts = async () => {
    try {
      const placementId = ADAPTY_CONFIG.PAYWALL_PLACEMENTS.DEFAULT;
      const result = await adaptyService.getProductsForCustomPaywall(placementId);
      
      setProducts(result.products);
      
      if (result.products.length > 0) {
        // 3 aylık ürünü varsayılan seçili yap
        const threeMonthProduct = result.products.find(p => {
          const period = p.originalProduct?.subscriptionDetails?.subscriptionPeriod;
          return period?.unit === 'month' && period?.numberOfUnits === 3;
        });
        
        if (threeMonthProduct) {
          setSelectedProduct(threeMonthProduct.id);
        } else {
          // 3 aylık yoksa yıllık, o da yoksa ilk ürün
          const yearlyProduct = result.products.find(p => 
            p.originalProduct?.subscriptionDetails?.subscriptionPeriod?.unit === 'year'
          );
          setSelectedProduct(yearlyProduct?.id || result.products[0].id);
        }
      } else {
        setError(t('paywall_no_products'));
      }
      
    } catch (error) {
      console.error('❌ PaywallScreen: Product loading error:', error);
      setError(t('paywall_loading_error'));
    }
  };

  const handlePurchase = async (product: ProductData) => {
    try {
      // Normal satın alma işlemi
      const result = await adaptyService.purchaseFromCustomPaywall(product);
      if (result) {
        // 🎉 Subscription başarılı! User role'ü premium yap
        
        // Redux store'u güncelle
        dispatch(updateUser({ user_role_id: 1 }));
        
        // UserContext'i de güncelle
        await setUserRoleId(1);
        
        // 🎉 Premium olduktan sonra BMI modalını aç
        setShowBMIModal(true);
      }
    } catch (error: any) {
      // Kullanıcı iptal ettiyse özel mesaj gösterme
      if (error.message?.includes('iptal etti') || error.message?.includes('canceled')) {
        return; // Alert gösterme
      }
      
      // Diğer hatalar için detaylı mesaj göster
      const errorMessage = error.message || t('paywall_purchase_error');
      Alert.alert(
        t('error'), 
        errorMessage, 
        [{ text: t('ok') }]
      );
    }
  };

  const handleContinue = () => {
    // Eğer modal olarak açıldıysa (source: 'settings'), sadece kapat
    if (source === 'settings') {
      navigation.goBack();
    } else {
      // Onboarding'den geliyorsa reset ile tam ekran Ana sayfa aç (geri dönme engelli)
      (navigation as any).reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  };

  const handleClose = () => {
    // Eğer onboarding'den geldiyse LoserPaywall göster
    if (source === 'onboarding') {
      // RootNavigator seviyesinde LoserPaywallScreen'e git
      const rootNavigation = (navigation as any).getParent?.() || navigation;
      rootNavigation.navigate('LoserPaywallScreen');
    } else {
      handleContinue();
    }
  };

  const handleBMIModalClose = () => {
    setShowBMIModal(false);
    
    // BMI modalı kapandıktan sonra success mesajı göster ve ana sayfaya git
    Alert.alert(
      t('success'),
      t('paywall_purchase_success'),
      [{ 
        text: t('paywall_continue'), 
        onPress: () => {
          // Premium kullanıcı için reset ile tam ekran Ana sayfa aç
          (navigation as any).reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }
      }]
    );
  };

  const handleSubscribe = () => {
    const product = products.find(p => p.id === selectedProduct);
    if (product) {
      handlePurchase(product);
    }
  };

  const handleRestore = async () => {
    try {
      const result = await adaptyService.restorePurchases();
      
      if (result) {
        // Premium access kontrolü yap
        const hasPremiumAccess = await adaptyService.checkPremiumAccess('premium');
        
        if (hasPremiumAccess) {
          // Redux store'u güncelle
          dispatch(updateUser({ user_role_id: 1 }));
          
          // UserContext'i de güncelle
          await setUserRoleId(1);
          
          Alert.alert(
            t('success'),
            t('paywall_restore_success'),
            [{ text: t('ok'), onPress: handleContinue }]
          );
        } else {
          Alert.alert(
            t('error'),
            t('paywall_restore_no_purchases'),
            [{ text: t('ok') }]
          );
        }
      } else {
        Alert.alert(
          t('error'),
          t('paywall_restore_no_purchases'),
          [{ text: t('ok') }]
        );
      }
    } catch (error) {
      Alert.alert(t('error'), t('paywall_restore_error'), [{ text: t('ok') }]);
    }
  };

  const getProductType = (product: ProductData) => {
    const period = product.originalProduct?.subscriptionDetails?.subscriptionPeriod;
    
    if (period?.unit === 'year') return t('paywall_yearly');
    if (period?.unit === 'month') {
      if (period.numberOfUnits === 1) return t('paywall_monthly');
      if (period.numberOfUnits === 3) return t('paywall_3_monthly');
      return `${period.numberOfUnits} ${t('paywall_monthly')}`;
    }
    if (!period) return t('paywall_lifetime');
    return t('paywall_pro');
  };

  const getSelectedProductButtonText = () => {
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return t('paywall_premium_button');
    
    const period = product.originalProduct?.subscriptionDetails?.subscriptionPeriod;
    
    if (!period) return t('paywall_lifetime_button');
    if (period?.unit === 'year') return t('paywall_yearly_button');
    if (period?.unit === 'month') {
      if (period.numberOfUnits === 1) return t('paywall_monthly_button');
      if (period.numberOfUnits === 3) return t('paywall_3_monthly_button');
    }
    return t('paywall_premium_button');
  };

  const openURL = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(`Don't know how to open this URL: ${url}`);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      
      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleClose}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
      </TouchableOpacity>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Logo */}
        <Image 
          source={require('../assets/logo.png')} 
          style={[styles.logoImage, { tintColor: currentTheme === 'light' ? colors.primary : colors.text }]}
        />

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: colors.text }]}>
          {t('paywall_get')} <Text style={[styles.premiumText, { color: colors.primary }]}>{t('paywall_premium')}</Text>
        </Text>

        {/* Feature Slider */}
        <ScrollView
          ref={sliderRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onSlideChange}
          style={styles.slider}
          contentContainerStyle={{ 
            paddingLeft: 0, 
            paddingRight: 0 
          }}
        >
          {slides.map((slide, index) => (
            <View key={slide.id} style={styles.slide}>
              {slide.isAIScore ? (
                <View style={styles.aiScoreContainer}>
                  <Animated.View 
                    style={[
                      styles.scoreCard, 
                      { 
                        backgroundColor: colors.surface,
                        transform: [{ scale: buzzAnimation }]
                      }
                    ]}
                  >
                    <Text style={[styles.scoreNumber, { color: colors.primary }]}>86</Text>
                    <BlurView
                      style={styles.scoreBlurOverlay}
                      blurType={currentTheme === 'dark' ? 'dark' : 'light'}
                      blurAmount={8}
                      reducedTransparencyFallbackColor={colors.surface}
                    />
                  </Animated.View>
                </View>
              ) : (
                <View style={styles.slideIconContainer}>
                  {slide.svgIcon && (
                    <SvgXml xml={slide.svgIcon(colors.primary)} width={getResponsiveSize(48)} height={getResponsiveSize(48)} />
                  )}
                </View>
              )}
              <Text style={[styles.slideTitle, { color: colors.text }]}>
                {slide.title}
              </Text>
              <Text style={[styles.slideDescription, { color: colors.textSecondary }]}>
                {slide.description}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Slide Indicator */}
        <View style={styles.slideIndicator}>
          {slides.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                index === currentSlide 
                  ? [styles.activeDot, { backgroundColor: colors.primary }]
                  : [styles.inactiveDot, { backgroundColor: colors.border }]
              ]}
              onPress={() => goToSlide(index)}
            />
          ))}
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              {t('loading')}
            </Text>
          </View>
        )}

        {/* Error */}
        {error && !loading && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={loadProducts}
            >
              <Text style={[styles.retryButtonText, { color: colors.buttonText }]}>
                {t('paywall_retry')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pricing Options - Horizontal */}
        {!loading && !error && products.length > 0 && (
          <View style={styles.pricingContainer}>
                          {products.map((product, index) => {
                const isSelected = selectedProduct === product.id;
                const period = product.originalProduct?.subscriptionDetails?.subscriptionPeriod;
                const is3Monthly = period?.unit === 'month' && period?.numberOfUnits === 3;
                const isBestChoice = is3Monthly; // Sadece 3 aylık için badge
                
                return (
                <TouchableOpacity
                  key={product.id}
                  style={[
                    styles.priceCard,
                    { 
                      backgroundColor: colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    }
                  ]}
                  onPress={() => setSelectedProduct(product.id)}
                >
                  {isBestChoice && (
                    <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.discountText, { color: colors.buttonText }]}>
                        {t('paywall_best_choice')}
                      </Text>
                    </View>
                  )}
                  
                  <Text style={[styles.priceCardTitle, { color: colors.primary }]}>
                    {t('paywall_pro')}
                  </Text>
                  
                  <Text style={[styles.priceCardType, { color: colors.primary }]}>
                    {getProductType(product)}
                  </Text>
                  
                  <Text style={[styles.priceCardPrice, { color: colors.text }]}>
                    {product.localizedPrice || 
                     product.originalProduct?.localizedPrice || 
                     product.price?.localizedString || 
                     `${product.price?.amount || '?'} ${product.currencyCode || 'TRY'}`}
                  </Text>
                  
                  <Text style={[styles.priceCardDescription, { color: colors.textSecondary }]}>
                    {product.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Subscribe Button */}
        {!loading && !error && products.length > 0 && (
          <TouchableOpacity
            style={[styles.subscribeButton, { backgroundColor: colors.primary }]}
            onPress={handleSubscribe}
          >
            <Text style={[styles.subscribeButtonText, { color: colors.buttonText }]}>
              {getSelectedProductButtonText()}
            </Text>
          </TouchableOpacity>
        )}

        {/* Restore Button */}
        {!loading && (
          <TouchableOpacity
            style={[styles.restoreButton, { borderColor: colors.border }]}
            onPress={handleRestore}
          >
            <Text style={[styles.restoreButtonText, { color: colors.textSecondary }]}>
              {t('paywall_restore_purchases')}
            </Text>
          </TouchableOpacity>
        )}

        {/* Testimonials */}
        <View style={styles.testimonialsSection}>
          <View style={styles.starRatingContainer}>
            {[...Array(5)].map((_, i) => (
              <View key={i} style={styles.starIcon}>
                <SvgXml xml={starSvg('#FFC107')} width={getResponsiveSize(28)} height={getResponsiveSize(28)} />
              </View>
            ))}
          </View>
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 12 }]}>
            {t('paywall_testimonials_title')}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            {t('paywall_testimonials_subtitle')}
          </Text>
          
          {/* Note: This can be a FlatList for better performance */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.testimonialsScrollView}
            contentContainerStyle={{ paddingHorizontal: getResponsivePadding(20) }}
            snapToInterval={getResponsiveSize(280) + getResponsivePadding(12)}
            decelerationRate="fast"
          >
            {[{
              id: '1',
              stars: 5,
              title: t('paywall_testimonial_1_title'),
              text: t('paywall_testimonial_1_text'),
              author: 'Nabil',
            },
            {
              id: '2',
              stars: 5,
              title: t('paywall_testimonial_2_title'),
              text: t('paywall_testimonial_2_text'),
              author: 'Alex',
            }].map(item => (
              <View key={item.id} style={[styles.testimonialCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                 <Text style={[styles.testimonialTitle, { color: colors.text }]}>{item.title}</Text>
                 <View style={styles.starRatingContainerSmall}>
                    {[...Array(item.stars)].map((_, i) => (
                      <View key={i} style={styles.starIconSmall}>
                        <SvgXml xml={starSvg('#FFC107')} width={getResponsiveSize(18)} height={getResponsiveSize(18)} />
                      </View>
                    ))}
                 </View>
                 <Text style={[styles.testimonialText, { color: colors.textSecondary }]}>{item.text}</Text>
                 <Text style={[styles.testimonialAuthor, { color: colors.text }]}>{item.author}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

                {/* Apple Feature Section */}
        <View style={styles.appleFeatureSection}>
          {/* Apple Icon */}
          <Image 
            source={require('../assets/social/apple.png')} 
            style={[styles.appleIcon, { tintColor: colors.text }]} 
            resizeMode="contain"
          />
          
          {/* Text Container with Leaves */}
          <View style={styles.appleFeatureTextContainer}>
            <Image 
              source={require('../assets/social/yaprak.png')} 
              style={[styles.leafIcon, styles.leftLeaf, { tintColor: colors.text }]} 
              resizeMode="contain"
            />
            <View style={styles.appleFeatureMainText}>
              <Text style={[styles.appleFeatureSubtitle, { color: colors.textSecondary }]}>{t('paywall_apple_featured_title')}</Text>
              <Text style={[styles.appleFeatureTitle, { color: colors.text }]}>{t('paywall_apple_featured_subtitle')}</Text>
            </View>
            <Image 
              source={require('../assets/social/yaprak.png')} 
              style={[styles.leafIcon, styles.rightLeaf, { tintColor: colors.text }]} 
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Comparison Section */}
        <View style={styles.comparisonSection}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: getResponsivePadding(20) }]}>
                {t('paywall_comparison_title')}
            </Text>
            <View style={styles.comparisonHeader}>
                <Text style={[styles.comparisonHeaderText, { flex: 2 }]}></Text>
                <Text style={[styles.comparisonHeaderText, { color: colors.textSecondary, textAlign: 'center' }]}>{t('paywall_comparison_free')}</Text>
                <Text style={[styles.comparisonHeaderText, { color: colors.primary, textAlign: 'center' }]}>{t('paywall_comparison_pro')}</Text>
            </View>
            {[
              { feature: t('paywall_comparison_feature_1'), free: '✓', pro: '✓' },
              { feature: t('paywall_comparison_feature_2'), free: t('paywall_comparison_free_limit_1'), pro: '✓' },
              { feature: t('paywall_comparison_feature_3'), free: t('paywall_comparison_free_limit_2'), pro: '✓' },
              { feature: t('paywall_comparison_feature_4'), free: '✗', pro: '✓' },
            ].map((item, index) => (
                <View key={index} style={[styles.comparisonRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.comparisonFeature, { color: colors.text }]}>{item.feature}</Text>
                    <Text style={[styles.comparisonValue, { color: colors.textSecondary }]}>{item.free}</Text>
                    <Text style={[styles.comparisonValue, { color: colors.primary }]}>{item.pro}</Text>
                </View>
            ))}
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: getResponsivePadding(20) }]}>
                {t('paywall_faq_title')}
            </Text>
            {[
              { q: t('paywall_faq_q1'), a: t('paywall_faq_a1') },
              { q: t('paywall_faq_q2'), a: t('paywall_faq_a2') },
              { q: t('paywall_faq_q3'), a: t('paywall_faq_a3') },
              { q: t('paywall_faq_q4'), a: t('paywall_faq_a4') },
              { q: t('paywall_faq_q5'), a: t('paywall_faq_a5') },
            ].map((item, index) => (
                <View key={index} style={[styles.faqItem, { backgroundColor: colors.surface }]}>
                    <TouchableOpacity 
                        style={styles.faqQuestion}
                        onPress={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                    >
                        <Text style={[styles.faqQuestionText, { color: colors.text }]}>{item.q}</Text>
                        <Text style={[styles.faqChevron, { color: colors.textSecondary }]}>
                            {expandedFAQ === index ? '▲' : '▼'}
                        </Text>
                    </TouchableOpacity>
                    {expandedFAQ === index && (
                        <View style={styles.faqAnswer}>
                            <Text style={[styles.faqAnswerText, { color: colors.textSecondary }]}>{item.a}</Text>
                        </View>
                    )}
                </View>
            ))}
        </View>

        {/* Support Contact */}
        <View style={styles.supportSection}>
          <Text style={[styles.supportQuestion, { color: colors.textSecondary }]}>
            {t('paywall_support_question')}
          </Text>
          <Text style={[styles.supportEmail, { color: colors.primary }]}>
            {t('paywall_support_email')}
          </Text>
        </View>

        {/* Footer Links */}
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => openURL('https://docs.google.com/document/d/1BhisjPthlOuoFCBHCYwUy-9ex_8gHd15eztIWg5VwQo/edit?usp=sharing')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              {t('paywall_privacy_policy')}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.footerSeparator, { color: colors.textSecondary }]}>
            {' • '}
          </Text>
          <TouchableOpacity onPress={() => openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              {t('paywall_terms_conditions')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* BMI Modal */}
      <Modal
        visible={showBMIModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleBMIModalClose}
      >
        <BMIScreen 
          navigation={navigation as any}
          route={{ 
            params: { 
              bmi: bmiData?.bmi || '0', // Gerçek BMI değeri
              onboardingData: bmiData?.onboardingData || {},
              onComplete: handleBMIModalClose
            } 
          } as any} 
        />
      </Modal>
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
    paddingVertical: getResponsivePadding(40),
  },
  loadingText: {
    fontSize: getResponsiveSize(16),
    fontFamily: 'Outfit',
    marginTop: getResponsivePadding(12),
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: getResponsivePadding(60),
    right: getResponsivePadding(20),
    zIndex: 10,
    width: getResponsiveSize(32),
    height: getResponsiveSize(32),
    justifyContent: 'center',
    alignItems: 'center',
  },  
  closeButtonText: {
    fontSize: getResponsiveSize(18),
    fontFamily: 'Outfit',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: getResponsivePadding(80),
    paddingHorizontal: getResponsivePadding(20),
    paddingBottom: getResponsivePadding(40),
  },
  logoImage: {
    width: getResponsiveSize(50),
    height: getResponsiveSize(50),
    alignSelf: 'center',
    marginBottom: getResponsivePadding(20),
  },
  subtitle: {
    fontSize: getResponsiveSize(32),
    fontFamily: 'Outfit',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: getResponsivePadding(16),
    marginTop: getResponsivePadding(20),
  },
  premiumText: {
    fontSize: getResponsiveSize(32),
    fontFamily: 'Outfit',
    fontWeight: '700',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Outfit',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  slider: {
    height: getResponsiveSize(200),
    marginBottom: getResponsivePadding(30),
    marginLeft: -getResponsivePadding(20),
    marginRight: -getResponsivePadding(20),
  },
  slide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 0,
    paddingRight: 0,
    marginLeft: 0,
    marginRight: 0,
  },
  slideIcon: {
    fontSize: getResponsiveSize(36),
    marginBottom: getResponsivePadding(10),
  },
  slideIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsivePadding(16),
  },
  aiScoreContainer: {
    alignItems: 'center',
    marginBottom: getResponsivePadding(10),
  },
  scoreCard: {
    width: getResponsiveSize(120),
    height: getResponsiveSize(120),
    borderRadius: getResponsiveSize(20),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  scoreNumber: {
    fontSize: getResponsiveSize(48),
    fontFamily: 'Outfit',
    fontWeight: '700',
    letterSpacing: -1,
  },
  scoreBlurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: getResponsiveSize(20),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  unlockText: {
    fontSize: getResponsiveSize(28),
    fontFamily: 'Outfit',
  },
  slideTitle: {
    fontSize: getResponsiveSize(20),
    fontFamily: 'Outfit',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: getResponsivePadding(8),
    width: SCREEN_WIDTH,
    paddingHorizontal: getResponsivePadding(20),
  },
  slideDescription: {
    fontSize: getResponsiveSize(15),
    fontFamily: 'Outfit',
    textAlign: 'center',
    lineHeight: getResponsiveSize(22),
    width: SCREEN_WIDTH,
    paddingHorizontal: getResponsivePadding(20),
  },
  slideIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getResponsivePadding(50),
  },
  dot: {
    marginHorizontal: getResponsivePadding(4),
  },
  activeDot: {
    width: getResponsiveSize(8),
    height: getResponsiveSize(8),
    borderRadius: getResponsiveSize(4),
  },
  inactiveDot: {
    width: getResponsiveSize(6),
    height: getResponsiveSize(6),
    borderRadius: getResponsiveSize(3),
  },
  errorContainer: {
    padding: getResponsivePadding(20),
    borderRadius: getResponsiveSize(12),
    marginBottom: getResponsivePadding(20),
    alignItems: 'center',
  },
  errorText: {
    fontSize: getResponsiveSize(16),
    fontFamily: 'Outfit',
    textAlign: 'center',
    marginBottom: getResponsivePadding(16),
  },
  retryButton: {
    paddingHorizontal: getResponsivePadding(16),
    paddingVertical: getResponsivePadding(8),
    borderRadius: getResponsiveSize(8),
  },
  retryButtonText: {
    fontSize: getResponsiveSize(14),
    fontFamily: 'Outfit',
    fontWeight: '600',
  },
  pricingContainer: {
    flexDirection: 'row',
    marginBottom: getResponsivePadding(32),
    gap: getResponsivePadding(12),
  },
  priceCard: {
    flex: 1,
    padding: getResponsivePadding(16),
    borderRadius: getResponsiveSize(16),
    position: 'relative',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: getResponsiveSize(-15),
    alignSelf: 'center',
    paddingHorizontal: getResponsivePadding(12),
    paddingVertical: getResponsivePadding(4),
    borderRadius: getResponsiveSize(10),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  discountText: {
    fontSize: getResponsiveSize(10),
    fontFamily: 'Outfit',
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  priceCardTitle: {
    fontSize: getResponsiveSize(16),
    fontFamily: 'Outfit',
    fontWeight: '700',
    marginBottom: getResponsivePadding(2),
    marginTop: getResponsivePadding(10),
  },
  priceCardType: {
    fontSize: getResponsiveSize(12),
    fontFamily: 'Outfit',
    fontWeight: '600',
    marginBottom: getResponsivePadding(6),
  },
  priceCardPrice: {
    fontSize: getResponsiveSize(18),
    fontFamily: 'Outfit',
    fontWeight: '800',
    marginBottom: getResponsivePadding(2),
  },
  priceCardDescription: {
    fontSize: getResponsiveSize(12),
    fontFamily: 'Outfit',
    textAlign: 'center',
    lineHeight: getResponsiveSize(16),
  },
  subscribeButton: {
    paddingVertical: getResponsivePadding(16),
    borderRadius: getResponsiveSize(16),
    alignItems: 'center',
    marginBottom: getResponsivePadding(20),
  },
  subscribeButtonText: {
    fontSize: getResponsiveSize(18),
    fontFamily: 'Outfit',
    fontWeight: '600',
  },
  footerInfo: {
    fontSize: getResponsiveSize(14),
    fontFamily: 'Outfit',
    textAlign: 'center',
    marginBottom: getResponsivePadding(16),
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLink: {
    fontSize: getResponsiveSize(14),
    fontFamily: 'Outfit',
    fontWeight: '500',
  },
  footerSeparator: {
    fontSize: getResponsiveSize(14),
    fontFamily: 'Outfit',
  },
  sectionTitle: {
    fontSize: getResponsiveSize(22),
    fontFamily: 'Outfit',
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: getResponsiveSize(15),
    fontFamily: 'Outfit',
    textAlign: 'center',
    marginTop: getResponsivePadding(4),
  },
  // Testimonials
  testimonialsSection: {
    marginTop: getResponsivePadding(40),
    alignItems: 'center',
  },
  starRatingContainer: {
    flexDirection: 'row',
  },
  starIcon: {
    marginHorizontal: getResponsivePadding(2),
  },
  testimonialsScrollView: {
    marginTop: getResponsivePadding(20),
    marginHorizontal: -getResponsivePadding(20),
  },
  testimonialCard: {
    width: getResponsiveSize(280),
    padding: getResponsivePadding(20),
    borderRadius: getResponsiveSize(16),
    marginRight: getResponsivePadding(12),
  },
  testimonialTitle: {
    fontSize: getResponsiveSize(16),
    fontFamily: 'Outfit',
    fontWeight: '700',
  },
  starRatingContainerSmall: {
    flexDirection: 'row',
    marginVertical: getResponsivePadding(8),
  },
  starIconSmall: {
    marginRight: getResponsivePadding(2),
  },
  testimonialText: {
    fontSize: getResponsiveSize(14),
    fontFamily: 'Outfit',
    lineHeight: getResponsiveSize(20),
    flex: 1,
  },
  testimonialAuthor: {
    fontSize: getResponsiveSize(14),
    fontFamily: 'Outfit',
    fontWeight: '600',
    marginTop: getResponsivePadding(12),
    textAlign: 'right',
  },
  // Apple Feature
  appleFeatureSection: {
    marginVertical: getResponsivePadding(50),
    alignItems: 'center',
  },
  appleIcon: {
    width: getResponsiveSize(40),
    height: getResponsiveSize(40),
    alignSelf: 'center',
  },
  appleFeatureTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getResponsivePadding(16),
  },
  leafIcon: {
    width: getResponsiveSize(30),
    height: getResponsiveSize(75),
  },
  leftLeaf: {
    // Sol yaprak için ekstra style (şimdilik boş)
  },
  rightLeaf: {
    transform: [{ scaleX: -1 }], // Sağ yaprak ters çevrilmiş
  },
  appleFeatureMainText: {
    marginHorizontal: getResponsivePadding(15),
    alignItems: 'center',
  },
  appleFeatureSubtitle: {
    fontSize: getResponsiveSize(12),
    fontFamily: 'Outfit',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  appleFeatureTitle: {
    fontSize: getResponsiveSize(20),
    fontFamily: 'Outfit',
    fontWeight: '700',
  },
  // Comparison
  comparisonSection: {
    marginBottom: getResponsivePadding(40),
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: getResponsivePadding(10),
  },
  comparisonHeaderText: {
    flex: 1,
    fontSize: getResponsiveSize(14),
    fontFamily: 'Outfit',
    fontWeight: '600',
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsivePadding(12),
    borderBottomWidth: 1,
  },
  comparisonFeature: {
    flex: 2,
    fontSize: getResponsiveSize(15),
    fontFamily: 'Outfit',
  },
  comparisonValue: {
    flex: 1,
    fontSize: getResponsiveSize(16),
    fontFamily: 'Outfit',
    fontWeight: '700',
    textAlign: 'center',
  },
  // FAQ
  faqSection: {
    marginBottom: getResponsivePadding(40),
  },
  faqItem: {
    borderRadius: getResponsiveSize(16),
    marginBottom: getResponsivePadding(12),
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsivePadding(20),
  },
  faqQuestionText: {
    flex: 1,
    fontSize: getResponsiveSize(15),
    fontFamily: 'Outfit',
    fontWeight: '600',
    paddingRight: getResponsivePadding(12),
  },
  faqChevron: {
    fontSize: getResponsiveSize(14),
    fontFamily: 'Outfit',
    fontWeight: '600',
  },
  faqAnswer: {
    paddingHorizontal: getResponsivePadding(20),
    paddingBottom: getResponsivePadding(20),
    paddingTop: 0,
  },
  faqAnswerText: {
    fontSize: getResponsiveSize(14),
    fontFamily: 'Outfit',
    lineHeight: getResponsiveSize(20),
  },
  supportSection: {
    alignItems: 'center',
    marginBottom: getResponsivePadding(20),
  },
  supportQuestion: {
    fontSize: getResponsiveSize(14),
    fontFamily: 'Outfit',
    textAlign: 'center',
    marginBottom: getResponsivePadding(4),
  },
  supportEmail: {
    fontSize: getResponsiveSize(14),
    fontFamily: 'Outfit',
    fontWeight: '600',
    textAlign: 'center',
  },
  restoreButton: {
    paddingVertical: getResponsivePadding(12),
    paddingHorizontal: getResponsivePadding(20),
    borderRadius: getResponsiveSize(8),
    borderWidth: 1,
    alignSelf: 'center',
    marginBottom: getResponsivePadding(20),
  },
  restoreButtonText: {
    fontSize: getResponsiveSize(14),
    fontFamily: 'Outfit',
    fontWeight: '600',
  },

});

export default PaywallScreen; 