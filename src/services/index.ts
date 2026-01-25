import { apiClient } from "@/src/services/api/apiClient";
import UserService from "@/src/modules/user/services/UserService";
import { StorageService } from "@/src/utils/storage";
import { AuthService } from "@/src/modules/auth/services/AuthService";
import { ServiceDependencies } from "@/src/types/services";
import { SignApiService } from "@/src/modules/signs/services/SignApiService";

const baseDependencies: ServiceDependencies = {
	apiClient: apiClient,
	storage: StorageService,
};

export const authService = new AuthService(baseDependencies);
export const userService = new UserService(baseDependencies);
export const signApiService = new SignApiService();

const services = {
	auth: authService,
	user: userService,
	signs: signApiService,
} as const;

export default services;
