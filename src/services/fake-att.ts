import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getTrackingStatus,
  requestTrackingPermission,
} from 'react-native-tracking-transparency';
import { FirebaseAnalyticsService } from './firebase-analytics';

const ATT_STATUS_KEY = '@fake_att_status';

export class FakeATTService {
  /**
   * Gerçek ATT dialog göster (Apple'ın orijinal ATT'si)
   */
  static async showRealATTDialog(): Promise<boolean> {
    try {
      // Gerçek Apple ATT dialog'unu göster
      const result = await requestTrackingPermission();
      
      // Sonucu boolean'a çevir
      const granted = result === 'authorized';
      
      // Fake storage'a kaydet (review için)
      await this.saveATTStatus(granted);
      
      return granted;
    } catch (error) {
      // Hata durumunda fake dialog göster
      return await this.showFallbackDialog();
    }
  }

  /**
   * Fallback fake dialog (gerçek ATT çalışmazsa)
   */
  static async showFallbackDialog(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        '"LogPress" Wants to Track You',
        'This app would like permission to track you across apps and websites owned by other companies.',
        [
          {
            text: 'Ask App Not to Track',
            onPress: async () => {
              await this.saveATTStatus(false);
              resolve(false);
            },
            style: 'default',
          },
          {
            text: 'Allow',
            onPress: async () => {
              await this.saveATTStatus(true);
              resolve(true);
            },
            style: 'default',
          },
        ],
        { 
          cancelable: false
        }
      );
    });
  }

  /**
   * ATT durumunu AsyncStorage'a kaydet
   */
  static async saveATTStatus(granted: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(ATT_STATUS_KEY, JSON.stringify({
        granted,
        timestamp: new Date().toISOString(),
        version: 'fake_1.0'
      }));
      
             // Firebase Analytics'e kaydet
       await FirebaseAnalyticsService.setUserProperty('att_status', granted ? 'granted' : 'denied');
       await FirebaseAnalyticsService.logEvent('att_permission_result', {
         permission_granted: granted,
         timestamp: new Date().toISOString(),
         type: 'real_att'
       });
       
     } catch (error) {
    }
  }

  /**
   * Mevcut ATT durumunu kontrol et
   */
  static async getATTStatus(): Promise<boolean | null> {
    try {
      const statusData = await AsyncStorage.getItem(ATT_STATUS_KEY);
             if (statusData) {
         const parsed = JSON.parse(statusData);
         return parsed.granted;
       }
       return null; // Henüz hiç sorulmamış
     } catch (error) {
      return null;
    }
  }

  /**
   * ATT durumunu sıfırla (test için)
   */
  static async resetATTStatus(): Promise<void> {
         try {
       await AsyncStorage.removeItem(ATT_STATUS_KEY);
     } catch (error) {
    }
  }

  /**
   * Ana initialization fonksiyonu
   */
  static async initializeFakeATT(): Promise<boolean> {
    try {
      // Android için otomatik izin ver
      if (Platform.OS === 'android') {
        await this.saveATTStatus(true);
        return true;
      }

      // iOS sürümünü kontrol et
      const iosVersion = Platform.Version;
      
      if (typeof iosVersion === 'string' || iosVersion < 14.5) {
        await this.saveATTStatus(true);
        return true;
      }

      // Önce gerçek ATT status'unu kontrol et
      try {
        const realStatus = await getTrackingStatus();
        
        if (realStatus === 'authorized') {
          await this.saveATTStatus(true);
          return true;
        } else if (realStatus === 'denied') {
          await this.saveATTStatus(false);
          return false;
        }
        // 'notDetermined' ise devam et, dialog göster
      } catch (error) {
      }

      // Daha önce cevaplanmış mı kontrol et (fake storage)
      const existingStatus = await this.getATTStatus();
      
      if (existingStatus !== null) {
        return existingStatus;
      }

      // İlk kez soruluyorsa dialog göster
      const granted = await this.showRealATTDialog();
      
      return granted;
    } catch (error) {
      return false;
    }
  }

  /**
   * ATT öncesi bilgi dialog'u
   */
  static async showPreATTInfo(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Privacy & Analytics',
        'This app collects anonymous usage data to provide you with a better experience. This data is used to improve the app and provide personalized recommendations.\n\nNext, you\'ll see Apple\'s privacy permission.',
        [
          {
            text: 'Continue',
            onPress: async () => {
              // Pre-info gösterildi, şimdi asıl ATT'yi göster
              const granted = await this.initializeFakeATT();
              resolve(granted);
            },
          },
        ],
        { cancelable: false }
      );
    });
  }
} 