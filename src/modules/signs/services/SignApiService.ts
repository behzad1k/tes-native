import { apiClient } from "@/src/services/api/apiClient";
import { CreateSignRequest, CreateSignResponse } from "../types";

export class SignApiService {
	async createSign(data: CreateSignRequest): Promise<CreateSignResponse> {
		return await apiClient.post<CreateSignResponse>("/signs", data);
	}

	async getAllSigns(): Promise<CreateSignResponse[]> {
		return await apiClient.get<CreateSignResponse[]>("/signs");
	}

	async getSignById(id: string): Promise<CreateSignResponse> {
		return await apiClient.get<CreateSignResponse>(`/signs/${id}`);
	}

	async updateSign(
		id: string,
		data: Partial<CreateSignRequest>,
	): Promise<CreateSignResponse> {
		return await apiClient.put<CreateSignResponse>(`/signs/${id}`, data);
	}

	async deleteSign(id: string): Promise<void> {
		return await apiClient.delete(`/signs/${id}`);
	}
}

export const signApiService = new SignApiService();
