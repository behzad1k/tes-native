import { Dimensions, PixelRatio } from "react-native";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const BASE_WIDTH = 375;

export const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;

export const spacing = {
	xxs: scale(4),
	xs: scale(8),
	sm: scale(16),
	md: scale(20),
	lg: scale(24),
	xl: scale(28),
	xxl: scale(32),
	xxxl: scale(36),
};
