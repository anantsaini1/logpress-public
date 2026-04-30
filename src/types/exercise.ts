export interface ExerciseSet {
  id: number;
  weight: string | number;
  reps: string;
  isCompleted: boolean;
}

export interface Exercise {
  id: string | number;
  name: string;
  target: string;
  equipment?: string;
  muscle_group: string[];
  image?: string;
  bodyPart?: string;
  gifUrl?: string;
  instructions?: string[];
}

export interface SelectedExercise extends Exercise {
  sets: ExerciseSet[];
  restTime: string;
}

export interface ExerciseData {
  id: string;
  name: string;
  category: string;
  equipment: string;
  instructions: string;
  muscle_group: string;
  created_at: string;
  target: string;
  image: string | null;
  gif_url: string | null;
}

export interface ExerciseFilter {
  category?: string;
  equipment?: string;
  muscle_group?: string;
  target?: string;
}

export interface ExerciseSearchParams {
  query?: string;
  filters?: ExerciseFilter;
  sortBy?: 'name' | 'category' | 'equipment';
  sortOrder?: 'asc' | 'desc';
}

export const EXERCISE_CATEGORIES = [
  'biceps',
  'triceps',
  'chest',
  'shoulders', 
  'quadriceps',
  'hamstrings',
  'calves',
  'glutes',
  'abdominals',
  'forearms',
  'traps',
  'cardio',
  'full body'
] as const;

export const EQUIPMENT_TYPES = [
  'Barbell',
  'Dumbbell', 
  'Machine',
  'Kettlebell',
  'Resistance Band',
  'None',
  'Other',
  'Suspension'
] as const;

export const MUSCLE_GROUPS = [
  'shoulders',
  'forearms',
  'glutes',
  'obliques',
  'quadriceps'
] as const;

export const TARGET_MUSCLES = [
  'Biceps',
  'Triceps',
  'Chest',
  'Shoulders',
  'Quadriceps',
  'Hamstrings',
  'Calves',
  'Glutes',
  'Abdominals',
  'Forearms',
  'Traps',
  'Cardio',
  'Full Body',
  'Lats',
  'Upper Back',
  'Adductors'
] as const;

export type ExerciseCategory = typeof EXERCISE_CATEGORIES[number];
export type EquipmentType = typeof EQUIPMENT_TYPES[number];
export type MuscleGroup = typeof MUSCLE_GROUPS[number];
export type TargetMuscle = typeof TARGET_MUSCLES[number]; 