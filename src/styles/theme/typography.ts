import { TextStyle } from "react-native";

export const FontWeights = {
	thin: "100",
	light: "300",
	medium: "500",
	bold: "700",
} as const;

export const FontFamilies = {
	poppins: {
		thin: "",
		light: "",
		medium: "",
		bold: "",
	},
} as const;

export const FontSizes = {
	xxs: 10,
	xs: 12,
	s: 14,
	m: 16,
	lg: 18,
	xl: 22,
	xxl: 26,
} as const;

export const Typography = {
	variants: {
		// Headings
		h1: {
			fontFamily: FontFamilies.poppins.bold,
			fontSize: FontSizes.xxl,
			lineHeight: 40,
			fontWeight: FontWeights.bold,
		} as TextStyle,

		h2: {
			fontFamily: FontFamilies.poppins.bold,
			fontSize: FontSizes.xl,
			lineHeight: 36,
			fontWeight: FontWeights.bold,
		} as TextStyle,

		h3: {
			fontFamily: FontFamilies.poppins.medium,
			fontSize: FontSizes.lg,
			lineHeight: 32,
			fontWeight: FontWeights.medium,
		} as TextStyle,

		h4: {
			fontFamily: FontFamilies.poppins.medium,
			fontSize: FontSizes.m,
			lineHeight: 28,
			fontWeight: FontWeights.medium,
		} as TextStyle,

		// Body text
		large: {
			fontFamily: FontFamilies.poppins.medium,
			fontSize: FontSizes.s,
			lineHeight: 26,
			fontWeight: FontWeights.medium,
		} as TextStyle,

		medium: {
			fontFamily: FontFamilies.poppins.medium,
			fontSize: FontSizes.xs,
			lineHeight: 24,
			fontWeight: FontWeights.medium,
		} as TextStyle,

		small: {
			fontFamily: FontFamilies.poppins.medium,
			fontSize: FontSizes.xxs,
			lineHeight: 20,
			fontWeight: FontWeights.medium,
		} as TextStyle,

		// Special text styles
		caption: {
			fontFamily: FontFamilies.poppins.light,
			fontSize: 12,
			lineHeight: 16,
			fontWeight: FontWeights.light,
		} as TextStyle,

		button: {
			fontFamily: FontFamilies.poppins.medium,
			fontSize: 16,
			lineHeight: 20,
			fontWeight: FontWeights.medium,
		} as TextStyle,
	},
	weights: {
		thin: {
			fontFamily: FontFamilies.poppins.thin,
			fontWeight: FontWeights.thin,
		} as TextStyle,

		light: {
			fontFamily: FontFamilies.poppins.light,
			fontWeight: FontWeights.light,
		} as TextStyle,

		normal: {
			fontFamily: FontFamilies.poppins.medium,
			fontWeight: FontWeights.medium,
		} as TextStyle,

		bold: {
			fontFamily: FontFamilies.poppins.bold,
			fontWeight: FontWeights.bold,
		} as TextStyle,
	} as FontWeight,
};

type FontTransform = {
	[key: string]: keyof typeof Typography.weights;
};

type FontWeight = {
	[key: string]: Partial<TextStyle>;
};

export const weightTransforms: FontTransform = {
	normal: "normal",
	bold: "bold",
	"100": "thin",
	"200": "thin",
	"300": "light",
	"400": "light",
	"500": "light",
	"600": "normal",
	"700": "normal",
	"800": "bold",
	"900": "bold",
	ultralight: "thin",
	thin: "thin",
	light: "light",
	medium: "normal",
	regular: "normal",
	semibold: "normal",
	condensedBold: "bold",
	condensed: "bold",
	heavy: "bold",
	black: "bold",
};
export default Typography;
