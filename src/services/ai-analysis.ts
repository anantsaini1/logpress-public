// AI Analiz Service - Direct OpenAI Integration
import OPENAI_CONFIG from '../config/openai';
import { supabase } from './supabase';

interface WorkoutData {
  workout_name: string;
  duration_minutes: number;
  exercises: Array<{
    name: string;
    sets: number;
    weight: number;
    reps: number;
  }>;
  total_sets: number;
  total_volume: number;
}

interface UserContext {
  age: number;
  gender: string;
  weight_kg: number;
  height_cm: number;
  experience_level: string;
  fitness_goals: string[];
}

interface AnalysisResult {
  overall_rating: number; // 1-100 arası kullanıcının genel rating'i
  muscle_groups: {
    chest?: number;      // 1-100 arası bu antrenmanda ne kadar gelişti
    shoulders?: number;
    biceps?: number;
    triceps?: number;
    back?: number;
    legs?: number;
    glutes?: number;
    abs?: number;
    hamstring?: number;
    calves?: number;
  };
  workout_effectiveness: number; // 1-100 arası bu antrenmanın etkisi
  summary: string; // Kısa özet
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class AIAnalysisService {
  
  /**
   * Direkt OpenAI API ile workout analizi yap
   */
  static async analyzeWorkout(workoutData: WorkoutData, userContext: UserContext, userId?: string): Promise<AnalysisResult> {
    let analysisId: string | null = null;
    
    try {
      // Analysis ID oluştur
      analysisId = this.generateAnalysisId();
      
      // Supabase'e başlangıç kaydı yap (optional)
      if (userId) {
        try {
          await this.saveAnalysisToSupabase(analysisId, userId, workoutData, userContext, 'processing');
        } catch (dbError) {
          // DB hatası analizi durdurmasın
        }
      }
      
      // ChatGPT prompt oluştur (kısaltılmış)
      const prompt = this.createWorkoutAnalysisPrompt(workoutData, userContext);
      
      // OpenAI API çağrısı
      const requestBody = {
        model: OPENAI_CONFIG.MODEL,
        messages: [
          {
            role: 'system',
            content: 'Sen uzman bir fitness antrenörü ve spor bilimcisisin. Türkçe yanıt ver ve her zaman JSON formatında analiz yap.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: OPENAI_CONFIG.TEMPERATURE,
        max_tokens: OPENAI_CONFIG.MAX_TOKENS,
      };
      
      const response = await fetch(OPENAI_CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_CONFIG.API_KEY.trim()}`,
          'User-Agent': 'LogPress-AI-Mobile/1.0',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.text();
        
        if (response.status === 401) {
          throw new Error('API Key authentication failed. Check your OpenAI API key.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait and try again.');
        } else if (response.status === 403) {
          throw new Error('Access denied to this model. Try a different model.');
        }
        
        throw new Error(`OpenAI API Error: ${response.status} - ${errorData}`);
      }

      const data: OpenAIResponse = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('OpenAI\'dan yanıt alınamadı');
      }

      // JSON parse etmeye çalış
      let parsedResult: AnalysisResult;
      try {
        parsedResult = JSON.parse(aiResponse) as AnalysisResult;
      } catch (parseError) {
        // JSON parse edilemezse, default format'ta döndür
        parsedResult = {
          overall_rating: 12,
          muscle_groups: {
            chest: 8,
            shoulders: 5,
            triceps: 6
          },
          workout_effectiveness: 14,
          summary: aiResponse
        };
      }
      
      // Başarılı analizi Supabase'e kaydet
      if (userId && analysisId) {
        try {
          await this.updateAnalysisInSupabase(analysisId, parsedResult, 'completed');
        } catch (dbError) {
          // DB hatası analizi durdurmasın
        }
      }
      
      return parsedResult;

    } catch (error) {
      // Hata durumunda Supabase'i güncelle
      if (userId && analysisId) {
        try {
          await this.updateAnalysisInSupabase(analysisId, null, 'failed');
        } catch (dbError) {
        }
      }
      
      // Error object'i string'e çevir
      let errorMessage = 'Bilinmeyen hata';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        errorMessage = JSON.stringify(error);
      }
      
      throw new Error(`AI analizi başarısız: ${errorMessage}`);
    }
  }

  /**
   * Analysis ID oluştur
   */
  private static generateAnalysisId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ana_${timestamp}_${random}`;
  }

  /**
   * Analizi Supabase'e kaydet
   */
  private static async saveAnalysisToSupabase(
    analysisId: string,
    userId: string,
    workoutData: WorkoutData,
    userContext: UserContext,
    status: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('workout_analyses')
        .insert({
          analysis_id: analysisId,
          user_id: userId,
          workout_data: workoutData,
          user_context: userContext,
          status: status,
          created_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Analizi Supabase'de güncelle
   */
  private static async updateAnalysisInSupabase(
    analysisId: string,
    results: AnalysisResult | null,
    status: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status: status,
        completed_at: new Date().toISOString()
      };
      
      if (results) {
        updateData.ai_results = results;
      }

      const { error } = await supabase
        .from('workout_analyses')
        .update(updateData)
        .eq('analysis_id', analysisId);

      if (error) {
        throw error;
      }
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * ChatGPT için workout analiz prompt'u oluştur
   */
     private static createWorkoutAnalysisPrompt(workoutData: WorkoutData, userContext: UserContext): string {
     const exercisesText = workoutData.exercises.map(exercise => 
       `${exercise.name}: ${exercise.sets}x${exercise.reps} (${exercise.weight}kg)`
     ).join(', ');

     return `Fitness AI olarak bu antrenmandan kas gruplarına KÜÇÜk artışlar hesapla:

Kullanıcı: ${userContext.age} yaş, ${userContext.gender}, ${userContext.experience_level}
Antrenman: ${workoutData.workout_name} - ${exercisesText}

Bu antrenmandan hangi kas grupları ne kadar puan kazandı? (TEK antrenman etkisi)

Şu JSON formatında yanıt ver:
{
  "overall_rating": 12,
  "muscle_groups": {
    "chest": 8,
    "shoulders": 5,
    "triceps": 6
  },
  "workout_effectiveness": 15,
  "summary": "İyi push antrenmanı, göğüs kaslarında gelişim."
}

ÖNEMLİ KURALLAR:
- overall_rating: Sadece 5-20 arası puan ver (tek antrenman etkisi)
- muscle_groups: Sadece çalışılan kaslar için 3-15 arası puan ver
- Çalışılmayan kas gruplarını dahil etme
- Gerçekçi ol, tek antrenman büyük değişiklik yapmaz`;
   }

  /**
   * Workout verisini analiz formatına çevir
   */
  static formatWorkoutData(
    routineName: string,
    duration: number, // saniye
    exercises: any[],
    totalSets: number,
    totalVolume: number
  ): WorkoutData {
    // Egzersizleri format'a çevir
    const formattedExercises = exercises
      .map(exercise => {
        const completedSets = exercise.sets?.filter((set: any) => set.isCompleted) || [];
        
        if (completedSets.length === 0) return null;

        // Ortalama ağırlık ve tekrar hesapla
        const avgWeight = completedSets.reduce((sum: number, set: any) => sum + (set.weight || 0), 0) / completedSets.length;
        const avgReps = completedSets.reduce((sum: number, set: any) => sum + parseInt(set.reps || '0'), 0) / completedSets.length;

        return {
          name: exercise.name,
          sets: completedSets.length,
          weight: Math.round(avgWeight),
          reps: Math.round(avgReps)
        };
      })
      .filter((exercise): exercise is {name: string; sets: number; weight: number; reps: number} => exercise !== null);

    return {
      workout_name: routineName,
      duration_minutes: Math.round(duration / 60),
      exercises: formattedExercises,
      total_sets: totalSets,
      total_volume: totalVolume
    };
  }

  /**
   * User context'i formatla
   */
  static formatUserContext(userData: any): UserContext {
    // Hedefleri İngilizce'ye çevir
    const goalMapping: { [key: string]: string } = {
      'kilo_verme': 'weight_loss',
      'kas_kazanma': 'muscle_gain',
      'guc_artirma': 'strength',
      'dayaniklilik': 'endurance',
      'genel_fitness': 'general_fitness'
    };

    const goals = userData.goals?.map((goal: string) => goalMapping[goal] || goal) || ['general_fitness'];

    return {
      age: userData.age || 25,
      gender: userData.gender === 'erkek' ? 'male' : 'female',
      weight_kg: userData.weight || 70,
      height_cm: userData.height || 175,
      experience_level: userData.experience_level || 'beginner',
      fitness_goals: goals
    };
  }
}

export default AIAnalysisService; 