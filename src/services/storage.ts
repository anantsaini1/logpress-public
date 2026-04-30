import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

type ThemeType = 'light' | 'dark' | 'system';

// ✅ TEKİLLEŞTİRİLMİŞ STORAGE KEYS - Sadece gerekli olanlar
const STORAGE_KEYS = {
  THEME: '@logpressai_theme',
  USER_DATA: '@logpressai_user_data', // Ana user verisi (onboarding, UUID, her şey dahil)
  USER_STATS: '@logpressai_user_stats',
  PREMIUM_STATUS: '@logpressai_premium_status',
  AUTH_SESSION_CREATED: '@logpressai_auth_session_created', // Auth session oluşturuldu mu kontrolü
  LANGUAGE: '@logpressai_language', // Dil seçimi için
  RATING_HISTORY: '@logpressai_rating_history', // Rating değişim geçmişi
};

// 🚀 Cache Layer - Her data type için ayrı cache
class CacheManager {
  private static caches: { [key: string]: any } = {};
  private static lastUpdated: { [key: string]: number } = {};
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

  static set(key: string, data: any) {
    this.caches[key] = data;
    this.lastUpdated[key] = Date.now();

  }

  static get(key: string): any | null {
    const cached = this.caches[key];
    const lastUpdate = this.lastUpdated[key];
    
    if (!cached || !lastUpdate) {

      return null;
    }

    const isExpired = (Date.now() - lastUpdate) > this.CACHE_DURATION;
    if (isExpired) {

      this.invalidate(key);
      return null;
    }


    return cached;
  }

  static invalidate(key: string) {
    delete this.caches[key];
    delete this.lastUpdated[key];

  }

  static invalidateAll() {
    this.caches = {};
    this.lastUpdated = {};

  }
}

