import { adapty } from 'react-native-adapty';
import { storage } from './storage';
import { OFFLINE_MODE } from '../config/offline';

/**
 * Networksüz/test modu için sahte paywall ürünleri.
 * PaywallScreen ve LoserPaywallScreen'in beklediği ProductData şekline birebir uyar.
 * (period bilgisi originalProduct.subscriptionDetails.subscriptionPeriod'tan okunuyor.)
 */
const makeMockProduct = (
  id: string,
  unit: 'week' | 'month' | 'year',
  numberOfUnits: number,
  localizedPrice: string,
  amount: number,
  description: string,
) => ({
  id,
  title: `Premium ${id}`,
  description,
  price: { amount, currencyCode: 'USD', currencySymbol: '$', localizedString: localizedPrice },
  localizedPrice,
  currencyCode: 'USD',
  subscriptionPeriod: { unit, numberOfUnits },
  originalProduct: {
    vendorProductId: id,
    localizedPrice,
    subscriptionDetails: { subscriptionPeriod: { unit, numberOfUnits } },
  },
});

const OFFLINE_MOCK_PRODUCTS = [
  makeMockProduct('logpress_premium_1m', 'month', 1, '$9.99', 9.99, 'Billed monthly. Cancel anytime.'),
  makeMockProduct('logpress_premium_3m', 'month', 3, '$24.99', 24.99, 'Billed every 3 months. Best value to start.'),
  makeMockProduct('logpress_premium_1y', 'year', 1, '$59.99', 59.99, 'Billed yearly. Save 50%.'),
];

/**
 * Adapty servis sinifi
 * Abonelik yonetimi icin kullanilir
 */
class AdaptyService {
  private static instance: AdaptyService;
  private isInitialized: boolean = false;

  private constructor() {}

  /**
   * Singleton instance dondurun
   */
  public static getInstance(): AdaptyService {
    if (!AdaptyService.instance) {
      AdaptyService.instance = new AdaptyService();
    }
    return AdaptyService.instance;
  }

