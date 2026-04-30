// Geçici API service - gerçek implementation'ı sonra eklenecek

import { Exercise } from '../types/exercise';
import { supabase } from './supabase';
import { storage } from './storage';
import { OPENAI_CONFIG } from '../config/openai';

export interface Program {
  id: string;
  name: string;
  description?: string;
  image?: string;
  routine_count?: number;
  level?: string;
  goal_id?: number;
  equipment_id?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role_id: number;
}

export const getUserInfo = async (): Promise<{ user: User | null; error: string | null }> => {
  // Geçici stub
  return {
    user: null,
    error: null
  };
};

export const getWorkoutPrograms = async (): Promise<{ programs: Program[] | null; error: string | null }> => {
  // Geçici stub
  return {
    programs: [
      {
        id: '1',
        name: 'Full Body',
        description: 'Tam vücut antrenmanı',
        routine_count: 3
      },
      {
        id: '2', 
        name: 'Push Pull Legs',
        description: 'İt-çek-bacak antrenmanı',
        routine_count: 6
      },
      {
        id: '3',
        name: 'Split',
        description: 'Bölgesel antrenman',
        routine_count: 4
      }
    ],
    error: null
  };
};

export const getAllExercises = async (): Promise<{ exercises: Exercise[] | null; error: string | null }> => {
  // Geçici dummy data
  return {
    exercises: [
      {
        id: 1,
        name: 'Push Up',
        target: 'Chest',
        equipment: 'bodyweight',
        muscle_group: ['chest', 'arms'],
        image: undefined
      },
      {
        id: 2,
        name: 'Pull Up',
        target: 'Back',
        equipment: 'pullup-bar',
        muscle_group: ['back', 'arms'],
        image: undefined
      },
      {
        id: 3,
        name: 'Squat',
        target: 'Legs',
        equipment: 'bodyweight',
        muscle_group: ['legs'],
        image: undefined
      },
      {
        id: 4,
        name: 'Deadlift',
        target: 'Back',
        equipment: 'barbell',
        muscle_group: ['back', 'legs'],
        image: undefined
      },
      {
        id: 5,
        name: 'Bench Press',
        target: 'Chest',
        equipment: 'barbell',
        muscle_group: ['chest', 'arms'],
        image: undefined
      }
    ],
    error: null
  };
};

export const getReadyRoutines = async (): Promise<Program[]> => {
    const allRoutines = await getReadyRoutines();
    return allRoutines;
};

// Placeholder - Bu fonksiyonun mantığını eklemen gerekecek
const calculateSkillLevel = (score: number): string => {
  if (score < 20) return 'Başlangıç';
  if (score < 40) return 'Orta Başlangıç';
  if (score < 60) return 'Orta';
  if (score < 80) return 'İleri Orta';
  return 'İleri';
};

