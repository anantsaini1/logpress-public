import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { storage } from '../../services/storage';
import { 
  calculateWorkoutStats, 
  calculateStreak,
  calculateUserStatsFromWorkouts,
  UserStats 
} from '../../utils/workoutCalculations';
// import { openAIService, UserAnalysisData } from '../../services/openai'; // Şimdilik kullanılmıyor

interface User {
  id: string;
  display_name: string;
  name?: string;
  gender: string;
  age: number;
  weight: number;
  height: number;
  aim: string;
  experience: string;
  exercise_hours: string;
  focus_areas?: number[];
  sports?: number[];
  environment_preference?: string;
  profile_percentage: number;
  ls_score: number;
  user_role_id: number;
  skill_level: string;
  leaderboard_points: number;
  bmi?: number;
  bmi_category?: string;
  // Profil bilgileri
  profile_image_url?: string;
  bio?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

interface UserState {
  user: User | null;
  userStats: UserStats | null;
  loading: boolean;
  error: string | null;
  lastSync: number | null;
  initialized: boolean;
}

const initialState: UserState = {
  user: null,
  userStats: null,
  loading: false,
  error: null,
  lastSync: null,
  initialized: false,
};

// 📂 Load from AsyncStorage (App başlangıcında)
export const loadUserFromStorage = createAsyncThunk(
  'user/loadFromStorage',
  async () => {

    const userData = await storage.getUserData();
    
    if (!userData) {

      return null;
    }


    return userData;
  }
);

// 💾 Add user (onboarding tamamlandığında)
export const addUser = createAsyncThunk(
  'user/add',
  async (userData: any) => {

    
    // 1. AsyncStorage'a kaydet (UUID otomatik oluşacak)
    const success = await storage.setUserData(userData);
    if (!success) {
      throw new Error('User AsyncStorage\'a kaydedilemedi');
    }

    // 2. Kaydedilen user'ı geri oku (UUID ile birlikte)
    const savedUser = await storage.getUserData();
    if (!savedUser) {
      throw new Error('Kaydedilen user okunamadı');
    }


    return savedUser;
  }
);

// 🗑️ Remove user (logout)
export const removeUser = createAsyncThunk(
  'user/remove',
  async () => {

    
    // 1. AsyncStorage'dan sil
    await storage.clearUserData();


    return null;
  }
);

// 🔄 Update user (profile updates)
export const updateUser = createAsyncThunk(
  'user/update',
  async (updates: Partial<User>) => {

    
    // 1. Storage'daki updateUserData metodunu kullan
    const success = await storage.updateUserData(updates);
    if (!success) {
      throw new Error('User güncellenemedi');
    }

    // 2. Güncellenmiş user'ı geri oku
    const updatedUser = await storage.getUserData();
    if (!updatedUser) {
      throw new Error('Güncellenmiş user okunamadı');
    }


    return updatedUser;
  }
);

// 🏋️‍♂️ Update workout stats (workout tamamlandığında)
export const updateWorkoutStats = createAsyncThunk(
  'user/updateWorkoutStats',
  async (workoutData: {
    duration: number;
    volume: number;
    sets: number;
    exercises: Array<{
      name: string;
      sets: Array<{
        weight: number;
        reps: number;
        isCompleted: boolean;
      }>;
    }>;
  }) => {
    // 1. Mevcut user'ı al
    const currentUser = await storage.getUserData();
    if (!currentUser) {
      throw new Error('User bulunamadı');
    }

    // 2. Basit puan hesaplama (UI için)
    const workoutStats = calculateWorkoutStats(workoutData.volume, workoutData.duration, workoutData.sets);
    const simpleWorkoutPoints = Math.ceil(
      (workoutStats.endurance * 2) + 
      (workoutStats.strength * 2) + 
      (workoutStats.power * 1.5)
    );

    // 3. User'ı güncelle (leaderboard puanı için)
    const updatedUser = {
      ...currentUser,
      ls_score: currentUser.ls_score + simpleWorkoutPoints,
      leaderboard_points: currentUser.leaderboard_points + simpleWorkoutPoints,
      updated_at: new Date().toISOString(),
    };

    // 4. User'ı kaydet
    await storage.setUserData(updatedUser);

    // 5. Tüm workout verilerini al ve gerçek stats hesapla
    const allWorkouts = await storage.getUserWorkouts();
    
    // 6. Mevcut AI stats'leri al (overall_rating ve muscle_groups korumak için)
    const existingStats = await storage.getUserStats();
    
    // 7. Gerçek verilerden hard stats hesapla
    const calculatedStats = calculateUserStatsFromWorkouts(allWorkouts);
    
    // 8. AI verilerini koru, hard data'yı güncelle
    const updatedStats: UserStats = {
      ...calculatedStats,
      overall_rating: existingStats?.overall_rating || calculatedStats.overall_rating,
      muscle_groups: existingStats?.muscle_groups || calculatedStats.muscle_groups || {
        // Test amaçlı örnek veriler (AI analizi yoksa)
        biceps: 15,
        triceps: 12,
        shoulder: 18,
        chest: 20,
        back: 8,
        hamstring: 10,
      },
      ai_analysis_summary: existingStats?.ai_analysis_summary,
      ai_recommendations: existingStats?.ai_recommendations,
      ai_analyzed_at: existingStats?.ai_analyzed_at,
    };

    // 9. Stats'leri kaydet
    await storage.saveUserStats(updatedStats);

    return { 
      user: updatedUser, 
      stats: updatedStats, 
      workoutStats: workoutStats,
      workoutPoints: simpleWorkoutPoints
    };
  }
);

// 📸 Update profile image
export const updateProfileImage = createAsyncThunk(
  'user/updateProfileImage',
  async (imageUrl: string) => {
    // 1. Storage'daki user'ı güncelle
    const success = await storage.updateUserData({ profile_image_url: imageUrl });
    if (!success) {
      throw new Error('Profil fotoğrafı storage\'a kaydedilemedi');
    }

    // 2. Güncellenmiş user'ı geri oku
    const updatedUser = await storage.getUserData();
    if (!updatedUser) {
      throw new Error('Güncellenmiş user okunamadı');
    }

    return updatedUser;
  }
);

// 📝 Update profile data (bio, social links, etc.)
export const updateProfileData = createAsyncThunk(
  'user/updateProfileData',
  async (profileData: {
    display_name?: string;
    name?: string;
    bio?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  }) => {
    // 1. Storage'daki user'ı güncelle
    const success = await storage.updateUserData(profileData);
    if (!success) {
      throw new Error('Profil bilgileri storage\'a kaydedilemedi');
    }

    // 2. Güncellenmiş user'ı geri oku
    const updatedUser = await storage.getUserData();
    if (!updatedUser) {
      throw new Error('Güncellenmiş user okunamadı');
    }

    return updatedUser;
  }
);

// 📊 Load user stats (uygulama açılırken ve stats ekranında)
export const loadUserStats = createAsyncThunk(
  'user/loadUserStats',
  async () => {
    try {
      // 1. Gerçek workout verilerini al
      const workouts = await storage.getUserWorkouts();
      
      // 2. Mevcut AI stats'leri al (overall_rating ve muscle_groups için)
      const existingStats = await storage.getUserStats();
      
      // 3. Gerçek verilerden hard stats hesapla
      const calculatedStats = calculateUserStatsFromWorkouts(workouts);
      
      // 4. AI verilerini koru, hard data'yı güncelle
      const updatedStats: UserStats = {
        ...calculatedStats,
        overall_rating: existingStats?.overall_rating || calculatedStats.overall_rating,
        muscle_groups: existingStats?.muscle_groups || calculatedStats.muscle_groups || {
          // Test amaçlı örnek veriler (AI analizi yoksa)
          biceps: 15,
          triceps: 12,
          shoulder: 18,
          chest: 20,
          back: 8,
          hamstring: 10,
        },
        ai_analysis_summary: existingStats?.ai_analysis_summary,
        ai_recommendations: existingStats?.ai_recommendations,
        ai_analyzed_at: existingStats?.ai_analyzed_at,
      };
      
      // 5. Güncellenmiş stats'leri kaydet
      await storage.saveUserStats(updatedStats);
      
      return updatedStats;
    } catch (error) {
      
      // Fallback: default değerler döndür
      const defaultStats: UserStats = {
        total_workouts: 0,
        total_exercises: 0,
        total_weight: 0,
        total_time: 0,
        current_streak: 0,
        max_streak: 0,
        last_workout_date: '',
        overall_rating: 0,
      };
      
      await storage.saveUserStats(defaultStats);
      return defaultStats;
    }
  }
);

// 🤖 AI Analysis - Şimdilik kullanılmıyor, daha sonra implement edilecek
/*
export const analyzeUserWithAI = createAsyncThunk(
  'user/analyzeUserWithAI',
  async () => {
    // AI analizi burada implement edilecek
    return null;
  }
);
*/



// 🔄 Force refresh (cache bypass)
export const refreshUser = createAsyncThunk(
  'user/refresh',
  async () => {

    // Cache'i temizle
    storage.cache.invalidateUserData();
    
    // Yeniden yükle
    const userData = await storage.getUserData();
    
    if (userData) {
      // Profil yüzdesini hesapla
      const fields = [
        { name: 'weight', weight: 12.5 },
        { name: 'height', weight: 12.5 },
        { name: 'aim', weight: 12.5 },
        { name: 'experience', weight: 12.5 },
        { name: 'focus_areas', weight: 12.5 },
        { name: 'sports', weight: 12.5 },
        { name: 'environment_preference', weight: 12.5 },
        { name: 'exercise_hours', weight: 12.5 }
      ];

      let totalPercentage = 0;

      fields.forEach(field => {
        if (Array.isArray(userData[field.name])) {
          if (userData[field.name].length > 0) {
            totalPercentage += field.weight;
          }
        } else if (userData[field.name] !== null && userData[field.name] !== undefined && userData[field.name] !== '' && userData[field.name] !== '0') {
          totalPercentage += field.weight;
        }
      });

      const percentage = Math.round(totalPercentage);
      
      // Yüzdeyi güncelle
      const updatedUserData = {
        ...userData,
        profile_percentage: percentage,
        updated_at: new Date().toISOString()
      };

      // AsyncStorage'a kaydet
      await storage.setUserData(updatedUserData);
      

      return updatedUserData;
    }
    
    
    return userData;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Synchronous actions for instant UI updates
    clearError: (state) => {
      state.error = null;
    },
    
    resetUser: (state) => {
      state.user = null;
      state.initialized = false;
      state.lastSync = null;
    },

    // 🚀 Optimistic UI updates (instant feedback)
    optimisticAddUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },

    optimisticRemoveUser: (state) => {
      state.user = null;
    },

    optimisticUpdateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    // Quick score update for points screen
    incrementScore: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.ls_score += action.payload;
        state.user.leaderboard_points += action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Load from storage
      .addCase(loadUserFromStorage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUserFromStorage.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.initialized = true;
        state.lastSync = Date.now();
      })
      .addCase(loadUserFromStorage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'User data yüklenemedi';
        state.initialized = true; // Still mark as initialized even if no data
      })

      // Add user
      .addCase(addUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.lastSync = Date.now();
      })
      .addCase(addUser.rejected, (state, action) => {
        state.error = action.error.message || 'User eklenemedi';
        // Optimistic update'i geri al
        state.user = null;
      })

      // Remove user
      .addCase(removeUser.fulfilled, (state) => {
        state.user = null;
        state.lastSync = Date.now();
      })
      .addCase(removeUser.rejected, (state, action) => {
        state.error = action.error.message || 'User silinemedi';
      })

      // Update user
      .addCase(updateUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.lastSync = Date.now();
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.error = action.error.message || 'User güncellenemedi';
      })

      // Refresh
      .addCase(refreshUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.lastSync = Date.now();
      })
      .addCase(refreshUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'User refresh başarısız';
      })

      // Update workout stats
      .addCase(updateWorkoutStats.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.userStats = action.payload.stats;
        state.lastSync = Date.now();
      })
      .addCase(updateWorkoutStats.rejected, (state, action) => {
        state.error = action.error.message || 'Workout stats güncellenemedi';
      })

      // Load user stats
      .addCase(loadUserStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUserStats.fulfilled, (state, action) => {
        state.loading = false;
        state.userStats = action.payload;
        state.lastSync = Date.now();
      })
      .addCase(loadUserStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'User stats yüklenemedi';
      })

      // Update profile image
      .addCase(updateProfileImage.fulfilled, (state, action) => {
        state.user = action.payload;
        state.lastSync = Date.now();
      })
      .addCase(updateProfileImage.rejected, (state, action) => {
        state.error = action.error.message || 'Profil fotoğrafı güncellenemedi';
      })

      // Update profile data
      .addCase(updateProfileData.fulfilled, (state, action) => {
        state.user = action.payload;
        state.lastSync = Date.now();
      })
      .addCase(updateProfileData.rejected, (state, action) => {
        state.error = action.error.message || 'Profil bilgileri güncellenemedi';
      })

      // AI Analysis - Şimdilik kullanılmıyor
      /*
      .addCase(analyzeUserWithAI.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(analyzeUserWithAI.fulfilled, (state, action) => {
        state.loading = false;
        state.userStats = action.payload;
        state.lastSync = Date.now();
      })
      .addCase(analyzeUserWithAI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'AI analizi başarısız oldu';
      })
      */;
  },
});

export const { 
  clearError, 
  resetUser, 
  optimisticAddUser, 
  optimisticRemoveUser, 
  optimisticUpdateUser,
  incrementScore
} = userSlice.actions;

// Selectors
export const selectUser = (state: any) => state.user.user;
export const selectUserStats = (state: any) => state.user.userStats;
export const selectUserLoading = (state: any) => state.user.loading;
export const selectUserError = (state: any) => state.user.error;

export default userSlice.reducer; 