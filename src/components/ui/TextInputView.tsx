import { useTheme } from "@/src/contexts/ThemeContext";
import { scale, spacing } from "@/src/styles/theme/spacing";
import Typography from "@/src/styles/theme/typography";
import React, { forwardRef, ReactElement } from "react";
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
  icon?: ReactElement;
}

const TextInputView = forwardRef<TextInput, TextInputViewProps>(
  ({ containerStyle = {}, style, error, label, icon, ...props }, ref) => {
    const { theme } = useTheme();

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <TextView variant="label" style={styles.label}>
            {label}
          </TextView>
        )}
        <View style={styles.inputContainer}>
          <TextInput
            ref={ref}
            style={[
              styles.input,
              {
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: error ? colors.error : theme.border,
              },
              style,
            ]}
            placeholderTextColor={"rgba(109, 119, 122, 0.4)"}
            {...props}
          />
          {icon && icon}
        </View>
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
    flex: 1,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: scale(36),
  },
  label: {
    marginBottom: 4,
  },
  input: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.placeholder,
    flex: 1,
    padding: spacing.xs,
    fontSize: 12,
    lineHeight: 14,
    height: scale(36),
  },
  error: {
    color: colors.error,
    marginTop: 4,
  },
});

export default TextInputView;
