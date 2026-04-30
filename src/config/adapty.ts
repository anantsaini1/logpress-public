/**
 * Adapty SDK Konfigürasyonu
 */
import Config from 'react-native-config';

export const ADAPTY_CONFIG = {
    API_KEY: Config.ADAPTY_API_KEY ?? '',
    
    // Paywall placement IDs
    PAYWALL_PLACEMENTS: {
      DEFAULT: 'default',
    },
    
    // Abonelik seviyeleri
    ACCESS_LEVELS: {
      PREMIUM: 'premium',
      FREE: 'free',
    },
    
    // Log seviyeleri
    LOG_LEVEL: __DEV__ ? 'verbose' : 'error',
    
    // Timeout ayarları
    TIMEOUT: {
      INITIALIZATION: 10000, // 10 saniye
      PURCHASE: 30000, // 30 saniye
      RESTORE: 20000, // 20 saniye
    },
  } as const;
  
  /**
   * Environment-specific config
   */
  export const getAdaptyConfig = () => {
    // Gerçek uygulamada environment variables kullanılmalıdır
    if (__DEV__) {
      return {
        ...ADAPTY_CONFIG,
        // Development ortamı için özel ayarlar
        LOG_LEVEL: 'verbose',
      };
    }
    
    return {
      ...ADAPTY_CONFIG,
      // Production ortamı için özel ayarlar
      LOG_LEVEL: 'error',
    };
  };
  
  export default ADAPTY_CONFIG; 