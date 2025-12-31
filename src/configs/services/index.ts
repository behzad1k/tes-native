import { apiClient } from "@/src/configs/api/apiClient";
import UserService from "@/src/features/user/services/UserService";
import { StorageService } from "@/src/utils/storage";
import { AuthService } from "@/src/features/auth/services/AuthService";
import { ServiceDependencies } from "@/src/types/services";
import { SignApiService } from "@/src/features/signs/services/SignApiService";

const baseDependencies: ServiceDependencies = {
	apiClient: apiClient,
	storage: StorageService,
};

export const authService = new AuthService(baseDependencies);
export const userService = new UserService(baseDependencies);
export const signApiService = new SignApiService();

export const services = {
	auth: authService,
	user: userService,
	signs: signApiService,
} as const;
