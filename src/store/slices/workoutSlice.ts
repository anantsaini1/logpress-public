import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { storage } from '../../services/storage';

interface ExerciseSet {
  id?: number;
  weight: string | number;
  reps: string;
  isCompleted: boolean;
}

interface Exercise {
  id?: number;
  name: string;
  icon?: string;
  description?: string;
  restTime?: string;
  sets: ExerciseSet[];
}

interface Workout {
  id: string;
  routineName: string;
  exercises: Exercise[];
  created_at: string;
  updated_at: string;
}

interface WorkoutState {
  workouts: Workout[];
  loading: boolean;
  error: string | null;
  lastSync: number | null;
  initialized: boolean;
}

const initialState: WorkoutState = {
  workouts: [],
  loading: false,
  error: null,
  lastSync: null,
  initialized: false,
};

// 🚀 AsyncStorage'dan Redux'a yükle (App açılırken 1 kere)
export const loadWorkoutsFromStorage = createAsyncThunk(
  'workout/loadFromStorage',
  async () => {

    const workoutsData = await storage.getAllWorkouts();
    
    if (!workoutsData || workoutsData.length === 0) {

      return [];
    }

    // Unique workouts (aynı routine_name'den en yenisi)
    /*
    const uniqueWorkouts = workoutsData.reduce((acc: any[], workout) => {
      const existingIndex = acc.findIndex(w => w.routine_name === workout.routine_name);
      if (existingIndex >= 0) {
        const existingWorkout = acc[existingIndex];
        if (new Date(workout.created_at) > new Date(existingWorkout.created_at)) {
          acc[existingIndex] = workout;
        }
      } else {
        acc.push(workout);
      }
      return acc;
    }, []);
    */

    const formattedWorkouts = workoutsData.map(workout => ({
      id: workout.id,
      routineName: workout.name || workout.routineName || 'Untitled Routine',
      exercises: workout.exercises || [],
      created_at: workout.created_at || workout.createdAt,
      updated_at: workout.updated_at || workout.updatedAt,
    }));


    return formattedWorkouts;
  }
);

// 💾 Yeni workout ekle (hem Redux hem AsyncStorage)
export const addWorkout = createAsyncThunk(
  'workout/add',
  async (workoutData: any) => {

    
    // 1. AsyncStorage'a kaydet
    const success = await storage.saveWorkout(workoutData);
    if (!success) {
      throw new Error('Workout AsyncStorage\'a kaydedilemedi');
    }

    // 2. Redux için format
    const newWorkout: Workout = {
      id: workoutData.id || Date.now().toString(),
      routineName: workoutData.name || workoutData.routine_name || workoutData.routineName || 'Untitled Routine',
      exercises: workoutData.exercises || [],
      created_at: workoutData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };


    return newWorkout;
  }
);

// 🗑️ Workout sil (hem Redux hem AsyncStorage)
export const removeWorkout = createAsyncThunk(
  'workout/remove',
  async (workoutId: string) => {

    
    // 1. AsyncStorage'dan sil
    const success = await storage.deleteWorkout(workoutId);
    if (!success) {
      throw new Error('Workout AsyncStorage\'dan silinemedi');
    }


    return workoutId;
  }
);

