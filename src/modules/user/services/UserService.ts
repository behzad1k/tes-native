import ENDPOINTS from "@/src/services/api/endpoints";
import { ServiceDependencies } from "@/src/types/services";
import { User } from "../types";

export default class UserService {
	constructor(private deps: ServiceDependencies) {}

	async getCurrentUser() {
		return await this.deps.apiClient.get<{ code: number; data: User }>(
			ENDPOINTS.USER.INDEX,
		);
	}

	async updateUser(userData: Partial<User>) {
		return await this.deps.apiClient.put<{ code: number; data: User }>(
			ENDPOINTS.USER.INDEX,
			userData,
		);
	}
}
