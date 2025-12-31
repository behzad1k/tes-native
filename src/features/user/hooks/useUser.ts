import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { services } from "@/src/configs/services";
import { useAuthStore } from "@/src/store/auth";
import { Toast } from "toastify-react-native";

export function useUser() {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

	return useQuery({
		queryKey: ["user"],
		queryFn: () => services.user.getCurrentUser(),
		enabled: isAuthenticated,
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 30, // 30 minutes
	});
}

export function useUpdateUser() {
	const queryClient = useQueryClient();
	const updateUser = useAuthStore((state) => state.updateUser);

	return useMutation({
		mutationFn: (userData: any) => services.user.updateUser(userData),
		onSuccess: (data) => {
			// Update cache
			queryClient.setQueryData(["user"], data);
			// Update auth store
			updateUser(data.data);
			Toast.success("Profile updated successfully");
		},
		onError: (error: any) => {
			Toast.error(error.message || "Failed to update profile");
		},
	});
}
