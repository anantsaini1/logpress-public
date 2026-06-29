import { getAnalytics, logEvent, logScreenView, setUserId, setUserProperty, setAnalyticsCollectionEnabled } from '@react-native-firebase/analytics';
import { getApp } from '@react-native-firebase/app';
import { OFFLINE_MODE } from '../config/offline';

export class FirebaseAnalyticsService {
  private static analyticsInstance: any = null;

  // Networksüz mod: native otomatik analytics toplamasını (session_start vb.)
  // class yüklenir yüklenmez kapat. Flag false olunca bu blok hiç çalışmaz.
  private static readonly _offlineInit = (() => {
    if (OFFLINE_MODE) {
      try { setAnalyticsCollectionEnabled(getAnalytics(getApp()), false); } catch (e) {}
    }
    return true;
  })();

  private static getAnalyticsInstance(): any {
    if (!this.analyticsInstance) {
      this.analyticsInstance = getAnalytics(getApp());
    }
    return this.analyticsInstance;
  }

  static async logEvent(eventName: string, parameters?: { [key: string]: any }) {
    if (OFFLINE_MODE) return;
    try {
      const analytics = this.getAnalyticsInstance();
      await logEvent(analytics, eventName, parameters);
    } catch (error) {
    }
  }

  static async logScreenView(screenName: string, screenClass?: string) {
    if (OFFLINE_MODE) return;
    try {
      const analytics = this.getAnalyticsInstance();
      await logScreenView(analytics, {
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch (error) {
    }
  }

  static async setUserId(userId: string) {
    if (OFFLINE_MODE) return;
    try {
      const analytics = this.getAnalyticsInstance();
      await setUserId(analytics, userId);
    } catch (error) {
    }
  }

  static async setUserProperty(name: string, value: string) {
    if (OFFLINE_MODE) return;
    try {
      const analytics = this.getAnalyticsInstance();
      await setUserProperty(analytics, name, value);
    } catch (error) {
    }
  }

  // Önceden tanımlanmış eventler
  static async logLogin(method: string) {
    await this.logEvent('login', { method });
  }

  static async logSignUp(method: string) {
    await this.logEvent('sign_up', { method });
  }

  static async logWorkoutStarted(workoutType: string, duration?: number) {
    await this.logEvent('workout_started', { 
      workout_type: workoutType,
      duration: duration 
    });
  }

  static async logWorkoutCompleted(workoutType: string, duration: number) {
    await this.logEvent('workout_completed', { 
      workout_type: workoutType,
      duration: duration 
    });
  }

  static async logSettingsChanged(settingName: string, value: string) {
    await this.logEvent('settings_changed', { 
      setting_name: settingName,
      value: value 
    });
  }
} 