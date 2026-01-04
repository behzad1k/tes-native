import "@testing-library/jest-native/extend-expect";
import "react-native-gesture-handler/jestSetup";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
	require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Mock Expo SecureStore
jest.mock("expo-secure-store", () => ({
	getItemAsync: jest.fn(),
	setItemAsync: jest.fn(),
	deleteItemAsync: jest.fn(),
}));

// Mock WatermelonDB
jest.mock("@nozbe/watermelondb", () => ({
	Database: jest.fn(),
	Model: jest.fn(),
	Q: {
		where: jest.fn(),
		sortBy: jest.fn(),
		desc: jest.fn(),
		like: jest.fn(),
		or: jest.fn(),
	},
}));

// Mock WatermelonDB decorators
jest.mock("@nozbe/watermelondb/decorators", () => ({
	field: () => jest.fn(),
	date: () => jest.fn(),
	readonly: () => jest.fn(),
	json: () => jest.fn(),
}));

// Mock NetInfo
jest.mock("@react-native-community/netinfo", () => ({
	addEventListener: jest.fn(),
	fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

// Mock Expo Router
jest.mock("expo-router", () => ({
	router: {
		push: jest.fn(),
		replace: jest.fn(),
		back: jest.fn(),
	},
	useLocalSearchParams: jest.fn(() => ({})),
	Stack: {
		Screen: jest.fn(),
	},
	Tabs: {
		Screen: jest.fn(),
	},
}));

// Mock React Native Reanimated
jest.mock("react-native-reanimated", () => {
	const Reanimated = require("react-native-reanimated/mock");
	Reanimated.default.call = () => {};
	return Reanimated;
});

// Mock Gesture Handler
jest.mock("react-native-gesture-handler", () => {
	const View = require("react-native").View;
	return {
		GestureHandlerRootView: View,
		GestureDetector: View,
		Gesture: {
			Pan: jest.fn(),
			Tap: jest.fn(),
		},
	};
});

// Mock Toast
jest.mock("toastify-react-native", () => ({
	toast: {
		success: jest.fn(),
		error: jest.fn(),
		info: jest.fn(),
		warning: jest.fn(),
	},
	ToastManager: jest.fn(),
}));

// Silence console errors in tests
global.console = {
	...console,
	error: jest.fn(),
	warn: jest.fn(),
};

// Mock timers
jest.useFakeTimers();
