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
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext';
import { adaptyService } from '../services/adapty';
import { ADAPTY_CONFIG } from '../config/adapty';
import { SvgXml } from 'react-native-svg';
import { useAppDispatch } from '../store/hooks';
import { updateUser } from '../store/slices/userSlice';

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

const timerIcon = (color: string) => `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="12" cy="12" r="10" stroke="${color}" stroke-width="2"/>
<polyline points="12,6 12,12 16,14" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const fireIcon = (color: string) => `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.5 14.5C8.5 16.9853 10.5147 19 13 19C15.4853 19 17.5 16.9853 17.5 14.5C17.5 12.0147 15.4853 10 13 10C10.5147 10 8.5 12.0147 8.5 14.5Z" stroke="${color}" stroke-width="2"/>
<path d="M13 10C13 8.5 14 7 15.5 6.5C16.5 6 17 5 17 4C17 3 16 2 15 2C14 2 13 3 13 4V10Z" stroke="${color}" stroke-width="2"/>
</svg>
`;

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
  localizedPrice: string;
  currencyCode: string;
  subscriptionPeriod: any;
  originalProduct: any;
}

const LoserPaywallScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, currentTheme } = useTheme();
  const { t } = useTranslation();
  const { setUserRoleId } = useUser();
  const dispatch = useAppDispatch();

  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 dakika countdown

  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProducts();
    startAnimations();
    startCountdown();
  }, []);

  const startAnimations = () => {
    // Pulse animation for offer
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Shake animation for urgency
    const shake = () => {
      Animated.sequence([
        Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(shake, 5000); // Her 5 saniyede bir shake
      });
    };
    setTimeout(shake, 2000);
  };

  const startCountdown = () => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleClose(); // Süre bitince kapat
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const loadProducts = async () => {
    try {
      const placementId = ADAPTY_CONFIG.PAYWALL_PLACEMENTS.DEFAULT;
      const result = await adaptyService.getProductsForCustomPaywall(placementId);
      
      setProducts(result.products);
      
      if (result.products.length > 0) {
        // Yıllık paketi seç
        const yearlyProduct = result.products.find(p => {
          const period = p.originalProduct?.subscriptionDetails?.subscriptionPeriod;
          return period?.unit === 'year' && period?.numberOfUnits === 1;
        });
        
        setSelectedProduct(yearlyProduct?.id || result.products[0].id);
      }
      
    } catch (error) {
      console.error('❌ LoserPaywallScreen: Product loading error:', error);
      setError(t('paywall_loading_error'));
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (product: ProductData) => {
    try {
      const result = await adaptyService.purchaseFromCustomPaywall(product);
      if (result) {
        // Premium olduktan sonra
        dispatch(updateUser({ user_role_id: 1 }));
        await setUserRoleId(1);
        
        Alert.alert(
          t('success'),
          t('paywall_purchase_success'),
          [{ 
            text: t('paywall_continue'), 
            onPress: () => {
              (navigation as any).reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            }
          }]
        );
      }
    } catch (error: any) {
      if (error.message?.includes('iptal etti') || error.message?.includes('canceled')) {
        return;
      }
      
      const errorMessage = error.message || t('paywall_purchase_error');
      Alert.alert(t('error'), errorMessage, [{ text: t('ok') }]);
    }
  };

  const handleSubscribe = () => {
    const product = products.find(p => p.id === selectedProduct);
    if (product) {
      handlePurchase(product);
    }
  };

  const handleClose = () => {
    // Ana sayfaya git
    (navigation as any).reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
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

  const selectedProductData = products.find(p => p.id === selectedProduct);

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

        {/* Urgency Timer */}
        <Animated.View style={[
          styles.urgencyContainer,
          { 
            backgroundColor: colors.primary + '15',
            borderColor: colors.primary,
            transform: [{ translateX: shakeAnimation }]
          }
        ]}>
          <SvgXml xml={timerIcon(colors.primary)} width={getResponsiveSize(20)} height={getResponsiveSize(20)} />
          <Text style={[styles.urgencyText, { color: colors.primary }]}>
            {t('loser_paywall_urgency_text')} {formatTime(timeLeft)}
          </Text>
        </Animated.View>

        {/* Main Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          {t('loser_paywall_wait_title')}
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('loser_paywall_wait_subtitle')}
        </Text>

        {/* Special Offer Card */}
        {!loading && !error && selectedProductData && (
          <Animated.View style={[
            styles.offerCard,
            { 
              backgroundColor: colors.surface,
              borderColor: colors.primary,
              transform: [{ scale: pulseAnimation }]
            }
          ]}>
            <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
              <SvgXml xml={fireIcon(colors.buttonText)} width={getResponsiveSize(16)} height={getResponsiveSize(16)} />
              <Text style={[styles.discountText, { color: colors.buttonText }]}>
                {t('loser_paywall_special_offer')}
              </Text>
            </View>

            <Text style={[styles.offerTitle, { color: colors.text }]}>
              {t('loser_paywall_offer_title')}
            </Text>

            <Text style={[styles.productType, { color: colors.primary }]}>
              {t('paywall_yearly')}
            </Text>

            <Text style={[styles.productPrice, { color: colors.text }]}>
              {selectedProductData.localizedPrice || 
               selectedProductData.originalProduct?.localizedPrice || 
               selectedProductData.price?.localizedString || 
               `${selectedProductData.price?.amount || '?'} ${selectedProductData.currencyCode || 'USD'}`}
            </Text>

            <Text style={[styles.offerDescription, { color: colors.textSecondary }]}>
              {t('loser_paywall_offer_description')}
            </Text>
          </Animated.View>
        )}

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('loser_paywall_benefits_title')}
          </Text>
          
          {[
            t('loser_paywall_benefit_1'),
            t('loser_paywall_benefit_2'),
            t('loser_paywall_benefit_3'),
            t('loser_paywall_benefit_4'),
          ].map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <View style={[styles.checkIcon, { backgroundColor: colors.primary }]}>
                <Text style={[styles.checkMark, { color: colors.buttonText }]}>✓</Text>
              </View>
              <Text style={[styles.benefitText, { color: colors.text }]}>
                {benefit}
              </Text>
            </View>
          ))}
        </View>

        {/* Subscribe Button */}
        <TouchableOpacity
          style={[styles.subscribeButton, { backgroundColor: colors.primary }]}
          onPress={handleSubscribe}
        >
          <Text style={[styles.subscribeButtonText, { color: colors.buttonText }]}>
            {t('loser_paywall_cta_button')}
          </Text>
        </TouchableOpacity>

        {/* Skip Button */}
        <TouchableOpacity
          style={[styles.skipButton, { borderColor: colors.border }]}
          onPress={handleClose}
        >
          <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
            {t('loser_paywall_skip_button')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  },
  closeButton: {
    position: 'absolute',
    top: getResponsivePadding(50),
    right: getResponsivePadding(20),
    zIndex: 1000,
    width: getResponsiveSize(32),
    height: getResponsiveSize(32),
    borderRadius: getResponsiveSize(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: getResponsiveSize(20),
    fontWeight: '600',
    fontFamily: 'Outfit',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: getResponsivePadding(20),
    paddingTop: getResponsivePadding(100),
    paddingBottom: getResponsivePadding(40),
  },
  logoImage: {
    width: getResponsiveSize(60),
    height: getResponsiveSize(60),
    alignSelf: 'center',
    marginBottom: getResponsivePadding(30),
  },
  urgencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsivePadding(12),
    paddingHorizontal: getResponsivePadding(20),
    borderRadius: getResponsiveSize(25),
    borderWidth: 2,
    marginBottom: getResponsivePadding(30),
  },
  urgencyText: {
    fontSize: getResponsiveSize(16),
    fontWeight: '700',
    fontFamily: 'Outfit',
    marginLeft: getResponsivePadding(8),
  },
  title: {
    fontSize: getResponsiveSize(28),
    fontWeight: '800',
    fontFamily: 'Outfit',
    textAlign: 'center',
    marginBottom: getResponsivePadding(16),
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: getResponsiveSize(16),
    fontWeight: '500',
    fontFamily: 'Outfit',
    textAlign: 'center',
    marginBottom: getResponsivePadding(40),
    lineHeight: getResponsiveSize(22),
  },
  offerCard: {
    borderRadius: getResponsiveSize(20),
    borderWidth: 2,
    padding: getResponsivePadding(24),
    marginBottom: getResponsivePadding(40),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(16),
    paddingVertical: getResponsivePadding(8),
    borderRadius: getResponsiveSize(20),
    marginBottom: getResponsivePadding(16),
  },
  discountText: {
    fontSize: getResponsiveSize(14),
    fontWeight: '700',
    fontFamily: 'Outfit',
    marginLeft: getResponsivePadding(6),
  },
  offerTitle: {
    fontSize: getResponsiveSize(24),
    fontWeight: '700',
    fontFamily: 'Outfit',
    textAlign: 'center',
    marginBottom: getResponsivePadding(16),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsivePadding(16),
  },
  originalPrice: {
    fontSize: getResponsiveSize(18),
    fontWeight: '500',
    fontFamily: 'Outfit',
    textDecorationLine: 'line-through',
    marginRight: getResponsivePadding(12),
  },
  discountedPrice: {
    fontSize: getResponsiveSize(24),
    fontWeight: '800',
    fontFamily: 'Outfit',
  },
  offerDescription: {
    fontSize: getResponsiveSize(14),
    fontWeight: '400',
    fontFamily: 'Outfit',
    textAlign: 'center',
    lineHeight: getResponsiveSize(20),
  },
  benefitsSection: {
    marginBottom: getResponsivePadding(40),
  },
  sectionTitle: {
    fontSize: getResponsiveSize(20),
    fontWeight: '700',
    fontFamily: 'Outfit',
    marginBottom: getResponsivePadding(20),
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsivePadding(16),
  },
  checkIcon: {
    width: getResponsiveSize(24),
    height: getResponsiveSize(24),
    borderRadius: getResponsiveSize(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getResponsivePadding(12),
  },
  checkMark: {
    fontSize: getResponsiveSize(14),
    fontWeight: '700',
    fontFamily: 'Outfit',
  },
  benefitText: {
    fontSize: getResponsiveSize(16),
    fontWeight: '500',
    fontFamily: 'Outfit',
    flex: 1,
    lineHeight: getResponsiveSize(22),
  },
  subscribeButton: {
    paddingVertical: getResponsivePadding(18),
    paddingHorizontal: getResponsivePadding(32),
    borderRadius: getResponsiveSize(25),
    marginBottom: getResponsivePadding(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subscribeButtonText: {
    fontSize: getResponsiveSize(18),
    fontWeight: '700',
    fontFamily: 'Outfit',
    textAlign: 'center',
  },
  skipButton: {
    paddingVertical: getResponsivePadding(12),
    paddingHorizontal: getResponsivePadding(20),
    borderRadius: getResponsiveSize(8),
    borderWidth: 1,
    alignSelf: 'center',
  },
  skipButtonText: {
    fontSize: getResponsiveSize(14),
    fontWeight: '500',
    fontFamily: 'Outfit',
    textAlign: 'center',
  },
  productType: {
    fontSize: getResponsiveSize(16),
    fontWeight: '600',
    fontFamily: 'Outfit',
    textAlign: 'center',
    marginBottom: getResponsivePadding(8),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productPrice: {
    fontSize: getResponsiveSize(32),
    fontWeight: '800',
    fontFamily: 'Outfit',
    textAlign: 'center',
    marginBottom: getResponsivePadding(16),
  },
});

export default LoserPaywallScreen;