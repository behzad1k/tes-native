// store/index.ts
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
	persistStore,
	persistReducer,
	FLUSH,
	REHYDRATE,
	PAUSE,
	PERSIST,
	PURGE,
	REGISTER,
} from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import authReducer from "./slices/authSlice";
import signsReducer from "./slices/signSlice";
import syncReducer from "./slices/syncSlice";

// Persist configuration for signs
const signsPersistConfig = {
	key: "signs",
	storage: AsyncStorage,
	whitelist: ["signs", "backendImages", "lastFetched"], // Only persist these fields
};

// Persist configuration for auth
const authPersistConfig = {
	key: "auth",
	storage: AsyncStorage,
	whitelist: ["user", "isAuthenticated"], // Don't persist loading states
};

const rootReducer = combineReducers({
	auth: persistReducer(authPersistConfig, authReducer),
	signs: persistReducer(signsPersistConfig, signsReducer),
	sync: syncReducer, // Don't persist sync state
});

export const store = configureStore({
	reducer: rootReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
				// Ignore date fields in state and actions
				ignoredActionPaths: ["payload.dateInstalled"],
				ignoredPaths: ["signs.signs"],
			},
		}),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
