import { NavigatorScreenParams } from "@react-navigation/native";

// Signs Stack Navigation Types
export type SignsStackParamList = {
	SignsList: undefined;
	ManageSign: {
		mode: "create" | "edit";
		signId?: string;
		preselectedSupportId?: string;
		onSignCreated?: (signId: string) => void;
	};
	ManageSupport: {
		mode: "create" | "edit";
		supportId?: string;
	};
	SignDetail: {
		signId: string;
	};
	SupportDetail: {
		supportId: string;
	};
	SignsMap: undefined;
};

// Maintenance Stack Navigation Types
export type MaintenanceStackParamList = {
	JobsList: undefined;
	JobDetail: {
		jobId: string;
	};
	ManageJob: {
		mode: "create" | "edit";
		jobId?: string;
	};
};

// Auth Stack Navigation Types
export type AuthStackParamList = {
	Login: undefined;
	ForgotPassword: undefined;
};

// Root Stack Navigation Types
export type RootStackParamList = {
	Auth: NavigatorScreenParams<AuthStackParamList>;
	Main: NavigatorScreenParams<MainTabParamList>;
};

// Main Tab Navigation Types
export type MainTabParamList = {
	SignsTab: NavigatorScreenParams<SignsStackParamList>;
	MaintenanceTab: NavigatorScreenParams<MaintenanceStackParamList>;
	SyncTab: undefined;
	SettingsTab: undefined;
};

// Declare global types for useNavigation and useRoute
declare global {
	namespace ReactNavigation {
		interface RootParamList extends RootStackParamList {}
	}
}
