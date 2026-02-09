import { apiClient } from "@/src/services/api/apiClient";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ReduxStorage, TokenStorage } from "../persistence";
import mockAppData from "@/src/data/mockAppData.json";

export interface VehicleType {
	id: string;
	name: string;
	icon: string;
	isPedestrian: boolean;
	sortOrder: number;
}

interface AppDataState {
	locationTypes: any[];
	customers: any[];
	vehicleTypes: VehicleType[];
	isLoading: boolean;
	lastFetched: number | null;
}

const initialState: AppDataState = {
	customers: [],
	locationTypes: [],
	vehicleTypes: [],
	isLoading: false,
	lastFetched: null,
};

export const fetchAppData = createAsyncThunk(
	"appData/fetch",
	async (_, { rejectWithValue }) => {
		try {
			const token = await TokenStorage.getToken();
			// if (!token) return rejectWithValue("No token");

			// TODO: Replace with real API call when backend is ready
			// const response = await apiClient.get("api/AppData/GetAppData", {
			// 	headers: { Authorization: `Bearer ${token}` },
			// });
			// const appData: any = response.data || response;

			// Using mock data for now
			console.log("Using mock app data");
			await new Promise((resolve) => setTimeout(resolve, 300));

			return {
				customers: mockAppData.customers || [],
				locationTypes: mockAppData.locationTypes || [],
				vehicleTypes: mockAppData.vehicleTypes || [],
			};
		} catch (error: any) {
			return rejectWithValue(error.message || "Failed to fetch app data");
		}
	},
);

const appDataSlice = createSlice({
	name: "appData",
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchAppData.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(fetchAppData.fulfilled, (state, action) => {
				state.customers = action.payload.customers;
				state.locationTypes = action.payload.locationTypes;
				state.vehicleTypes = action.payload.vehicleTypes;
				state.lastFetched = Date.now();
				state.isLoading = false;
			})
			.addCase(fetchAppData.rejected, (state) => {
				state.isLoading = false;
			});
	},
});

export default appDataSlice.reducer;
