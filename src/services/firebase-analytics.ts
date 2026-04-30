import { getAnalytics, logEvent, logScreenView, setUserId, setUserProperty } from '@react-native-firebase/analytics';
import { getApp } from '@react-native-firebase/app';

export class FirebaseAnalyticsService {
  private static analyticsInstance: any = null;

  private static getAnalyticsInstance(): any {
    if (!this.analyticsInstance) {
      this.analyticsInstance = getAnalytics(getApp());
    }
    return this.analyticsInstance;
  }

  static async logEvent(eventName: string, parameters?: { [key: string]: any }) {
    try {
      const analytics = this.getAnalyticsInstance();
      await logEvent(analytics, eventName, parameters);
    } catch (error) {
    }
  }

  static async logScreenView(screenName: string, screenClass?: string) {
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
    try {
      const analytics = this.getAnalyticsInstance();
      await setUserId(analytics, userId);
    } catch (error) {
    }
  }

  static async setUserProperty(name: string, value: string) {
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