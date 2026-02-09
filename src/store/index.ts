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
import supportReducer from "./slices/supportSlice";
import syncReducer from "./slices/syncSlice";
import appDataReducer from "./slices/appData";
import maintenanceReducer from "./slices/maintenanceSlice";
import trafficCountReducer from "./slices/trafficCountSlice";

const signsPersistConfig = {
	key: "signs",
	storage: AsyncStorage,
	whitelist: ["signs", "backendImages", "lastFetched"],
};

const supportsPersistConfig = {
	key: "supports",
	storage: AsyncStorage,
	whitelist: ["supports", "backendImages", "lastFetched"],
};

const authPersistConfig = {
	key: "auth",
	storage: AsyncStorage,
	whitelist: ["user", "isAuthenticated"],
};

const maintenancesPersistConfig = {
	key: "maintenances",
	storage: AsyncStorage,
	whitelist: ["maintenances", "backendImages", "lastFetched"],
};

const trafficCountPersistConfig = {
	key: "trafficCount",
	storage: AsyncStorage,
	whitelist: ["workOrders", "classifications", "lastFetched"],
};

const appDataPersistConfig = {
	key: "appData",
	storage: AsyncStorage,
	whitelist: ["customers", "locationTypes", "lastFetched"],
};

const rootReducer = combineReducers({
	auth: persistReducer(authPersistConfig, authReducer),
	signs: persistReducer(signsPersistConfig, signsReducer),
	supports: persistReducer(supportsPersistConfig, supportReducer),
	maintenances: persistReducer(maintenancesPersistConfig, maintenanceReducer),
	trafficCount: persistReducer(trafficCountPersistConfig, trafficCountReducer),
	appData: persistReducer(appDataPersistConfig, appDataReducer),
	sync: syncReducer,
});

export const store = configureStore({
	reducer: rootReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
				ignoredActionPaths: ["payload.dateInstalled"],
				ignoredPaths: ["signs.signs"],
			},
		}),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
