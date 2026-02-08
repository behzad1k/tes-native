import { apiClient } from "@/src/services/api/apiClient";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ReduxStorage, ImageStorage, TokenStorage } from "../persistence";
import { Sign, SignImage } from "@/src/types/models";
import { SYNC_STATUS } from "@/src/constants/global";

interface appDataState {
	locationTypes: any[];
	customers: any[];
	isLoading: boolean;
	lastFetched: number | null;
}

const initialState: appDataState = {
	customers: [],
	locationTypes: [],
	isLoading: false,
	lastFetched: null,
};

export const fetchAppData = createAsyncThunk(
	"appData/fetch",
	async (_, { rejectWithValue }) => {
		try {
			const token = await TokenStorage.getToken();
			if (!token) return rejectWithValue("No token");

			const response = await apiClient.get("api/Sign/GetSigns", {
				headers: { Authorization: `Bearer ${token}` },
			});

			const appData: any = response.data || response;

			return { customers: appData.customers };
		} catch (error: any) {
			return rejectWithValue(error.message || "Failed to fetch signs");
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
			})
			.addCase(fetchAppData.rejected, (state) => {
				state.isLoading = false;
			});
	},
});

export default appDataSlice.reducer;
