// store/index.ts
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import signsReducer from './slices/signSlice';
import syncReducer from './slices/syncSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  signs: signsReducer,
  sync: syncReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Allow FileSystem objects
    }),
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;