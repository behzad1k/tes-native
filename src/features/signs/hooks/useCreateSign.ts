import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signOfflineService } from "../services/SignOfflineService";
import { signApiService } from "../services/SignApiService";
import { useAuthStore } from "@/src/store/auth";
import { useSyncStore } from "@/src/store/sync";
import { CreateSignRequest } from "../types";
import { Toast } from "toastify-react-native";

export function useCreateSign() {
	const queryClient = useQueryClient();
	const userId = useAuthStore((state) => state.user?.id);
	const isOnline = useSyncStore((state) => state.isOnline);

	return useMutation({
		mutationFn: async (data: CreateSignRequest) => {
			if (!userId) {
				throw new Error("User not authenticated");
			}

			const localSign = await signOfflineService.createSign(data, userId);

			if (isOnline) {
				try {
					const serverResponse = await signApiService.createSign(data);
					await signOfflineService.markAsSynced(
						localSign.id,
						serverResponse.id,
					);
					return {
						...localSign,
						serverId: serverResponse.id,
						status: "synced" as const,
					};
				} catch (error) {
					console.error("Failed to sync sign:", error);
					return localSign;
				}
			}

			return localSign;
		},

		onSuccess: (data) => {
			if (data.status === "synced") {
				Toast.success("Sign created and synced!");
			} else {
				Toast.success("Sign created! Will sync when online.");
			}
			queryClient.invalidateQueries({ queryKey: ["signs"] });
		},

		onError: (error: any) => {
			Toast.error(error.message || "Failed to create sign");
		},
	});
}
