import { useSyncStore } from "@/src/store/sync";

describe("Sync Store", () => {
	beforeEach(() => {
		useSyncStore.setState({
			isOnline: true,
			isSyncing: false,
			lastSyncTime: null,
			pendingCount: 0,
			failedCount: 0,
		});
	});

	it("should set online status", () => {
		const { setOnline } = useSyncStore.getState();

		setOnline(false);

		expect(useSyncStore.getState().isOnline).toBe(false);
	});

	it("should set syncing status", () => {
		const { setSyncing } = useSyncStore.getState();

		setSyncing(true);

		expect(useSyncStore.getState().isSyncing).toBe(true);
	});

	it("should set last sync time", () => {
		const { setLastSyncTime } = useSyncStore.getState();
		const now = Date.now();

		setLastSyncTime(now);

		expect(useSyncStore.getState().lastSyncTime).toBe(now);
	});

	it("should set pending count", () => {
		const { setPendingCount } = useSyncStore.getState();

		setPendingCount(5);

		expect(useSyncStore.getState().pendingCount).toBe(5);
	});
});
