import { apiClient } from "@/src/services/api/apiClient";
import UserService from "@/src/modules/user/services/UserService";
import { StorageService } from "@/src/utils/storage";
import { AuthService } from "@/src/modules/auth/services/AuthService";
import { ServiceDependencies } from "@/src/types/services";

const baseDependencies: ServiceDependencies = {
	apiClient: apiClient,
	storage: StorageService,
};

export const authService = new AuthService(baseDependencies);
export const userService = new UserService(baseDependencies);

const services = {
	auth: authService,
	user: userService,
} as const;

export default services;
