import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { services } from "@/src/configs/services";

interface globalState {
	setting: any;
}

const initialState: globalState = {
	setting: {},
};

const globalSlice = createSlice({
	name: "global",
	initialState,
	reducers: {},
});

export default globalSlice.reducer;
