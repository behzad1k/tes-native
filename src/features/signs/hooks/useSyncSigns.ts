import { useMutation } from "@tanstack/react-query";
import { signOfflineService } from "../services/SignOfflineService";
import { signApiService } from "../services/SignApiService";
import { useSyncStore } from "@/src/store/sync";
import { Toast } from "toastify-react-native";

export function useSyncSigns() {
	const { setSyncing, setLastSyncTime, setPendingCount } = useSyncStore();

	return useMutation({
		mutationFn: async () => {
			setSyncing(true);

			const pendingSigns = await signOfflineService.getPendingSigns();

			let syncedCount = 0;
			let failedCount = 0;

			for (const sign of pendingSigns) {
				try {
					const response = await signApiService.createSign({
						signType: sign.signType as any,
						location: {
							lat: sign.locationLat,
							lng: sign.locationLng,
						},
						address: sign.address || undefined,
						condition: sign.condition as any,
						notes: sign.notes || undefined,
						imagePath: sign.imagePath || undefined,
					});

					await signOfflineService.markAsSynced(sign.id, response.id);
					syncedCount++;
				} catch (error) {
					console.error("Failed to sync sign:", error);
					await signOfflineService.markAsFailed(sign.id);
					failedCount++;
				}
			}

			setLastSyncTime(Date.now());
			setPendingCount(failedCount);

			return { syncedCount, failedCount };
		},

		onSuccess: ({ syncedCount, failedCount }) => {
			setSyncing(false);
			if (syncedCount > 0) {
				Toast.success(`Synced ${syncedCount} sign(s)!`);
			}
			if (failedCount > 0) {
				Toast.error(`Failed to sync ${failedCount} sign(s)`);
			}
		},

		onError: (error: any) => {
			setSyncing(false);
			Toast.error(error.message || "Sync failed");
		},
	});
}
