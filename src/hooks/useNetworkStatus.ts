import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

export interface NetworkStatus {
	isOnline: boolean;
	isInternetReachable: boolean | null;
	type: string | null;
}

export function useNetworkStatus() {
	const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
		isOnline: true,
		isInternetReachable: null,
		type: null,
	});

	useEffect(() => {
		const unsubscribe = NetInfo.addEventListener((state) => {
			setNetworkStatus({
				isOnline: state.isConnected ?? false,
				isInternetReachable: state.isInternetReachable,
				type: state.type,
			});
		});

		return () => {
			unsubscribe();
		};
	}, []);

	return networkStatus;
}
