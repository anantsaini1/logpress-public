import { storage } from './storage';

export interface WorkoutData {
  id: string;
  routineName: string;
  completedAt: string;
  duration: number; // seconds
  exercises: ExerciseData[];
  aiScore: number; // 0-100
  volume: number; // total weight * reps
  sets: number;
  muscleGroups: string[];
  workoutType: 'strength' | 'cardio' | 'flexibility' | 'mixed';
  notes?: string;
}

export interface ExerciseData {
  id: string;
  name: string;
  sets: ExerciseSet[];
  muscleGroup: string;
  equipment: string;
}

export interface ExerciseSet {
  weight: number;
  reps: number;
  restTime?: number;
}

export interface CalendarCell {
  date: string;
  intensity: number; // 0-4 (GitHub style)
  workoutCount: number;
  aiScore: number;
}

class WorkoutHistoryService {
  async loadWorkoutData(): Promise<WorkoutData[]> {
    try {
      const rawWorkouts = await storage.getUserWorkouts();
      
      if (rawWorkouts.length === 0) {
        return [];
      }
      
      const processedWorkouts = this.processWorkoutData(rawWorkouts);
      return processedWorkouts;
    } catch (error) {
      
      return [];
    }
  }

  private processWorkoutData(rawWorkouts: any[]): WorkoutData[] {
    if (!rawWorkouts || !Array.isArray(rawWorkouts)) {
      return [];
    }



    const processed = rawWorkouts.map(workout => {
      const completedAt = workout.completed_at || workout.completedAt || workout.createdAt || new Date().toISOString();
      const dateOnly = completedAt.split('T')[0];
      

      
      // Duration hesaplama: workout data'sından veya exercises'dan
      let duration = workout.duration || 0;
      if (duration === 0 && workout.exercises && Array.isArray(workout.exercises)) {
        // Eğer duration yok ise exercises'dan hesapla
        const exerciseCount = workout.exercises.length;
        const setCount = workout.exercises.reduce((total: number, ex: any) => {
          if (ex.sets && Array.isArray(ex.sets)) {
            return total + ex.sets.filter((set: any) => set.isCompleted !== false).length;
          }
          return total;
        }, 0);
        // Ortalama: set başına 90 saniye (45 saniye egzersiz + 45 saniye dinlenme)
        duration = setCount * 90;
      }

      return {
        id: workout.id || workout.routineId || Math.random().toString(),
        routineName: workout.routine_name || workout.routineName || 'Workout',
        completedAt,
        duration,
        exercises: this.processExercises(workout.exercises || []),
        aiScore: workout.ai_score || workout.aiScore || this.calculateAIScore(workout),
        volume: workout.volume || 0,
        sets: workout.sets || workout.totalSets || 0,
        muscleGroups: workout.muscle_groups || workout.muscleGroups || this.extractMuscleGroups(workout.exercises || []),
        workoutType: workout.workout_type || workout.workoutType || 'strength',
        notes: workout.notes || ''
      };
    });



    return processed;
  }

  private processExercises(rawExercises: any[]): ExerciseData[] {
    if (!rawExercises || !Array.isArray(rawExercises)) {
      return [];
    }

    return rawExercises.map(exercise => ({
      id: exercise.id || Math.random().toString(),
      name: exercise.name || 'Exercise',
      sets: this.processSets(exercise.sets || []),
      muscleGroup: exercise.muscle_group || exercise.muscleGroup || this.guessMuscleGroup(exercise.name || ''),
      equipment: exercise.equipment || 'bodyweight'
    }));
  }

  private guessMuscleGroup(exerciseName: string): string {
    const name = exerciseName.toLowerCase();
    if (name.includes('push') || name.includes('bench') || name.includes('chest')) return 'chest';
    if (name.includes('pull') || name.includes('row') || name.includes('back')) return 'back';
    if (name.includes('squat') || name.includes('leg') || name.includes('thigh')) return 'legs';
    if (name.includes('curl') || name.includes('bicep')) return 'biceps';
    if (name.includes('press') || name.includes('tricep')) return 'triceps';
    if (name.includes('shoulder') || name.includes('deltoid')) return 'shoulders';
    return 'other';
  }

