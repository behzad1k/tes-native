import { useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useSyncStore } from "@/src/store/sync";

export function useNetworkStatus() {
	const { isOnline, setOnline } = useSyncStore();

	useEffect(() => {
		const unsubscribe = NetInfo.addEventListener((state) => {
			setOnline(state.isConnected ?? false);
		});

		return () => {
			unsubscribe();
		};
	}, [setOnline]);

	return { isOnline };
}