export const storage = {
  // Tema işlemleri
  async getTheme(): Promise<ThemeType | null> {
    try {
      // Cache'den kontrol et
      const cached = CacheManager.get(STORAGE_KEYS.THEME);
      if (cached !== null) return cached;

      // Cache yoksa AsyncStorage'dan çek
      const theme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      const result = theme as ThemeType;
      
      // Cache'e kaydet
      if (result) CacheManager.set(STORAGE_KEYS.THEME, result);
      
      return result;
    } catch (error) {
      console.error('Tema yüklenirken hata:', error);
      return null;
    }
  },

  async setTheme(theme: ThemeType): Promise<void> {
    try {
      // 1. AsyncStorage'a kaydet
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
      
      // 2. Cache'i güncelle
      CacheManager.set(STORAGE_KEYS.THEME, theme);
      
      // 3. Gelecekte DB'ye de kaydedilecek
      // await this.syncToDatabase('theme', theme);
    } catch (error) {
      console.error('Tema kaydedilirken hata:', error);
    }
  },

  // Dil işlemleri
  async getLanguage(): Promise<string | null> {
    try {
      const cached = CacheManager.get(STORAGE_KEYS.LANGUAGE);
      if (cached !== null) return cached;

      const lang = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
      if (lang) CacheManager.set(STORAGE_KEYS.LANGUAGE, lang);
      
      return lang;
    } catch (error) {
      console.error('Dil yüklenirken hata:', error);
      return null;
    }
  },

  async setLanguage(language: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
      CacheManager.set(STORAGE_KEYS.LANGUAGE, language);
    } catch (error) {
      console.error('Dil kaydedilirken hata:', error);
    }
  },

  // ✅ TEKİLLEŞTİRİLMİŞ USER DATA METHODS - Tek bir metodla her şey
  
  // 🎯 Ana User Data metodları - TEKİL UUID SİSTEMİ
  async setUserData(userData: any): Promise<boolean> {
    try {
      // 🔑 UUID yoksa react-native-uuid ile oluştur (TEK KAYNAK)
      if (!userData.id) {
        userData.id = this.generateUUID();

      }
      
      // Timestamp'leri ekle
      userData.created_at = userData.created_at || new Date().toISOString();
      userData.updated_at = new Date().toISOString();
      
      // AsyncStorage'a kaydet
      const jsonData = JSON.stringify(userData);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, jsonData);
      CacheManager.set(STORAGE_KEYS.USER_DATA, userData);
      

      return true;
    } catch (error) {
      console.error('User data kaydedilirken hata:', error);
      return false;
    }
  },

  async getUserData(): Promise<any | null> {
    try {
      // Cache'den kontrol et
      const cached = CacheManager.get(STORAGE_KEYS.USER_DATA);
      if (cached !== null) {
        return cached;
      }

      // AsyncStorage okumayı timeout ile sınırla
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('getUserData AsyncStorage timeout')), 3000)
      );
      
      const storagePromise = AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      
      const data = await Promise.race([storagePromise, timeoutPromise])
        .catch((error) => {
          console.error('getUserData AsyncStorage error/timeout:', error);
          return null; // Güvenli fallback
        });
      
      let result = null;
      if (data && typeof data === 'string') {
        try {
          result = JSON.parse(data);
        } catch (parseError) {
          console.error('getUserData JSON parse error:', parseError);
          result = null;
        }
      }
      
      // Cache'e kaydet (null olsa bile, tekrar okumayı önlemek için)
      CacheManager.set(STORAGE_KEYS.USER_DATA, result);
      
      return result;
    } catch (error) {
      return null;
    }
  },

  async clearUserData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      CacheManager.invalidate(STORAGE_KEYS.USER_DATA);

    } catch (error) {
      console.error('User data temizlenirken hata:', error);
    }
  },

  async updateUserData(updates: any): Promise<boolean> {
    try {
      // Önce verinin mevcut olduğunu kontrol edelim. Bu, bir güncelleme işleminden
      // yeni bir kullanıcı parçası oluşturulmasını önler.
      const currentUserData = await this.getUserData();
      if (!currentUserData) {
        // Bu durumda yeni bir kullanıcı oluşturmak yerine işlemi durdurmak kritiktir.
        console.error('Update için user data bulunamadı, işlem durduruldu.');
        return false;
      }

      // Birleştirilecek veriyi ve güncelleme zaman damgasını hazırla
      const payloadToMerge = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Önbelleği yazmadan *önce* geçersiz kıl. Bu, bir sonraki okumanın
      // birleştirilmiş en güncel veriyi almasını sağlar.
      CacheManager.invalidate(STORAGE_KEYS.USER_DATA);

      // Veriyi güvenli bir şekilde birleştirmek için `mergeItem` kullan.
      await AsyncStorage.mergeItem(STORAGE_KEYS.USER_DATA, JSON.stringify(payloadToMerge));
      
      return true;
    } catch (error) {
      console.error('User data güncellenirken hata (merge):', error);
      return false;
    }
  },

  // 🔄 Geriye uyumluluk için alias metodlar (eski metodlara yönlendirme)
  async setUserInfo(userInfo: any): Promise<boolean> {
    return this.setUserData(userInfo);
  },

  async getUserInfo(): Promise<any | null> {
    return this.getUserData();
  },

  async setOnboardingData(data: any): Promise<boolean> {
    // SORUNLU: Bu metod tüm veriyi siliyor. Güvenli olan `updateUserData` kullanılmalı.
    return this.updateUserData({ ...data, onboarding_completed: false });
  },

  async getOnboardingData(): Promise<any | null> {
    return this.getUserData();
  },

  async clearOnboardingData(): Promise<void> {
    return this.clearUserData();
  },

  async setOnboardingCompleted(completed: boolean = true): Promise<boolean> {
    return this.updateUserData({ onboarding_completed: completed });
  },

  async hasSeenOnboarding(): Promise<boolean> {
    try {
      // Cache'den hızlı kontrol et (RootNavigator için kritik)
      const cached = CacheManager.get(STORAGE_KEYS.USER_DATA);
      if (cached !== null) {
        return cached?.onboarding_completed || false;
      }

      // Cache yoksa AsyncStorage'dan oku ama timeout ile
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('hasSeenOnboarding timeout')), 2000)
      );
      
      const dataPromise = this.getUserData();
      
      const userData = await Promise.race([dataPromise, timeoutPromise])
        .catch((error) => {
          console.error('hasSeenOnboarding error/timeout:', error);
          return null; // Güvenli fallback
        });
      
      return userData?.onboarding_completed || false;
    } catch (error) {
      console.error('Onboarding completion kontrol edilirken hata:', error);
      return false;
    }
  },

  async clearOnboardingCompleted(): Promise<void> {
    await this.updateUserData({ onboarding_completed: false });
  },

  // 🆔 TEKİL UUID SİSTEMİ - react-native-uuid ile
  generateUUID(): string {
    return uuid.v4() as string;
  },

  async getUserUUID(): Promise<string | null> {
    // User data içindeki id field'ını döndür - TEK KAYNAK
    const userData = await this.getUserData();
    return userData?.id || null;
  },

  // 🧹 Utility metodlar
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
      CacheManager.invalidateAll();

    } catch (error) {
      console.error('Storage temizlenirken hata:', error);
    }
  },

  // 📎 Generic getItem/setItem metodları (profil fotoğrafı vs. için)
  async getItem(key: string): Promise<string | null> {
    try {
      const cached = CacheManager.get(key);
      if (cached !== null) return cached;

      const result = await AsyncStorage.getItem(key);
      if (result) CacheManager.set(key, result);
      
      return result;
    } catch (error) {
      console.error(`Item yüklenirken hata (${key}):`, error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, value);
      CacheManager.set(key, value);
      return true;
    } catch (error) {
      console.error(`Item kaydedilirken hata (${key}):`, error);
      return false;
    }
  },

  async getAllStorageKeys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Storage keys yüklenirken hata:', error);
      return [];
    }
  },

  async getAllStorageData(): Promise<Record<string, any>> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const result: Record<string, any> = {};
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        try {
          result[key] = value ? JSON.parse(value) : value;
        } catch {
          result[key] = value;
        }
      }
      
      return result;
    } catch (error) {
      console.error('Tüm storage data yüklenirken hata:', error);
      return {};
    }
  },



  // 🏆 USER WORKOUTS - Tek array'de tüm completed workoutlar
  async getUserWorkouts(): Promise<any[]> {
    try {
      // Cache'den kontrol et
      const cached = CacheManager.get('user_workouts');
      if (cached !== null) return cached;

      // AsyncStorage'dan yükle
      const data = await AsyncStorage.getItem('user_workouts');
      const result = data ? JSON.parse(data) : [];
      
      // Cache'e kaydet
      CacheManager.set('user_workouts', result);
      
      // completedAt veya createdAt'a göre sırala (en yeni önce)
      return result.sort((a: any, b: any) => {
        const dateA = new Date(a.completedAt || a.createdAt).getTime();
        const dateB = new Date(b.completedAt || b.createdAt).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error loading user workouts:', error);
      return [];
    }
  },

  async saveUserWorkout(workout: any): Promise<boolean> {
    try {
      // Mevcut workout'ları al
      const userWorkouts = await this.getUserWorkouts();
      
      // Yeni workout'ı ekle
      const workoutWithId = {
        ...workout,
        id: workout.id || Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
        completedAt: workout.completedAt || new Date().toISOString(),
        createdAt: workout.createdAt || new Date().toISOString(),
      };
      
      userWorkouts.unshift(workoutWithId); // En başa ekle (yeni olan önce)
      
      // AsyncStorage'a kaydet
      await AsyncStorage.setItem('user_workouts', JSON.stringify(userWorkouts));
      
      // Cache'i güncelle
      CacheManager.set('user_workouts', userWorkouts);
      
      return true;
    } catch (error) {
      console.error('Error saving user workout:', error);
      return false;
    }
  },

  async getUserWorkoutsByDate(date: string): Promise<any[]> {
    try {
      const allWorkouts = await this.getUserWorkouts();
      const targetDate = new Date(date).toDateString();
      
      return allWorkouts.filter(workout => {
        const workoutDate = new Date(workout.completedAt).toDateString();
        return workoutDate === targetDate;
      });
    } catch (error) {
      console.error('Error loading user workouts by date:', error);
      return [];
    }
  },

  async getUserWorkoutsCount(): Promise<number> {
    try {
      const userWorkouts = await this.getUserWorkouts();
      return userWorkouts.length;
    } catch (error) {
      console.error('Error getting user workouts count:', error);
      return 0;
    }
  },

  async deleteUserWorkout(workoutId: string): Promise<boolean> {
    try {
      const userWorkouts = await this.getUserWorkouts();
      const filteredWorkouts = userWorkouts.filter(workout => workout.id !== workoutId);
      
      await AsyncStorage.setItem('user_workouts', JSON.stringify(filteredWorkouts));
      CacheManager.set('user_workouts', filteredWorkouts);
      
      return true;
    } catch (error) {
      console.error('Error deleting user workout:', error);
      return false;
    }
  },

  async clearAllUserWorkouts(): Promise<boolean> {
    try {
      await AsyncStorage.setItem('user_workouts', JSON.stringify([]));
      CacheManager.set('user_workouts', []);
      
      return true;
    } catch (error) {
      console.error('Error clearing all user workouts:', error);
      return false;
    }
  },

  // 📋 ROUTINE TEMPLATES - Kullanıcının oluşturduğu rutinler (workoutSlice için)
  async getRoutineTemplates(): Promise<any[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const routineKeys = allKeys.filter(key => key.startsWith('routine_'));
      
      if (routineKeys.length === 0) {
        return [];
      }

      const routines = [];
      for (const key of routineKeys) {
        try {
          const routineData = await AsyncStorage.getItem(key);
          if (routineData) {
            const routine = JSON.parse(routineData);
            routines.push(routine);
          }
        } catch (error) {
          console.error(`Error parsing routine ${key}:`, error);
        }
      }

      // Tarihe göre sırala (en yeni önce)
      return routines.sort((a, b) => 
        new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
      );
    } catch (error) {
      console.error('Error loading routine templates:', error);
      return [];
    }
  },

  async saveRoutineTemplate(routine: any): Promise<boolean> {
    try {
      const routineWithId = {
        ...routine,
        id: routine.id || Date.now().toString(),
        created_at: routine.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const routineKey = `routine_${routineWithId.id}`;
      await AsyncStorage.setItem(routineKey, JSON.stringify(routineWithId));
      
      return true;
    } catch (error) {
      console.error('Error saving routine template:', error);
      return false;
    }
  },

  async deleteRoutineTemplate(routineId: string): Promise<boolean> {
    try {
      const routineKey = `routine_${routineId}`;
      await AsyncStorage.removeItem(routineKey);
      

      return true;
    } catch (error) {
      console.error('Error deleting routine template:', error);
      return false;
    }
  },

  // Geriye uyumluluk için alias metodlar
  async getAllWorkouts(): Promise<any[]> {
    return this.getRoutineTemplates();
  },

  async saveWorkout(workout: any): Promise<boolean> {
    return this.saveRoutineTemplate(workout);
  },

  async deleteWorkout(workoutId: string): Promise<boolean> {
    return this.deleteRoutineTemplate(workoutId);
  },

  async getCompletedWorkouts(): Promise<any[]> {
    return this.getUserWorkouts();
  },

  async getCompletedWorkoutsByDate(date: string): Promise<any[]> {
    return this.getUserWorkoutsByDate(date);
  },

  async getCompletedWorkoutsCount(): Promise<number> {
    return this.getUserWorkoutsCount();
  },

  // 📊 User Stats methods
  async getUserStats(): Promise<any | null> {
    try {
      // Cache'den kontrol et
      const cached = CacheManager.get(STORAGE_KEYS.USER_STATS);
      if (cached !== null) return cached;

      // Cache yoksa AsyncStorage'dan yükle
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_STATS);
      const result = data ? JSON.parse(data) : null;
      
      // Cache'e kaydet
      if (result) CacheManager.set(STORAGE_KEYS.USER_STATS, result);
      
      return result;
    } catch (error) {
      console.error('User stats yüklenirken hata:', error);
      return null;
    }
  },

  async saveUserStats(stats: any): Promise<boolean> {
    try {
      const jsonData = JSON.stringify(stats);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_STATS, jsonData);
      CacheManager.set(STORAGE_KEYS.USER_STATS, stats);

      return true;
    } catch (error) {
      console.error('User stats kaydedilirken hata:', error);
      return false;
    }
  },

  // 💳 Premium Status methods
  async getPremiumStatus(): Promise<boolean> {
    try {
      // Önce Adapty'den kontrol et
      try {
        const AdaptyService = require('./adapty').default;
        const adaptyService = AdaptyService.getInstance();
        if (adaptyService.isSDKInitialized()) {
          const isPremium = await adaptyService.checkPremiumAccess('premium');
          
          // Local storage'a da kaydet (cache için)
          await this.setPremiumStatus(isPremium);
          return isPremium;
        }
      } catch (adaptyError) {
      }

      // Adapty yoksa local storage'dan kontrol et
      const cached = CacheManager.get(STORAGE_KEYS.PREMIUM_STATUS);
      if (cached !== null) return cached;

      const localPremium = await AsyncStorage.getItem(STORAGE_KEYS.PREMIUM_STATUS);
      const result = localPremium ? JSON.parse(localPremium) : false;
      
      if (result !== null) CacheManager.set(STORAGE_KEYS.PREMIUM_STATUS, result);
      
      return result;
    } catch (error) {
      console.error('Premium status kontrol edilirken hata:', error);
      return false; // Varsayılan olarak free
    }
  },

  async setPremiumStatus(isPremium: boolean): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PREMIUM_STATUS, JSON.stringify(isPremium));
      CacheManager.set(STORAGE_KEYS.PREMIUM_STATUS, isPremium);
      return true;
    } catch (error) {
      console.error('Premium status kaydedilirken hata:', error);
      return false;
    }
  },

  async clearPremiumStatus(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.PREMIUM_STATUS);
      CacheManager.invalidate(STORAGE_KEYS.PREMIUM_STATUS);
    } catch (error) {
    }
  },

  // 🔄 Cache yönetim metodları (tekilleştirilmiş)
  cache: {
    invalidate: (key: string) => CacheManager.invalidate(key),
    invalidateAll: () => CacheManager.invalidateAll(),
    get: (key: string) => CacheManager.get(key),
    
    // Specific cache invalidation methods
    invalidateUserWorkouts: () => CacheManager.invalidate('user_workouts'),
    invalidateWorkouts: () => {
      // Routine template cache'lerini temizle (routine_* keyler için)
    },
    invalidateUserData: () => CacheManager.invalidate(STORAGE_KEYS.USER_DATA), // UUID da burada
    invalidateTheme: () => CacheManager.invalidate(STORAGE_KEYS.THEME),
    invalidateUserStats: () => CacheManager.invalidate(STORAGE_KEYS.USER_STATS),
    invalidatePremiumStatus: () => CacheManager.invalidate(STORAGE_KEYS.PREMIUM_STATUS),
    invalidateAuthSession: () => CacheManager.invalidate(STORAGE_KEYS.AUTH_SESSION_CREATED),
  },

  // 🔐 Auth Session methods - Supabase default auth session takibi
  async isAuthSessionCreated(): Promise<boolean> {
    try {
      const cached = CacheManager.get(STORAGE_KEYS.AUTH_SESSION_CREATED);
      if (cached !== null) return cached;

      const result = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_SESSION_CREATED);
      const isCreated = result === 'true';
      
      if (result !== null) CacheManager.set(STORAGE_KEYS.AUTH_SESSION_CREATED, isCreated);
      

      return isCreated;
    } catch (error) {
      console.error('Auth session status kontrol edilirken hata:', error);
      return false;
    }
  },

  async setAuthSessionCreated(created: boolean = true): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_SESSION_CREATED, created.toString());
      CacheManager.set(STORAGE_KEYS.AUTH_SESSION_CREATED, created);

      return true;
    } catch (error) {
      console.error('Auth session status kaydedilirken hata:', error);
      return false;
    }
  },

  async clearAuthSessionStatus(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_SESSION_CREATED);
      CacheManager.invalidate(STORAGE_KEYS.AUTH_SESSION_CREATED);

    } catch (error) {
      console.error('Auth session status temizlenirken hata:', error);
    }
  },

  // 📈 Rating History methods
  async getRatingHistory(): Promise<RatingHistoryEntry[]> {
    try {
      // Cache'den kontrol et
      const cached = CacheManager.get(STORAGE_KEYS.RATING_HISTORY);
      if (cached !== null) return cached;

      // Cache yoksa AsyncStorage'dan yükle
      const data = await AsyncStorage.getItem(STORAGE_KEYS.RATING_HISTORY);
      const result = data ? JSON.parse(data) : [];
      
      // Cache'e kaydet
      CacheManager.set(STORAGE_KEYS.RATING_HISTORY, result);
      
      return result;
    } catch (error) {
      console.error('Rating history yüklenirken hata:', error);
      return [];
    }
  },

  async saveRatingHistory(history: RatingHistoryEntry[]): Promise<boolean> {
    try {
      const jsonData = JSON.stringify(history);
      await AsyncStorage.setItem(STORAGE_KEYS.RATING_HISTORY, jsonData);
      CacheManager.set(STORAGE_KEYS.RATING_HISTORY, history);
      return true;
    } catch (error) {
      console.error('Rating history kaydedilirken hata:', error);
      return false;
    }
  },

  async addRatingHistoryEntry(entry: RatingHistoryEntry): Promise<boolean> {
    try {
      const currentHistory = await this.getRatingHistory();
      const updatedHistory = [...currentHistory, entry];
      
      // Son 100 entry'yi sakla (performans için)
      if (updatedHistory.length > 100) {
        updatedHistory.splice(0, updatedHistory.length - 100);
      }
      
      return await this.saveRatingHistory(updatedHistory);
    } catch (error) {
      console.error('Rating history entry eklenirken hata:', error);
      return false;
    }
  },

  async getCurrentUserRating(): Promise<number> {
    try {
      const userStats = await this.getUserStats();
      return userStats?.overall_rating || 0;
    } catch (error) {
      console.error('Current user rating alınırken hata:', error);
      return 0;
    }
  },

  // 🌐 Gelecekte DB sync için hazır metodlar
  // async syncToDatabase(dataType: string, data: any): Promise<void> {
  //   try {
  //     if (!navigator.onLine) {
  //       console.log('⚠️ Offline - data will sync later');
  //       return;
  //     }
  //     
  //     switch(dataType) {
  //       case 'workouts':
  //         await supabase.from('workouts').upsert(data);
  //         break;
  //       case 'user_data':
  //         await supabase.from('users').upsert(data);
  //         break;
  //       // ... diğer data types
  //     }
  //     
  //     console.log('☁️ Data synced to database:', dataType);
  //   } catch (error) {
  //     console.error('DB sync error:', error);
  //   }
  // }
};

// 📈 Rating History Types
export interface RatingHistoryEntry {
  date: string; // ISO string
  beforeRating: number; // 0-5 star rating
  afterRating: number; // 0-5 star rating  
  workoutId: string;
  workoutName: string;
  change: number; // afterRating - beforeRating
  workoutDuration: number; // dakika
  workoutVolume: number; // kg
} 