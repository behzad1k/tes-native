import {
	interpolate,
	Extrapolate,
	withTiming,
	Easing,
} from "react-native-reanimated";
import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const createTimingConfig = (duration: number) => ({
	duration,
	easing: Easing.out(Easing.cubic),
});

export const getDrawerTransform = (
	progress: any,
	transitionType: string,
	position: string,
	drawerWidth: number,
	drawerHeight?: number,
) => {
	"worklet";
	const height = drawerHeight || 400;

	let translateX = 0;
	let translateY = 0;
	let opacity = 1;
	let scale = 1;

	if (position === "left") {
		translateX = interpolate(
			progress.value,
			[0, 1],
			[-drawerWidth, 0],
			Extrapolate.CLAMP,
		);
	} else if (position === "right") {
		translateX = interpolate(
			progress.value,
			[0, 1],
			[drawerWidth, 0],
			Extrapolate.CLAMP,
		);
	} else if (position === "top") {
		translateY = interpolate(
			progress.value,
			[0, 1],
			[-height, 0],
			Extrapolate.CLAMP,
		);
	} else if (position === "bottom") {
		translateY = interpolate(
			progress.value,
			[0, 1],
			[height, 0],
			Extrapolate.CLAMP,
		);
	}

	if (transitionType.includes("fade")) {
		opacity = interpolate(progress.value, [0, 1], [0, 1], Extrapolate.CLAMP);
	}

	if (transitionType.includes("scale")) {
		scale = interpolate(progress.value, [0, 1], [0.8, 1], Extrapolate.CLAMP);
	}

	return {
		transform: [{ translateX }, { translateY }, { scale }],
		opacity,
	};
};

export const getContentTransform = (
	progress: any,
	transitionType: string,
	position: string,
	drawerWidth: number,
	drawerHeight?: number,
) => {
	if (transitionType !== "push") {
		return { transform: [{ translateX: 0 }, { translateY: 0 }] };
	}

	let translateX = 0;
	let translateY = 0;

	if (position === "left") {
		translateX = interpolate(
			progress.value,
			[0, 1],
			[0, drawerWidth],
			Extrapolate.CLAMP,
		);
	} else if (position === "right") {
		translateX = interpolate(
			progress.value,
			[0, 1],
			[0, -drawerWidth],
			Extrapolate.CLAMP,
		);
	} else if (position === "top") {
		translateY = interpolate(
			progress.value,
			[0, 1],
			[0, drawerHeight || 400],
			Extrapolate.CLAMP,
		);
	} else if (position === "bottom") {
		translateY = interpolate(
			progress.value,
			[0, 1],
			[0, -(drawerHeight || 400)],
			Extrapolate.CLAMP,
		);
	}

	return {
		transform: [{ translateX }, { translateY }],
	};
};
