import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_NETWORK_CONFIG } from '../config/supabase';
import { OFFLINE_MODE } from '../config/offline';

// Networksüz mod: tüm Supabase istekleri (auth + db) network'e çıkmadan
// anında reddedilir. Mevcut try/catch'ler bunu sessizce yutar.
const offlineFetch = (() =>
  Promise.reject(new Error('OFFLINE_MODE: network disabled'))) as unknown as typeof fetch;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: !OFFLINE_MODE,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: SUPABASE_NETWORK_CONFIG.headers,
    ...(OFFLINE_MODE ? { fetch: offlineFetch } : {}),
  },
  // Ağ bağlantı hatalarına karşı önlemler
  realtime: {
    timeout: SUPABASE_NETWORK_CONFIG.timeout
  },
  db: {
    schema: 'public'
  }
});

// Auth ile ilgili yardımcı fonksiyonlar
export const auth = {
  signUp: async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Kullanıcının varliğini kontrol etmek için fonksiyon
  checkUserExists: async (email: string) => {
    try {
      // OTP ile kontrol yerine signInWithPassword kullanarak
      // Hata tipine bakacağız - şifre yanlış ama email doğruysa kullanıcı vardır
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: 'invalid-password-for-checking' // Geçersiz şifre
      });
      
      // Eğer hata "Invalid login credentials" ise kullanıcı vardır
      // ama şifresi yanlıştır.
      if (error && error.message.includes('Invalid login credentials')) {
        return { exists: true, error: null };
      } 
      
      // Eğer hata "Email not confirmed" ise kullanıcı var, henüz onaylanmamış
      if (error && error.message.includes('Email not confirmed')) {
        return { exists: true, error: null };
      }
      
      // Eğer hata "User not found" ise kullanıcı yok demektir
      if (error && error.message.includes('User not found')) {
        return { exists: false, error: null };
      }
      
      // Başka bir hata varsa bunu döndür
      if (error) {
        return { exists: false, error };
      }
      
      // Eğer hata olmadan giriş yapabilirse (bu olamaz normalde) kullanıcı var demektir
      return { exists: true, error: null };
    } catch (error: any) {
      return { 
        exists: false, 
        error: { 
          message: error.message || 'Kullanıcı kontrolü sırasında bir hata oluştu' 
        } 
      };
    }
  },

  // Anonim oturum açma fonksiyonu
  signInAnonymously: async () => {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error: any) {
      return { 
        data: null, 
        error: { 
          message: error.message || 'Anonim giriş yapılırken bir hata oluştu' 
        } 
      };
    }
  },
  
  // E-posta ekleme/güncelleme fonksiyonu
  updateEmail: async (email: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        email: email,
      });
      
      if (error) {
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error: any) {
      return { 
        data: null, 
        error: { 
          message: error.message || 'Email güncellenirken bir hata oluştu' 
        } 
      };
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  sendMagicLink: async (email: string, isFromRegister: boolean = false) => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: isFromRegister, // Kayıt akışından geliyorsa hesap oluşturmasına izin ver
          emailRedirectTo: 'logpress://',
          data: {
            name: email.split('@')[0],
            app: 'Logpress iOS App',
            purpose: 'authentication',
          },
        },
      });

      if (error) {
        // Sadece login akışından gelen kullanıcılar için hesap bulunamadı hatası göster
        if (!isFromRegister && (error.message.includes('User not found') || error.message.includes('Email not confirmed'))) {
          return {
            data: null,
            error: {
              message: 'Bu email adresi ile kayıtlı bir hesap bulunamadı. Lütfen önce kayıt olun.'
            }
          };
        }
        throw error;
      }
      return { data, error: null };
    } catch (error: any) {
      return { 
        data: null, 
        error: { 
          message: error.message || 'Doğrulama kodu gönderilirken bir hata oluştu' 
        } 
      };
    }
  },
};

