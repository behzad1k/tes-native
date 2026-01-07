import { useMutation } from "@tanstack/react-query";
import { Toast } from "toastify-react-native";
import { ForgotPasswordRequest } from "../types";
import { authService } from "@/src/configs/services";
import { useLanguage } from "@/src/hooks/useLanguage";

export function useForgotPassword() {
	const { t } = useLanguage();

	return useMutation({
		mutationFn: async (request: ForgotPasswordRequest) => {
			return await authService.forgotPassword(request);
		},

		onSuccess: (success) => {
			if (success) {
				Toast.success(t("auth.forgotPasswordSuccess"));
			} else {
				Toast.error(t("error.forgotPasswordFailed"));
			}
		},

		onError: (error: any) => {
			console.error("Forgot password error:", error);
			Toast.error(error.message || t("error.forgotPasswordFailed"));
		},
	});
}
