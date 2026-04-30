export interface MuscleGroup {
  id: string;
  translationKey: string;
  icon: string;
  category: 'upper' | 'lower' | 'core' | 'cardio';
}

export const muscleGroupData: MuscleGroup[] = [
  { 
    id: 'chest', 
    translationKey: 'muscle_chest', 
    icon: '💪',
    category: 'upper'
  },
  { 
    id: 'back', 
    translationKey: 'muscle_back', 
    icon: '🔙',
    category: 'upper'
  },
  { 
    id: 'shoulders', 
    translationKey: 'muscle_shoulders', 
    icon: '💺',
    category: 'upper'
  },
  { 
    id: 'arms', 
    translationKey: 'muscle_arms', 
    icon: '💪',
    category: 'upper'
  },
  { 
    id: 'legs', 
    translationKey: 'muscle_legs', 
    icon: '🦵',
    category: 'lower'
  },
  { 
    id: 'glutes', 
    translationKey: 'muscle_glutes', 
    icon: '🍑',
    category: 'lower'
  },
  { 
    id: 'abs', 
    translationKey: 'muscle_abs', 
    icon: '🔥',
    category: 'core'
  },
  { 
    id: 'cardio', 
    translationKey: 'muscle_cardio', 
    icon: '❤️',
    category: 'cardio'
  },
]; 