import { Platform, Alert } from 'react-native';
import {
  getTrackingStatus,
  requestTrackingPermission,
} from 'react-native-tracking-transparency';

export class TrackingTransparencyService {
  /**
   * iOS 14.5+ için App Tracking Transparency izni kontrolü ve isteği
   */
  static async requestTrackingPermission(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return true; // Android için true döner
    }

    try {
      // iOS sürümünü kontrol et (iOS 14.5+ gerekli)
      const iosVersion = Platform.Version;
      
      if (typeof iosVersion === 'string' || iosVersion < 14.5) {
        return true; // Eski iOS sürümleri için true döner
      }

      // Mevcut tracking durumunu kontrol et
      const trackingStatus = await getTrackingStatus();

      switch (trackingStatus as string) {
        case 'authorized':
          return true;

        case 'denied':
          return false;

        case 'restricted':
          return false;

        case 'notDetermined':
          // Kullanıcıdan izin iste
          const requestResult = await requestTrackingPermission();

          if (requestResult === 'authorized') {
            return true;
          } else {
            return false;
          }

        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Mevcut tracking permission durumunu kontrol et
   */
  static async getTrackingStatus(): Promise<string | null> {
    if (Platform.OS !== 'ios') {
      return null;
    }

    try {
      const status = await getTrackingStatus();
      return status;
    } catch (error) {
      return null;
    }
  }

  /**
   * Tracking izni var mı kontrolü
   */
  static async hasTrackingPermission(): Promise<boolean> {
    const status = await this.getTrackingStatus();
    return status === 'authorized';
  }

  /**
   * Kullanıcıya ATT hakkında bilgi veren dialog
   */
  static showTrackingInfo(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Gizlilik ve Analitik',
        'Bu uygulama size daha iyi bir deneyim sunmak için anonim kullanım verilerini toplar. Bu veriler uygulamayı geliştirmek ve kişiselleştirilmiş deneyim sağlamak için kullanılır.',
        [
          {
            text: 'Daha Sonra',
            onPress: () => resolve(false),
            style: 'cancel',
          },
          {
            text: 'İzin Ver',
            onPress: async () => {
              const hasPermission = await this.requestTrackingPermission();
              resolve(hasPermission);
            },
          },
        ],
        { cancelable: false }
      );
    });
  }

  /**
   * Manuel ATT test için
   */
  static showManualATTTest(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        '🔒 ATT Test',
        'iOS Simülatörde ATT bazen çalışmayabilir. Gerçek cihazda test etmelisiniz.\n\nManuel test yapmak ister misiniz?',
        [
          {
            text: 'Hayır',
            onPress: () => resolve(false),
            style: 'cancel',
          },
          {
            text: 'Test Et',
            onPress: async () => {
              const hasPermission = await this.requestTrackingPermission();
              resolve(hasPermission);
            },
          },
        ],
        { cancelable: false }
      );
    });
  }

  /**
   * Uygulama başlarken ATT kontrolü
   */
  static async initializeATT(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return true;
    }

    try {
      // Önce mevcut durumu kontrol et
      const currentStatus = await this.getTrackingStatus();
      
      if (currentStatus === 'notDetermined') {
        // Henüz sorulmamışsa bilgi dialog'u göster
        return await this.showTrackingInfo();
      } else {
        // Zaten bir karar verilmişse sadece durumu döner
        return currentStatus === 'authorized';
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Firebase Analytics ile ATT durumunu senkronize et
   */
  static async syncWithFirebase(): Promise<void> {
    try {
      const hasPermission = await this.hasTrackingPermission();
      
      // Firebase Analytics'e tracking izin durumunu bildir
      const { FirebaseAnalyticsService } = await import('./firebase-analytics');
      await FirebaseAnalyticsService.setUserProperty('att_status', hasPermission ? 'granted' : 'denied');
      
    } catch (error) {
    }
  }
} 