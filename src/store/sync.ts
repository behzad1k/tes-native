import { create } from "zustand";

interface SyncState {
	isOnline: boolean;
	isSyncing: boolean;
	lastSyncTime: number | null;
	pendingCount: number;
	failedCount: number;

	setOnline: (isOnline: boolean) => void;
	setSyncing: (isSyncing: boolean) => void;
	setLastSyncTime: (time: number) => void;
	setPendingCount: (count: number) => void;
	setFailedCount: (count: number) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
	isOnline: true,
	isSyncing: false,
	lastSyncTime: null,
	pendingCount: 0,
	failedCount: 0,

	setOnline: (isOnline) => set({ isOnline }),
	setSyncing: (isSyncing) => set({ isSyncing }),
	setLastSyncTime: (time) => set({ lastSyncTime: time }),
	setPendingCount: (count) => set({ pendingCount: count }),
	setFailedCount: (count) => set({ failedCount: count }),
}));
