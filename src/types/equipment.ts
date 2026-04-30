export interface Equipment {
  id: string;
  translationKey: string;
  icon: string;
  category: 'weight' | 'cardio' | 'bodyweight' | 'machine';
}

export const equipmentData: Equipment[] = [
  {
    id: 'dumbbell',
    translationKey: 'equipment_dumbbell',
    icon: '💪',
    category: 'weight'
  },
  {
    id: 'barbell',
    translationKey: 'equipment_barbell',
    icon: '🏋️‍♂️',
    category: 'weight'
  },
  {
    id: 'kettlebell',
    translationKey: 'equipment_kettlebell',
    icon: '🔔',
    category: 'weight'
  },
  {
    id: 'treadmill',
    translationKey: 'equipment_treadmill',
    icon: '🏃',
    category: 'cardio'
  },
  {
    id: 'pullup-bar',
    translationKey: 'equipment_pullup_bar',
    icon: '🔝',
    category: 'bodyweight'
  },
  {
    id: 'bench-press',
    translationKey: 'equipment_bench_press',
    icon: '🛏️',
    category: 'machine'
  },
  {
    id: 'machine',
    translationKey: 'equipment_machine',
    icon: '⚙️',
    category: 'machine'
  },
  {
    id: 'bodyweight',
    translationKey: 'equipment_bodyweight',
    icon: '🧘‍♂️',
    category: 'bodyweight'
  },
  {
    id: 'cable',
    translationKey: 'equipment_cable',
    icon: '🔗',
    category: 'machine'
  },
  {
    id: 'resistance-band',
    translationKey: 'equipment_resistance_band',
    icon: '🎗️',
    category: 'bodyweight'
  }
]; 