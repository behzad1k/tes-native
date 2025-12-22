import { apiClient } from "@/src/configs/api/apiClient";
import UserService from "@/src/features/user/services/UserService";
import { StorageService } from "@/src/utils/storage";
import { AuthService } from "@/src/features/auth/services/AuthService";
import { ServiceDependencies } from "@/src/types/services";

const baseDependencies = {
	apiClient: apiClient,
	storage: StorageService,
};

export const authService = new AuthService(baseDependencies);

const userServiceDependencies: ServiceDependencies = {
	...baseDependencies,
};

export const userService = new UserService(userServiceDependencies);

export const services = {
	auth: authService,
	user: userService,
} as const;
