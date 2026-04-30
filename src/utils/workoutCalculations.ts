// Basit workout hesaplama utilities - sadece hard data
export interface WorkoutStats {
  endurance: number;
  strength: number;
  power: number;
}

export interface UserStats {
  total_workouts: number;
  total_exercises: number;
  total_weight: number;
  total_time: number;
  current_streak: number;
  max_streak: number;
  last_workout_date: string;
  overall_rating: number; // AI'dan gelecek
  muscle_groups?: {
    shoulder: number;
    chest: number;
    biceps: number;
    triceps: number;
    hamstring: number;
    calf: number;
  };
  ai_analysis_summary?: string;
  ai_recommendations?: string[];
  ai_analyzed_at?: string;
}

// Basit workout stats hesaplama (UI gösterimi için)
export const calculateWorkoutStats = (volume: number, duration: number, sets: number): WorkoutStats => {
  const durationMinutes = duration / 60;
  
  const endurance = Math.ceil(durationMinutes * 0.5 + sets * 0.3);
  const strength = Math.ceil((volume / 100) * 0.8);
  const power = Math.ceil((volume * sets) / (durationMinutes || 1) * 0.1);

  return {
    endurance: Math.max(1, endurance),
    strength: Math.max(1, strength),
    power: Math.max(1, power)
  };
};

// Streak hesaplama (günlük)
export const calculateStreak = (lastWorkoutDate: string | null, currentStreak: number = 0): { newStreak: number; streakIncreased: boolean } => {
  const today = new Date().toISOString().split('T')[0];
  const lastDate = lastWorkoutDate ? 
    new Date(lastWorkoutDate).toISOString().split('T')[0] : null;
  
  if (!lastDate) {
    // İlk antrenman
    return { newStreak: 1, streakIncreased: true };
  }
  
  if (lastDate === today) {
    // Bugün zaten antrenman yapılmış, streak aynı kalır
    return { newStreak: currentStreak, streakIncreased: false };
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (lastDate === yesterdayStr) {
    // Dün antrenman yapılmış, streak +1
    return { newStreak: currentStreak + 1, streakIncreased: true };
  } else {
    // Streak kırılmış, yeniden başla
    return { newStreak: 1, streakIncreased: true };
  }
};

// Gerçek workout verilerinden user stats hesaplama
export const calculateUserStatsFromWorkouts = (workouts: any[]): UserStats => {
  if (!workouts || workouts.length === 0) {
    return {
      total_workouts: 0,
      total_exercises: 0,
      total_weight: 0,
      total_time: 0,
      current_streak: 0,
      max_streak: 0,
      last_workout_date: '',
      overall_rating: 0,
    };
  }

  // Workout verilerini analiz et
  const sortedWorkouts = workouts.sort((a, b) => 
    new Date(b.completedAt || b.completed_at || b.created_at || '').getTime() - 
    new Date(a.completedAt || a.completed_at || a.created_at || '').getTime()
  );

  let totalExercises = 0;
  let totalWeight = 0;
  let totalTime = 0;

  // Her workout'u analiz et
  workouts.forEach(workout => {
    // Süre hesaplama
    totalTime += workout.duration || 0;

    // Egzersiz ve ağırlık hesaplama
    const exercises = workout.exercises || [];
    exercises.forEach((exercise: any) => {
      totalExercises += 1; // Her egzersiz +1

      // Set'lerdeki ağırlıkları topla
      const sets = exercise.sets || [];
      sets.forEach((set: any) => {
        if (set.isCompleted !== false) { // Tamamlanmış set'ler
          const weight = parseFloat(set.weight || '0');
          const reps = parseInt(set.reps || '0');
          totalWeight += weight * reps; // Volume hesaplama
        }
      });
    });
  });

  // Streak hesaplama
  const lastWorkout = sortedWorkouts[0];
  const lastWorkoutDate = lastWorkout ? 
    (lastWorkout.completedAt || lastWorkout.completed_at || lastWorkout.created_at || '') : '';

  // Günlük streak hesaplama
  let currentStreak = 0;
  const today = new Date();
  const workoutDates = new Set();

  // Benzersiz workout günlerini topla
  workouts.forEach(workout => {
    const workoutDate = workout.completedAt || workout.completed_at || workout.created_at;
    if (workoutDate) {
      const dateStr = new Date(workoutDate).toISOString().split('T')[0];
      workoutDates.add(dateStr);
    }
  });

  // Mevcut streak hesaplama (bugünden geriye doğru)
  for (let i = 0; i < 365; i++) { // Max 1 yıl geriye bak
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    
    if (workoutDates.has(dateStr)) {
      currentStreak++;
    } else if (i > 0) { // İlk gün (bugün) workout yoksa streak 0
      break;
    } else {
      break;
    }
  }

  // Max streak hesaplama (tüm geçmişte en uzun streak)
  let maxStreak = 0;
  let tempStreak = 0;
  const sortedDates = Array.from(workoutDates).sort();
  
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = new Date(sortedDates[i - 1] as string);
      const currDate = new Date(sortedDates[i] as string);
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        maxStreak = Math.max(maxStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  maxStreak = Math.max(maxStreak, tempStreak);

  return {
    total_workouts: workouts.length,
    total_exercises: totalExercises,
    total_weight: Math.round(totalWeight),
    total_time: Math.round(totalTime / 60), // Dakika cinsinden
    current_streak: currentStreak,
    max_streak: maxStreak,
    last_workout_date: lastWorkoutDate,
    overall_rating: 0, // AI'dan gelecek, şimdilik 0
  };
}; 