import NetInfo from "@react-native-community/netinfo";
import { useSyncStore } from "@/src/store/sync";
import { signOfflineService } from "@/src/features/signs/services/SignOfflineService";
import { signApiService } from "@/src/features/signs/services/SignApiService";

export class SyncEngine {
	private isSyncing = false;
	private unsubscribe: (() => void) | null = null;

	start() {
		this.setupNetworkListener();
	}

	stop() {
		if (this.unsubscribe) {
			this.unsubscribe();
			this.unsubscribe = null;
		}
	}

	private setupNetworkListener() {
		this.unsubscribe = NetInfo.addEventListener((state) => {
			const isOnline = state.isConnected ?? false;
			useSyncStore.getState().setOnline(isOnline);

			if (isOnline && !this.isSyncing) {
				this.syncAll();
			}
		});
	}

	async syncAll() {
		if (this.isSyncing) return;

		this.isSyncing = true;
		const { setSyncing, setLastSyncTime } = useSyncStore.getState();

		setSyncing(true);

		try {
			await this.syncSigns();
			setLastSyncTime(Date.now());
		} catch (error) {
			console.error("Sync failed:", error);
		} finally {
			this.isSyncing = false;
			setSyncing(false);
		}
	}

	private async syncSigns() {
		const pendingSigns = await signOfflineService.getPendingSigns();
		const { setPendingCount, setFailedCount } = useSyncStore.getState();

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
			} catch (error) {
				console.error("Failed to sync sign:", error);
				await signOfflineService.markAsFailed(sign.id);
				failedCount++;
			}
		}

		setPendingCount(failedCount);
		setFailedCount(failedCount);
	}

	async forceSyncNow() {
		await this.syncAll();
	}
}

export const syncEngine = new SyncEngine();
