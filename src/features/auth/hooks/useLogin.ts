import { useMutation } from "@tanstack/react-query";
import { Toast } from "toastify-react-native";
import { router } from "expo-router";
import { LoginCredentials } from "../types";
import { authService } from "@/src/configs/services";
import { useLanguage } from "@/src/hooks/useLanguage";

export function useLogin() {
	const { t } = useLanguage();

	return useMutation({
		mutationFn: async (credentials: LoginCredentials) => {
			return await authService.login(credentials);
		},

		onSuccess: (response) => {
			if (response.success) {
				Toast.success(t("auth.loginSuccess"));
				router.replace("/(protected)/profile");
			} else {
				Toast.error(response.message || t("error.loginFailed"));
			}
		},

		onError: (error: any) => {
			console.error("Login error:", error);
			Toast.error(error.message || t("error.loginFailed"));
		},
	});
}
