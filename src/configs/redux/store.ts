import { configureStore, combineReducers } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import userSlice from "./slices/userSlice";
import globalSlice from "./slices/globalSlice";

const persistConfig = {
	key: "root",
	storage: AsyncStorage,
	whitelist: ["user"], // Only persist user slice
	// blacklist: ['counter'], // Don't persist counter slice
};

const rootReducer = combineReducers({
	user: userSlice,
	global: globalSlice,
});

export const store = configureStore({
	reducer: rootReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
			},
		}),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
