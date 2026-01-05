import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { colors } from "@/src/styles/theme/colors";

const { width } = Dimensions.get("window");

export function LoadingAnimation() {
	const styles = useThemedStyles(createStyles);
	const spinValue = useRef(new Animated.Value(0)).current;
	const scaleValue = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		// Rotation animation
		Animated.loop(
			Animated.timing(spinValue, {
				toValue: 1,
				duration: 2000,
				useNativeDriver: true,
			}),
		).start();

		// Pulse animation
		Animated.loop(
			Animated.sequence([
				Animated.timing(scaleValue, {
					toValue: 1.2,
					duration: 1000,
					useNativeDriver: true,
				}),
				Animated.timing(scaleValue, {
					toValue: 1,
					duration: 1000,
					useNativeDriver: true,
				}),
			]),
		).start();
	}, []);

	const spin = spinValue.interpolate({
		inputRange: [0, 1],
		outputRange: ["0deg", "360deg"],
	});

	return (
		<View style={styles.container}>
			<Animated.View
				style={[
					styles.circle,
					{
						transform: [{ rotate: spin }, { scale: scaleValue }],
					},
				]}
			/>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			alignItems: "center",
			justifyContent: "center",
			height: width / 4,
		},
		circle: {
			width: width / 6,
			height: width / 6,
			borderRadius: width / 12,
			borderWidth: 4,
			borderColor: colors.pink,
			borderTopColor: "transparent",
		},
	});