export const getWorkoutEvaluation = async (
  currentStats: any,
  workoutData: any
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Kullanıcı bulunamadı');

    const { data: completedWorkouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id')
      .eq('user_id', user.id);
    
    if (workoutsError) throw workoutsError;
    
    const isFirstWorkout = !completedWorkouts || completedWorkouts.length === 0;
    const workoutCount = completedWorkouts ? completedWorkouts.length : 0;

    // Kullanıcı demografik bilgilerini al
    const userData = await storage.getUserData();

    // 🔥 YENİ AKILLI PROMPT SİSTEMİ
    let workoutTypeMessage = '';
    if (isFirstWorkout) {
      workoutTypeMessage = `
🚀 İLK ANTRENMAN - GÜÇLÜ BAŞLANGIÇ SİSTEMİ:

OVERALL RATING İçin Akıllı Puanlama:
- Hafif antrenman (2-4 egzersiz): 50-65 puan
- Orta antrenman (5-7 egzersiz): 60-75 puan  
- Yoğun antrenman (8+ egzersiz): 70-85 puan

KAS GRUBU AKILLI PUANLAMA (Chart'taki 6 kas grubu):
✅ Sadece bu kas gruplarını kullan: shoulder, chest, biceps, triceps, hamstring, calf

BİRİNCİL KAS (Ana hedef): 8-20 puan
- Bench Press → chest: 15-20 puan
- Squat → hamstring: 15-20 puan  
- Shoulder Press → shoulder: 15-20 puan

İKİNCİL KAS (Yardımcı): 3-8 puan
- Bench Press → triceps: 5-8 puan
- Squat → calf: 3-5 puan

ÇALIŞILMAYAN KAS: 0 puan (kesinlikle!)

EGZERSİZ ZORLUK FAKTÖRÜ:
- Compound movements (Squat, Bench, Deadlift): +2-5 bonus puan
- Isolation movements (Bicep curl, Tricep ext): normal puan
- Ağır ağırlık (80kg+ bench): +2-3 bonus puan`;
    } else {
      const prevWorkoutBonus = Math.min(workoutCount * 2, 20); // Her antrenman +2 bonus (max 20)
      
      workoutTypeMessage = `
📈 DEVAM EDEN ANTRENMAN - AKILLI İLERLEME (${workoutCount}. antrenman):

OVERALL RATING İlerleme Sistemi:
- Hafif antrenman: +3-6 puan artış
- Orta antrenman: +5-10 puan artış  
- Yoğun antrenman: +8-15 puan artış
- Tecrübe bonusu: +${prevWorkoutBonus} puan (${workoutCount} antrenman)

KAS GRUBU İLERLEME PUANI:
✅ Sadece bu kas gruplarını kullan: shoulder, chest, biceps, triceps, hamstring, calf

BİRİNCİL KAS İlerlemesi: +2-8 puan
- Güçlü antrenman → +6-8 puan
- Normal antrenman → +3-5 puan
- Hafif antrenman → +2-3 puan

İKİNCİL KAS İlerlemesi: +1-4 puan
- Yardımcı kas çalışması → +2-4 puan

ÇALIŞILMAYAN KAS: 0 puan artış (mutlaka!)

PROGRESİF BONUS SİSTEMİ:
- Önceki antrenmandan daha ağır → +2-5 bonus
- Daha fazla set/tekrar → +1-3 bonus
- Yeni egzersiz deneme → +1-2 bonus`;
    }

    const systemMessage = `Sen LogPress AI'nin uzman fitness antrenörüsün! 

🎯 MİSYONUN: Kullanıcıları motive edecek, gerçekçi ve adil puanlar vermek.

${workoutTypeMessage}

🧠 EGZERSİZ ANALİZ REHBERİ:

BENCH PRESS/PUSH-UP/CHEST: 
→ Birincil: chest (15-20 puan)
→ İkincil: triceps (4-8 puan)
→ Çalışmayan: shoulder, biceps, hamstring, calf (0 puan)

SQUAT/LEG PRESS/LUNGES:
→ Birincil: hamstring (15-20 puan)  
→ İkincil: calf (3-6 puan)
→ Çalışmayan: chest, shoulder, biceps, triceps (0 puan)

SHOULDER PRESS/LATERAL RAISE:
→ Birincil: shoulder (15-20 puan)
→ İkincil: triceps (3-6 puan)
→ Çalışmayan: chest, biceps, hamstring, calf (0 puan)

BICEP CURL/PULL-UP:
→ Birincil: biceps (12-18 puan)
→ Çalışmayan: chest, shoulder, triceps, hamstring, calf (0 puan)

TRICEP EXTENSION/DIPS:
→ Birincil: triceps (12-18 puan)
→ Çalışmayan: chest, shoulder, biceps, hamstring, calf (0 puan)

CALF RAISE/TIP TOE:
→ Birincil: calf (10-15 puan)
→ Çalışmayan: chest, shoulder, biceps, triceps, hamstring (0 puan)

🔥 MANTIK KONTROLÜ:
- Kol antrenmanı yapan bacak puanı ALAMAZ!
- Bacak antrenmanı yapan kol puanı ALAMAZ!
- Çalışılmayan kas = 0 puan (bu zorunlu!)

JSON FORMATINDA YANIT VER - başka hiçbir şey yazma!`;

    const messages = [
      {
        role: 'system',
        content: systemMessage
      },
      {
        role: 'user',
        content: `
Kullanıcının Mevcut Puanları:
${JSON.stringify(currentStats, null, 2)}

Yeni Tamamlanan Antrenman:
${JSON.stringify(workoutData, null, 2)}

Kullanıcı Profili:
${JSON.stringify({
  age: userData?.age,
  gender: userData?.gender,
  height: userData?.height,
  weight: userData?.weight,
  goal: userData?.goal,
  experience: userData?.experience,
  frequency: userData?.frequency,
  workoutCount: workoutCount,
  isFirstWorkout: isFirstWorkout
}, null, 2)}

Bu antrenmana göre akıllı puanları hesapla ve şu JSON formatında yanıt ver:
{
  "over_all_rating": number,
  "shoulder": number,
  "chest": number,  
  "biceps": number,
  "triceps": number,
  "hamstring": number,
  "calf": number,
  "reasons": "Detaylı açıklama: hangi egzersizler hangi kasları çalıştırdı ve neden bu puanları verdin"
}`
      }
    ];

    const openaiApiKey = OPENAI_CONFIG.API_KEY;

    if (!openaiApiKey) {
      throw new Error('OpenAI API key bulunamadı');
    }

    // Direkt OpenAI API çağrısı yapalım
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.4, // Biraz daha yaratıcı olsun
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API hatası: ${response.status}`);
    }

    const aiResponse = await response.json();

    if (!aiResponse.choices || !aiResponse.choices[0]?.message?.content) {
      throw new Error('AI yanıtı boş geldi');
    }

    const content = aiResponse.choices[0].message.content;

    try {
      const evaluation = JSON.parse(content.trim());
      
      // 🔥 YENİ AKILLI SINIR SİSTEMİ - Çok daha esnek
      const muscleGroups = ['shoulder', 'chest', 'biceps', 'triceps', 'hamstring', 'calf'];
      
      if (isFirstWorkout) {
        // İlk antrenman: Güçlü başlangıç (50-85 puan)
        evaluation.over_all_rating = Math.max(
          Math.min(Math.ceil(Number(evaluation.over_all_rating)), 85),
          50 // Minimum 50 puan garantisi!
        );

        // Kas grupları için güçlü başlangıç (max 20 puan)
        muscleGroups.forEach(muscle => {
          evaluation[muscle] = Math.max(
            Math.min(Math.ceil(Number(evaluation[muscle] || 0)), 20),
            0
          );
        });
      } else {
        // Sonraki antrenmanlar: Akıllı ilerleme
        const currentRating = currentStats.overall_rating || 50;
        const aiSuggestedRating = Math.ceil(Number(evaluation.over_all_rating));
        
        // Mevcut rating'e göre esnek artış
        if (currentRating < 70) {
          // Düşük seviyedeyse hızlı ilerleme (max +15)
          evaluation.over_all_rating = Math.min(aiSuggestedRating, currentRating + 15);
        } else if (currentRating < 120) {
          // Orta seviyede normal ilerleme (max +10)
          evaluation.over_all_rating = Math.min(aiSuggestedRating, currentRating + 10);
        } else {
          // Yüksek seviyede yavaş ilerleme (max +6)
          evaluation.over_all_rating = Math.min(aiSuggestedRating, currentRating + 6);
        }
        
        // En az mevcut puanı korusun
        evaluation.over_all_rating = Math.max(evaluation.over_all_rating, currentRating);

        // Kas grupları için akıllı ilerleme
        muscleGroups.forEach(muscle => {
          const currentMuscleScore = currentStats.muscle_groups?.[muscle] || 0;
          const aiSuggestedScore = Math.ceil(Number(evaluation[muscle] || 0));
          
          if (aiSuggestedScore > 0) { // Sadece çalışılan kaslar için
            // Kas grubu seviyesine göre esnek artış
            if (currentMuscleScore < 30) {
              evaluation[muscle] = Math.min(aiSuggestedScore, currentMuscleScore + 8);
            } else if (currentMuscleScore < 60) {
              evaluation[muscle] = Math.min(aiSuggestedScore, currentMuscleScore + 6);
            } else {
              evaluation[muscle] = Math.min(aiSuggestedScore, currentMuscleScore + 4);
            }
            
            // En az mevcut puanı korusun
            evaluation[muscle] = Math.max(evaluation[muscle], currentMuscleScore);
          } else {
            // Çalışılmayan kas = 0 puan artış
            evaluation[muscle] = 0;
          }
        });
      }

      evaluation.isFirstWorkout = isFirstWorkout;

      // AI evaluation sonuçlarını Stats ekranının beklediği formata çevir
      const updatedStats = {
        ...currentStats,
        overall_rating: evaluation.over_all_rating,
        muscle_groups: {
          shoulder: evaluation.shoulder || 0,
          chest: evaluation.chest || 0,
          biceps: evaluation.biceps || 0,
          triceps: evaluation.triceps || 0,
          hamstring: evaluation.hamstring || 0,
          calf: evaluation.calf || 0,
          // Eski sistem uyumluluğu için (geriye dönük destek)
          back: currentStats.muscle_groups?.back || 0,
          upper_chest: currentStats.muscle_groups?.upper_chest || 0,
        },
        // Diğer AI analiz sonuçları
        ai_analysis_summary: evaluation.reasons,
        ai_recommendations: `İlk antrenman bonusu: ${isFirstWorkout ? '+50 puan!' : 'Devam et!'}`,
        ai_analyzed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await storage.saveUserStats(updatedStats);

      return { evaluation };
    } catch (parseError) {
      throw new Error('AI yanıtı işlenemedi');
    }

  } catch (error) {
    return { error: 'AI değerlendirmesi alınamadı' };
  }
};

export const completeWorkout = async (workoutData: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Kullanıcı bulunamadı');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    const { data: completedWorkouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id')
      .eq('user_id', user.id);
    
    if (workoutsError) throw workoutsError;
    
    const isFirstWorkout = !completedWorkouts || completedWorkouts.length === 0;
    
    let newScore;
    
    if (isFirstWorkout) {
      const baseScore = Math.max(20, workoutData.score);
      newScore = baseScore;
    } else {
      newScore = (profile.ls_score || 0) + workoutData.score;
    }
    
    const newSkillLevel = calculateSkillLevel(newScore);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        ls_score: newScore,
        skill_level: newSkillLevel,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    const storedUserInfo = await storage.getUserInfo();
    if (storedUserInfo) {
      await storage.setUserInfo({
        ...storedUserInfo,
        ls_score: newScore,
        skill_level: newSkillLevel,
        updated_at: new Date().toISOString()
      });
    }

    return { success: true, newScore, newSkillLevel, isFirstWorkout };
  } catch (error) {
    return { error: 'Workout tamamlanamadı' };
  }
};

export const updateLeaderboardPoints = async (points: number) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Kullanıcı bulunamadı');

    // Kullanıcının role bilgisini profiles'tan al
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_role_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // Profil hatası olsa bile leaderboard'u güncellemeye devam et
    }

    // Display name'i auth'tan al - user_metadata'dan veya storage'dan
    let displayName = 'İsimsiz Kullanıcı';
    
    // Önce auth user_metadata'sından dene
    if (user.user_metadata?.display_name) {
      displayName = user.user_metadata.display_name;
    } else if (user.user_metadata?.name) {
      displayName = user.user_metadata.name;
    }
    
    // Eğer auth'ta yoksa storage'dan dene
    if (displayName === 'İsimsiz Kullanıcı') {
      try {
        const userData = await storage.getUserData();
        if (userData?.display_name) {
          displayName = userData.display_name;
        } else if (userData?.name) {
          displayName = userData.name;
        }
      } catch (storageError) {
      }
    }

    const { data: existingEntry, error: fetchError } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { 
      throw fetchError;
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Streak hesaplama
    let newStreakDays = 1;
    if (existingEntry && existingEntry.last_workout_date) {
      const lastWorkoutDate = new Date(existingEntry.last_workout_date);
      const lastWorkoutDay = lastWorkoutDate.toISOString().split('T')[0];
      const daysDiff = Math.floor((now.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (lastWorkoutDay === today) {
        // Aynı gün, streak aynı kalır
        newStreakDays = existingEntry.streak_days || 1;
      } else if (daysDiff === 1) {
        // Ardışık gün, streak artır
        newStreakDays = (existingEntry.streak_days || 0) + 1;
      } else {
        // Streak kopmuş, yeniden başla
        newStreakDays = 1;
      }
    }

    const updateData = {
      points: (existingEntry?.points || 0) + points,
      workout_count: (existingEntry?.workout_count || 0) + 1,
      streak_days: newStreakDays,
      last_workout_date: now.toISOString(),
      display_name: displayName,
      ispremium: (profile?.user_role_id || 0) >= 1,
      updated_at: now.toISOString()
    };

    if (existingEntry) {
      const { error: updateError } = await supabase
        .from('leaderboard')
        .update(updateData)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('leaderboard')
        .insert({
          user_id: user.id,
          ...updateData,
          created_at: now.toISOString()
        });

      if (insertError) throw insertError;
    }

    // 🔥 ÖNEMLİ: Local storage'daki user_data'yı da güncelle
    try {
      await storage.updateUserData({
        leaderboard_points: updateData.points,
      });
    } catch (storageError) {
      // Storage hatası olsa bile ana işlemi başarılı say
    }

    return { success: true, newLeaderboardPoints: updateData.points };
  } catch (error) {
    return { error: 'Leaderboard güncellenemedi' };
  }
};

export const getUserStats = async () => {
    try {
        const stats = await storage.getUserStats();
        return { stats, error: null };
    } catch (error) {
        return { stats: null, error };
    }
} 