// ✅ Gerçek Supabase Auth ile user oluşturma
export const authService = {
  // UUID ile dummy email oluşturup gerçek Supabase auth'a kaydet
  async createSupabaseUser(uuid: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      if (OFFLINE_MODE) return { success: false, error: 'OFFLINE_MODE' };
      // UUID'den dummy email oluştur
      const dummyEmail = `user_${uuid}@logpressai.app`;
      const dummyPassword = `pass_${uuid}_2024`;
      
      // Gerçek Supabase auth ile user oluştur
      const { data, error } = await supabase.auth.signUp({
        email: dummyEmail,
        password: dummyPassword,
        options: {
          data: {
            app_uuid: uuid,
            created_from: 'first_screen',
            platform: 'mobile'
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'User data alınamadı' };
      }

      return { success: true, userId: data.user.id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  // Mevcut Supabase session kontrolü
  async hasValidSupabaseSession(): Promise<boolean> {
    try {
      if (OFFLINE_MODE) return false;
      const { data } = await supabase.auth.getSession();
      const hasSession = !!data.session;
      return hasSession;
    } catch (error) {
      return false;
    }
  }
};

// Kullanıcı profili işlemleri
export const profiles = {
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  updateProfile: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...updates,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    return { data, error };
  },

  createProfile: async (userId: string, onboardingData: {
    gender: number;
    age: number;
    weight: number;
    height: number;
    aim: number;
    experience: number;
    exercise_hours: number;
    profile_percentage?: number; // Optional profile_percentage parametresi eklendi
  }) => {
    try {
      if (!userId || !onboardingData) {
        throw new Error('Geçersiz kullanıcı ID veya onboarding verisi');
      }

      const profileData = {
        id: userId,
        ...onboardingData,
        profile_percentage: onboardingData.profile_percentage || 63, // Parametre olarak gelen değeri kullan, yoksa 63
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert([profileData], { 
          onConflict: 'id'
        });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error: any) {
      return { 
        data: null, 
        error: {
          message: error.message || 'Profil oluşturulurken bir hata oluştu'
        }
      };
    }
  }
};

// Antrenman rutinleri işlemleri
export const workouts = {
  getRoutines: async () => {
    const { data, error } = await supabase
      .from('routines')
      .select(`
        *,
        categories(*),
        equipment(*)
      `);
    return { data, error };
  },

  getRoutineById: async (routineId: number) => {
    const { data, error } = await supabase
      .from('routines')
      .select(`
        *,
        categories(*),
        equipment(*)
      `)
      .eq('id', routineId)
      .single();
    return { data, error };
  },

  saveWorkout: async (workoutData: {
    user_id: string;
    routine_name: string;
    duration: number;
    volume: number;
    total_sets: number;
    exercises: Array<{
      name: string;
      sets: Array<{
        weight: number;
        reps: string;
        is_completed: boolean;
      }>;
    }>;
  }) => {
    const { data, error } = await supabase
      .from('workouts')
      .insert([
        {
          user_id: workoutData.user_id,
          routine_name: workoutData.routine_name,
          duration: workoutData.duration,
          volume: workoutData.volume,
          total_sets: workoutData.total_sets,
          exercises: workoutData.exercises,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    return { data, error };
  }
};

// Kategori işlemleri
export const categories = {
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      return { error: 'Kategoriler alınırken bir hata oluştu' };
    }
  },

  getById: async (id: number) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      return { error: 'Kategori alınırken bir hata oluştu' };
    }
  },
};

export const workoutService = {
  getAllWorkouts: async () => {
    try {
      // Kullanıcı bilgisini al
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Oturum bilgisi alınamadı');
      }
      
      const userId = session.user.id;
      
      // Tüm antrenmanları çek - sadece ihtiyaç duyulan alanları seç
      const { data, error } = await supabase
        .from('workouts')
        .select('id, routine_name, exercises, created_at, user_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Daha verimli bir şekilde benzersiz antrenmanları filtrele
      const routineMap = new Map();
      
      data?.forEach(workout => {
        if (!routineMap.has(workout.routine_name)) {
          routineMap.set(workout.routine_name, workout);
        }
      });
      
      return Array.from(routineMap.values());
    } catch (error) {
      throw error;
    }
  },

  updateRoutineInDB: async (routine: { id: string; name: string; exercises: any[] }) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Kullanıcı bulunamadı');

      // Sadece mevcut ID'yi güncelle
      const { data, error } = await supabase
        .from('workouts')
        .update({
          exercises: routine.exercises,
          updated_at: new Date().toISOString()
        })
        .eq('id', routine.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }
};

export const createProfile = async (profileData: any) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .upsert(profileData)
            .select();

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        throw error;
    }
};

export const getWorkoutCount = async (userId: string) => {
    try {
        const { data: user } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Kullanıcı bulunamadı');
        }

        const { data: workouts, error } = await supabase
            .from('workouts')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            throw error;
        }

        const uniqueWorkouts = workouts.filter((workout, index, self) =>
            index === self.findIndex((w) => w.date === workout.date)
        );

        return uniqueWorkouts.length;
    } catch (error) {
        throw error;
    }
}; 