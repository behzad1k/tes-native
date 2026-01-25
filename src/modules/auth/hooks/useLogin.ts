import services from "@/src/services";
import { useAppDispatch } from "@/src/store/hooks";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { LoginFormData } from "../types";
import { loginThunk } from "@/src/store/slices/authSlice";
import { Toast } from "toastify-react-native";

export const useAuth = () => {
	const dispatch = useAppDispatch();
	const router = useRouter();
	const [loginLoading, setLoginLoading] = useState(false);

	const login = useCallback(
		async (credentials: LoginFormData) => {
			setLoginLoading(true);
			const result = await dispatch(loginThunk(credentials));

			if (loginThunk.fulfilled.match(result)) {
				const response = result.payload;
				// if (response.success) {
				// 	Toast.show({ type: "success", text1: "Login successful!" });
				// 	router.replace("/(app)/(tabs)");
				// } else {
				// 	Toast.show(response.message || "Login failed", { type: "error" });
				// }
				return response;
			} else if (loginThunk.rejected.match(result)) {
				// Toast.show(result.payload || "Login failed", { type: "error" });
				// throw new Error(result.payload);
			}
		},
		[dispatch, router],
	);

	return {
		login,
		loginLoading,
		logout: services.auth.logout,
		isAuthenticated: services.auth.isAuthenticated,
		// Expose other service methods as needed
	};
};
