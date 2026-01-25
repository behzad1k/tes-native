import { TextStyle } from "react-native";
import { FontFamilies, FontWeights, FontSizes, LineHeights } from "./fonts";

export const Typography = {
	variants: {
		// Headings
		h1: {
			fontFamily: FontFamilies.poppins.bold,
			fontSize: FontSizes["3xl"],
			lineHeight: LineHeights["3xl"],
			fontWeight: FontWeights.xxbold,
		} as TextStyle,

		h2: {
			fontFamily: FontFamilies.poppins.bold,
			fontSize: FontSizes["2xl"],
			lineHeight: LineHeights["2xl"],
			fontWeight: FontWeights.xbold,
		} as TextStyle,

		h3: {
			fontFamily: FontFamilies.poppins.semiBold,
			fontSize: FontSizes["xl"],
			lineHeight: LineHeights["xl"],
			fontWeight: FontWeights.bold,
		} as TextStyle,

		h4: {
			fontFamily: FontFamilies.poppins.semiBold,
			fontSize: FontSizes.xl,
			lineHeight: LineHeights.xl,
			fontWeight: FontWeights.semiBold,
		} as TextStyle,

		// Body text
		body: {
			fontFamily: FontFamilies.poppins.regular,
			fontSize: FontSizes.base,
			lineHeight: LineHeights.sm,
			fontWeight: FontWeights.regular,
		} as TextStyle,

		bodyMedium: {
			fontFamily: FontFamilies.poppins.medium,
			fontSize: FontSizes.base,
			lineHeight: LineHeights.base,
			fontWeight: FontWeights.medium,
		} as TextStyle,

		bodySmall: {
			fontFamily: FontFamilies.poppins.regular,
			fontSize: FontSizes.xs,
			lineHeight: LineHeights.sm,
			fontWeight: FontWeights.regular,
		} as TextStyle,

		// Special
		caption: {
			fontFamily: FontFamilies.poppins.regular,
			fontSize: FontSizes.xs,
			lineHeight: LineHeights.xs,
			fontWeight: FontWeights.regular,
		} as TextStyle,

		button: {
			fontFamily: FontFamilies.poppins.medium,
			fontSize: FontSizes.base,
			lineHeight: LineHeights.base,
			fontWeight: FontWeights.medium,
		} as TextStyle,

		label: {
			fontFamily: FontFamilies.poppins.medium,
			fontSize: FontSizes.sm,
			lineHeight: LineHeights.sm,
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

		regular: {
			fontFamily: FontFamilies.poppins.regular,
			fontWeight: FontWeights.regular,
		} as TextStyle,

		medium: {
			fontFamily: FontFamilies.poppins.medium,
			fontWeight: FontWeights.medium,
		} as TextStyle,

		semiBold: {
			fontFamily: FontFamilies.poppins.semiBold,
			fontWeight: FontWeights.semiBold,
		} as TextStyle,

		bold: {
			fontFamily: FontFamilies.poppins.bold,
			fontWeight: FontWeights.bold,
		} as TextStyle,
	},
};

export { FontFamilies, FontWeights, FontSizes, LineHeights };
export default Typography;
