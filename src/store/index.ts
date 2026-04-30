import { configureStore } from '@reduxjs/toolkit';
import settingsReducer from './slices/settingsSlice';
import workoutReducer from './slices/workoutSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    workout: workoutReducer,
    user: userReducer,
  },
});

// Tipleri store'un kendisinden çıkarım yap
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 