  private processSets(rawSets: any[]): ExerciseSet[] {
    if (!rawSets || !Array.isArray(rawSets)) {
      return [];
    }

    return rawSets.filter(set => set.isCompleted !== false).map(set => ({
      weight: parseFloat(String(set.weight || 0)) || 0,
      reps: parseInt(String(set.reps || 0)) || 0,
      restTime: set.rest_time || set.restTime
    }));
  }

  generateCalendarData(workouts: WorkoutData[], month: Date): CalendarCell[] {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    
    const calendarData: CalendarCell[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      // Timezone sorununu çözmek için manuel date formatting
      const dateString = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const dayWorkouts = workouts.filter(workout => 
        workout.completedAt.split('T')[0] === dateString
      );
      
      const workoutCount = dayWorkouts.length;
      const avgAiScore = workoutCount > 0 
        ? dayWorkouts.reduce((sum, w) => sum + w.aiScore, 0) / workoutCount 
        : 0;
      
      // GitHub style intensity (0-4) - sadece gerçek workout varsa
      let intensity = 0;
      if (workoutCount > 0 && avgAiScore > 0) {
        if (avgAiScore >= 80) intensity = 4;
        else if (avgAiScore >= 60) intensity = 3;
        else if (avgAiScore >= 40) intensity = 2;
        else intensity = 1;
      }
      
      calendarData.push({
        date: dateString,
        intensity,
        workoutCount,
        aiScore: Math.round(avgAiScore)
      });
    }
    
    return calendarData;
  }

  private calculateAIScore(workout: any): number {
    // Basit AI score hesaplama: volume ve duration'a göre
    const volume = workout.volume || 0;
    const duration = workout.duration || 0;
    const sets = workout.sets || workout.totalSets || 0;
    
    if (volume === 0 || duration === 0) return 0;
    
    // Volume/dakika ratio + set sayısına göre score hesapla
    const volumePerMinute = volume / (duration / 60);
    let score = Math.min(volumePerMinute * 2, 70); // Max 70 from volume efficiency
    
    // Set sayısına göre bonus
    if (sets >= 10) score += 20;
    else if (sets >= 6) score += 15;
    else if (sets >= 3) score += 10;
    
    // Duration'a göre bonus (30-90 dk ideal)
    const durationMinutes = duration / 60;
    if (durationMinutes >= 30 && durationMinutes <= 90) {
      score += 10;
    }
    
    return Math.min(Math.max(Math.round(score), 0), 100);
  }

  private extractMuscleGroups(exercises: any[]): string[] {
    if (!exercises || !Array.isArray(exercises)) return [];
    
    const muscleGroups = new Set<string>();
    
    exercises.forEach(exercise => {
      if (exercise.muscleGroup) {
        muscleGroups.add(exercise.muscleGroup);
      } else if (exercise.name) {
        // Exercise ismine göre muscle group tahmin et
        const name = exercise.name.toLowerCase();
        if (name.includes('push') || name.includes('bench') || name.includes('chest')) {
          muscleGroups.add('chest');
        } else if (name.includes('pull') || name.includes('row') || name.includes('back')) {
          muscleGroups.add('back');
        } else if (name.includes('squat') || name.includes('leg') || name.includes('thigh')) {
          muscleGroups.add('legs');
        } else if (name.includes('curl') || name.includes('bicep')) {
          muscleGroups.add('biceps');
        } else if (name.includes('press') || name.includes('tricep')) {
          muscleGroups.add('triceps');
        } else if (name.includes('shoulder') || name.includes('deltoid')) {
          muscleGroups.add('shoulders');
        } else {
          muscleGroups.add('other');
        }
      }
    });
    
    return Array.from(muscleGroups);
  }



  async handleStorageError(error: Error): Promise<void> {
    console.error('Storage error:', error);
    // Error handling burada yapılacak
  }
}

export const workoutHistoryService = new WorkoutHistoryService();