// 🔄 Workout güncelle (hem Redux hem AsyncStorage)
export const updateWorkout = createAsyncThunk(
  'workout/update',
  async ({ workoutId, updates }: { workoutId: string; updates: Partial<Workout> }) => {

    
    // 1. Mevcut workout'ı al
    const allWorkouts = await storage.getAllWorkouts();
    const workoutIndex = allWorkouts.findIndex(w => w.id === workoutId);
    
    if (workoutIndex === -1) {
      throw new Error('Workout bulunamadı');
    }

    // 2. Güncelle
    const updatedWorkout = {
      ...allWorkouts[workoutIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // 3. AsyncStorage'a kaydet
    const success = await storage.saveWorkout(updatedWorkout);
    if (!success) {
      throw new Error('Workout güncellenemedi');
    }


    return { workoutId, updates: { ...updates, updated_at: updatedWorkout.updated_at } };
  }
);

// 🔄 Force refresh (cache bypass)
export const refreshWorkouts = createAsyncThunk(
  'workout/refresh',
  async () => {

    // Cache'i temizle
    storage.cache.invalidateWorkouts();
    
    // Yeniden yükle
    const workoutsData = await storage.getAllWorkouts();
    
    /*
    const uniqueWorkouts = workoutsData.reduce((acc: any[], workout) => {
      const existingIndex = acc.findIndex(w => w.routine_name === workout.routine_name);
      if (existingIndex >= 0) {
        const existingWorkout = acc[existingIndex];
        if (new Date(workout.created_at) > new Date(existingWorkout.created_at)) {
          acc[existingIndex] = workout;
        }
      } else {
        acc.push(workout);
      }
      return acc;
    }, []);
    */

    const formattedWorkouts = workoutsData.map(workout => ({
      id: workout.id,
      routineName: workout.name || workout.routineName || 'Untitled Routine',
      exercises: workout.exercises || [],
      created_at: workout.created_at || workout.createdAt,
      updated_at: workout.updated_at || workout.updatedAt,
    }));


    return formattedWorkouts;
  }
);

const workoutSlice = createSlice({
  name: 'workout',
  initialState,
  reducers: {
    // Synchronous actions for instant UI updates
    clearError: (state) => {
      state.error = null;
    },
    
    resetWorkouts: (state) => {
      state.workouts = [];
      state.initialized = false;
      state.lastSync = null;
    },

    // Optimistic UI updates (instant feedback)
    optimisticAddWorkout: (state, action: PayloadAction<Workout>) => {
      state.workouts.push(action.payload);
    },

    optimisticRemoveWorkout: (state, action: PayloadAction<string>) => {
      state.workouts = state.workouts.filter(w => w.id !== action.payload);
    },

    optimisticUpdateWorkout: (state, action: PayloadAction<{ workoutId: string; updates: Partial<Workout> }>) => {
      const index = state.workouts.findIndex(w => w.id === action.payload.workoutId);
      if (index !== -1) {
        state.workouts[index] = { ...state.workouts[index], ...action.payload.updates };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Load from storage
      .addCase(loadWorkoutsFromStorage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadWorkoutsFromStorage.fulfilled, (state, action) => {
        state.loading = false;
        state.workouts = action.payload;
        state.initialized = true;
        state.lastSync = Date.now();
      })
      .addCase(loadWorkoutsFromStorage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Workoutlar yüklenemedi';
      })

      // Add workout
      .addCase(addWorkout.fulfilled, (state, action) => {
        // Eğer optimistic update yapılmadıysa ekle
        const exists = state.workouts.some(w => w.id === action.payload.id);
        if (!exists) {
          state.workouts.push(action.payload);
        }
        state.lastSync = Date.now();
      })
      .addCase(addWorkout.rejected, (state, action) => {
        state.error = action.error.message || 'Workout eklenemedi';
        // Optimistic update'i geri al
        state.workouts = state.workouts.filter(w => w.id !== action.meta.arg.id);
      })

      // Remove workout
      .addCase(removeWorkout.fulfilled, (state, action) => {
        state.workouts = state.workouts.filter(w => w.id !== action.payload);
        state.lastSync = Date.now();
      })
      .addCase(removeWorkout.rejected, (state, action) => {
        state.error = action.error.message || 'Workout silinemedi';
        // Optimistic update'i geri al - workout'ı geri ekle
        // Bu kısım daha karmaşık, gerekirse implement edilir
      })

      // Update workout
      .addCase(updateWorkout.fulfilled, (state, action) => {
        const index = state.workouts.findIndex(w => w.id === action.payload.workoutId);
        if (index !== -1) {
          state.workouts[index] = { ...state.workouts[index], ...action.payload.updates };
        }
        state.lastSync = Date.now();
      })
      .addCase(updateWorkout.rejected, (state, action) => {
        state.error = action.error.message || 'Workout güncellenemedi';
      })

      // Refresh
      .addCase(refreshWorkouts.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshWorkouts.fulfilled, (state, action) => {
        state.loading = false;
        state.workouts = action.payload;
        state.lastSync = Date.now();
      })
      .addCase(refreshWorkouts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Refresh başarısız';
      });
  },
});

export const { 
  clearError, 
  resetWorkouts, 
  optimisticAddWorkout, 
  optimisticRemoveWorkout, 
  optimisticUpdateWorkout 
} = workoutSlice.actions;

export default workoutSlice.reducer; 