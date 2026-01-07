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
import { Entypo } from "@expo/vector-icons";
import { LoginCredentials } from "../types";

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => void;
  onForgotPassword: () => void;
  loading?: boolean;
}

export function LoginForm({
  onSubmit,
  onForgotPassword,
  loading = false,
}: LoginFormProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: { username?: string; password?: string } = {};

    if (!username.trim()) {
      newErrors.username = t("validation.required");
    }

    if (!password.trim()) {
      newErrors.password = t("validation.required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({ username, password });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <TextInputView
            label={t("auth.username")}
            value={username}
            onChangeText={setUsername}
            placeholder={t("auth.usernamePlaceholder")}
            autoCapitalize="none"
            error={errors.username}
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInputView
            label={t("auth.password")}
            value={password}
            onChangeText={setPassword}
            placeholder={t("auth.passwordPlaceholder")}
            secureTextEntry={!showPassword}
            error={errors.password}
            editable={!loading}
            icon={
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <Entypo
                  name={showPassword ? "eye" : "eye-with-line"}
                  size={24}
                  color={colors.lightGreen}
                />
              </TouchableOpacity>
            }
          />
        </View>

        <ButtonView
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        >
          {t("general.login")}
        </ButtonView>

        <TouchableOpacity
          onPress={onForgotPassword}
          style={styles.forgotPassword}
          disabled={loading}
        >
          <TextView variant="body" style={styles.forgotPasswordText}>
            {t("auth.forgotPassword")}
          </TextView>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: "100%",
      maxWidth: 400,
      backgroundColor: theme.background,
      borderRadius: 20,
      padding: spacing.lg,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    form: {
      gap: spacing.md,
    },
    inputContainer: {
      position: "relative",
      flexDirection: "row",
      width: "100%",
      flex: 1,
    },
    eyeIcon: {
      position: "absolute",
      right: spacing.md,
      padding: spacing.xs,
    },
    submitButton: {
      marginTop: spacing.md,
    },
    forgotPassword: {
      alignItems: "center",
      marginTop: spacing.sm,
    },
    forgotPasswordText: {
      color: colors.lightGreen,
      fontWeight: "600",
    },
  });
