import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signOfflineService } from "../services/SignOfflineService";
import { signApiService } from "../services/SignApiService";
import { useSyncStore } from "@/src/store/sync";
import { CreateSignRequest } from "../types";
import { Toast } from "toastify-react-native";

export function useUpdateSign() {
	const queryClient = useQueryClient();
	const isOnline = useSyncStore((state) => state.isOnline);

	return useMutation({
		mutationFn: async ({
			id,
			data,
		}: {
			id: string;
			data: Partial<CreateSignRequest>;
		}) => {
			const updatedSign = await signOfflineService.updateSign(id, data);

			if (isOnline && updatedSign.serverId) {
				try {
					await signApiService.updateSign(updatedSign.serverId, data);
				} catch (error) {
					console.error("Failed to sync update:", error);
				}
			}

			return updatedSign;
		},

		onSuccess: () => {
			Toast.success("Sign updated!");
			queryClient.invalidateQueries({ queryKey: ["signs"] });
		},

		onError: (error: any) => {
			Toast.error(error.message || "Failed to update sign");
		},
	});
}
