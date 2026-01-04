import { useTheme } from "@/src/contexts/ThemeContext";
import { spacing } from "@/src/styles/theme/spacing";
import Typography from "@/src/styles/theme/typography";
import React, { forwardRef } from "react";
import {
  TextInput,
  TextInputProps,
  View,
  StyleSheet,
  ViewStyle,
} from "react-native";
import TextView from "./TextView";
import { colors } from "@/src/styles/theme/colors";

interface TextInputViewProps extends TextInputProps {
  error?: string;
  containerStyle?: ViewStyle;
  label?: string;
}

const TextInputView = forwardRef<TextInput, TextInputViewProps>(
  ({ containerStyle = {}, style, error, label, ...props }, ref) => {
    const { theme } = useTheme();

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <TextView variant="label" style={styles.label}>
            {label}
          </TextView>
        )}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              backgroundColor: theme.primary,
              color: theme.text,
              borderColor: error ? colors.error : theme.border,
            },
            style,
          ]}
          placeholderTextColor={theme.secondary}
          {...props}
        />
        {error && (
          <TextView variant="caption" style={styles.error}>
            {error}
          </TextView>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    padding: spacing.sm,
    borderRadius: 8,
    fontSize: 16,
    ...Typography.variants.body,
  },
  error: {
    color: colors.error,
    marginTop: 4,
  },
});

export default TextInputView;
