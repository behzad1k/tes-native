import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			gcTime: 1000 * 60 * 60 * 24, // 24 hours
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: 3,
			refetchOnReconnect: true,
			refetchOnWindowFocus: false,
			networkMode: "offlineFirst",
		},
		mutations: {
			retry: 3,
			networkMode: "offlineFirst",
		},
	},
});

export const asyncStoragePersister = createAsyncStoragePersister({
	storage: AsyncStorage,
	key: "REACT_QUERY_OFFLINE_CACHE",
});

// Fix: Use onlineManager instead of queryClient.setOnline
NetInfo.addEventListener((state) => {
	onlineManager.setOnline(state.isConnected ?? false);
});
