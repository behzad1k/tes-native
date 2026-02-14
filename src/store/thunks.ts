import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "../services/api/apiClient";
import ENDPOINTS from "../services/api/endpoints";
import { BSignSupportData, BUserJobs } from "../types/api";

export const fetchSignSupportData = createAsyncThunk(
	"sign_support/appData",
	async (_, { rejectWithValue }) => {
		try {
			const response: BSignSupportData = await apiClient.get(
				ENDPOINTS.SIGNS.APP_DATA,
			);

			return response;
		} catch (error: any) {
			return rejectWithValue(error.message || "Failed to fetch app data");
		}
	},
);

export const fetchSignSupportSetups = createAsyncThunk(
	"sign_support/setups",
	async (customerId: string, { rejectWithValue }) => {
		try {
			const response: BSignSupportData = await apiClient.get(
				ENDPOINTS.SIGNS.SETUPS,
			);

			return response;
		} catch (error: any) {
			return rejectWithValue(error.message || "Failed to fetch app data");
		}
	},
);

export const fetchJobs = createAsyncThunk(
	"maintenance/fetchJobs",
	async (customerId: string, { rejectWithValue }) => {
		try {
			// await new Promise((resolve) => setTimeout(resolve, 1000));

			// return {
			// 	jobs: mockData.jobs,
			// 	jobStatuses: mockData.jobStatuses,
			// 	jobTypes: mockData.jobTypes,
			// };

			const response: BUserJobs = await apiClient.post(
				ENDPOINTS.MAINTENANCE.INDEX,
				{
					CustomerId: customerId,
					ShowDataByLocation: true,
				},
			);

			return response;
		} catch (error: any) {
			return rejectWithValue(error.message);
		}
	},
);
