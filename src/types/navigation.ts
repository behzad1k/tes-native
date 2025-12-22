import { StackNavigationProp } from "@react-navigation/stack";

export type RootStackParamList = {};

export type NavigationProp = StackNavigationProp<RootStackParamList>;

declare global {
	namespace ReactNavigation {
		interface RootParamList extends RootStackParamList {}
	}
}
