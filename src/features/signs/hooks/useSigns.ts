import { useDatabase } from "@nozbe/watermelondb/hooks";
import { Sign } from "@/src/database/models/Sign";
import { Q } from "@nozbe/watermelondb";
import { useAuthStore } from "@/src/store/auth";

export function useSigns() {
	const signs = [];
	return signs;
}

export function usePendingSigns() {
	const pendingSigns = [];
	return pendingSigns;
}

export function useSignById(id: string | null) {
	// const database = useDatabase();
	const signsCollection: any = {};

	if (!id) {
		return null;
	}

	const sign = signsCollection.findAndObserve(id);
	return sign;
}
