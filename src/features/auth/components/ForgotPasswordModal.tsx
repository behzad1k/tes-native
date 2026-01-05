import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import TextInputView from "@/src/components/ui/TextInputView";
import ButtonView from "@/src/components/ui/ButtonView";
import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { useLanguage } from "@/src/hooks/useLanguage";
import { Theme } from "@/src/types/theme";
import { spacing } from "@/src/styles/theme/spacing";
import { colors } from "@/src/styles/theme/colors";

interface ForgotPasswordModalProps {
	onSubmit: (email: string) => void;
	onClose: () => void;
	loading?: boolean;
	success?: boolean;
}

export function ForgotPasswordModal({
	onSubmit,
	onClose,
	loading = false,
	success = false,
}: ForgotPasswordModalProps) {
	const styles = useThemedStyles(createStyles);
	const { t } = useLanguage();

	const [email, setEmail] = useState("");
	const [error, setError] = useState("");

	const validateEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const handleSubmit = () => {
		if (!email.trim()) {
			setError(t("validation.required"));
			return;
		}

		if (!validateEmail(email)) {
			setError(t("validation.invalidEmail"));
			return;
		}

		setError("");
		onSubmit(email);
	};

	if (success) {
		return (
			<View style={styles.container}>
				<TextView variant="h4" style={styles.title}>
					{t("auth.forgotPassword")}
				</TextView>

				<View style={styles.content}>
					<TextView variant="body" style={styles.successMessage}>
						{t("auth.forgotPasswordSuccess")}
					</TextView>

					<ButtonView onPress={onClose} style={styles.button}>
						{t("buttons.close")}
					</ButtonView>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<TextView variant="h4" style={styles.title}>
				{t("auth.forgotPassword")}
			</TextView>

			<View style={styles.content}>
				<TextView variant="body" style={styles.description}>
					{t("auth.forgotPasswordDescription")}
				</TextView>

				<TextInputView
					value={email}
					onChangeText={(value) => {
						setEmail(value);
						setError("");
					}}
					placeholder={t("auth.emailPlaceholder")}
					keyboardType="email-address"
					autoCapitalize="none"
					error={error}
					editable={!loading}
				/>

				<View style={styles.actions}>
					<ButtonView
						onPress={handleSubmit}
						loading={loading}
						disabled={loading}
						style={styles.button}
					>
						{t("buttons.send")}
					</ButtonView>

					<ButtonView
						onPress={onClose}
						variant="outline"
						disabled={loading}
						style={styles.button}
					>
						{t("buttons.cancel")}
					</ButtonView>
				</View>
			</View>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			backgroundColor: theme.background,
			borderTopLeftRadius: 20,
			borderTopRightRadius: 20,
			padding: spacing.lg,
		},
		title: {
			color: colors.pink,
			marginBottom: spacing.md,
			textAlign: "center",
		},
		content: {
			gap: spacing.md,
		},
		description: {
			color: theme.secondary,
			textAlign: "center",
		},
		successMessage: {
			color: theme.text,
			textAlign: "center",
		},
		actions: {
			gap: spacing.sm,
			marginTop: spacing.md,
		},
		button: {
			width: "100%",
		},
	});
