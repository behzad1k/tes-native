import { useDatabase } from "@nozbe/watermelondb/hooks";
import { Sign } from "@/src/database/models/Sign";
import { Q } from "@nozbe/watermelondb";
import { useAuthStore } from "@/src/store/auth";

export function useSigns() {
	const database = useDatabase();
	const userId = useAuthStore((state) => state.user?.id);
	const signsCollection = database.get<Sign>("signs");

	if (!userId) {
		return [];
	}

	const signs = signsCollection
		.query(Q.where("user_id", userId), Q.sortBy("created_at", Q.desc))
		.observe();

	return signs;
}

export function usePendingSigns() {
	const database = useDatabase();
	const signsCollection = database.get<Sign>("signs");

	const pendingSigns = signsCollection
		.query(Q.where("status", "pending"))
		.observe();

	return pendingSigns;
}

export function useSignById(id: string | null) {
	const database = useDatabase();
	const signsCollection = database.get<Sign>("signs");

	if (!id) {
		return null;
	}

	const sign = signsCollection.findAndObserve(id);
	return sign;
}