  /**
   * Adapty SDK baslatir
   * @param apiKey Adapty API anahtari
   */
  public async initialize(apiKey: string): Promise<void> {
    try {
      if (OFFLINE_MODE) {
        // Networksüz mod: SDK aktive edilmez, hiçbir Adapty isteği atılmaz.
        this.isInitialized = false;
        return;
      }
      if (this.isInitialized) {
        return;
      }

      // SDK'yi dogru sekilde baslat - çok daha kısa timeout ile
      const initializationPromise = adapty.activate(apiKey, {
        observerMode: false,
        logLevel: __DEV__ ? 'verbose' : 'error',
      });
      
      // Kısa timeout ile race condition oluştur
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Adapty initialization timeout')), 8000)
      );
      
      await Promise.race([initializationPromise, timeoutPromise]);
      
      this.isInitialized = true;
      
      // Başlangıç bilgilerini test et (non-blocking)
      setTimeout(() => {
        this.testConnection().catch(error => {
        });
      }, 2000);
      
    } catch (error) {
      // İlk initialization failed - başka yerde tekrar denenir
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Kullaniciyi tanimlar
   * @param userId Benzersiz kullanici kimligi
   */
  public async identifyUser(userId: string): Promise<void> {
    try {
      if (OFFLINE_MODE) return;
      await adapty.identify(userId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mevcut paywallari getirir
   * @param placementId Paywall yerlesim kimligi
   */
  public async getPaywall(placementId: string) {
    try {
      if (!placementId || placementId.trim() === '') {
        throw new Error('Placement ID bos olamaz');
      }
      
      const paywall = await adapty.getPaywall(placementId);
      return paywall;
    } catch (error: any) {
      // Hata tipine gore daha aciklayici mesajlar
      if (error.code === 2003 || error.message?.includes('2003')) {
        throw new Error(`Placement ID '${placementId}' bulunamadi. Adapty dashboardinda bu placementin olusturuldugunu emin olun.`);
      } else if (error.code === 2002) {
        throw new Error('API key gecersiz. Adapty dashboardindan dogru API keyini alin.');
      } else if (error.code === 2001) {
        throw new Error('Ag hatasi. Internet baglantinizi kontrol edin.');
      }
      
      throw error;
    }
  }

  /**
   * Urunleri getirir
   * @param paywall Paywall objesi
   */
  public async getPaywallProducts(paywall: any) {
    try {
      const products = await adapty.getPaywallProducts(paywall);
      return products;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Test icin basit paywall olmadan urun kontrolu
   */
  public async testConnection(): Promise<boolean> {
    try {
      // Sadece profil bilgilerini cekmeye calis
      const profile = await adapty.getProfile();
      
      // Ek test: Paywall varlık kontrolü
      try {
        const testPaywall = await adapty.getPaywall('default');
        
        // Ürünleri de test et
        const testProducts = await adapty.getPaywallProducts(testPaywall);
        
      } catch (paywallError: any) {
      }
      
      return true;
    } catch (error: any) {
      return false;
    }
  }

  /**
   * Mevcut placementlari listele (debug icin)
   */
  public async listAvailablePlacements(): Promise<string[]> {
    try {
      // Yaygin placement IDlerini test et
      const commonPlacements = [
        'default'
      ];
      
      const availablePlacements: string[] = [];
      
      for (const placementId of commonPlacements) {
        try {
          await adapty.getPaywall(placementId);
          availablePlacements.push(placementId);
        } catch (error) {
        }
      }
      
      return availablePlacements;
    } catch (error) {
      return [];
    }
  }

  /**
   * Kendi paywalli icin urunleri ve detaylarini getirir
   * @param placementId Placement ID
   * @returns Formatlanmis urun listesi
   */
  public async getProductsForCustomPaywall(placementId: string) {
    try {
      if (OFFLINE_MODE) {
        // Test modu: network'e çıkmadan sahte ürünleri döndür
        return {
          products: OFFLINE_MOCK_PRODUCTS,
          paywall: null,
          placementId,
          originalRequestedPlacementId: placementId,
        };
      }
      // Once baglantıyi test et
      const isConnected = await this.testConnection();
      if (!isConnected) {
        throw new Error('Adapty baglantisi kurulamadi. API keyinizi kontrol edin.');
      }

      // Once mevcut placementlari kontrol et
      const availablePlacements = await this.listAvailablePlacements();
      
      if (availablePlacements.length === 0) {
        throw new Error('Hic placement bulunamadi. Adapty dashboardinda paywall olusturun.');
      }
      
      // Eger istenen placement mevcut degilse, ilk mevcut olani kullan
      let targetPlacementId = placementId;
      if (!availablePlacements.includes(placementId)) {
        targetPlacementId = availablePlacements[0];
      }
      
      const paywall = await this.getPaywall(targetPlacementId);
      const products = await this.getPaywallProducts(paywall);
      
      // Urunleri daha kullanisli formatta dondur
      const formattedProducts = products.map((product: any, index: number) => {
        // En güvenilir fiyat string'ini al
        const finalPrice = product.localizedPrice || 
                          product.price?.localizedString || 
                          `${product.price?.amount || 0} ${product.currencyCode || 'TRY'}`;
        
        return {
          id: product.vendorProductId,
          title: product.localizedTitle || `Premium ${product.vendorProductId}`,
          description: product.localizedDescription || 'Premium subscription',
          price: {
            amount: product.price?.amount,
            currencyCode: product.currencyCode,
            currencySymbol: product.price?.currencySymbol,
            localizedString: finalPrice,
          },
          localizedPrice: finalPrice,
          currencyCode: product.currencyCode,
          subscriptionPeriod: product.subscriptionPeriod,
          introductoryOfferEligibility: product.introductoryOfferEligibility,
          introductoryDiscount: product.introductoryDiscount,
          discounts: product.discounts,
          originalProduct: product, // Orijinal urun objesi satin alma icin gerekli
          paywall: paywall, // Paywall objesi de gerekli
        };
      });
      
      return {
        products: formattedProducts,
        paywall: paywall,
        placementId: targetPlacementId,
        originalRequestedPlacementId: placementId
      };
    } catch (error: any) {
      // Daha aciklayici hata mesajlari
      if (error.message?.includes('Placement ID')) {
        throw error; // Zaten aciklayici
      } else if (error.code === 2003) {
        throw new Error('Adapty dashboardinda paywall olusturun ve placement IDsini dogru ayarlayin.');
      } else if (error.code === 2002) {
        throw new Error('API key gecersiz. Adapty hesabinizdan dogru API keyini alin.');
      }
      
      throw error;
    }
  }

  /**
   * Kullanicinin premium durumunu kontrol eder
   * @param accessLevelId Access level ID (orn: 'premium')
   */
  public async checkPremiumAccess(accessLevelId: string = 'premium'): Promise<boolean> {
    try {
      if (OFFLINE_MODE) return false;
      const profile = await this.getProfile();
      
      if (!profile.accessLevels) {
        return false;
      }
      
      const accessLevel = profile.accessLevels[accessLevelId];
      
      if (!accessLevel) {
        return false;
      }
      
      const isActive = accessLevel.isActive;
      
      return isActive;
    } catch (error) {
      return false;
    }
  }

  /**
   * Kullanicinin abonelik detaylarini getirir
   */
  public async getSubscriptionDetails() {
    try {
      const profile = await this.getProfile();
      return {
        subscriptions: profile.subscriptions,
        accessLevels: profile.accessLevels,
        nonSubscriptions: profile.nonSubscriptions,
        profileId: profile.profileId,
        customerUserId: profile.customerUserId,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Satin alma islemini baslatir
   * @param product Satin alinacak urun
   */
  public async makePurchase(product: any) {
    try {
      const result = await adapty.makePurchase(product);
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Kendi paywallindan satin alma yapar
   * @param productData Custom paywall'dan gelen urun verisi
   */
  public async purchaseFromCustomPaywall(productData: any) {
    try {
      if (OFFLINE_MODE) {
        // Test modu: satın alma anında başarılı sayılır (truthy = başarı)
        return { success: true, offline: true, product: productData?.id };
      }
      // Orijinal urun objesini kullan
      const result = await adapty.makePurchase(productData.originalProduct);
      
      // Satin alma basarılıysa profili guncelle
      if (result) {
        return result;
      }
    } catch (error: any) {
      // Spesifik hata mesajları
      if (error.code === 2) {
        throw new Error('Kullanıcı satın almayı iptal etti');
      } else if (error.code === 0) {
        throw new Error('Geçersiz ürün ID\'si veya ürün mevcut değil');
      } else if (error.code === 1) {
        throw new Error('Ödeme yöntemi geçersiz');
      } else if (error.code === 3) {
        throw new Error('Ödeme izni verilmedi');
      } else if (error.code === 4) {
        throw new Error('Geçersiz ürün tanımlayıcısı');
      } else if (error.code === 5) {
        throw new Error('Ürün mevcut değil');
      } else if (error.code === 6) {
        throw new Error('İstek geçersiz');
      } else if (error.code === 7) {
        throw new Error('Store hizmeti mevcut değil');
      } else if (error.code === 8) {
        throw new Error('İstemci geçersiz');
      } else if (error.code === 9) {
        throw new Error('Ödeme iptal edildi');
      } else if (error.code === 10) {
        throw new Error('Ödeme geçersiz');
      } else if (error.code === 11) {
        throw new Error('Ödemeye izin verilmedi');
      } else if (error.code === 12) {
        throw new Error('Bilinmeyen hata');
      } else if (error.code === 1000) {
        throw new Error('App Store Connect yapılandırma hatası. Bundle ID ve ürün ID\'lerini kontrol edin.');
      } else {
        throw new Error(`Satın alma hatası: ${error.message || 'Bilinmeyen hata'}`);
      }
    }
  }

  /**
   * Kullanicinin mevcut abonelik durumunu getirir
   */
  public async getProfile() {
    try {
      const profile = await adapty.getProfile();
      return profile;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Abonelikleri geri yukler
   */
  public async restorePurchases() {
    try {
      if (OFFLINE_MODE) {
        // Test modu: geri yüklenecek satın alma yok (network'e çıkma)
        return { success: false, offline: true };
      }
      // Önce mevcut profili kontrol et
      const currentProfile = await this.getProfile();
      
      // Restore işlemini başlat
      const profile = await adapty.restorePurchases();
      
      return profile;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Kullaniciya ozel ozellikler atar
   * @param attributes Kullanici ozellikleri
   */
  public async updateProfile(attributes: any) {
    try {
      await adapty.updateProfile(attributes);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Profil fotoğrafı URL'ini Adapty'e kaydeder
   * @param imageUrl Profil fotoğrafı URL'i
   */
  public async updateProfileImage(imageUrl: string): Promise<void> {
    try {
      const attributes = {
        profile_image_url: imageUrl
      };
      
      await this.updateProfile(attributes);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Kullanıcının profil bilgilerini Adapty'den alır
   */
  public async getUserProfileData(): Promise<any> {
    try {
      const profile = await this.getProfile();
      
      return {
        profileId: profile.profileId,
        customerUserId: profile.customerUserId,
        profileImageUrl: profile.customAttributes?.profile_image_url,
        displayName: profile.customAttributes?.display_name,
        bio: profile.customAttributes?.bio,
        instagram: profile.customAttributes?.instagram,
        twitter: profile.customAttributes?.twitter,
        linkedin: profile.customAttributes?.linkedin,
        website: profile.customAttributes?.website,
        updatedAt: profile.customAttributes?.profile_updated_at,
        accessLevels: profile.accessLevels,
        subscriptions: profile.subscriptions
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Kullanıcının tüm profil bilgilerini Adapty'e kaydeder
   * @param profileData Profil verileri
   */
  public async updateUserProfileData(profileData: {
    displayName?: string;
    bio?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
    profileImageUrl?: string;
  }): Promise<void> {
    try {
      const attributes: any = {};

      if (profileData.displayName) attributes.display_name = profileData.displayName;
      if (profileData.bio) attributes.bio = profileData.bio;
      if (profileData.instagram) attributes.instagram = profileData.instagram;
      if (profileData.twitter) attributes.twitter = profileData.twitter;
      if (profileData.linkedin) attributes.linkedin = profileData.linkedin;
      if (profileData.website) attributes.website = profileData.website;
      if (profileData.profileImageUrl) attributes.profile_image_url = profileData.profileImageUrl;

      await this.updateProfile(attributes);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Event loglamak icin (analytics)
   * @param eventName Event adi
   * @param parameters Event parametreleri
   */
  public async logEvent(eventName: string, parameters?: any) {
    try {
      await adapty.logShowPaywall(parameters || {});
    } catch (error) {
    }
  }

  /**
   * SDKnın baslatilip baslatilmadigini kontrol eder
   */
  public isSDKInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Basit refund kontrolü - sadece user_role_id günceller
   */
  public async checkAndHandleRefund(): Promise<boolean> {
    try {
      if (OFFLINE_MODE) return false;
      const profile = await this.getProfile();
      let hasRefund = false;
      
      // Access levels kontrolü
      if (profile.accessLevels) {
        Object.keys(profile.accessLevels).forEach(levelId => {
          const accessLevel = profile.accessLevels![levelId];
          if (accessLevel.isRefund || (!accessLevel.isActive && !accessLevel.willRenew)) {
            hasRefund = true;
          }
        });
      }
      
      // Subscriptions kontrolü  
      if (profile.subscriptions) {
        Object.keys(profile.subscriptions).forEach(subId => {
          const subscription = profile.subscriptions![subId];
          if (subscription.isRefund || (!subscription.isActive && !subscription.willRenew)) {
            hasRefund = true;
          }
        });
      }
      
      // Eğer refund varsa user'ı downgrade et
      if (hasRefund) {
        await this.downgradeUserToFree();
        return true;
      }
      
      return false;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Detaylı refund kontrolü (eski versiyon)
   */
  public async checkRefundStatus(): Promise<{
    hasRefund: boolean;
    refundedSubscriptions: any[];
    shouldDowngrade: boolean;
  }> {
    try {
      const profile = await this.getProfile();
      const refundedSubscriptions: any[] = [];
      let hasActiveAccess = false;
      
      // Access levels kontrolü
      if (profile.accessLevels) {
        Object.keys(profile.accessLevels).forEach(levelId => {
          const accessLevel = profile.accessLevels![levelId];
          
          if (accessLevel.isActive) {
            hasActiveAccess = true;
          }
          
          // İade tespiti
          if (accessLevel.isRefund) {
            refundedSubscriptions.push({
              levelId,
              store: accessLevel.store,
              expiresAt: accessLevel.expiresAt
            });
          }
        });
      }
      
      // Subscriptions kontrolü  
      if (profile.subscriptions) {
        Object.keys(profile.subscriptions).forEach(subId => {
          const subscription = profile.subscriptions![subId];
          
          // İade tespiti
          if (subscription.isRefund) {
            refundedSubscriptions.push({
              subscriptionId: subId,
              store: subscription.store,
              expiresAt: subscription.expiresAt
            });
          }
        });
      }
      
      const hasRefund = refundedSubscriptions.length > 0;
      const shouldDowngrade = hasRefund && !hasActiveAccess;
      
      return {
        hasRefund,
        refundedSubscriptions,
        shouldDowngrade
      };
      
    } catch (error) {
      return {
        hasRefund: false,
        refundedSubscriptions: [],
        shouldDowngrade: false
      };
    }
  }

  /**
   * Kullanıcıyı free tier'a düşürür (basit versiyon)
   */
  private async downgradeUserToFree(): Promise<void> {
    try {
      const userInfo = await storage.getUserInfo();
      
      if (userInfo) {
        const updatedUserInfo = {
          ...userInfo,
          user_role_id: 0, // Free tier
          subscription_status: 'refunded',
          updated_at: new Date().toISOString()
        };
        
        await storage.setUserInfo(updatedUserInfo);
      }
      
    } catch (error) {
    }
  }

  /**
   * Kullanıcıyı downgrade eder (detaylı versiyon)
   */
  private async handleUserDowngrade(refundedSubscriptions: any[]): Promise<void> {
    try {
      // Storage'dan user bilgilerini al ve güncelle
      const userInfo = await storage.getUserInfo();
      
      if (userInfo) {
        // User role'ü free (0) yap
        const updatedUserInfo = {
          ...userInfo,
          user_role_id: 0,
          subscription_status: 'refunded',
          refund_date: new Date().toISOString(),
          refunded_subscriptions: refundedSubscriptions,
          updated_at: new Date().toISOString()
        };
        
        await storage.setUserInfo(updatedUserInfo);
      }
      
      // Alert göster
      setTimeout(() => {
        this.showRefundAlert(refundedSubscriptions);
      }, 1000);
      
    } catch (error) {
    }
  }

  /**
   * Kullanıcıya refund bildirimi göster
   */
  private showRefundAlert(refundedSubscriptions: any[]): void {
    try {
      const Alert = require('react-native').Alert;
      
      Alert.alert(
        'Abonelik İade Edildi',
        'Premium aboneliğiniz iade edilmiştir. Artık ücretsiz özellikleri kullanabilirsiniz.',
        [
          {
            text: 'Anladım',
            style: 'default',
            onPress: () => {
            }
          }
        ],
        { cancelable: false }
      );
    } catch (error) {
    }
  }
}

// Singleton instancei export et
export const adaptyService = AdaptyService.getInstance();
export default AdaptyService; 