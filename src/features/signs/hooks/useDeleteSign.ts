import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signOfflineService } from "../services/SignOfflineService";
import { signApiService } from "../services/SignApiService";
import { useSyncStore } from "@/src/store/sync";
import { Toast } from "toastify-react-native";

export function useDeleteSign() {
	const queryClient = useQueryClient();
	const isOnline = useSyncStore((state) => state.isOnline);

	return useMutation({
		mutationFn: async (id: string) => {
			const sign = await signOfflineService.getSignById(id);

			// Only allow deleting synced signs
			if (sign.status !== "synced") {
				throw new Error("Cannot delete unsynced sign. Please sync first.");
			}

			// Delete from server if online
			if (isOnline && sign.serverId) {
				await signApiService.deleteSign(sign.serverId);
			}

			// Delete locally
			await signOfflineService.deleteSign(id);
		},

		onSuccess: () => {
			Toast.success("Sign deleted!");
			queryClient.invalidateQueries({ queryKey: ["signs"] });
		},

		onError: (error: any) => {
			Toast.error(error.message || "Failed to delete sign");
		},
	});
}
